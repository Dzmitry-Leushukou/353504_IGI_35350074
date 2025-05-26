from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

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