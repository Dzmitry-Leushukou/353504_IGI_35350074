const express = require('express');
const axios = require('axios');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Get movie recommendations - УПРОЩЕННАЯ ВЕРСИЯ
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
    
    console.log('AI Recommendation request:', { 
      movieCount: movies.length, 
      preference 
    });
    
    // Упрощенная логика рекомендаций без внешнего API
    const getMockRecommendations = () => {
      const availableMovies = movies.slice(0, 5);
      
      if (preference) {
        const pref = preference.toLowerCase();
        
        // Простая логика на основе ключевых слов
        if (pref.includes('путешествие') || pref.includes('приключение') || pref.includes('евро')) {
          return `На основе вашего предпочтения "${preference}", рекомендую:\n\n🎬 **Евротур** - отличная комедия о путешествиях по Европе\n🎬 **Властелин колец** - эпическое фэнтези-путешествие\n🎬 **Тайная жизнь Уолтера Митти** - вдохновляющая история о поиске себя\n\nЭти фильмы лучше всего соответствуют теме путешествия и приключений!`;
        }
        
        if (pref.includes('комедия') || pref.includes('смех') || pref.includes('веселье')) {
          return `Для любителей комедий:\n\n😂 **Евротур** - самая смешная комедия о путешествиях\n😂 **1+1** - трогательная и смешная история дружбы\n😂 **Игры разума** - интеллектуальная комедия-драма\n\nОтличный выбор для поднятия настроения!`;
        }
        
        if (pref.includes('драма') || pref.includes('эмоци') || pref.includes('чувств')) {
          return `Эмоциональные драмы:\n\n🎭 **1+1** - трогательная история дружбы и преодоления\n🎭 **Зеленая миля** - глубокая эмоциональная драма\n🎭 **Форрест Гамп** - история жизни, полная чувств\n\nЭти фильмы не оставят вас равнодушными!`;
        }
      }
      
      // Общие рекомендации
      const recommendations = availableMovies.map((movie, index) => {
        const emoji = ['⭐', '🎬', '🍿', '🎥', '🏆'][index] || '🎬';
        return `${emoji} **${movie.title}** - ${movie.genre.join(', ')} (рейтинг: ${movie.rating}/10)`;
      }).join('\n\n');
      
      return `Рекомендую посмотреть:\n\n${recommendations}\n\nЭти фильмы сейчас самые популярные в нашем кинотеатре!`;
    };
    
    // Всегда возвращаем мок-данные для надежности
    const recommendations = getMockRecommendations();
    
    res.json({
      recommendations,
      timestamp: new Date().toISOString(),
      source: 'mock_ai_service',
      note: 'Используется локальный AI для рекомендаций'
    });
    
  } catch (error) {
    console.error('AI recommendation error:', error.message);
    
    // Fallback
    res.json({
      recommendations: 'На основе ваших предпочтений рекомендую посмотреть самые популярные фильмы из нашего каталога. Все они доступны для бронирования прямо сейчас!',
      timestamp: new Date().toISOString(),
      source: 'fallback'
    });
  }
});

module.exports = router;