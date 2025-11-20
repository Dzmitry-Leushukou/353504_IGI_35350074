from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator, RegexValidator
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.contrib.auth.models import User
from django.urls import reverse 
from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.db.models import Q, F
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils.translation import gettext_lazy as _



class Session(models.Model):
    movie = models.ForeignKey(
        'Movie',
        on_delete=models.CASCADE,
        related_name='sessions',
        verbose_name="Фильм"
    )
    hall = models.ForeignKey(
        'Hall',
        on_delete=models.CASCADE,
        related_name='sessions',
        verbose_name="Зал"
    )
    start_time = models.DateTimeField(
        verbose_name="Время начала",
        db_index=True
    )
    end_time = models.DateTimeField(
        verbose_name="Время окончания",
        editable=False
    )
    price = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        verbose_name="Цена билета",
        validators=[MinValueValidator(0.01)]
    )
    available_seats = models.PositiveIntegerField(
        verbose_name="Свободные места",
        default=0
    )

    class Meta:
        verbose_name = "Сеанс"
        verbose_name_plural = "Сеансы"
        ordering = ['start_time']
        indexes = [
            models.Index(fields=['hall', 'start_time']),
            models.Index(fields=['available_seats']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['hall', 'start_time'],
                name='unique_session_time'
            ),
            models.CheckConstraint(
                check=Q(price__gte=0),
                name='price_positive'
            )
        ]

    def __str__(self):
        return f"{self.movie.title} ({self.start_time.strftime('%d.%m.%Y %H:%M')})"

    def clean(self):
        if self.start_time < timezone.now():
            raise ValidationError("Время начала сеанса не может быть в прошлом")

        self.end_time = self.start_time + timezone.timedelta(
            minutes=self.movie.duration + 30
        )

        overlapping = Session.objects.filter(
            hall=self.hall,
            start_time__lt=self.end_time,
            end_time__gt=self.start_time
        ).exclude(pk=self.pk).exists()

        if overlapping:
            raise ValidationError("Зал занят в это время другим сеансом")

        if self.available_seats > self.hall.capacity:
            raise ValidationError("Свободных мест не может быть больше вместимости зала")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def get_occupied_seats(self):
        """Возвращает список занятых номеров мест (для этого сеанса)."""
        return list(self.tickets.values_list('seat_number', flat=True))

    def is_seat_available(self, seat_number):
        """
        Проверяет, доступно ли указанное место:
        - номера от 1 до capacity
        - и его нет в списке уже занятых.
        """
        return (
            1 <= seat_number <= self.hall.capacity and
            seat_number not in self.get_occupied_seats()
        )

    def update_availability(self):
        """
        Пересчитывает available_seats на основе вместимости зала и количества
        уже проданных билетов для этого сеанса.
        """
        new_available = self.hall.capacity - self.tickets.count()
        if self.available_seats != new_available:
            self.available_seats = new_available
            self.save(update_fields=['available_seats'])

class Ticket(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='tickets',
        verbose_name="Пользователь"
    )
    session = models.ForeignKey(
        Session,
        on_delete=models.CASCADE,
        related_name='tickets',
        verbose_name="Сеанс"
    )
    seat_number = models.PositiveIntegerField(
        verbose_name="Номер места"
    )
    purchase_date = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата покупки"
    )
    final_price = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        verbose_name="Итоговая цена",
        validators=[MinValueValidator(0)]
    )
    is_paid = models.BooleanField(
        default=False,
        verbose_name="Оплачен"
    )
    payment_date = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Дата оплаты"
    )

    PAYMENT_METHODS = [
        ('card', 'Банковская карта'),
        ('cash', 'Наличные'),
    ]
    
    payment_method = models.CharField(
        max_length=10,
        choices=PAYMENT_METHODS,
        null=True,
        blank=True,
        verbose_name="Способ оплаты"
    )
    
    class Meta:
        verbose_name = "Билет"
        verbose_name_plural = "Билеты"
        ordering = ['-purchase_date']
        constraints = [
            models.UniqueConstraint(
                fields=['session', 'seat_number'],
                name='unique_seat_per_session'
            )
        ]

    def __str__(self):
        return f"Билет #{self.id} ({self.session})"

    @property
    def is_expired(self):
        """Проверяет, не истекло ли время для оплаты (30 минут)"""
        if self.is_paid:
            return False
        time_since_purchase = timezone.now() - self.purchase_date
        return time_since_purchase > timezone.timedelta(minutes=30)

    @property
    def can_be_paid(self):
        """Можно ли оплатить билет"""
        return not self.is_paid and not self.is_expired and self.session.start_time > timezone.now()

    def clean(self):
        if self.seat_number > self.session.hall.capacity:
            raise ValidationError(f"В зале всего {self.session.hall.capacity} мест!")

        if hasattr(self.user, 'profile') and self.user.profile.birth_date:
            film_age_limit = self.session.movie.age_limit
            if film_age_limit != '0+':
                user_age = calculate_age(self.user.profile.birth_date)
                required_age = int(film_age_limit[:-1])
                if user_age < required_age:
                    raise ValidationError("Возрастное ограничение не соблюдено!")
        else:
            raise ValidationError("Профиль пользователя не заполнен")
        
