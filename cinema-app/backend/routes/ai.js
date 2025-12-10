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
    const movieList = movies.slice(0, 8).map(m => m.title).join(', ');
    const prompt = preference 
      ? `У меня есть фильмы: ${movieList}. Я хочу посмотреть фильм ${preference}. Какие из перечисленных ты порекомендуешь? Объясни свой выбор кратко в 3-5 предложениях. Отвечай на русском языке.`
      : `У меня есть фильмы: ${movieList}. Какие ты порекомендуешь посмотреть и почему? Ответь в 3-5 предложениях на русском языке.`;
    
    console.log('Sending request to Poe API with prompt:', prompt);
    
    // Check if API key is available
    if (!process.env.POE_API_KEY || process.env.POE_API_KEY === 'your_poe_api_key_here') {
      console.warn('POE_API_KEY not configured, using mock response');
      return sendMockResponse(movies, preference, res);
    }
    
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
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 15000 // 15 second timeout
        }
      );
      
      console.log('Poe API response received');
      
      // Parse response - adjust based on actual API response structure
      let recommendations = 'Рекомендации недоступны';
      
      if (response.data && response.data.choices && response.data.choices.length > 0) {
        recommendations = response.data.choices[0].message.content;
      } else if (response.data && response.data.text) {
        recommendations = response.data.text;
      } else if (response.data && response.data.result) {
        recommendations = response.data.result;
      } else if (response.data && response.data.data) {
        recommendations = response.data.data;
      }
      
      // Clean up response
      recommendations = recommendations.replace(/```[\s\S]*?```/g, '')
                                       .trim()
                                       .substring(0, 500); // Limit length
      
      res.json({
        recommendations,
        timestamp: new Date().toISOString(),
        source: 'poe_api'
      });
      
    } catch (apiError) {
      console.error('Poe API error:', apiError.message);
      console.error('API error details:', apiError.response?.data);
      
      // Fallback to mock response
      return sendMockResponse(movies, preference, res);
    }
    
  } catch (error) {
    console.error('AI recommendation error:', error.message);
    
    // Generic fallback
    res.json({
      recommendations: 'Извините, сервис рекомендаций временно недоступен. Пожалуйста, попробуйте позже или выберите фильм из нашего каталога.',
      timestamp: new Date().toISOString(),
      source: 'error_fallback'
    });
  }
});

// Helper function for mock response
function sendMockResponse(movies, preference, res) {
  const movieTitles = movies.slice(0, 3).map(m => m.title);
  const mockRecommendations = preference 
    ? `На основе вашего предпочтения "${preference}", я рекомендую:\n\n1. **${movieTitles[0]}** - отличный выбор для вашего настроения\n2. **${movieTitles[1]}** - подходит по тематике и имеет высокий рейтинг\n3. **${movieTitles[2]}** - популярный фильм с интересным сюжетом\n\nВсе эти фильмы доступны для бронирования прямо сейчас!`
    : `Рекомендую посмотреть:\n\n1. **${movieTitles[0]}** - высокий рейтинг и отличные отзывы\n2. **${movieTitles[1]}** - интересный сюжет и хорошая режиссура\n3. **${movieTitles[2]}** - популярный среди зрителей выбор\n\nВыберите любой из этих фильмов для просмотра в нашем кинотеатре!`;
  
  res.json({
    recommendations: mockRecommendations,
    timestamp: new Date().toISOString(),
    source: 'mock_response',
    note: 'POE API недоступна, используется демо-режим'
  });
}

// Analyze movie preferences (optional, можно удалить если не нужно)
router.post('/analyze-preference', authMiddleware, async (req, res) => {
  try {
    const { watchHistory, ratings } = req.body;
    
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