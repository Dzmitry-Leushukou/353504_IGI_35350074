// backend/routes/ai.js
const express = require('express');
const { OpenAI } = require('openai');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Инициализация клиента OpenAI для Poe API
const getPoeClient = () => {
  return new OpenAI({
    apiKey: process.env.POE_API_KEY,
    baseURL: "https://api.poe.com/v1",
  });
};

// Get movie recommendations через Poe API
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
      preference: preference || 'любой жанр'
    });
    
    // Формируем промпт для AI
    const createPrompt = () => {
      const movieList = movies.slice(0, 8).map((movie, idx) => 
        `${idx + 1}. "${movie.title}" (${movie.year}) - Жанры: ${movie.genre.join(', ')}. Рейтинг: ${movie.rating}/10. Описание: ${movie.description.substring(0, 150)}...`
      ).join('\n\n');

      return `Ты - AI-консультант в кинотеатре. Пользователь ищет фильм с предпочтениями: "${preference || 'любой жанр'}".

Вот доступные фильмы:
${movieList}

Пожалуйста, порекомендуй 3-5 фильмов из этого списка, которые лучше всего подходят под предпочтения пользователя.
Для каждого рекомендованного фильма кратко объясни (1-2 предложения), почему он подходит.
Ответ должен быть на русском языке, дружелюбным тоном, с использованием эмодзи и переносов строк.

Пример формата ответа:
🎬 **Название фильма** (год)
⭐ Рейтинг: X.X/10
🎭 Жанр: жанры
📝 Краткое объяснение почему подходит под запрос пользователя

И так для каждого фильма.`;
    };

    const prompt = createPrompt();
    
    // Используем Poe API с openai пакетом
    const poeClient = getPoeClient();
    
    console.log('Making request to Poe API with model: claude-3-opus');
    
    const completion = await poeClient.chat.completions.create({
      model: "claude-3-opus", // Эта модель работает!
      messages: [
        {
          role: "system",
          content: "Ты - дружелюбный AI-консультант по фильмам в кинотеатре. Отвечай только на русском языке. Будь полезным и конкретным в рекомендациях."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 600,
    });

    const recommendations = completion.choices[0]?.message?.content;
    
    if (!recommendations || recommendations.trim().length === 0) {
      throw new Error('Empty response from Poe API');
    }
    
    console.log('Successfully got recommendations from Poe API');
    
    res.json({
      recommendations,
      timestamp: new Date().toISOString(),
      source: 'poe_api',
      model: 'claude-3-opus'
    });
    
  } catch (error) {
    console.error('Poe API recommendation error:', error.message);
    console.error('Error details:', error);
    
    // Улучшенный fallback
    try {
      const availableMovies = req.body.movies || [];
      const pref = (req.body.preference || '').toLowerCase();
      
      // Умная фильтрация для fallback
      let filteredMovies = [...availableMovies];
      
      if (pref) {
        if (pref.includes('космос') || pref.includes('планет') || pref.includes('звезд')) {
          filteredMovies = availableMovies.filter(m => 
            m.genre.some(g => 
              ['фантастика', 'приключения', 'боевик'].some(genre => 
                g.toLowerCase().includes(genre)
              )
            )
          );
        } else if (pref.includes('комедия') || pref.includes('смех')) {
          filteredMovies = availableMovies.filter(m => 
            m.genre.some(g => g.toLowerCase().includes('комедия'))
          );
        } else if (pref.includes('драма') || pref.includes('эмоци')) {
          filteredMovies = availableMovies.filter(m => 
            m.genre.some(g => g.toLowerCase().includes('драма'))
          );
        }
      }
      
      // Если фильтрация не дала результатов, берем топ по рейтингу
      if (filteredMovies.length === 0) {
        filteredMovies = [...availableMovies];
      }
      
      // Сортируем по рейтингу и берем топ 3
      const topMovies = filteredMovies
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 3);
      
      const fallbackRecommendations = `🎬 **AI Рекомендации** 🎬\n\n` +
        topMovies.map((movie, idx) => {
          const emojis = ['⭐', '🎬', '🍿'];
          return `${emojis[idx] || '🎬'} **${movie.title}** (${movie.year})\n` +
                 `⭐ Рейтинг: ${movie.rating}/10\n` +
                 `🎭 Жанр: ${movie.genre.join(', ')}\n` +
                 `📝 ${movie.description.substring(0, 100)}...\n`;
        }).join('\n') +
        `\n💡 *На основе вашего запроса "${req.body.preference || 'все жанры'}"*\n` +
        `🎯 Эти фильмы сейчас самые популярные!`;
      
      res.json({
        recommendations: fallbackRecommendations,
        timestamp: new Date().toISOString(),
        source: 'fallback_ai',
        note: 'Используются локальные рекомендации'
      });
      
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      
      // Последний резервный вариант
      res.json({
        recommendations: `🎬 **Рекомендуем посмотреть:**\n\n` +
          `⭐ **Евротур** - веселая комедия о путешествиях по Европе\n` +
          `🎬 **1+1** - трогательная история необычной дружбы\n` +
          `🍿 **Властелин колец** - эпическое фэнтези-приключение\n\n` +
          `🎯 Все фильмы доступны для бронирования прямо сейчас!`,
        timestamp: new Date().toISOString(),
        source: 'hardcoded_fallback'
      });
    }
  }
});

module.exports = router;