@receiver(post_save, sender=Session)
def init_session_data(sender, instance, created, **kwargs):
    if created:
        instance.available_seats = instance.hall.capacity
        instance.save(update_fields=['available_seats'])

@receiver(post_save, sender=Ticket)
def update_session_availability(sender, instance, created, **kwargs):
    """
    После создания нового билета пересчитываем свободные места в сеансе.
    """
    if created:
        instance.session.update_availability()

def calculate_age(birth_date):
    today = timezone.now().date()
    return today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))

class Review(models.Model):
    RATING_CHOICES = [
        (1, '1 звезда'),
        (2, '2 звезды'),
        (3, '3 звезды'),
        (4, '4 звезды'),
        (5, '5 звёзд'),
    ]
    
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        related_name='reviews',
        verbose_name="Пользователь"
    )
    text = models.TextField(
        max_length=2000,
        verbose_name="Текст отзыва"
    )
    rating = models.PositiveSmallIntegerField(
        choices=RATING_CHOICES,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name="Оценка"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата создания"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Дата обновления"
    )

    class Meta:
        verbose_name = "Отзыв"
        verbose_name_plural = "Отзывы"
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['user'],
                name='one_review_per_user'
            )
        ]

    def __str__(self):
        return f"Отзыв от {self.user.username} ({self.created_at.date()})"

def calculate_age(birth_date):
    today = timezone.now().date()
    return today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))

class Profile(models.Model):
    ROLE_CHOICES = (
        ('superuser', 'Владелец'),
        ('registered', 'Зарегистрированный пользователь'),
        ('guest', 'Гостевой пользователь'),
    )
    
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='guest')
    birth_date = models.DateField(null=True, blank=True)
    phone = models.CharField(max_length=20, blank=True)

    def can_write_reviews(self):
        return (
            self.role == 'registered' and 
            not self.user.is_staff and 
            not self.user.is_superuser
        )
    
    def __str__(self):
        return f"{self.user.username} ({self.get_role_display()})"

class Client(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    birth_date = models.DateField(null=True, blank=True)
    phone = models.CharField(max_length=20, blank=True)

class PromoCode(models.Model):
    class Status(models.TextChoices):
        ACTIVE = 'active', 'Активный'
        INACTIVE = 'inactive', 'Неактивный'
        EXPIRED = 'expired', 'Истек'
        USED = 'used', 'Использован'
        PENDING = 'pending', 'Ожидает активации'
    
    code = models.CharField(
        max_length=50,
        unique=True,
        verbose_name="Промокод"
    )
    discount = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(100)],
        verbose_name="Скидка (%)"
    )
    max_uses = models.PositiveIntegerField(
        default=1,
        verbose_name="Максимальное количество использований"
    )
    used_count = models.PositiveIntegerField(
        default=0,
        verbose_name="Количество использований"
    )
    start_date = models.DateTimeField(
        default=timezone.now,
        verbose_name="Действует с"
    )
    end_date = models.DateTimeField(
        verbose_name="Действует до",
        null=False,
        blank=False
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="Активный"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата создания"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Дата обновления"
    )

    class Meta:
        verbose_name = "Промокод"
        verbose_name_plural = "Промокоды"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.code} ({self.discount}%)"
    
    @property
    def status(self):
        now = timezone.now()
        if not self.is_active:
            return self.Status.INACTIVE
        if self.used_count >= self.max_uses:
            return self.Status.USED
        if self.start_date and now < self.start_date:
            return self.Status.PENDING
        if self.end_date and now > self.end_date:
            return self.Status.EXPIRED
        return self.Status.ACTIVE

    
    @property
    def status_display(self):
        return dict(self.Status.choices).get(self.status, self.status)
    
    @property
    def remaining_uses(self):
        return max(0, self.max_uses - self.used_count)

