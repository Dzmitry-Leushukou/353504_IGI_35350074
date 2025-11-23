from django.views import View
from .models import News, Movie, About, Contact, Employee, FAQ,Vacancy, PromoCode, Profile, LogoModel, AdvModel, SliderSettings
from django.views.generic import ListView, DetailView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.urls import reverse_lazy,reverse
from django.views.generic import CreateView, UpdateView, DeleteView
from .models import Session, Ticket, Genre
from django.shortcuts import render, get_object_or_404, redirect
from django.contrib import messages
from django.db import transaction
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.views.generic import DetailView
from django.db.models import F
from django.utils.translation import gettext_lazy as _
from .forms import UserRegistrationForm, ReviewForm,TicketPurchaseForm, SliderSettingsForm
from django.contrib.auth import login, authenticate
from django.contrib.auth import logout
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect
from django.contrib.auth.views import LogoutView
from .models import Review
from django.contrib.auth.mixins import UserPassesTestMixin
from django.http import HttpResponseForbidden, JsonResponse
from decimal import Decimal, ROUND_DOWN
import io
import base64
import random
import statistics as stats_mod
import matplotlib.pyplot as plt
from django.views.generic import TemplateView
from django.db.models import Sum, Count, F
from django.db.models.functions import TruncDate
import requests
import calendar
from datetime import datetime
import json
import re
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt


def calculate_age(birth_date):
    today = timezone.now().date()
    return today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))

class StatisticsView(UserPassesTestMixin, TemplateView):
    """
    Страница «Статистика» для staff и superuser.
    Все графики рисуем в виде круговых диаграмм.
    """
    template_name = 'cinema/statistics.html'
    login_url = 'cinema:login'

    def test_func(self):
        user = self.request.user
        return user.is_authenticated and (user.is_staff or user.is_superuser)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        movie_id = self.request.GET.get('movie_id')
        if movie_id:
            try:
                selected_movie = Movie.objects.get(pk=movie_id)
            except Movie.DoesNotExist:
                selected_movie = None
        else:
            selected_movie = None

        tickets_qs = Ticket.objects.select_related('session__movie').all()
        if selected_movie:
            tickets_qs = tickets_qs.filter(session__movie=selected_movie)

        sales_by_date = (
            tickets_qs
            .annotate(day=TruncDate('purchase_date'))
            .values('day')
            .annotate(revenue=Sum('final_price'))
            .order_by('day')
        )
        dates = [item['day'].strftime('%d.%m.%Y') for item in sales_by_date]
        revenue_list = [float(item['revenue']) for item in sales_by_date]

        sales_by_movie = (
            tickets_qs
            .values('session__movie__title')
            .annotate(revenue=Sum('final_price'))
            .order_by('-revenue')
        )
        top10_movies = sales_by_movie[:10]
        movie_titles = [item['session__movie__title'] for item in top10_movies]
        movie_revenue = [float(item['revenue']) for item in top10_movies]

        from collections import defaultdict

        genre_sales_count = defaultdict(int)
        genre_revenue = defaultdict(Decimal)

        tickets_to_iter = tickets_qs.select_related('session__movie').prefetch_related('session__movie__genres')
        for ticket in tickets_to_iter:
            movie = ticket.session.movie
            price = ticket.final_price
            for g in movie.genres.all():
                genre_sales_count[g.name] += 1
                genre_revenue[g.name] += price

        genre_sales_list = sorted(
            [{'genre': genre, 'tickets_sold': count} for genre, count in genre_sales_count.items()],
            key=lambda x: x['tickets_sold'], reverse=True
        )
        genre_revenue_list = sorted(
            [{'genre': genre, 'revenue': float(rev)} for genre, rev in genre_revenue.items()],
            key=lambda x: x['revenue'], reverse=True
        )

        profiles = Profile.objects.filter(user__is_active=True).exclude(birth_date__isnull=True)
        clients_data = []
        ages = []
        for p in profiles.select_related('user'):
            today = timezone.now().date()
            birth = p.birth_date
            age = today.year - birth.year - ((today.month, today.day) < (birth.month, birth.day))
            clients_data.append({'username': p.user.username, 'age': age})
            ages.append(age)
        clients_data_sorted = sorted(clients_data, key=lambda x: x['username'])
        if ages:
            age_mean = round(stats_mod.mean(ages), 2)
            age_median = round(stats_mod.median(ages), 2)
            try:
                age_mode = stats_mod.mode(ages)
            except stats_mod.StatisticsError:
                age_mode = '—'
        else:
            age_mean = age_median = age_mode = None

        total_revenue = tickets_qs.aggregate(total=Sum('final_price'))['total'] or 0

        if revenue_list:
            daily_mean = round(stats_mod.mean(revenue_list), 2)
            daily_median = round(stats_mod.median(revenue_list), 2)
        else:
            daily_mean = daily_median = None


        chart_revenue_by_date = self._generate_pie_chart(
            labels=dates, values=revenue_list,
            title='Выручка по датам'
        )

        chart_revenue_by_movie = self._generate_pie_chart(
            labels=movie_titles, values=movie_revenue,
            title='ТОП-10 фильмов по выручке'
        )

        top5_genres = genre_sales_list[:5]
        genres_labels = [item['genre'] for item in top5_genres]
        genres_counts = [item['tickets_sold'] for item in top5_genres]
        chart_genres_pie = self._generate_pie_chart(
            labels=genres_labels, values=genres_counts,
            title='Доля продаж по жанрам (топ-5)'
        )

        context.update({
            'movies': Movie.objects.all().order_by('title'),
            'selected_movie': selected_movie,
            'sales_by_date': sales_by_date,
            'sales_by_movie': sales_by_movie,
            'clients_data': clients_data_sorted,
            'age_mean': age_mean,
            'age_median': age_median,
            'age_mode': age_mode,
            'genre_sales_list': genre_sales_list,
            'genre_revenue_list': genre_revenue_list,
            'total_revenue': total_revenue,
            'daily_mean': daily_mean,
            'daily_median': daily_median,
            'chart_revenue_by_date': chart_revenue_by_date,
            'chart_revenue_by_movie': chart_revenue_by_movie,
            'chart_genres_pie': chart_genres_pie,
        })
        return context

    def _generate_pie_chart(self, labels, values, title: str) -> str:
        """
        Рисует круговую диаграмму по спискам labels и values,
        возвращает результат в base64-строке для вставки в <img>.
        """
        plt.switch_backend('AGG')
        fig, ax = plt.subplots(figsize=(6, 6))

        if not any(values):
            plt.close(fig)
            return ''

        ax.pie(values, labels=labels, autopct='%1.1f%%', startangle=140)
        ax.set_title(title)
        plt.tight_layout()

        buffer = io.BytesIO()
        fig.savefig(buffer, format='png')
        plt.close(fig)
        buffer.seek(0)
        image_png = buffer.getvalue()
        buffer.close()
        return base64.b64encode(image_png).decode('utf-8')
    
