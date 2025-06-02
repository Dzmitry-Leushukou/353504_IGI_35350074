from django import forms
from .models import Review, PromoCode
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator, RegexValidator


