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
  {
    title: "Властелин колец: Братство кольца",
    description: "Хоббит Фродо получает опасную миссию — уничтожить Кольцо Всевластья.",
    genre: ["Фэнтези", "Приключения", "Экшн"],
    duration: 178,
    rating: 8.8,
    year: 2001,
    director: "Питер Джексон",
    actors: ["Элайджа Вуд", "Вигго Мортенсен", "Иэн Маккеллен", "Шон Эстин"],
    price: 400,
    poster: "lotr.jpg",
    trailer: "lotr-trailer.mp4",
    sessions: [
      { 
        date: new Date('2024-12-21'), 
        time: "19:00", 
        hall: "Зал 1", 
        availableSeats: 120, 
        totalSeats: 150 
      },
      { 
        date: new Date('2024-12-22'), 
        time: "16:00", 
        hall: "Зал 3", 
        availableSeats: 90, 
        totalSeats: 100 
      }
    ]
  },
  {
    title: "Побег из Шоушенка",
    description: "Несправедливо осужденный банкир проводит 19 лет в тюрьме, не теряя надежды на свободу.",
    genre: ["Драма", "Криминал"],
    duration: 142,
    rating: 9.3,
    year: 1994,
    director: "Фрэнк Дарабонт",
    actors: ["Тим Роббинс", "Морган Фриман", "Боб Гантон"],
    price: 300,
    poster: "shawshank.jpg",
    trailer: "shawshank-trailer.mp4",
    sessions: [
      { 
        date: new Date('2024-12-19'), 
        time: "20:00", 
        hall: "Зал 2", 
        availableSeats: 60, 
        totalSeats: 80 
      },
      { 
        date: new Date('2024-12-20'), 
        time: "22:00", 
        hall: "Зал 3", 
        availableSeats: 70, 
        totalSeats: 100 
      }
    ]
  }
];

async function seedDatabase() {
  try {
    // Подключаемся к MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27017/cinema_db?authSource=admin');
    console.log('Connected to MongoDB for seeding');

    // Очищаем базу данных
    await User.deleteMany({});
    await Movie.deleteMany({});
    await Order.deleteMany({});
    console.log('Cleared existing data');

    console.log('Starting seeding process...');

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

    // Ждем чтобы убедиться что фильмы сохранены и имеют _id
    await new Promise(resolve => setTimeout(resolve, 100));

    // Получаем свежие данные фильмов с сессиями
    const moviesWithSessions = await Movie.find();
    
    // Создаем несколько тестовых заказов
    const testOrders = [
      {
        user: createdUsers[1]._id,
        movie: moviesWithSessions[0]._id,
        sessionId: moviesWithSessions[0].sessions[0]._id ? moviesWithSessions[0].sessions[0]._id.toString() : moviesWithSessions[0].sessions[0]._id,
        seats: ["A1", "A2", "A3"],
        totalPrice: moviesWithSessions[0].price * 3,
        status: "confirmed",
        isPaid: true,
        paymentDate: new Date(),
        paymentMethod: "online",
        showDate: moviesWithSessions[0].sessions[0].date,
        showTime: moviesWithSessions[0].sessions[0].time
      },
      {
        user: createdUsers[1]._id,
        movie: moviesWithSessions[1]._id,
        sessionId: moviesWithSessions[1].sessions[0]._id ? moviesWithSessions[1].sessions[0]._id.toString() : moviesWithSessions[1].sessions[0]._id,
        seats: ["B5", "B6"],
        totalPrice: moviesWithSessions[1].price * 2,
        status: "confirmed",
        isPaid: false,
        paymentMethod: "card",
        showDate: moviesWithSessions[1].sessions[0].date,
        showTime: moviesWithSessions[1].sessions[0].time
      },
      {
        user: createdUsers[2]._id,
        movie: moviesWithSessions[2]._id,
        sessionId: moviesWithSessions[2].sessions[0]._id ? moviesWithSessions[2].sessions[0]._id.toString() : moviesWithSessions[2].sessions[0]._id,
        seats: ["C10"],
        totalPrice: moviesWithSessions[2].price,
        status: "completed",
        isPaid: true,
        paymentDate: new Date(),
        paymentMethod: "cash",
        showDate: moviesWithSessions[2].sessions[0].date,
        showTime: moviesWithSessions[2].sessions[0].time
      }
    ];

    const createdOrders = await Order.insertMany(testOrders);
    console.log(`Added ${createdOrders.length} orders`);

    // Обновляем количество доступных мест
    for (const order of createdOrders) {
      const movie = await Movie.findById(order.movie);
      if (!movie) continue;
      
      // Ищем сессию по _id
      const session = movie.sessions.find(s => 
        s._id && s._id.toString() === order.sessionId
      );
      
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
    console.log('\nОбычный пользователь 1:');
    console.log('  Email: user1@test.com');
    console.log('  Пароль: user123');
    console.log('\nОбычный пользователь 2:');
    console.log('  Email: user2@test.com');
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