class TicketPurchaseView(UserPassesTestMixin, View):
    login_url = 'cinema:login'

    def test_func(self):
        user = self.request.user
        return user.is_authenticated and (not user.is_staff) and (not user.is_superuser)

    def handle_no_permission(self):
        if self.request.user.is_authenticated:
            messages.error(
                self.request,
                'Только обычные зарегистрированные пользователи могут покупать билеты.'
            )
            return redirect('cinema:home')
        return super().handle_no_permission()

    def get_context_data(self, **kwargs):
        """
        Собирает все общие переменные для контекста:
         - название часового пояса пользователя
         - текущую дату/время в UTC и в локальном часовом поясе
         - смещение UTC (например, 'UTC+03:00')
         - текстовый календарь текущего месяца в часовом поясе пользователя
        Принимает любые дополнительные ключи через kwargs и добавляет их в результат.
        """
        now_utc = timezone.now()
        user_tz = timezone.get_current_timezone()
        now_local = timezone.localtime(now_utc, user_tz)

        offset = now_local.utcoffset() or timezone.timedelta(0)
        total_minutes = offset.total_seconds() / 60
        sign = '+' if total_minutes >= 0 else '-'
        hours_offset = int(abs(total_minutes) // 60)
        minutes_offset = int(abs(total_minutes) % 60)
        utc_offset_str = f"UTC{sign}{hours_offset:02}:{minutes_offset:02}"

        calendar_text = calendar.TextCalendar(firstweekday=0).formatmonth(
            now_local.year,
            now_local.month
        )

        context = {
            'user_timezone': str(user_tz),
            'timezone_name': str(user_tz),
            'now_local': now_local.strftime('%d.%m.%Y %H:%M'),
            'now_utc': now_utc.strftime('%d.%m.%Y %H:%M'),
            'user_tz_offset': utc_offset_str,
            'calendar_text': calendar_text,
        }

        context.update(kwargs)
        return context

    def get(self, request, session_id):
        session = get_object_or_404(Session, pk=session_id)

        if session.start_time < timezone.now():
            messages.error(request, 'Нельзя купить билет на прошедший сеанс.')
            return redirect('cinema:home')

        form = TicketPurchaseForm(session=session)
        if not form.fields['seat_number'].choices:
            messages.info(request, 'Извините, свободных мест на этот сеанс больше нет.')
            return redirect('cinema:home')

        context = self.get_context_data(
            form=form,
            session=session,
            base_price=session.price,
            discounted_price=None,
            promo_used=None
        )
        return render(request, 'cinema/buy_ticket.html', context)

    def post(self, request, session_id):
        session = get_object_or_404(Session, pk=session_id)
        form = TicketPurchaseForm(request.POST, session=session)

        if not form.fields['seat_number'].choices:
            messages.info(request, 'Извините, свободных мест на этот сеанс больше нет.')
            return redirect('cinema:home')

        context = self.get_context_data(
            form=form,
            session=session,
            base_price=session.price,
            discounted_price=None,
            promo_used=None
        )

        if form.is_valid():
            seat = form.cleaned_data['seat_number']
            promo_obj = form.cleaned_data.get('promo_code')
            base_price = session.price
            final_price = base_price

            if promo_obj:
                discount_percent = promo_obj.discount
                discounted_amount = (base_price * Decimal(discount_percent) / Decimal(100)).quantize(Decimal('0.01'))
                final_price = (base_price - discounted_amount).quantize(Decimal('0.01'))
                context['discounted_price'] = final_price
                context['promo_used'] = promo_obj.code

            ticket = Ticket(
                user=request.user,
                session=session,
                seat_number=seat,
                final_price=final_price
            )
            try:
                ticket.full_clean()
                ticket.save()
                if promo_obj:
                    promo_obj.used_count += 1
                    promo_obj.save()
                messages.success(request, f'Билет успешно куплен! Место №{seat}.')
                return redirect('cinema:my_tickets')
            except ValidationError as e:
                form.add_error(None, e.messages)

        if form.cleaned_data.get('promo_code'):
            promo_obj = form.cleaned_data.get('promo_code')
            if promo_obj and promo_obj.status == promo_obj.Status.ACTIVE:
                base_price = session.price
                discount_percent = promo_obj.discount
                discounted_amount = (base_price * Decimal(discount_percent) / Decimal(100)).quantize(Decimal('0.01'))
                final_price = (base_price - discounted_amount).quantize(Decimal('0.01'))
                context['discounted_price'] = final_price
                context['promo_used'] = promo_obj.code

        return render(request, 'cinema/buy_ticket.html', context)

class MyTicketsView(LoginRequiredMixin, ListView):
    template_name = 'cinema/my_tickets.html'
    context_object_name = 'tickets'
    login_url = 'cinema:login'
    paginate_by = 10

    def get_queryset(self):
        return Ticket.objects.filter(user=self.request.user) \
            .select_related('session__movie', 'session__hall') \
            .order_by('-purchase_date')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        tickets = context['tickets']
        paid_tickets = [t for t in tickets if t.is_paid]
        unpaid_tickets = [t for t in tickets if not t.is_paid]
        
        user_tz = timezone.get_current_timezone()
        now_utc = timezone.now()
        now_local = timezone.localtime(now_utc, user_tz)
        
        offset = now_local.utcoffset()
        total_minutes = offset.total_seconds() / 60
        sign = '+' if total_minutes >= 0 else '-'
        hours_offset = int(abs(total_minutes) // 60)
        minutes_offset = int(abs(total_minutes) % 60)
        utc_offset_str = f"UTC{sign}{hours_offset:02}:{minutes_offset:02}"
        
        calendar_text = calendar.TextCalendar(firstweekday=0).formatmonth(
            now_local.year, now_local.month
        )

        context.update({
            'paid_tickets': paid_tickets,
            'unpaid_tickets': unpaid_tickets,
            'user_timezone': str(user_tz),
            'timezone_name': str(user_tz),
            'user_tz_offset': utc_offset_str,
            'now_local': now_local.strftime('%d.%m.%Y %H:%M'),
            'now_utc': now_utc.strftime('%d.%m.%Y %H:%M'),
            'calendar_text': calendar_text,
            'current_time': timezone.now(),
        })
        return context
    
class ReviewView(UserPassesTestMixin, View):
    template_list = 'cinema/reviews.html'
    template_form = 'cinema/review_form.html'
    template_confirm = 'cinema/review_confirm_delete.html'
    login_url = 'cinema:login'
    
    def test_func(self):
        """Определяет доступ к действиям с отзывами"""
        if self.request.resolver_match.url_name == 'reviews':
            return True
        
        if not self.request.user.is_authenticated:
            return False
        
        try:
            profile = self.request.user.profile
            return profile.can_write_reviews()
        except Profile.DoesNotExist:
            return False
    
    def handle_no_permission(self):
        """Обработка отказа в доступе"""
        if self.request.user.is_authenticated:
            messages.error(self.request, 'Только обычные пользователи могут оставлять отзывы')
            return redirect('cinema:reviews')
        return super().handle_no_permission()
    
    def get(self, request, *args, **kwargs):
        if request.resolver_match.url_name == 'add_review':
            return self.add_review(request)
        elif request.resolver_match.url_name == 'edit_review':
            return self.edit_review(request)
        elif request.resolver_match.url_name == 'delete_review':
            return self.confirm_delete_review(request)
        else:
            return self.list_reviews(request)
    
    def post(self, request, *args, **kwargs):
        if request.resolver_match.url_name == 'add_review':
            return self.create_review(request)
        elif request.resolver_match.url_name == 'edit_review':
            return self.update_review(request)
        elif request.resolver_match.url_name == 'delete_review':
            return self.delete_review(request)
        else:
            return self.list_reviews(request)
    
    def list_reviews(self, request):
        reviews = Review.objects.select_related('user').all().order_by('-created_at')
        user_review = Review.objects.filter(user=request.user).first() if request.user.is_authenticated else None
        
        return render(request, self.template_list, {
            'reviews': reviews,
            'user_review': user_review
        })
    
    def add_review(self, request):
        if Review.objects.filter(user=request.user).exists():
            messages.warning(request, 'Вы уже оставили отзыв')
            return redirect('cinema:reviews')
        
        form = ReviewForm(user=request.user)
        return render(request, self.template_form, {
            'form': form,
            'title': 'Добавить отзыв',
            'submit_text': 'Отправить отзыв'
        })
    
    def create_review(self, request):
        if Review.objects.filter(user=request.user).exists():
            messages.warning(request, 'Вы уже оставили отзыв')
            return redirect('cinema:reviews')
        
        form = ReviewForm(request.POST, user=request.user)
        if form.is_valid():
            review = form.save(commit=False)
            review.user = request.user
            review.save()
            messages.success(request, 'Спасибо за ваш отзыв!')
            return redirect('cinema:reviews')
        
        return render(request, self.template_form, {
            'form': form,
            'title': 'Добавить отзыв',
            'submit_text': 'Отправить отзыв'
        })
    
    def edit_review(self, request):
        review = get_object_or_404(Review, user=request.user)
        form = ReviewForm(instance=review)
        return render(request, self.template_form, {
            'form': form,
            'title': 'Редактировать отзыв',
            'submit_text': 'Обновить отзыв'
        })
    
    def update_review(self, request):
        review = get_object_or_404(Review, user=request.user)
        form = ReviewForm(request.POST, instance=review)
        
        if form.is_valid():
            form.save()
            messages.success(request, 'Ваш отзыв успешно обновлён')
            return redirect('cinema:reviews')
        
        return render(request, self.template_form, {
            'form': form,
            'title': 'Редактировать отзыв',
            'submit_text': 'Обновить отзыв'
        })
    
    def confirm_delete_review(self, request):
        review = get_object_or_404(Review, user=request.user)
        return render(request, self.template_confirm, {'review': review})
    
    def delete_review(self, request):
        review = get_object_or_404(Review, user=request.user)
        review.delete()
        messages.success(request, 'Ваш отзыв удалён')
        return redirect('cinema:reviews')

class CustomLogoutView(LogoutView):
    next_page = reverse_lazy('cinema:login')
    
    def dispatch(self, request, *args, **kwargs):
        messages.info(request, 'Вы успешно вышли из системы.')
        return super().dispatch(request, *args, **kwargs)

def login_view(request):
    next_url = request.GET.get('next') or 'cinema:home'
    
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        next_url = request.POST.get('next') or 'cinema:home'
        
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            login(request, user)
            messages.success(request, f'Добро пожаловать, {user.username}!')
            return redirect(next_url)
        else:
            messages.error(request, 'Неверное имя пользователя или пароль.')
    
    return render(request, 'cinema/login.html', {'next': next_url})

def register_view(request):
    if request.method == 'POST':
        form = UserRegistrationForm(request.POST)
        if form.is_valid():
            user = form.save()
            
            user = authenticate(
                username=form.cleaned_data['username'],
                password=form.cleaned_data['password']
            )
            
            if user is not None:
                login(request, user)
                messages.success(request, 'Регистрация прошла успешно!')
                return redirect('cinema:home')
            else:
                messages.error(request, 'Ошибка автоматического входа после регистрации')
        else:
            messages.error(request, 'Пожалуйста, исправьте ошибки в форме')
    else:
        form = UserRegistrationForm()
    
    return render(request, 'cinema/register.html', {'form': form})

class PromoCodeListView(ListView):
    model = PromoCode
    template_name = 'cinema/promo_codes.html'
    context_object_name = 'promo_codes'
    
    def get_queryset(self):
        return PromoCode.objects.all().order_by(
            '-is_active', 
            '-start_date'
        )
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['now'] = timezone.now()
        return context

class VacancyView(View):
    def get(self, request):
        vacancies = Vacancy.objects.filter(is_active=True).order_by('-created_at')
    
        context = {
        'page_title': _("Актуальные вакансии"),
        'vacancies': vacancies
    }
        return render(request, 'cinema/vacancy_list.html', context)

class PrivacyPolicyView(View):
    def get(self, request):
        return render(request, 'cinema/privacy_policy.html')

class FAQListView(ListView):
    model = FAQ
    template_name = 'cinema/faq.html'
    context_object_name = 'faqs'
    ordering = ['-created_at']
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['questions'] = FAQ.objects.filter(entry_type=FAQ.QUESTION).order_by('-created_at')
        context['terms'] = FAQ.objects.filter(entry_type=FAQ.TERM).order_by('-created_at')
        return context
    
class ContactView(View):
    def get(self, request):
        company_contact = Contact.objects.first()

        # Get all employees with their user information
        employees = Employee.objects.select_related('user').all()

        context = {
            'company': company_contact,
            'employees': employees
        }
        return render(request, 'cinema/contacts.html', context)

class NewsDetailView(DetailView):
    model = News
    template_name = 'cinema/news_detail.html'
    context_object_name = 'news'

    def get_queryset(self):
        return News.objects.filter(is_published=True)
    
class MovieDetailView(DetailView):
    model = Movie
    template_name = 'cinema/movie_detail.html'
    context_object_name = 'movie'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        current_time = timezone.now()
        context['sessions'] = self.object.sessions.filter(
            start_time__gte=current_time
        ).order_by('start_time')
        now_utc = timezone.now()
        user_tz = timezone.get_current_timezone()
        now_local = timezone.localtime(now_utc, user_tz)
        calendar_text = calendar.TextCalendar(firstweekday=0).formatmonth(now_local.year, now_local.month)
        context['current_time'] = current_time
        context['calendar_text'] = calendar_text
        
        return context
    
class MovieListView(ListView):
    model = Movie
    template_name = 'cinema/movie_list.html'
    context_object_name = 'movies'
    paginate_by = 10
    ordering = ['-release_date']
    genres = Genre.objects.all()
    def get_queryset(self):
        queryset = super().get_queryset()
        genre = self.request.GET.get('genre')
        if genre:
            queryset = queryset.filter(genres__name=genre)
        return queryset
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['genres'] = Genre.objects.all()
        return context

class HomeView(View):
    def _build_context(self, request, slider_form=None):
        """Собираем контекст для главной страницы, включая настройки слайдера."""
        # Цитата дня
        quote_text, quote_author = "", ""
        try:
            response = requests.get("https://zenquotes.io/api/random", timeout=5)
            data = response.json()
            quote_text = data[0]["q"]
            quote_author = data[0]["a"]
        except Exception as e:
            print("Ошибка при запросе цитаты:", e)
            quote_text = "Не удалось загрузить цитату."
            quote_author = ""

        # Погода (Минск)
        weather_info = ""
        try:
            response = requests.get(
                "https://api.open-meteo.com/v1/forecast"
                "?latitude=53.9&longitude=27.5667&current_weather=true",
                timeout=5
            )
            data = response.json()
            temp = data["current_weather"]["temperature"]
            wind = data["current_weather"]["windspeed"]
            weather_info = f"Температура: {temp}°C, Ветер: {wind} км/ч"
        except Exception as e:
            print("Ошибка при запросе погоды:", e)
            weather_info = "Погода временно недоступна."

        # Фильмы в прокате
        active_movies = Movie.objects.filter(
            sessions__start_time__gte=timezone.now()
        ).distinct()

        # Логотип
        lm = LogoModel.objects.first()
        logo = lm.logo if lm else None

        # Реклама
        banners = AdvModel.objects.all()
        banner = random.choice(banners) if banners else None

        # Последняя новость
        last_news = News.objects.order_by('-publish_date').first()

        # Настройки слайдера
        slider_settings = SliderSettings.get_solo()
        if slider_form is None and request.user.is_superuser:
            slider_form = SliderSettingsForm(instance=slider_settings)

        context = {
            'quote_text': quote_text,
            'quote_author': quote_author,
            'weather_info': weather_info,
            'active_movies': active_movies,
            'logo': logo,
            'adv_img': banner.img if banner else None,
            'adv_src': banner.src if banner else None,
            'last_news': last_news,
            'slider_settings': slider_settings,
            'slider_form': slider_form,
        }
        return context

    def get(self, request):
        context = self._build_context(request)
        return render(request, 'cinema/home.html', context)

    def post(self, request):
        """Сохранение настроек слайдера. Только для администратора."""
        if not request.user.is_superuser:
            return HttpResponseForbidden("Только администратор может изменять настройки слайдера.")

        slider_settings = SliderSettings.get_solo()
        form = SliderSettingsForm(request.POST, instance=slider_settings)
        if form.is_valid():
            form.save()
            messages.success(request, "Настройки слайдера сохранены.")
            return redirect('cinema:home')

        context = self._build_context(request, slider_form=form)
        return render(request, 'cinema/home.html', context)


class AboutView(View):
    def get(self, request):
        try:
            company_info = About.objects.latest('updated_at')
            history_events = company_info.history.all()
            certificates = company_info.certificates.all()
        except About.DoesNotExist:
            company_info = None
            history_events = []
            certificates = []

        lm = LogoModel.objects.first()
        logo = lm.logo if lm else None
        
        from .models import SponsorModel
        sponsors = SponsorModel.objects.all()

        return render(request, 'cinema/about.html', {
            'company_info': company_info,
            'history_events': history_events,
            'certificates': certificates,
            'logo' : logo,
            'sponsors': sponsors
        })
    
class NewsListView(ListView):
    model = News
    template_name = 'cinema/news_list.html'
    context_object_name = 'news_list'
    paginate_by = 5

    def get_queryset(self):
        return News.objects.filter(is_published=True).order_by('-publish_date')
    
class PayTicketView(LoginRequiredMixin, View):
    login_url = 'cinema:login'
    
    def get(self, request, ticket_id):
        ticket = get_object_or_404(Ticket, id=ticket_id, user=request.user)
        
        if not ticket:
            messages.error(request, 'Билет не найден.')
            return redirect('cinema:my_tickets')
        
        if not ticket.can_be_paid:
            if ticket.is_paid:
                messages.error(request, 'Билет уже оплачен')
            elif ticket.is_expired:
                messages.error(request, 'Время оплаты билета истекло')
            elif ticket.session.start_time <= timezone.now():
                messages.error(request, 'Сеанс уже начался или завершился')
            return redirect('cinema:my_tickets')
        
        context = self.get_context_data(ticket=ticket)
        return render(request, 'cinema/pay_ticket.html', context)
    
    def post(self, request, ticket_id):
        ticket = get_object_or_404(Ticket, id=ticket_id, user=request.user)
        payment_method = request.POST.get('payment_method')
        
        if not ticket.can_be_paid:
            messages.error(request, 'Невозможно оплатить билет')
            return redirect('cinema:my_tickets')
        
        if payment_method not in ['card', 'cash']:
            messages.error(request, 'Выберите способ оплаты')
            context = self.get_context_data(ticket=ticket)
            return render(request, 'cinema/pay_ticket.html', context)
        
        ticket.is_paid = True
        ticket.payment_date = timezone.now()
        ticket.payment_method = payment_method
        ticket.save()
        
        return redirect('cinema:payment_success', ticket_id=ticket.id)
    
    def get_context_data(self, **kwargs):
        """Общий контекст с часовым поясом"""
        user_tz = timezone.get_current_timezone()
        now_utc = timezone.now()
        now_local = timezone.localtime(now_utc, user_tz)
        
        offset = now_local.utcoffset()
        total_minutes = offset.total_seconds() / 60
        sign = '+' if total_minutes >= 0 else '-'
        hours_offset = int(abs(total_minutes) // 60)
        minutes_offset = int(abs(total_minutes) % 60)
        utc_offset_str = f"UTC{sign}{hours_offset:02}:{minutes_offset:02}"
        
        calendar_text = calendar.TextCalendar(firstweekday=0).formatmonth(
            now_local.year, now_local.month
        )
        
        context = {
            'user_timezone': str(user_tz),
            'timezone_name': str(user_tz),
            'now_local': now_local.strftime('%d.%m.%Y %H:%M'),
            'now_utc': now_utc.strftime('%d.%m.%Y %H:%M'),
            'user_tz_offset': utc_offset_str,
            'calendar_text': calendar_text,
        }
        context.update(kwargs)
        return context
      
class DeleteTicketView(LoginRequiredMixin, View):
    login_url = 'cinema:login'
    
    def post(self, request, ticket_id):
        ticket = get_object_or_404(Ticket, id=ticket_id, user=request.user)
        
        if not ticket.is_paid:
            ticket.delete()
            messages.success(request, 'Билет успешно удален из корзины.')
        else:
            messages.error(request, 'Нельзя удалить оплаченный билет.')
        
        return redirect('cinema:my_tickets')
    

class ConfirmDeleteTicketView(LoginRequiredMixin, View):
    login_url = 'cinema:login'
    
    def get(self, request, ticket_id):
        ticket = get_object_or_404(Ticket, id=ticket_id, user=request.user)
        
        if ticket.is_paid:
            messages.error(request, 'Нельзя удалить оплаченный билет.')
            return redirect('cinema:my_tickets')
        
        context = self.get_context_data(ticket=ticket)
        return render(request, 'cinema/confirm_delete_ticket.html', context)
    
    def get_context_data(self, **kwargs):
        """Общий контекст с часовым поясом"""
        user_tz = timezone.get_current_timezone()
        now_utc = timezone.now()
        now_local = timezone.localtime(now_utc, user_tz)
        
        offset = now_local.utcoffset()
        total_minutes = offset.total_seconds() / 60
        sign = '+' if total_minutes >= 0 else '-'
        hours_offset = int(abs(total_minutes) // 60)
        minutes_offset = int(abs(total_minutes) % 60)
        utc_offset_str = f"UTC{sign}{hours_offset:02}:{minutes_offset:02}"
        
        calendar_text = calendar.TextCalendar(firstweekday=0).formatmonth(
            now_local.year, now_local.month
        )
        
        context = {
            'user_timezone': str(user_tz),
            'timezone_name': str(user_tz),
            'now_local': now_local.strftime('%d.%m.%Y %H:%M'),
            'now_utc': now_utc.strftime('%d.%m.%Y %H:%M'),
            'user_tz_offset': utc_offset_str,
            'calendar_text': calendar_text,
        }
        context.update(kwargs)
        return context
    
class PaymentSuccessView(LoginRequiredMixin, View):
    login_url = 'cinema:login'
    
    def get(self, request, ticket_id):
        ticket = get_object_or_404(Ticket, id=ticket_id, user=request.user)
        
        if not ticket.is_paid:
            messages.error(request, 'Билет не оплачен')
            return redirect('cinema:my_tickets')
        
        context = self.get_context_data(ticket=ticket)
        return render(request, 'cinema/payment_success.html', context)
    
    def get_context_data(self, **kwargs):
        """Общий контекст с часовым поясом"""
        user_tz = timezone.get_current_timezone()
        now_utc = timezone.now()
        now_local = timezone.localtime(now_utc, user_tz)
        
        offset = now_local.utcoffset()
        total_minutes = offset.total_seconds() / 60
        sign = '+' if total_minutes >= 0 else '-'
        hours_offset = int(abs(total_minutes) // 60)
        minutes_offset = int(abs(total_minutes) % 60)
        utc_offset_str = f"UTC{sign}{hours_offset:02}:{minutes_offset:02}"
        
        calendar_text = calendar.TextCalendar(firstweekday=0).formatmonth(
            now_local.year, now_local.month
        )
        
        context = {
            'user_timezone': str(user_tz),
            'timezone_name': str(user_tz),
            'now_local': now_local.strftime('%d.%m.%Y %H:%M'),
            'now_utc': now_utc.strftime('%d.%m.%Y H:%M'),
            'user_tz_offset': utc_offset_str,
            'calendar_text': calendar_text,
        }
        context.update(kwargs)
        return context

from django.contrib.auth.decorators import user_passes_test

def is_admin(user):
    return user.is_staff

@user_passes_test(is_admin)
def add_employee(request):
    if request.method == "POST":
        Contact.objects.create(
            full_name=request.POST.get("full_name"),
            position=request.POST.get("position"),
            email=request.POST.get("email"),
            phone=request.POST.get("phone"),
            photo=request.FILES.get("photo")
        )
        return redirect("contacts")
    return redirect("contacts")

@user_passes_test(is_admin)
def reward_employees(request):
    ids=request.POST.getlist("ids[]")
    employees=Contact.objects.filter(id__in=ids)
    names=[e.full_name for e in employees]
    return JsonResponse({"status":"ok","message":"Премированы: "+", ".join(names)})

import requests
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
import os
from urllib.parse import urlparse
import uuid

class EmployeeAPIView(View):
    """API для работы с сотрудниками"""
    
    def get(self, request):
        employees = Employee.objects.select_related('user').all()
        
        employees_data = []
        for emp in employees:
            employees_data.append({
                "id": emp.id,
                "full_name": emp.full_name,
                "position": emp.get_position_display(),  # Use display value for position
                "phone": emp.phone,
                "email": emp.user.email if emp.user and emp.user.email else "нет@email.com",
                "photo_url": request.build_absolute_uri(emp.photo.url) if emp.photo else request.build_absolute_uri('/static/images/favicon.png'),
                "description": emp.description or f"Сотрудник работает с {emp.hire_date.strftime('%d.%m.%Y')}"
            })
        
        return JsonResponse({"employees": employees_data})
    
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def post(self, request):
        """Добавление нового сотрудника"""
        if not (request.user.is_staff or request.user.is_superuser):
            return JsonResponse({"error": "Доступ запрещен"}, status=403)
        
        try:
            # Проверяем, является ли запрос multipart/form-data (для загрузки файлов)
            if request.content_type.startswith('multipart/form-data'):
                # Обработка загрузки файла
                full_name = request.POST.get('full_name')
                position = request.POST.get('position')
                phone = request.POST.get('phone')
                email = request.POST.get('email')
                description = request.POST.get('description')
                photo_file = request.FILES.get('photo')
                photo_url = request.POST.get('photo_url', '')
            else:
                # Обработка JSON-запроса
                data = json.loads(request.body)
                full_name = data.get('full_name')
                position = data.get('position')
                phone = data.get('phone')
                email = data.get('email')
                description = data.get('description')
                photo_url = data.get('photo_url', '')
                photo_file = None
            
            # Валидация данных
            if not self.validate_phone(phone or ''):
                return JsonResponse({"error": "Неверный формат телефона"}, status=400)
            
            # Валидация URL если он предоставлен
            if photo_url and not self.validate_url(photo_url):
                return JsonResponse({"error": "Неверный формат URL фотографии"}, status=400)
            
            # Проверяем наличие обязательных полей
            if not all([full_name, position, phone, email]):
                return JsonResponse({"error": "Не все обязательные поля заполнены"}, status=400)
            
            # Создание нового пользователя
            from django.contrib.auth.models import User
            from datetime import date
            import uuid
            username = full_name.replace(' ', '_').lower() + str(uuid.uuid4())[:8]
            user = User.objects.create_user(
                username=username,
                email=email,
                first_name=full_name.split()[0] if full_name.split() else '',
                last_name=' '.join(full_name.split()[1:]) if len(full_name.split()) > 1 else ''
            )
            
            # Определение позиции из переданных данных
            position_key = None
            for key, value in Employee.POSITIONS:
                if value == position or key == position:
                    position_key = key
                    break
            
            if not position_key:
                # Если позиция не найдена в списках, используем первую доступную
                position_key = Employee.POSITIONS[0][0] if Employee.POSITIONS else 'manager'
            
            # Создание сотрудника
            # Для тестирования используем дату рождения 30 лет назад
            test_birth_date = date.today().replace(year=date.today().year - 30)
            
            # Создаем сотрудника
            employee = Employee.objects.create(
                user=user,
                position=position_key,  # Используем ключ позиции, а не отображаемое значение
                phone=phone,
                birth_date=test_birth_date,  # В реальном приложении нужно получать из данных
                description=description or ''
            )
            
            # Если предоставлен файл фотографии, сохраняем его
            if photo_file:
                employee.photo = photo_file
                employee.save()
            # Если предоставлен URL фотографии, скачиваем и сохраняем изображение
            elif photo_url:
                try:
                    response = requests.get(photo_url, timeout=10)  # Добавляем таймаут
                    if response.status_code == 200:
                        # Получаем расширение файла из URL
                        parsed_url = urlparse(photo_url)
                        file_ext = os.path.splitext(parsed_url.path)[1]
                        if not file_ext:
                            file_ext = '.jpg'  # по умолчанию
                        
                        # Генерируем уникальное имя файла
                        filename = f"employee_{employee.id}_{uuid.uuid4()}{file_ext}"
                        
                        # Сохраняем файл
                        employee.photo.save(filename, ContentFile(response.content), save=True)
                except Exception as e:
                    # Если не удалось загрузить фото, продолжаем без него
                    print(f"Ошибка загрузки фото: {e}")
                    # Логируем ошибку для отладки
                    import logging
                    logging.error(f"Ошибка загрузки фото по URL {photo_url}: {e}")
            
            # Подготовка данных для ответа
            new_employee = {
                "id": employee.id,
                "full_name": employee.full_name,
                "position": employee.get_position_display(),  # Используем отображаемое значение
                "phone": employee.phone,
                "email": user.email,
                "photo_url": request.build_absolute_uri(employee.photo.url) if employee.photo else request.build_absolute_uri('/static/images/favicon.png'),
                "description": employee.description or f"Сотрудник работает с {employee.hire_date.strftime('%d.%m.%Y')}"
            }
            
            return JsonResponse({"success": True, "employee": new_employee})
            
        except Exception as e:
            # Удаляем пользователя, если создание сотрудника не удалось
            if 'user' in locals():
                user.delete()
            return JsonResponse({"error": str(e)}, status=400)
    
    def validate_phone(self, phone):
        """Валидация телефонного номера"""
        # Проверяем форматы: 80291112233, 8 (029) 1112233, +375 (29) 111-22-33, +375 (29) 111 22 33
        pattern = r'^(\+375\s?\(\d{2}\)\s?\d{3}[-\s]?\d{2}[-\s]?\d{2}|8\s?\(\d{3}\)\s?\d{3}[-\s]?\d{2}[-\s]?\d{2}|80\d{2}\d{7}|8\s?\d{3}\s?\d{3}[-\s]?\d{2}[-\s]?\d{2})$'
        return re.match(pattern, phone.replace(' ', '')) is not None
    
    def validate_url(self, url):
        """Валидация URL фотографии - должен начинаться с http:// или https:// и заканчиваться на расширение изображения"""
        pattern = r'^(http://|https://).*\.(jpg|jpeg|png|gif|webp|bmp)$'
        return re.match(pattern, url) is not None

def reward_employees_api(request):
    """API для премирования сотрудников"""
    if request.method == 'POST' and (request.user.is_staff or request.user.is_superuser):
        try:
            data = json.loads(request.body)
            employee_ids = data.get('employee_ids', [])
            
            # Получаем сотрудников (в реальном проекте - из БД)
            employees = Employee.objects.filter(id__in=employee_ids)
            names = [emp.full_name.split()[0] for emp in employees]  # Берем только фамилии
            
            reward_text = f"Поздравляем сотрудников {', '.join(names)} с премией! Ваш труд высоко ценится руководством кинотеатра."
            
            return JsonResponse({
                "success": True,
                "message": reward_text,
                "rewarded_count": len(names)
            })
            
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    
    return JsonResponse({"error": "Метод не разрешен"}, status=405)


class LR3GeneratorView(TemplateView):
    template_name = "cinema/lr3_generator.html"

class LR3CatalogView(TemplateView):
    template_name = "cinema/lr3_catalog.html"

def movies_api(request):
    qs = Movie.objects.all()
    data = []
    for m in qs:
        data.append({
            "id": m.id,
            "title": m.title,
            "price": float(getattr(m, "ticket_price", 10) or 10),
            "poster": m.poster.url if getattr(m, "poster", None) else "",
            "desc": m.description[:160] if getattr(m, "description", "") else "",
        })
    return JsonResponse({"movies": data})

class LR3AgeView(TemplateView):
    template_name = "cinema/lr3_age.html"

class LR3OOPView(TemplateView):
    template_name = "cinema/lr3_oop.html"

class LR3APIView(TemplateView):
    template_name = "cinema/lr3_api.html"

class LR3ChartsView(TemplateView):
    template_name = "cinema/lr3_charts.html"

class LR3ScrollCinemaView(TemplateView):
    template_name = "cinema/lr3_scroll.html"

class ExpView(TemplateView):
    template_name = 'cinema/exp.html'