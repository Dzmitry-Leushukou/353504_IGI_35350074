#!/usr/bin/env python
import os
import sys
import django
import random
from datetime import date

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cinema_site.settings')
django.setup()

from django.contrib.auth.models import User
from cinema.models import Employee

def create_employees():
    # Create additional employees to reach at least 10
    positions = ['manager', 'cashier', 'admin', 'cleaner']
    first_names = ['Иван', 'Петр', 'Сидор', 'Алексей', 'Дмитрий', 'Михаил', 'Андрей', 'Сергей', 'Владимир', 'Александр', 'Константин', 'Евгений', 'Олег', 'Николай', 'Виктор']
    last_names = ['Иванов', 'Петров', 'Сидоров', 'Козлов', 'Волков', 'Смирнов', 'Кузнецов', 'Попов', 'Лебедев', 'Новиков', 'Морозов', 'Федоров', 'Михайлов', 'Соколов', 'Васильев']
    descriptions = [
        'Отвечает за общее руководство кинотеатром',
        'Обслуживает посетителей и продает билеты',
        'Управляет системами и администрирует ресурсы',
        'Поддерживает чистоту и порядок в помещениях',
        'Обеспечивает техническую поддержку',
        'Контролирует сеансы и обслуживание залов',
        'Работает с клиентами и решает вопросы',
        'Проводит уборку помещений и санитарных зон',
        'Организует работу персонала',
        'Обеспечивает безопасность посетителей',
        'Работает с кассовыми операциями',
        'Контролирует качество обслуживания',
        'Обслуживает посетителей в фойе',
        'Работает на кассе и в буфете',
        'Отвечает за техническое обслуживание оборудования'
    ]
    
    current_count = Employee.objects.count()
    needed = max(0, 10 - current_count)
    
    print(f"Current employees: {current_count}, need to add: {needed}")
    
    for i in range(needed):
        first_name = random.choice(first_names)
        last_name = random.choice(last_names)
        username = f"employee_{first_name.lower()}_{last_name.lower()}_{i+current_count}"
        
        # Create user
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                'first_name': first_name,
                'last_name': last_name,
                'email': f"{username}@cinema.com"
            }
        )
        
        # Create employee if user doesn't already have one
        if not hasattr(user, 'employee'):
            birth_date = date(1980 + (i % 30), 1 + (i % 12), 1 + (i % 28))
            
            # Random phone number in valid format
            phone_formats = [
                f"+375 (29) {random.randint(100, 999)}-{random.randint(10, 99)}-{random.randint(10, 99)}",
                f"8 (029) {random.randint(100000, 999999)}",
                f"8029{random.randint(1000000, 9999999)}"
            ]
            phone = random.choice(phone_formats)
            
            employee = Employee.objects.create(
                user=user,
                position=random.choice(positions),
                phone=phone,
                birth_date=birth_date,
                description=random.choice(descriptions)
            )
            
            print(f'Created employee: {user.get_full_name()} ({employee.get_position_display()})')
    
    print(f"Total employees after adding: {Employee.objects.count()}")

if __name__ == '__main__':
    create_employees()