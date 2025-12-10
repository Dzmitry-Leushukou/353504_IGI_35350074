const express = require('express');
const Movie = require('../models/Movie');
const authMiddleware = require('../middleware/auth');
const { body, validationResult, query } = require('express-validator');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Get all movies (public)
router.get('/', [
  query('search').optional(),
  query('genre').optional(),
  query('sort').optional(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    const { search, genre, sort = 'title', page = 1, limit = 10 } = req.query;
    
    let query = { isActive: true };
    
    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }
    
    // Filter by genre
    if (genre) {
      query.genre = { $in: [genre] };
    }
    
    // Sorting
    let sortOption = {};
    switch (sort) {
      case 'rating':
        sortOption = { rating: -1 };
        break;
      case 'year':
        sortOption = { year: -1 };
        break;
      case 'price':
        sortOption = { price: 1 };
        break;
      default:
        sortOption = { title: 1 };
    }
    
    const skip = (page - 1) * limit;
    
    const movies = await Movie.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Movie.countDocuments(query);
    
    res.json({
      movies,
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

// Get single movie (public)
router.get('/:id', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    
    if (!movie || !movie.isActive) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    
    res.json(movie);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create movie (admin only)
router.post('/', authMiddleware, upload.single('poster'), [
  body('title').notEmpty(),
  body('description').notEmpty(),
  body('genre').isArray(),
  body('duration').isInt({ min: 1 }),
  body('year').isInt({ min: 1900, max: new Date().getFullYear() }),
  body('director').notEmpty(),
  body('price').isFloat({ min: 0 })
], async (req, res) => {
  try {
    // Check if user is admin
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const movieData = req.body;
    
    // Handle file upload
    if (req.file) {
      movieData.poster = req.file.filename;
    }
    
    // Parse arrays
    if (typeof movieData.genre === 'string') {
      movieData.genre = JSON.parse(movieData.genre);
    }
    if (typeof movieData.actors === 'string') {
      movieData.actors = JSON.parse(movieData.actors);
    }
    if (typeof movieData.sessions === 'string') {
      movieData.sessions = JSON.parse(movieData.sessions);
    }
    
    const movie = new Movie(movieData);
    await movie.save();
    
    res.status(201).json(movie);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update movie (admin only)
router.put('/:id', authMiddleware, upload.single('poster'), async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    
    const updateData = req.body;
    
    // Handle file upload
    if (req.file) {
      updateData.poster = req.file.filename;
    }
    
    // Parse arrays if needed
    if (updateData.genre && typeof updateData.genre === 'string') {
      updateData.genre = JSON.parse(updateData.genre);
    }
    
    Object.assign(movie, updateData);
    await movie.save();
    
    res.json(movie);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete movie (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    
    movie.isActive = false;
    await movie.save();
    
    res.json({ message: 'Movie deactivated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;