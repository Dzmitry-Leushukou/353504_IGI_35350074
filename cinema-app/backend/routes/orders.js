const express = require('express');
const Order = require('../models/Order');
const Movie = require('../models/Movie');
const authMiddleware = require('../middleware/auth');
const { body, validationResult, query } = require('express-validator');
const moment = require('moment-timezone');

const router = express.Router();

// Get user's orders (authenticated)
router.get('/my-orders', authMiddleware, [
  query('status').optional(),
  query('sort').optional(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    const { status, sort = '-createdAt', page = 1, limit = 10 } = req.query;
    
    let queryObj = { user: req.userId };
    
    // Filter by status
    if (status) {
      if (status === 'paid') {
        queryObj.isPaid = true;
      } else if (status === 'pending') {
        queryObj.status = 'confirmed';
        queryObj.isPaid = false;
      } else {
        queryObj.status = status;
      }
    }
    
    const skip = (page - 1) * limit;
    
    const orders = await Order.find(queryObj)
      .populate('movie', 'title poster duration price')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    // Add local timezone dates
    const ordersWithLocalTime = orders.map(order => {
      const orderObj = order.toObject();
      
      // Get user's timezone (in real app, get from user profile)
      const userTimezone = req.headers['user-timezone'] || 'UTC';
      
      // Add local dates
      orderObj.showDateLocal = moment(order.showDate)
        .tz(userTimezone)
        .format('YYYY-MM-DD HH:mm');
      
      orderObj.orderDateLocal = moment(order.createdAt)
        .tz(userTimezone)
        .format('YYYY-MM-DD HH:mm:ss');
      
      orderObj.showDateUTC = moment(order.showDate)
        .utc()
        .format('YYYY-MM-DD HH:mm');
      
      orderObj.orderDateUTC = moment(order.createdAt)
        .utc()
        .format('YYYY-MM-DD HH:mm:ss');
      
      return orderObj;
    });
    
    const total = await Order.countDocuments(queryObj);
    
    res.json({
      orders: ordersWithLocalTime,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create order (authenticated)
router.post('/', authMiddleware, [
  body('movieId').isMongoId(),
  body('sessionId').notEmpty(),
  body('seats').isArray({ min: 1 }),
  body('showDate').isISO8601(),
  body('showTime').notEmpty(),
  body('totalPrice').isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { movieId, sessionId, seats, showDate, showTime, totalPrice } = req.body;
    
    // Get movie
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ message: 'Фильм не найден' });
    }
    
    // Find the session
    const session = movie.sessions.id(sessionId);
    if (!session) {
      return res.status(400).json({ message: 'Сеанс не найден' });
    }
    
    // Check available seats
    if (session.availableSeats < seats.length) {
      return res.status(400).json({ message: 'Недостаточно свободных мест' });
    }
    
    // Check if seats are already taken
    const existingOrders = await Order.find({
      movie: movieId,
      sessionId: sessionId,
      showDate: new Date(showDate),
      showTime: showTime,
      seats: { $in: seats }
    });
    
    if (existingOrders.length > 0) {
      return res.status(400).json({ message: 'Некоторые места уже заняты' });
    }
    
    // Create order
    const order = new Order({
      user: req.userId,
      movie: movieId,
      sessionId,
      seats,
      totalPrice,
      status: 'confirmed',
      isPaid: false,
      showDate: new Date(showDate),
      showTime,
      paymentMethod: 'online'
    });
    
    await order.save();
    
    // Update available seats
    session.availableSeats -= seats.length;
    await movie.save();
    
    // Populate movie data in response
    const populatedOrder = await Order.findById(order._id)
      .populate('movie', 'title poster duration price');
    
    res.status(201).json({
      message: 'Заказ успешно создан',
      order: populatedOrder
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Pay order (authenticated)
router.put('/:id/pay', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.userId
    }).populate('movie', 'title poster');
    
    if (!order) {
      return res.status(404).json({ message: 'Заказ не найден' });
    }
    
    if (order.isPaid) {
      return res.status(400).json({ message: 'Заказ уже оплачен' });
    }
    
    if (order.status === 'cancelled') {
      return res.status(400).json({ message: 'Нельзя оплатить отмененный заказ' });
    }
    
    // Update payment status
    order.isPaid = true;
    order.paymentDate = new Date();
    await order.save();
    
    res.json({
      message: 'Заказ успешно оплачен',
      order
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Cancel order (authenticated)
router.put('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.userId
    }).populate('movie');
    
    if (!order) {
      return res.status(404).json({ message: 'Заказ не найден' });
    }
    
    if (order.status === 'cancelled') {
      return res.status(400).json({ message: 'Заказ уже отменен' });
    }
    
    if (order.status === 'completed') {
      return res.status(400).json({ message: 'Нельзя отменить завершенный заказ' });
    }
    
    // Update order status
    order.status = 'cancelled';
    await order.save();
    
    // Return seats to availability
    const movie = await Movie.findById(order.movie._id);
    if (movie) {
      const session = movie.sessions.id(order.sessionId);
      if (session) {
        session.availableSeats += order.seats.length;
        await movie.save();
      }
    }
    
    res.json({
      message: 'Заказ отменен',
      order
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Get order details (authenticated)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.userId
    }).populate('movie', 'title poster duration price');
    
    if (!order) {
      return res.status(404).json({ message: 'Заказ не найден' });
    }
    
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;