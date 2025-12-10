const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./server/models/User');
const Movie = require('./server/models/Movie');
const Showtime = require('./server/models/Showtime');
const Booking = require('./server/models/Booking');

async function testConnection() {
  try {
    // Подключаемся к MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://cinema_user:cinema_password@localhost:27017/cinema-app');
    console.log('Connected to MongoDB successfully!');

    // Проверяем создание тестового пользователя
    const testUser = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User'
    });

    await testUser.save();
    console.log('Test user created successfully!');

    // Проверяем создание тестового фильма
    const testMovie = new Movie({
      title: 'Test Movie',
      description: 'This is a test movie',
      duration: 120,
      genre: ['Action', 'Drama'],
      releaseDate: new Date(),
      director: 'Test Director',
      cast: ['Actor 1', 'Actor 2']
    });

    await testMovie.save();
    console.log('Test movie created successfully!');

    // Проверяем создание тестового сеанса
    const testShowtime = new Showtime({
      movie: testMovie._id,
      date: new Date(),
      startTime: '18:00',
      endTime: '20:00',
      hall: 'Hall 1',
      totalSeats: 100,
      availableSeats: 100,
      price: 10
    });

    await testShowtime.save();
    console.log('Test showtime created successfully!');

    // Проверяем создание тестового бронирования
    const testBooking = new Booking({
      user: testUser._id,
      showtime: testShowtime._id,
      seats: ['A1', 'A2'],
      totalPrice: 20,
      status: 'confirmed',
      paymentMethod: 'credit_card'
    });

    await testBooking.save();
    console.log('Test booking created successfully!');

    // Удаляем тестовые данные
    await User.deleteMany({ username: 'testuser' });
    await Movie.deleteMany({ title: 'Test Movie' });
    console.log('Test data cleaned up!');

    console.log('All tests passed successfully!');
  } catch (error) {
    console.error('Error during testing:', error);
 } finally {
    // Закрываем соединение
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

testConnection();