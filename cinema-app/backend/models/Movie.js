const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  date: Date,
  time: String,
  hall: String,
  availableSeats: Number,
  totalSeats: Number,
  bookedSeats: { type: [String], default: [] } // Добавляем массив занятых мест
});

const movieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  genre: {
    type: [String],
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  rating: {
    type: Number,
    min: 0,
    max: 10,
    default: 0
  },
  year: {
    type: Number,
    required: true
  },
  director: {
    type: String,
    required: true
  },
  actors: {
    type: [String],
    required: true
  },
  trailer: {
    type: String,
    default: ''
  },
  trailerUrl: {
    type: String
  },
  poster: {
    type: String,
    default: 'default-poster.jpg'
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  sessions: [sessionSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for search
movieSchema.index({ title: 'text', description: 'text', genre: 'text' });

module.exports = mongoose.model('Movie', movieSchema);