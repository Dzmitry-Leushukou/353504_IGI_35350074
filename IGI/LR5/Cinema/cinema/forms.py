from django import forms
from .models import Employee,PromoCode, Profile, Client
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator, RegexValidator
from datetime import date
import re
from .models import Review

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
        widget=forms.DateInput(attrs={'type': 'date'})
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
    class Meta:
        model = PromoCode
        fields = '__all__'
        widgets = {
            'start_date': forms.DateTimeInput(attrs={'type': 'datetime-local'}),
            'end_date': forms.DateTimeInput(attrs={'type': 'datetime-local'}),
        }
    
    def clean_end_date(self):
        start_date = self.cleaned_data.get('start_date')
        end_date = self.cleaned_data.get('end_date')
        
        if start_date and end_date and end_date <= start_date:
            raise forms.ValidationError("Дата окончания должна быть позже даты начала")
        return end_date


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
