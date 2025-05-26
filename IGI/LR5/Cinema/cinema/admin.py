from django.contrib import admin
from .models import Genre, Hall, Movie, Session, PromoCode, Ticket

@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ('movie', 'hall', 'start_time', 'end_time', 'price')
    list_filter = ('hall', 'start_time')
    search_fields = ('movie__title', 'hall__number')
    readonly_fields = ('end_time',)  # Запрещаем ручное редактирование
    date_hierarchy = 'start_time'

@admin.register(PromoCode)
class PromoCodeAdmin(admin.ModelAdmin):
    list_display = ('code', 'discount_type', 'discount_value', 'is_active', 'used_count')
    list_editable = ('is_active',)
    list_filter = ('discount_type', 'is_active')
    search_fields = ('code',)

@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ('user', 'session', 'seat_number', 'final_price')
    list_filter = ('session__start_time',)
    search_fields = ('user__username', 'session__movie__title')
    readonly_fields = ('purchase_date', 'final_price')
@admin.register(Genre)
class GenreAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)

@admin.register(Hall)
class HallAdmin(admin.ModelAdmin):
    list_display = ('number', 'hall_type', 'capacity')
    list_filter = ('hall_type',)
    search_fields = ('number', 'description')

@admin.register(Movie)
class MovieAdmin(admin.ModelAdmin):
    list_display = ('title', 'release_date', 'age_limit', 'rating')
    list_filter = ('genres', 'age_limit', 'release_date')
    search_fields = ('title', 'description')
    filter_horizontal = ('genres',)
    fieldsets = (
        ('Основная информация', {
            'fields': ('title', 'genres', 'duration', 'poster')
        }),
        ('Детали', {
            'fields': ('release_date', 'age_limit', 'country', 'budget', 'rating'),
            'classes': ('collapse',)
        }),
        ('Описание', {
            'fields': ('description',)
        })
    )