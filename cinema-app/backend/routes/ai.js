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
    
    // Try to call Poe API
    try {
      const response = await axios.post(
        'https://api.poe.com/bot/fetch',
        {
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          bot: "chinchilla",
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
      const recommendations = response.data.choices?.[0]?.message?.content || 'Рекомендации недоступны';
      
      res.json({
        recommendations,
        timestamp: new Date().toISOString()
      });
    } catch (apiError) {
      console.error('Poe API error:', apiError.message);
      
      // Fallback mock response
      const mockRecommendations = `На основе вашего предпочтения "${preference}", я рекомендую:\n1. Евротур - комедия о путешествиях по Европе\n2. Властелин колец - эпическое фэнтези путешествие\n3. 1+1 - эмоциональное путешествие дружбы\n\nПричина: эти фильмы лучше всего соответствуют теме путешествия и приключений.`;
      
      res.json({
        recommendations: mockRecommendations,
        timestamp: new Date().toISOString(),
        note: 'Mock response (Poe API недоступна)'
      });
    }
    
  } catch (error) {
    console.error('AI recommendation error:', error.message);
    
    // Generic fallback
    res.json({
      recommendations: 'Извините, сервис рекомендаций временно недоступен. Пожалуйста, попробуйте позже.',
      timestamp: new Date().toISOString()
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
      preferredGenres: ['Приключения', 'Комедия', 'Драма'],
      preferredThemes: ['Путешествие', 'Дружба', 'Саморазвитие'],
      recommendations: [
        'Тайная жизнь Уолтера Митти',
        'В диких условиях',
        'Пока не сыграл в ящик'
      ],
      confidenceScore: 0.85
    };
    
    res.json(analysis);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка анализа предпочтений' });
  }
});

module.exports = router;