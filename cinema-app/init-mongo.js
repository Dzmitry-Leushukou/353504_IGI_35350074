// Подключаемся к MongoDB и создаем пользователя для приложения
db = db.getSiblingDB('cinema-app');

// Создаем пользователя для приложения
db.createUser({
  user: 'cinema_user',
  pwd: 'cinema_password',
  roles: [
    {
      role: 'readWrite',
      db: 'cinema-app'
    }
  ]
});

print('MongoDB user created successfully');