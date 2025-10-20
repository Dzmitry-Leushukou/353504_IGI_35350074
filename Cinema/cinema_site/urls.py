from django.contrib import admin
from django.urls import path, include  # Добавьте include
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from django.contrib.auth import views as auth_views
from cinema import views as cinema_views 

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('cinema.urls')),
    path('logout/', cinema_views.CustomLogoutView.as_view(), name='logout'),
]+ static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)