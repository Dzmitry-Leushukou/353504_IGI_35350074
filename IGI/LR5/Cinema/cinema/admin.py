from django.contrib import admin
from .models import Genre, Hall, Movie

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