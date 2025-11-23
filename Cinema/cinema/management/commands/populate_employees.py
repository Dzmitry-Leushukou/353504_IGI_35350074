from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from cinema.models import Employee
from django.utils import timezone
from datetime import date
import random

class Command(BaseCommand):
    help = 'Populate database with test employees'

    def handle(self, *args, **options):
        # Create test employees if they don't exist
        if Employee.objects.count() == 0:
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
            
            for i in range(15):  # Create 15 test employees
                first_name = random.choice(first_names)
                last_name = random.choice(last_names)
                username = f"{first_name.lower()}_{last_name.lower()}_{i}"
                
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
                        f"8 (029) {random.randint(1000000, 9999999)}",
                        f"8029{random.randint(1000000, 9999)}"
                    ]
                    phone = random.choice(phone_formats)
                    
                    employee = Employee.objects.create(
                        user=user,
                        position=random.choice(positions),
                        phone=phone,
                        birth_date=birth_date,
                        description=random.choice(descriptions)
                    )
                    
                    self.stdout.write(f'Created employee: {user.get_full_name()} ({employee.get_position_display()})')
            
            self.stdout.write(
                self.style.SUCCESS('Successfully created 15 test employees')
            )
        else:
            self.stdout.write(
                self.style.WARNING('Employees already exist in the database')
            )