class About(models.Model):
    content = models.TextField("Текст о компании")
    updated_at = models.DateTimeField(default=timezone.now)
    video = models.FileField(upload_to='videos/', blank=True, null=True)

    company_name = models.CharField("Название компании", max_length=255, blank=True)
    inn = models.CharField("ИНН", max_length=20, blank=True)
    ogrn = models.CharField("ОГРН", max_length=20, blank=True)
    address = models.CharField("Адрес", max_length=255, blank=True)
    bank = models.CharField("Банк", max_length=255, blank=True)

    class Meta:
        verbose_name = "Информация о компании"
        verbose_name_plural = "Информация о компании"
    
    def __str__(self):
        return f"Информация (обновлено: {self.updated_at.strftime('%d/%m/%Y')})"

class Certificate(models.Model):
    about = models.ForeignKey(About, on_delete=models.CASCADE, related_name='certificates')
    name = models.CharField("Название сертификата", max_length=200)
    description = models.TextField("Описание сертификата")
    issue_date = models.DateField("Дата выдачи", null=True, blank=True)
    issuer = models.CharField("Организация, выдавшая сертификат", max_length=200, blank=True)

    class Meta:
        verbose_name = "Сертификат"
        verbose_name_plural = "Сертификаты"

    def __str__(self):
        return self.name    

class HistoryEvent(models.Model):
    about = models.ForeignKey(About, on_delete=models.CASCADE, related_name='history')
    year = models.PositiveIntegerField("Год")
    text = models.TextField("Описание события")


    class Meta:
        ordering = ['-year'] 
        verbose_name = "Событие истории"
        verbose_name_plural = "События истории"

    def __str__(self):
        return f"{self.year}: {self.text[:50]}…"
    
class Genre(models.Model):
    name = models.CharField(
        max_length=50, 
        unique=True,
        verbose_name="Название жанра",
        help_text="Введите название жанра (например, 'Фантастика', 'Драма')"
    )
    
    class Meta:
        verbose_name = "Жанр"
        verbose_name_plural = "Жанры"
        ordering = ['name']

    def __str__(self):
        return self.name

class Hall(models.Model):
    HALL_TYPES = (
        ('2D', 'Стандартный 2D'),
        ('3D', '3D-зал'),
        ('IMAX', 'IMAX'),
        ('VIP', 'VIP-зал'),
    )

    number = models.PositiveIntegerField(
        unique=True,
        verbose_name="Номер зала",
        help_text="Уникальный номер кинозала"
    )
    capacity = models.PositiveIntegerField(
        verbose_name="Вместимость",
        help_text="Количество мест в зале"
    )
    hall_type = models.CharField(
        max_length=20,
        choices=HALL_TYPES,
        default='2D',
        verbose_name="Тип зала"
    )
    description = models.TextField(
        blank=True,
        verbose_name="Описание",
        help_text="Дополнительная информация о зале"
    )

    class Meta:
        verbose_name = "Кинозал"
        verbose_name_plural = "Кинозалы"
        ordering = ['number']

    def __str__(self):
        return f"Зал {self.number} ({self.get_hall_type_display()})"
    
