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
    description: "Хоббит Фродо должен уничтожить опасное кольцо в огне горы Роковой.",
    genre: ["Фэнтези", "Приключения", "Драма"],
    duration: 178,
    rating: 8.8,
    year: 2001,
    director: "Питер Джексон",
    actors: ["Элайджа Вуд", "Иэн Маккеллен", "Вигго Мортенсен", "Шон Эстин"],
    price: 400,
    poster: "lotr.jpg",
    sessions: [
      { 
        date: new Date('2024-12-21'), 
        time: "19:00", 
        hall: "Зал 1", 
        availableSeats: 90, 
        totalSeats: 150 
      }
    ]
  },
  {
    title: "1+1",
    description: "Неожиданная дружба между богатым парализованным человеком и его сиделкой из неблагополучного района.",
    genre: ["Драма", "Комедия"],
    duration: 112,
    rating: 8.5,
    year: 2011,
    director: "Оливье Накаш",
    actors: ["Франсуа Клюзе", "Омар Си"],
    price: 300,
    poster: "intouchables.jpg",
    sessions: [
      { 
        date: new Date('2024-12-22'), 
        time: "17:00", 
        hall: "Зал 3", 
        availableSeats: 110, 
        totalSeats: 130 
      }
    ]
  },
  {
    title: "Евротур",
    description: "Четверо друзей отправляются в путешествие по Европе в поисках одной из них.",
    genre: ["Комедия", "Приключения"],
    duration: 93,
    rating: 6.6,
    year: 2004,
    director: "Джефф Шеффер",
    actors: ["Скотт Мечовиц", "Джейкоб Питтс", "Мишель Трахтенберг"],
    price: 250,
    poster: "eurotrip.jpg",
    sessions: [
      { 
        date: new Date('2024-12-20'), 
        time: "20:00", 
        hall: "Зал 3", 
        availableSeats: 70, 
        totalSeats: 100 
      }
    ]
  },
  {
    title: "Интерстеллар",
    description: "Группа исследователей путешествует через червоточину в космосе в поисках нового дома для человечества.",
    genre: ["Фантастика", "Драма", "Приключения"],
    duration: 169,
    rating: 8.6,
    year: 2014,
    director: "Кристофер Нолан",
    actors: ["Мэттью Макконахи", "Энн Хэтэуэй", "Джессика Честейн"],
    price: 450,
    poster: "interstellar.jpg",
    sessions: [
      { 
        date: new Date('2024-12-23'), 
        time: "19:30", 
        hall: "Зал 1", 
        availableSeats: 120, 
        totalSeats: 150 
      }
    ]
  },
  {
    title: "Начало",
    description: "Вор, специализирующийся на краже секретов через погружение в сны, получает задание внедрить идею в подсознание цели.",
    genre: ["Фантастика", "Триллер", "Драма"],
    duration: 148,
    rating: 8.8,
    year: 2010,
    director: "Кристофер Нолан",
    actors: ["Леонардо ДиКаприо", "Джозеф Гордон-Левитт", "Эллен Пейдж"],
    price: 380,
    poster: "inception.jpg",
    sessions: [
      { 
        date: new Date('2024-12-24'), 
        time: "20:00", 
        hall: "Зал 2", 
        availableSeats: 95, 
        totalSeats: 120 
      }
    ]
  },
  {
    title: "Побег из Шоушенка",
    description: "Два заключенных заводят дружбу, находя утешение и искупление через акты обычной доброты.",
    genre: ["Драма"],
    duration: 142,
    rating: 9.3,
    year: 1994,
    director: "Фрэнк Дарабонт",
    actors: ["Тим Роббинс", "Морган Фриман", "Боб Гантон"],
    price: 320,
    poster: "shawshank.jpg",
    sessions: [
      { 
        date: new Date('2024-12-25'), 
        time: "18:30", 
        hall: "Зал 3", 
        availableSeats: 85, 
        totalSeats: 100 
      }
    ]
  },
  {
    title: "Крестный отец",
    description: "Стареющий патриарх организованной преступной династии передает контроль своему неохотному сыну.",
    genre: ["Драма", "Криминал"],
    duration: 175,
    rating: 9.2,
    year: 1972,
    director: "Фрэнсис Форд Коппола",
    actors: ["Марлон Брандо", "Аль Пачино", "Джеймс Каан"],
    price: 370,
    poster: "godfather.jpg",
    sessions: [
      { 
        date: new Date('2024-12-26'), 
        time: "19:00", 
        hall: "Зал 1", 
        availableSeats: 110, 
        totalSeats: 150 
      }
    ]
  },
  {
    title: "Темный рыцарь",
    description: "Когда Бэтмен, Джеймс Гордон и Харви Дент начинают наводить порядок в городе, появляется Джокер.",
    genre: ["Боевик", "Криминал", "Драма"],
    duration: 152,
    rating: 9.0,
    year: 2008,
    director: "Кристофер Нолан",
    actors: ["Кристиан Бэйл", "Хит Леджер", "Аарон Экхарт"],
    price: 420,
    poster: "dark-knight.jpg",
    sessions: [
      { 
        date: new Date('2024-12-27'), 
        time: "21:00", 
        hall: "Зал 2", 
        availableSeats: 75, 
        totalSeats: 120 
      }
    ]
  },
  {
    title: "Форрест Гамп",
    description: "История жизни Форреста Гампа, добродушного и доверчивого человека с низким IQ.",
    genre: ["Драма", "Романтика"],
    duration: 142,
    rating: 8.8,
    year: 1994,
    director: "Роберт Земекис",
    actors: ["Том Хэнкс", "Робин Райт", "Гэри Синиз"],
    price: 350,
    poster: "forrest-gump.jpg",
    sessions: [
      { 
        date: new Date('2024-12-28'), 
        time: "17:30", 
        hall: "Зал 3", 
        availableSeats: 100, 
        totalSeats: 130 
      }
    ]
  }
];

async function seedDatabase() {
  try {
    // Подключаемся к MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27017/cinema_db?authSource=admin');
    console.log('Connected to MongoDB for seeding');

    // Очищаем коллекции
    await User.deleteMany({});
    await Movie.deleteMany({});
    await Order.deleteMany({});
    console.log('Cleared existing data');

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
        status: "pending",
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