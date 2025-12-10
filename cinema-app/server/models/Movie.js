const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  duration: {
    type: Number,
    required: true,
    min: 1
  },
  genre: {
    type: [String],
    required: true,
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'Movie must have at least one genre'
    }
  },
  releaseDate: {
    type: Date,
    required: true
  },
  director: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  cast: {
    type: [String],
    required: true,
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'Movie must have at least one cast member'
    }
  },
  rating: {
    type: Number,
    min: 0,
    max: 10,
    default: 0
  },
  posterUrl: {
    type: String,
    required: false,
    match: [/^https?:\/\/.+\.(jpg|jpeg|png|gif)$/i, 'Please enter a valid image URL']
  },
  trailer: {
    data: Buffer,  // Store the actual video file data
    contentType: String // Store the content type (e.g., 'video/mp4')
  },
  language: {
    type: String,
    required: false,
    trim: true,
    maxlength: 50
  },
  country: {
    type: String,
    required: false,
    trim: true,
    maxlength: 50
  },
  ageRating: {
    type: String,
    required: false,
    enum: ['G', 'PG', 'PG-13', 'R', 'NC-17', 'Not Rated'],
    default: 'Not Rated'
  },
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
});


module.exports = mongoose.model('Movie', movieSchema);