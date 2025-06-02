from django.contrib import admin,messages
from .models import Genre, Hall, Movie, Session, Ticket, Employee, News, Vacancy, FAQ, Contact, About
from .forms import EmployeeAdminForm
from django.db import models

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    fform = EmployeeAdminForm
    list_display = ('full_name', 'position', 'phone')
    search_fields = ('user__first_name', 'user__last_name',)
    
    def full_name(self, obj):
        return obj.user.get_full_name() or obj.user.username
    full_name.short_description = 'Имя сотрудника'

@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ('company_name', 'phone', 'email')


@admin.register(News)
class NewsAdmin(admin.ModelAdmin):
    list_display = ('title', 'publish_date', 'is_published')
    list_filter = ('is_published', 'publish_date')
    search_fields = ('title', 'summary')
    prepopulated_fields = {'summary': ('title',)}

@admin.register(Vacancy)
class VacancyAdmin(admin.ModelAdmin):
    list_display = ('title', 'salary', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('title', 'description')
    actions = ['activate_vacancies', 'deactivate_vacancies']  # Регистрация действий

    # Действие для активации
    def activate_vacancies(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(
            request,
            f"Активировано вакансий: {updated}",
            messages.SUCCESS
        )

    # Действие для деактивации
    def deactivate_vacancies(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(
            request,
            f"Деактивировано вакансий: {updated}",
            messages.SUCCESS
        )
    
    # Настройка отображения названий действий
    activate_vacancies.short_description = "Активировать выбранные вакансии"
    deactivate_vacancies.short_description = "Деактивировать выбранные вакансии"

@admin.register(About)
class CompanyInfoAdmin(admin.ModelAdmin):
    list_display = ('updated_at', 'content_preview')
    fields = ('content',)
    
    def content_preview(self, obj):
        return obj.content[:100] + '...' if len(obj.content) > 100 else obj.content
    content_preview.short_description = "Текст (предпросмотр)"
    
    def has_add_permission(self, request):
        return not About.objects.exists()

@admin.register(FAQ)
class FAQAdmin(admin.ModelAdmin):
    list_display = ('entry_type', 'truncated_question', 'created_at')
    list_filter = ('entry_type', 'created_at')
    search_fields = ('question', 'answer')
    fieldsets = (
        (None, {
            'fields': ('entry_type', 'question', 'answer')
        }),
        ('Даты', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ('created_at', 'updated_at')

    def truncated_question(self, obj):
        return obj.question[:75] + ("..." if len(obj.question) > 75 else "")
    truncated_question.short_description = "Вопрос/Термин"

@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ('movie', 'hall', 'start_time', 'end_time', 'price')
    list_filter = ('hall', 'start_time')
    search_fields = ('movie__title', 'hall__number')
    readonly_fields = ('end_time',) 
    date_hierarchy = 'start_time'

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