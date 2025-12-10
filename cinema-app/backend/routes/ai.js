const express = require('express');
const axios = require('axios');
const authMiddleware = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Get movie recommendations from Poe
router.post('/recommend', [
  body('movies').isArray({ min: 1 }),
  body('preference').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { movies, preference } = req.body;
    
    // Prepare prompt for Poe
    const movieList = movies.map(m => m.title).join(', ');
    const prompt = preference 
      ? `У меня есть фильмы: ${movieList}. Я хочу посмотреть фильм ${preference}. Какие из перечисленных ты порекомендуешь? Объясни свой выбор кратко.`
      : `У меня есть фильмы: ${movieList}. Какие ты порекомендуешь посмотреть и почему?`;
    
    // Call Poe API
    const response = await axios.post(
      `${process.env.POE_API_URL}/chat`,
      {
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        model: "claude-3-haiku",
        stream: false
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.POE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Parse response
    const recommendations = response.data.choices[0].message.content;
    
    // Mock response for development (if API key not available)
    // const recommendations = `Based on your preference "${preference}", I recommend:\n1. EuroTrip - Perfect for travel comedy\n2. The Lord of the Rings - Epic journey fantasy\n3. 1+1 - Emotional journey of friendship\n\nThese films best capture the essence of journey and adventure.`;
    
    res.json({
      recommendations,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Poe API error:', error.message);
    
    // Fallback mock response
    const mockRecommendations = `Based on your preference "${req.body.preference}", I recommend:\n1. EuroTrip - Travel comedy across Europe\n2. The Lord of the Rings - Epic fantasy journey\n3. 1+1 - Emotional journey of friendship\n\nReason: These films best match the theme of journey and adventure.`;
    
    res.json({
      recommendations: mockRecommendations,
      timestamp: new Date().toISOString(),
      note: 'Mock response (Poe API not configured)'
    });
  }
});

// Analyze movie preferences
router.post('/analyze-preference', authMiddleware, async (req, res) => {
  try {
    const { watchHistory, ratings } = req.body;
    
    // Analyze user preferences using Poe
    const prompt = `Analyze this movie watching history and ratings: ${JSON.stringify(watchHistory)}. 
    Based on this data, what movie genres and characteristics does this user prefer? 
    Provide recommendations for similar movies.`;
    
    // Mock AI analysis for development
    const analysis = {
      preferredGenres: ['Adventure', 'Comedy', 'Drama'],
      preferredThemes: ['Journey', 'Friendship', 'Self-discovery'],
      recommendations: [
        'The Secret Life of Walter Mitty',
        'Into the Wild',
        'The Bucket List'
      ],
      confidenceScore: 0.85
    };
    
    res.json(analysis);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'AI analysis failed' });
  }
});

module.exports = router;