from django import forms
from .models import Employee,PromoCode, Profile, Client
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator, RegexValidator
from datetime import date
import re
from .models import Review, Session, PromoCode
from django.utils import timezone
from datetime import datetime


class TicketPurchaseForm(forms.Form):
    """
    Форма для покупки билета:
    - выбор свободного места;
    - ввод промокода (необязательно).
    """
    seat_number = forms.ChoiceField(
        label="Выберите место",
        choices=[],
        widget=forms.RadioSelect
    )
    promo_code = forms.CharField(
        label="Промокод (если есть)",
        max_length=50,
        required=False,
        widget=forms.TextInput(attrs={'placeholder': 'Введите промокод'})
    )

    def __init__(self, *args, session: Session, **kwargs):
        """
        При инициализации обязательно передавать session (экземпляр Session),
        чтобы сформировать список свободных мест.
        """
        super().__init__(*args, **kwargs)
        self.session = session

        # Генерируем список доступных мест
        capacity = session.hall.capacity
        occupied = set(session.get_occupied_seats())
        choices = []
        for num in range(1, capacity + 1):
            if num not in occupied:
                choices.append((str(num), f"Место {num}"))
        self.fields['seat_number'].choices = choices

    def clean_seat_number(self):
        seat = self.cleaned_data.get('seat_number')
        if seat is None:
            raise ValidationError("Выберите, пожалуйста, место.")
        seat = int(seat)
        if not self.session.is_seat_available(seat):
            raise ValidationError("Данное место уже занято.")
        return seat

    def clean_promo_code(self):
        code = self.cleaned_data.get('promo_code', '').strip()
        if not code:
            return None  # промокод не указан
        try:
            promo = PromoCode.objects.get(code__iexact=code)
        except PromoCode.DoesNotExist:
            raise ValidationError("Промокод не найден.")
        # Проверяем статус промокода
        if promo.status != PromoCode.Status.ACTIVE:
            # Если статус не ACTIVE, отдаём разные сообщения
            if promo.status == PromoCode.Status.INACTIVE:
                raise ValidationError("Промокод неактивен.")
            if promo.status == PromoCode.Status.USED:
                raise ValidationError("Этот промокод уже использован максимально допустимое число раз.")
            if promo.status == PromoCode.Status.EXPIRED:
                raise ValidationError("Срок действия промокода истёк.")
            if promo.status == PromoCode.Status.PENDING:
                raise ValidationError("Промокод ещё не активен.")
            # В остальных случаях общее сообщение
            raise ValidationError("Невалидный промокод.")
        # Всё хорошо — возвращаем сам объект промокода, чтобы использовать его в представлении
        return promo

class ReviewForm(forms.ModelForm):
    class Meta:
        model = Review
        fields = ['text', 'rating']
        widgets = {
            'text': forms.Textarea(attrs={
                'rows': 5,
                'placeholder': 'Напишите ваш отзыв о кинотеатре...'
            }),
            'rating': forms.RadioSelect(choices=Review.RATING_CHOICES)
        }
        labels = {
            'text': 'Ваш отзыв',
            'rating': 'Ваша оценка'
        }
    def __init__(self, *args, **kwargs):
        self.user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)
    
    def clean(self):
        cleaned_data = super().clean()
        if self.user and not self.user.profile.can_write_reviews():
            raise ValidationError("У вас нет прав для оставления отзывов")
        return cleaned_data
    

class UserRegistrationForm(forms.ModelForm):
    password = forms.CharField(
        widget=forms.PasswordInput(attrs={'placeholder': 'Введите пароль'}),
        label='Пароль'
    )
    password_confirm = forms.CharField(
        widget=forms.PasswordInput(attrs={'placeholder': 'Подтвердите пароль'}),
        label='Подтверждение пароля'
    )
    phone = forms.CharField(
        label='Телефон',
        max_length=20,
        widget=forms.TextInput(attrs={'placeholder': '+375 (29) XXX-XX-XX'})
    )
    birth_date = forms.DateField(
    label='Дата рождения',
    input_formats=['%d/%m/%Y'],  # формат ввода
    widget=forms.DateInput(
        format='%d/%m/%Y',  # формат отображения
        attrs={'placeholder': 'ДД/ММ/ГГГГ', 'type': 'text'}
    )
)
    class Meta:
        model = User
        fields = ['username', 'email']
        widgets = {
            'username': forms.TextInput(attrs={'placeholder': 'Имя пользователя'}),
            'email': forms.EmailInput(attrs={'placeholder': 'email@example.com'}),
        }

    def clean_phone(self):
        phone = self.cleaned_data['phone']
        pattern = r'^\+375\s\(\d{2}\)\s\d{3}-\d{2}-\d{2}$'
        if not re.match(pattern, phone):
            raise ValidationError('Телефон должен быть в формате +375 (29) XXX-XX-XX')
        return phone

    def clean_birth_date(self):
        birth_date = self.cleaned_data['birth_date']
        today = date.today()
        age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
        if age < 18:
            raise ValidationError('Вам должно быть больше 18 лет для регистрации.')
        return birth_date

    def clean(self):
        cleaned_data = super().clean()
        password = cleaned_data.get("password")
        password_confirm = cleaned_data.get("password_confirm")

        if password and password_confirm and password != password_confirm:
            self.add_error('password_confirm', "Пароли не совпадают")

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data["password"])
        if commit:
            user.save()
            
            # Создаем профиль
            Profile.objects.create(
                user=user,
                role='registered',
                birth_date=self.cleaned_data['birth_date'],
                phone=self.cleaned_data['phone'],
            )
            
        return user

class PromoCodeForm(forms.ModelForm):
    start_date = forms.DateField(
        widget=forms.DateInput(attrs={'type': 'date'}),
        label='Действует с'
    )
    end_date = forms.DateField(
        widget=forms.DateInput(attrs={'type': 'date'}),
        label='Действует до'
    )

    class Meta:
        model = PromoCode
        fields = '__all__'

    def clean_start_date(self):
        date = self.cleaned_data['start_date']
        # Преобразуем в datetime с полуночью
        return timezone.make_aware(datetime.combine(date, datetime.min.time()))

    def clean_end_date(self):
        date = self.cleaned_data['end_date']
        # Преобразуем в datetime с 23:59:59
        return timezone.make_aware(datetime.combine(date, datetime.max.time()))
    
class EmployeeForm(forms.ModelForm):
    class Meta:
        model = Employee
        fields = '__all__'
    
    def clean(self):
        cleaned_data = super().clean()
        birth_date = cleaned_data.get('birth_date')
        
        if birth_date:
            today = date.today()
            age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
            
            if age < 18:
                raise forms.ValidationError("Сотрудник должен быть старше 18 лет!")
        return cleaned_data
    
class EmployeeAdminForm(forms.ModelForm):
    class Meta:
        model = Employee
        fields = '__all__'
    
    def clean(self):
        birth_date = self.cleaned_data.get('birth_date')
        
        if not birth_date:
            raise forms.ValidationError(
                {'birth_date': "Поле 'Дата рождения' обязательно для заполнения"}
            )
        
        return super().clean()
