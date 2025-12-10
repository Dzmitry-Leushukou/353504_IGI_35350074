const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Movie = require('./models/Movie');
const Order = require('./models/Order');

const users = [
  {
    username: "admin",
    email: "admin@cinema.com",
    password: "admin123",
    role: "admin",
    timezone: "Europe/Moscow"
  },
  {
    username: "user1",
    email: "user1@test.com",
    password: "user123",
    timezone: "Europe/Moscow"
  },
  {
    username: "user2",
    email: "user2@test.com",
    password: "user123",
    timezone: "America/New_York"
  }
];

const movies = [
  {
    title: "Гарри Поттер и философский камень",
    description: "Мальчик-сирота узнает, что он волшебник, и отправляется в школу магии Хогвартс.",
    genre: ["Фэнтези", "Приключения", "Семейный"],
    duration: 152,
    rating: 7.6,
    year: 2001,
    director: "Крис Коламбус",
    actors: ["Дэниел Рэдклифф", "Руперт Гринт", "Эмма Уотсон", "Ричард Харрис"],
    price: 350,
    poster: "harry-potter.jpg",
    trailer: "harry-potter-trailer.mp4",
    sessions: [
      { 
        date: new Date('2024-12-20'), 
        time: "18:00", 
        hall: "Зал 1", 
        availableSeats: 100, 
        totalSeats: 150 
      },
      { 
        date: new Date('2024-12-20'), 
        time: "21:00", 
        hall: "Зал 2", 
        availableSeats: 80, 
        totalSeats: 120 
      }
    ]
  },
  // ... остальные фильмы (оставьте как есть)
];

async function seedDatabase() {
  try {
    // Подключаемся к MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27017/cinema_db?authSource=admin');
    console.log('Connected to MongoDB for seeding');

    // Проверяем, есть ли уже данные в базе
    const userCount = await User.countDocuments();
    const movieCount = await Movie.countDocuments();
    
    if (userCount > 0 || movieCount > 0) {
      console.log('Database already has data. Skipping seeding.');
      console.log(`Users in DB: ${userCount}, Movies in DB: ${movieCount}`);
      return;
    }

    console.log('Database is empty. Starting seeding process...');

    // Хешируем пароли и создаем пользователей
    const hashedUsers = await Promise.all(
      users.map(async (user) => {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.password, salt);
        return {
          ...user,
          password: hashedPassword
        };
      })
    );

    const createdUsers = await User.insertMany(hashedUsers);
    console.log(`Added ${createdUsers.length} users`);

    // Создаем фильмы
    const createdMovies = await Movie.insertMany(movies);
    console.log(`Added ${createdMovies.length} movies`);

    // Создаем несколько тестовых заказов
    const testOrders = [
      {
        user: createdUsers[1]._id,
        movie: createdMovies[0]._id,
        sessionId: createdMovies[0].sessions[0]._id.toString(),
        seats: ["A1", "A2", "A3"],
        totalPrice: createdMovies[0].price * 3,
        status: "confirmed",
        isPaid: true,
        paymentDate: new Date(),
        paymentMethod: "online",
        showDate: createdMovies[0].sessions[0].date,
        showTime: createdMovies[0].sessions[0].time
      },
      {
        user: createdUsers[1]._id,
        movie: createdMovies[1]._id,
        sessionId: createdMovies[1].sessions[0]._id.toString(),
        seats: ["B5", "B6"],
        totalPrice: createdMovies[1].price * 2,
        status: "confirmed",
        isPaid: false,
        paymentMethod: "card",
        showDate: createdMovies[1].sessions[0].date,
        showTime: createdMovies[1].sessions[0].time
      },
      {
        user: createdUsers[2]._id,
        movie: createdMovies[2]._id,
        sessionId: createdMovies[2].sessions[0]._id.toString(),
        seats: ["C10"],
        totalPrice: createdMovies[2].price,
        status: "completed",
        isPaid: true,
        paymentDate: new Date(),
        paymentMethod: "cash",
        showDate: createdMovies[2].sessions[0].date,
        showTime: createdMovies[2].sessions[0].time
      }
    ];

    const createdOrders = await Order.insertMany(testOrders);
    console.log(`Added ${createdOrders.length} orders`);

    // Обновляем количество доступных мест
    for (const order of testOrders) {
      const movie = await Movie.findById(order.movie);
      const session = movie.sessions.id(order.sessionId);
      if (session) {
        session.availableSeats -= order.seats.length;
        await movie.save();
      }
    }

    console.log('Database seeding completed successfully!');
    
    // Выводим информацию для входа
    console.log('\n=== Тестовые пользователи ===');
    console.log('Администратор:');
    console.log('  Email: admin@cinema.com');
    console.log('  Пароль: admin123');
    console.log('\nОбычный пользователь:');
    console.log('  Email: user1@test.com');
    console.log('  Пароль: user123');

  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Если файл запущен напрямую
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;