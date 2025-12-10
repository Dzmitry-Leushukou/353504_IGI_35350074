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
    
    let query = { user: req.userId };
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    const skip = (page - 1) * limit;
    
    const orders = await Order.find(query)
      .populate('movie', 'title poster duration')
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
      
      orderObj.orderDateLocal = moment(order.orderDate)
        .tz(userTimezone)
        .format('YYYY-MM-DD HH:mm');
      
      orderObj.showDateUTC = moment(order.showDate)
        .utc()
        .format('YYYY-MM-DD HH:mm');
      
      orderObj.orderDateUTC = moment(order.orderDate)
        .utc()
        .format('YYYY-MM-DD HH:mm');
      
      return orderObj;
    });
    
    const total = await Order.countDocuments(query);
    
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
  body('showTime').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { movieId, sessionId, seats, showDate, showTime } = req.body;
    
    // Get movie
    const movie = await Movie.findById(movieId);
    if (!movie || !movie.isActive) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    
    // Check session availability
    const session = movie.sessions.find(s => s._id.toString() === sessionId);
    if (!session) {
      return res.status(400).json({ message: 'Session not found' });
    }
    
    if (session.availableSeats < seats.length) {
      return res.status(400).json({ message: 'Not enough seats available' });
    }
    
    // Calculate price
    const totalPrice = movie.price * seats.length;
    
    // Create order
    const order = new Order({
      user: req.userId,
      movie: movieId,
      sessionId,
      seats,
      totalPrice,
      showDate: new Date(showDate),
      showTime,
      status: 'pending'
    });
    
    await order.save();
    
    // Update available seats
    session.availableSeats -= seats.length;
    await movie.save();
    
    // Populate movie data in response
    const populatedOrder = await Order.findById(order._id)
      .populate('movie', 'title poster duration');
    
    res.status(201).json(populatedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
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
      return res.status(404).json({ message: 'Order not found' });
    }
    
    if (order.status === 'cancelled') {
      return res.status(400).json({ message: 'Order already cancelled' });
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
    
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
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
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;