from django.urls import path
from . import views
from django.conf import settings
from django.conf.urls.static import static

app_name = 'cinema'

urlpatterns = [
    path('', views.HomeView.as_view(), name='home'),
    path('movies/', views.MovieListView.as_view(), name='movie_list'),
    path('movies/<int:pk>/', views.MovieDetailView.as_view(), name='movie_detail'),
    path('news/', views.NewsListView.as_view(), name='news_list'),
    path('news/<int:pk>/', views.NewsDetailView.as_view(), name='news_detail'),
    path('about/', views.AboutView.as_view(), name='about'),
    path('contacts/', views.ContactView.as_view(), name='contacts'),
    path('faq/', views.FAQListView.as_view(), name='faq'),
    path('privacy-policy/', views.PrivacyPolicyView.as_view(), name='privacy_policy'),
    path('vacancies/', views.VacancyView.as_view(), name='vacancy_list'),
    path('promo-codes/', views.PromoCodeListView.as_view(), name='promo_codes'),
    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),
    path('reviews/', views.ReviewView.as_view(), name='reviews'),
    path('reviews/add/', views.ReviewView.as_view(), name='add_review'),
    path('reviews/edit/', views.ReviewView.as_view(), name='edit_review'),
    path('reviews/delete/', views.ReviewView.as_view(), name='delete_review'),
    path('session/<int:session_id>/buy/', views.TicketPurchaseView.as_view(), name='buy_ticket'),
    path('my-tickets/', views.MyTicketsView.as_view(), name='my_tickets'),
    path('statistics/', views.StatisticsView.as_view(), name='statistics'),
    path('ticket/<int:ticket_id>/pay/', views.PayTicketView.as_view(), name='pay_ticket'),
    path('ticket/<int:ticket_id>/delete/', views.DeleteTicketView.as_view(), name='delete_ticket'),
    path('ticket/<int:ticket_id>/delete/confirm/', views.ConfirmDeleteTicketView.as_view(), name='confirm_delete_ticket'),
    path('ticket/<int:ticket_id>/payment-success/', views.PaymentSuccessView.as_view(), name='payment_success'),
    
    # API для сотрудников
    path('api/employees/', views.EmployeeAPIView.as_view(), name='employees_api'),
    path('api/employees/reward/', views.reward_employees_api, name='reward_employees_api'),
    
    # Дополнительные пути
    path('api/movies/', views.movies_api, name='movies_api'),
    path('exp/', views.ExpView.as_view(), name='exp'),
    
    # Старые пути для обратной совместимости
    path('contacts/add/', views.add_employee, name='add_employee'),
    path('contacts/reward/', views.reward_employees, name='reward_employees'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)