class Movie(models.Model):
    AGE_LIMITS = (
        ('0+', '0+'),
        ('6+', '6+'), 
        ('12+', '12+'),
        ('16+', '16+'),
        ('18+', '18+'),
    )

    title = models.CharField(
        max_length=200,
        verbose_name="Название фильма"
    )
    genres = models.ManyToManyField(
        Genre,
        related_name='movies',
        verbose_name="Жанры"
    )
    duration = models.PositiveIntegerField(
        verbose_name="Длительность (мин)",
        help_text="Продолжительность в минутах"
    )
    release_date = models.DateField(
        verbose_name="Дата выхода"
    )
    age_limit = models.CharField(
        max_length=3,
        choices=AGE_LIMITS,
        verbose_name="Возрастное ограничение"
    )
    country = models.CharField(
        max_length=100,
        verbose_name="Страна производства"
    )
    description = models.TextField(
        verbose_name="Описание фильма"
    )
    poster = models.ImageField(
        upload_to='posters/',
        verbose_name="Постер",
        help_text="Рекомендуемый размер: 600x900 px"
    )
    budget = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name="Бюджет ($)",
        help_text="Укажите сумму в долларах"
    )
    rating = models.FloatField(
        default=0.0,
        verbose_name="Рейтинг",
        validators=[
            MinValueValidator(0.0),
            MaxValueValidator(10.0)
        ]
    )

    class Meta:
        verbose_name = "Фильм"
        verbose_name_plural = "Фильмы"
        ordering = ['-release_date', 'title']
        indexes = [
            models.Index(fields=['-release_date']),
            models.Index(fields=['rating']),
        ]

    def __str__(self):
        return f"{self.title} ({self.release_date.year})"

class Employee(models.Model):
    POSITIONS = (
        ('cashier', 'Кассир'),
        ('manager', 'Менеджер'),
        ('admin', 'Администратор'),
        ('cleaner', 'Уборщик'),
    )

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        verbose_name="Пользователь"
    )
    @property
    def full_name(self):
        return self.user.get_full_name() or self.user.username
    position = models.CharField(
        max_length=20,
        choices=POSITIONS,
        verbose_name="Должность"
    )
    phone = models.CharField(
        max_length=20,
        validators=[
            RegexValidator(
                regex=r'^\+375 \(\d{2}\) \d{3}-\d{2}-\d{2}$',
                message="Формат: +375 (29) XXX-XX-XX"
            )
        ],
        verbose_name="Телефон"
    )
    birth_date = models.DateField(
        verbose_name="Дата рождения",
        validators=[
            MinValueValidator(
                limit_value=timezone.datetime(1900, 1, 1).date(),
                message="Дата рождения не может быть ранее 1900 года"
            )
        ],
        blank=False,
        null=False,
    )
    photo = models.ImageField(
        upload_to='employees/',
        verbose_name="Фотография",
        help_text="Рекомендуемый размер: 300x300 px"
    )
    hire_date = models.DateField(
        auto_now_add=True,
        verbose_name="Дата приёма на работу"
    )
    description = models.TextField(
        verbose_name="Описание работы",
        blank=True,
        null=True,
        help_text="Описание выполняемых работ сотрудником"
    )

    class Meta:
        verbose_name = "Сотрудник"
        verbose_name_plural = "Сотрудники"
        ordering = ['position']

    def __str__(self):
        return f"{self.user.get_full_name()} ({self.get_position_display()})"

    def clean(self):
    
        if not self.birth_date:
            raise ValidationError("Укажите дату рождения!")

        today = timezone.now().date()
        age = today.year - self.birth_date.year - (
            (today.month, today.day) < (self.birth_date.month, self.birth_date.day)
        )

        if age < 18:
            raise ValidationError("Сотрудник должен быть старше 18 лет!")

class News(models.Model):
    title = models.CharField(
        max_length=200,
        verbose_name="Заголовок"
    )
    summary = models.CharField(
        max_length=200,
        verbose_name="Краткое описание"
    )
    image = models.ImageField(
        upload_to='news/',
        verbose_name="Изображение"
    )
    full_text = models.TextField(
        verbose_name="Полный текст"
    )
    publish_date = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата публикации"
    )
    is_published = models.BooleanField(
        default=True,
        verbose_name="Опубликовано"
    )

    class Meta:
        verbose_name = "Новость"
        verbose_name_plural = "Новости"
        ordering = ['-publish_date']

    def __str__(self):
        return self.title
    
class Vacancy(models.Model):
    title = models.CharField(
        max_length=200,
        verbose_name=_("Название вакансии")
    )
    description = models.TextField(
        verbose_name=_("Описание")
    )
    requirements = models.TextField(
        verbose_name=_("Требования")
    )
    salary = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        verbose_name=_("Зарплата ($)"),
        null=True,
        blank=True
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name=_("Активна")
    )
    created_at = models.DateField(
        auto_now_add=True,
        verbose_name=_("Дата размещения")
    )

    class Meta:
        verbose_name = _("Вакансия")
        verbose_name_plural = _("Вакансии")
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({'активна' if self.is_active else 'закрыта'})"
    
    def get_formatted_salary(self):
        if self.salary:
            return f"{self.salary:,.2f}".replace(',', ' ').replace('.', ',')
        return _("По договорённости")
    
