from django.urls import path
from . import views

app_name = 'cinema'  # Пространство имён для URL

urlpatterns = [
    path('', views.HomeView.as_view(), name='home'),
    path('movies/', views.MovieListView.as_view(), name='movie_list'),
    path('movies/<int:pk>/', views.MovieDetailView.as_view(), name='movie_detail'),
    path('news/', views.NewsListView.as_view(), name='news_list'),
    path('news/<int:pk>/', views.NewsDetailView.as_view(), name='news_detail'),
    path('about/', views.AboutView.as_view(), name='about'),
]