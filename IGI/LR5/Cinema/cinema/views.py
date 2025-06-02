from django.views import View
from .models import News, Movie, About, Contact, Employee, FAQ,Vacancy, PromoCode, Profile
from django.views.generic import ListView, DetailView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.urls import reverse_lazy,reverse
from django.views.generic import CreateView, UpdateView, DeleteView
from .models import Session, Ticket, Genre
from django.urls import reverse
from django.shortcuts import render, get_object_or_404, redirect
from django.contrib import messages
from django.db import transaction
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.views.generic import DetailView
from django.db.models import F
from django.utils.translation import gettext_lazy as _
from .forms import UserRegistrationForm
from django.contrib.auth import login, authenticate
from django.contrib.auth import logout
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect
from django.contrib.auth.views import LogoutView
from .models import Review
from .forms import ReviewForm   
from django.contrib.auth.mixins import UserPassesTestMixin
from django.http import HttpResponseForbidden


class ReviewView(UserPassesTestMixin, View):
    template_list = 'cinema/reviews.html'
    template_form = 'cinema/review_form.html'
    template_confirm = 'cinema/review_confirm_delete.html'
    login_url = 'cinema:login'
    
    def test_func(self):
        """Определяет доступ к действиям с отзывами"""
        # Для просмотра списка всегда доступно
        if self.request.resolver_match.url_name == 'reviews':
            return True
        
        # Для других действий требуется аутентификация
        if not self.request.user.is_authenticated:
            return False
        
        # Проверка прав через профиль
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
        # Определяем действие по имени URL
        if request.resolver_match.url_name == 'add_review':
            return self.add_review(request)
        elif request.resolver_match.url_name == 'edit_review':
            return self.edit_review(request)
        elif request.resolver_match.url_name == 'delete_review':
            return self.confirm_delete_review(request)
        else:
            return self.list_reviews(request)
    
    def post(self, request, *args, **kwargs):
        # Определяем действие по имени URL
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
            
            # Автоматический вход после регистрации
            user = authenticate(
                username=form.cleaned_data['username'],
                password=form.cleaned_data['password']
            )
            
            if user is not None:
                login(request, user)
                messages.success(request, 'Регистрация прошла успешно!')
                return redirect('cinema:home')  # Редирект на главную страницу
            else:
                messages.error(request, 'Ошибка автоматического входа после регистрации')
        else:
            # Если форма невалидна, покажем ошибки
            messages.error(request, 'Пожалуйста, исправьте ошибки в форме')
    else:
        form = UserRegistrationForm()
    
    return render(request, 'cinema/register.html', {'form': form})

class PromoCodeListView(ListView):
    model = PromoCode
    template_name = 'cinema/promo_codes.html'
    context_object_name = 'promo_codes'
    
    def get_queryset(self):
        # Сначала активные, затем неактивные
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
    
    # Если нужно добавить дополнительный контекст
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # Разделяем FAQ и термины для удобства в шаблоне (опционально)
        context['questions'] = FAQ.objects.filter(entry_type=FAQ.QUESTION).order_by('-created_at')
        context['terms'] = FAQ.objects.filter(entry_type=FAQ.TERM).order_by('-created_at')
        return context

class ContactView(ListView):
    def get(self, request):
        company_contact = Contact.objects.first()

        employees = Employee.objects.all().select_related('user')

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
        context['current_time'] = current_time
        
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
    def get(self, request):
        latest_news = News.objects.filter(is_published=True).order_by('-publish_date')[:1]
        latest_movie = Movie.objects.order_by('-release_date').first()
        
        context = {
            'latest_news': latest_news[0] if latest_news else None,
            'latest_movie': latest_movie
        }
        return render(request, 'cinema/home.html', context)
      
class AboutView(View):
    def get(self, request):
        try:
            company_info = About.objects.latest('updated_at')
        except About.DoesNotExist:
            company_info = None
    
        return render(request, 'cinema/about.html', {
        'company_info': company_info
    })
class NewsListView(ListView):
    model = News
    template_name = 'cinema/news_list.html'
    context_object_name = 'news_list'
    paginate_by = 5

    def get_queryset(self):
        return News.objects.filter(is_published=True).order_by('-publish_date')
    
class HomeView(View):
    def get(self, request):
        active_movies = Movie.objects.filter(
            sessions__start_time__gte=timezone.now()
        ).distinct()
        return render(request, 'cinema/home.html', {'active_movies': active_movies})