class FAQ(models.Model):
    QUESTION = 'question'
    TERM = 'term'
    ENTRY_TYPE_CHOICES = [
        (QUESTION, 'Частый вопрос'),
        (TERM, 'Термин глоссария'),
    ]
    
    entry_type = models.CharField(
        max_length=10,
        choices=ENTRY_TYPE_CHOICES,
        default=QUESTION,
        verbose_name="Тип записи"
    )
    question = models.CharField(
        max_length=300,
        verbose_name="Вопрос/Термин"
    )
    answer = models.TextField(
        verbose_name="Ответ/Определение"
    )
    created_at = models.DateField(
        auto_now_add=True,
        verbose_name="Дата добавления"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Дата обновления"
    )

    class Meta:
        verbose_name = "Запись"
        verbose_name_plural = "Словарь терминов и FAQ"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['entry_type']),
        ]

    def __str__(self):
        return self.question[:50] + ("..." if len(self.question) > 50 else "")
    
class Contact(models.Model):
    company_name = models.CharField(
        max_length=100,
        verbose_name="Название компании"
    )
    address = models.TextField(
        verbose_name="Адрес"
    )
    phone = models.CharField(
        max_length=20,
        validators=[
            RegexValidator(
                regex=r'^\+375 \(\d{2}\) \d{3}-\d{2}-\d{2}$',
                message="Формат: +375 (29) XXX-XX-XX"
            )
        ],
        verbose_name="Телефон"
    )
    email = models.EmailField(
        verbose_name="Email"
    )
    requisites = models.TextField(
        verbose_name="Реквизиты",
        help_text="Банковские реквизиты компании"
    )

    class Meta:
        verbose_name = "Контакт"
        verbose_name_plural = "Контакты"

    def __str__(self):
        return self.company_name
    
class LogoModel(models.Model):
    class Meta:
        verbose_name = "Главная страница"
        verbose_name_plural = "Главная страница"
    logo = models.ImageField(
        upload_to='logo/',
        verbose_name="Логотип",
    )

class AdvModel(models.Model):
    class Meta:
        verbose_name = "Рекламный баннер"
        verbose_name_plural = "Рекламные баннеры"
    
    img = models.ImageField(
        upload_to='adb/',
        verbose_name="Баннер",
    )

    src = models.TextField(
        verbose_name="Ссылка"
    )

class SponsorModel(models.Model):
    class Meta:
        verbose_name = "Спонсор"
        verbose_name_plural = "Спонсоры"
    
    img = models.ImageField(
        upload_to='sponsors/',
        verbose_name="Баннер",
    )

    src = models.TextField(
        verbose_name="Ссылка"
    )
    name = models.CharField("Название", max_length=255, null=True)

class SliderSettings(models.Model):
    """Настройки слайдера на главной странице."""

    loop = models.BooleanField(
        default=True,
        verbose_name="Зацикливание (loop)"
    )
    navs = models.BooleanField(
        default=True,
        verbose_name="Показывать стрелки (navs)"
    )
    pags = models.BooleanField(
        default=True,
        verbose_name="Показывать пагинацию (pags)"
    )
    auto = models.BooleanField(
        default=True,
        verbose_name="Автоматическая прокрутка (auto)"
    )
    stop_mouse_hover = models.BooleanField(
        default=True,
        verbose_name="Останавливать при наведении (stopMouseHover)"
    )
    delay = models.PositiveIntegerField(
        default=5,
        validators=[MinValueValidator(1), MaxValueValidator(60)],
        verbose_name="Интервал между слайдами (сек)"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Дата последнего изменения"
    )

    class Meta:
        verbose_name = "Настройки слайдера"
        verbose_name_plural = "Настройки слайдера"

    def __str__(self):
        return "Настройки слайдера"

    @classmethod
    def get_solo(cls):
        """Гарантированно одна запись с pk=1."""
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj
