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
    if (file.fieldname === 'trailer') {
      cb(null, 'uploads/trailers/');
    } else {
      cb(null, 'uploads/');
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit for trailers
  }
});

// Get all movies (public)
router.get('/', [
  query('search').optional(),
  query('genre').optional(),
  query('sort').optional(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    const { search, genre, sort = 'title', page = 1, limit = 20 } = req.query;
    
    let queryObj = { isActive: true };
    
    // Search functionality
    if (search) {
      queryObj.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { director: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by genre
    if (genre) {
      queryObj.genre = { $in: [genre] };
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
    
    const movies = await Movie.find(queryObj)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Movie.countDocuments(queryObj);
    
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
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Get single movie (public)
router.get('/:id', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    
    if (!movie) {
      return res.status(404).json({ message: 'Фильм не найден' });
    }
    
    res.json(movie);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Create movie (admin only)
router.post('/', authMiddleware, upload.fields([
  { name: 'poster', maxCount: 1 },
  { name: 'trailer', maxCount: 1 }
]), [
  body('title').notEmpty(),
  body('description').notEmpty(),
  body('genre').custom((value) => {
    // Validate that genre is either an array or a valid JSON string representing an array
    if (Array.isArray(value)) {
      return true;
    }
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return true;
        }
        throw new Error('Genre must be an array or a JSON string representing an array');
      } catch (e) {
        throw new Error('Invalid JSON format for genre');
      }
    }
    throw new Error('Genre must be an array or a JSON string representing an array');
  }),
  body('actors').optional().custom((value) => {
    // Validate that actors is either an array or a valid JSON string representing an array
    if (Array.isArray(value)) {
      return true;
    }
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return true;
        }
        throw new Error('Actors must be an array or a JSON string representing an array');
      } catch (e) {
        throw new Error('Invalid JSON format for actors');
      }
    }
    throw new Error('Actors must be an array or a JSON string representing an array');
  }),
  body('duration').isInt({ min: 1 }),
  body('year').isInt({ min: 1900, max: new Date().getFullYear() }),
  body('director').notEmpty(),
  body('price').isFloat({ min: 0 })
], async (req, res) => {
  try {
    // Check if user is admin
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Требуются права администратора' });
    }
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const movieData = req.body;
    
    // Handle file uploads
    if (req.files && req.files.poster) {
      movieData.poster = req.files.poster[0].filename;
    }
    
    if (req.files && req.files.trailer) {
      movieData.trailer = req.files.trailer[0].filename;
    }
    
    // Parse arrays
    if (typeof movieData.genre === 'string') {
      movieData.genre = JSON.parse(movieData.genre);
    }
    if (movieData.actors && typeof movieData.actors === 'string') {
      movieData.actors = JSON.parse(movieData.actors);
    }
    if (movieData.sessions && typeof movieData.sessions === 'string') {
      movieData.sessions = JSON.parse(movieData.sessions);
    }
    
    const movie = new Movie(movieData);
    await movie.save();
    
    res.status(201).json(movie);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Update movie (admin only)
router.put('/:id', authMiddleware, upload.fields([
  { name: 'poster', maxCount: 1 },
  { name: 'trailer', maxCount: 1 }
]), [
  body('title').optional().notEmpty(),
  body('description').optional().notEmpty(),
  body('genre').optional().custom((value) => {
    // Validate that genre is either an array or a valid JSON string representing an array
    if (Array.isArray(value)) {
      return true;
    }
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return true;
        }
        throw new Error('Genre must be an array or a JSON string representing an array');
      } catch (e) {
        throw new Error('Invalid JSON format for genre');
      }
    }
    throw new Error('Genre must be an array or a JSON string representing an array');
  }),
  body('actors').optional().custom((value) => {
    // Validate that actors is either an array or a valid JSON string representing an array
    if (Array.isArray(value)) {
      return true;
    }
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return true;
        }
        throw new Error('Actors must be an array or a JSON string representing an array');
      } catch (e) {
        throw new Error('Invalid JSON format for actors');
      }
    }
    throw new Error('Actors must be an array or a JSON string representing an array');
  }),
  body('sessions').optional().custom((value) => {
    // Validate that sessions is either an array or a valid JSON string representing an array
    if (Array.isArray(value)) {
      return true;
    }
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return true;
        }
        throw new Error('Sessions must be an array or a JSON string representing an array');
      } catch (e) {
        throw new Error('Invalid JSON format for sessions');
      }
    }
    throw new Error('Sessions must be an array or a JSON string representing an array');
  }),
  body('duration').optional().isInt({ min: 1 }),
  body('year').optional().isInt({ min: 1900, max: new Date().getFullYear() }),
  body('director').optional().notEmpty(),
  body('price').optional().isFloat({ min: 0 })
], async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Требуются права администратора' });
    }
    
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ message: 'Фильм не найден' });
    }
    
    const updateData = req.body;
    
    // Handle file uploads
    if (req.files && req.files.poster) {
      updateData.poster = req.files.poster[0].filename;
    }
    
    if (req.files && req.files.trailer) {
      updateData.trailer = req.files.trailer[0].filename;
    }
    
    // Parse arrays if needed
    if (updateData.genre && typeof updateData.genre === 'string') {
      updateData.genre = JSON.parse(updateData.genre);
    }
    
    if (updateData.actors && typeof updateData.actors === 'string') {
      updateData.actors = JSON.parse(updateData.actors);
    }
    
    Object.assign(movie, updateData);
    await movie.save();
    
    res.json(movie);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Delete movie (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Требуются права администратора' });
    }
    
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ message: 'Фильм не найден' });
    }
    
    movie.isActive = false;
    await movie.save();
    
    res.json({ message: 'Фильм деактивирован' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;