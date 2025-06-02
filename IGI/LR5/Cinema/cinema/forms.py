from django import forms
from .models import Employee
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator, RegexValidator
from datetime import date

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
        if not self.cleaned_data.get('birth_date'):
            raise forms.ValidationError("Поле 'Дата рождения' обязательно для заполнения")
        
        return super().clean()