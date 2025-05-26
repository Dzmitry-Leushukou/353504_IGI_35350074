from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from django.utils import timezone

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
    

class Session(models.Model):
    movie = models.ForeignKey(
        Movie,
        on_delete=models.CASCADE,
        related_name='sessions',
        verbose_name="Фильм"
    )
    hall = models.ForeignKey(
        Hall,
        on_delete=models.CASCADE,
        related_name='sessions',
        verbose_name="Зал"
    )
    start_time = models.DateTimeField(
        verbose_name="Время начала"
    )
    end_time = models.DateTimeField(
        verbose_name="Время окончания",
        editable=False
    )
    price = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        verbose_name="Цена билета"
    )

    class Meta:
        verbose_name = "Сеанс"
        verbose_name_plural = "Сеансы"
        ordering = ['start_time']
        constraints = [
            models.UniqueConstraint(
                fields=['hall', 'start_time'],
                name='unique_session_time'
            )
        ]

    def __str__(self):
        return f"{self.movie.title} ({self.start_time.strftime('%d.%m.%Y %H:%M')})"

    def clean(self):
        self.end_time = self.start_time + timezone.timedelta(
            minutes=self.movie.duration + 30
        )

        overlapping_sessions = Session.objects.filter(
            hall=self.hall,
            start_time__lt=self.end_time,
            end_time__gt=self.start_time
        ).exclude(pk=self.pk)

        if overlapping_sessions.exists():
            raise ValidationError("Зал занят в это время другим сеансом!")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

class PromoCode(models.Model):
    DISCOUNT_TYPES = (
        ('percent', 'Процент'),
        ('fixed', 'Фиксированная сумма'),
    )

    code = models.CharField(
        max_length=20,
        unique=True,
        verbose_name="Код"
    )
    discount_type = models.CharField(
        max_length=10,
        choices=DISCOUNT_TYPES,
        default='percent',
        verbose_name="Тип скидки"
    )
    discount_value = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        verbose_name="Значение скидки"
    )
    start_date = models.DateField(
        verbose_name="Дата начала действия"
    )
    end_date = models.DateField(
        verbose_name="Дата окончания действия"
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="Активен"
    )
    max_uses = models.PositiveIntegerField(
        default=1,
        verbose_name="Максимум использований"
    )
    used_count = models.PositiveIntegerField(
        default=0,
        editable=False,
        verbose_name="Количество использований"
    )

    class Meta:
        verbose_name = "Промокод"
        verbose_name_plural = "Промокоды"
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.code} ({self.get_discount_type_display()})"

    def is_valid(self):
        today = timezone.now().date()
        return (
            self.is_active and
            self.start_date <= today <= self.end_date and
            self.used_count < self.max_uses
        )
    
class Ticket(models.Model):
    user = models.ForeignKey(
        'auth.User',
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
    promo_code = models.ForeignKey(
        PromoCode,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Промокод"
    )
    final_price = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        verbose_name="Итоговая цена"
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

    def clean(self):
        # Проверка номера места
        if self.seat_number > self.session.hall.capacity:
            raise ValidationError(
                f"В зале всего {self.session.hall.capacity} мест!"
            )

        # Проверка промокода
        if self.promo_code:
            if not self.promo_code.is_valid():
                raise ValidationError("Промокод недействителен!")
            self.promo_code.used_count += 1
            self.promo_code.save()

        # Рассчёт цены
        self.final_price = self._calculate_price()

    def _calculate_price(self):
        base_price = self.session.price
        if not self.promo_code:
            return base_price

        if self.promo_code.discount_type == 'percent':
            return base_price * (1 - self.promo_code.discount_value / 100)
        else:
            return max(base_price - self.promo_code.discount_value, 0)

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)