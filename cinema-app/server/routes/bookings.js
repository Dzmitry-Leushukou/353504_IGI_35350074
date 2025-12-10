const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Booking = require('../models/Booking');
const Showtime = require('../models/Showtime');

// POST /api/bookings - создание нового бронирования
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { seats, showtime: showtimeId, movieId, ticketCount } = req.body;

    // Проверяем, что все необходимые поля переданы
    if (!seats || !showtimeId || !movieId || !ticketCount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: seats, showtime, movieId, or ticketCount'
      });
    }

    // Проверяем, существует ли сеанс
    const showtime = await Showtime.findById(showtimeId);
    if (!showtime) {
      return res.status(404).json({
        success: false,
        message: 'Showtime not found'
      });
    }

    // Проверяем, достаточно ли свободных мест
    if (seats.length > showtime.availableSeats) {
      return res.status(400).json({
        success: false,
        message: 'Not enough available seats'
      });
    }

    // Проверяем, не заняты ли уже выбранные места
    // В реальном приложении нужно хранить список занятых мест в сеансе
    // и проверять пересечения с новым бронированием

    // Вычисляем общую стоимость
    const totalPrice = seats.length * showtime.price;

    // Создаем новое бронирование
    const booking = new Booking({
      user: req.user.userId, // извлекаем из токена через middleware
      showtime: showtimeId,
      seats: seats,
      totalPrice: totalPrice,
      paymentMethod: 'credit_card' // можно передавать из фронтенда
    });

    // Сохраняем бронирование
    const savedBooking = await booking.save();

    // Обновляем количество доступных мест в сеансе
    showtime.availableSeats -= seats.length;
    await showtime.save();

    res.status(201).json({
      success: true,
      data: savedBooking,
      message: 'Booking created successfully'
    });
  } catch (error) {
    console.error('Booking creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// GET /api/bookings - получение всех бронирований пользователя
router.get('/', authMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.userId })
      .populate('showtime')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: bookings,
      message: 'Bookings retrieved successfully'
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// GET /api/bookings/:id - получение конкретного бронирования
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('showtime');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Проверяем, принадлежит ли бронирование текущему пользователю
    if (booking.user.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: booking,
      message: 'Booking retrieved successfully'
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;