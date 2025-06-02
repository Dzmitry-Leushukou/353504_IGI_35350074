from django.contrib import admin
from .models import Genre, Hall, Movie, Session, Ticket, Employee, News, Vacancy, FAQ, Contact, About


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('user', 'position', 'phone')
    list_filter = ('position',)
    search_fields = ('user__username', 'phone')

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
    list_display = ('question', 'created_at')
    search_fields = ('question', 'answer')

@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ('company_name', 'phone', 'email')

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