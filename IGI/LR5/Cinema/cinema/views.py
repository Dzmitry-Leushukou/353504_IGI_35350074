from django.views import View
from .models import News, Movie, About, Contact, Employee
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
        context['reviews'] = self.object.reviews.select_related('user').order_by('-created_at')
        
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