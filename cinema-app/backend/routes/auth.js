const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const { OAuth2Client } = require('google-auth-library');

const router = express.Router();

// Инициализация Google OAuth клиента
let googleClient;
try {
  googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
} catch (error) {
  console.warn('Google OAuth client not initialized:', error.message);
}

// Регистрация пользователя
router.post('/register', [
  body('username').isLength({ min: 3 }),
  body('email').isEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, timezone } = req.body;
    
    // Проверяем, существует ли пользователь с таким email
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
    }

    // Проверяем, существует ли пользователь с таким username
    let userWithUsername = await User.findOne({ username });
    if (userWithUsername) {
      return res.status(400).json({ message: 'Имя пользователя уже занято' });
    }

    // Создаем нового пользователя
    user = new User({
      username,
      email,
      password,
      timezone: timezone || 'Europe/Moscow',
      isGoogleAuth: false
    });

    await user.save();

    // Создаем JWT токен
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        timezone: user.timezone
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Вход по email/password
router.post('/login', [
  body('email').isEmail(),
  body('password').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    
    // Ищем пользователя
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Неверные учетные данные' });
    }

    // Проверяем, не является ли пользователь Google-пользователем
    if (user.isGoogleAuth) {
      return res.status(401).json({ message: 'Этот аккаунт использует вход через Google. Пожалуйста, войдите через Google.' });
    }

    // Проверяем пароль
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Неверные учетные данные' });
    }

    // Создаем JWT токен
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        timezone: user.timezone
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Google OAuth вход - ИСПРАВЛЕННАЯ ВЕРСИЯ
router.post('/google', async (req, res) => {
  try {
    console.log('Google OAuth request received');
    const { token } = req.body;
    
    if (!token) {
      console.log('No token provided');
      return res.status(400).json({ message: 'Токен Google отсутствует' });
    }

    console.log('Token received, length:', token.length);

    // В режиме разработки используем мок
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Using mock Google auth');
      
      // Проверяем, есть ли реальный Google Client ID
      if (!process.env.GOOGLE_CLIENT_ID) {
        console.log('No Google Client ID, using full mock');
        const mockEmail = `google_user_${Date.now()}@gmail.com`;
        const mockName = 'Google User';
        const mockPicture = 'https://via.placeholder.com/150';
        const mockSub = `google_${Date.now()}`;
        
        return await handleGoogleUser({
          email: mockEmail,
          name: mockName,
          picture: mockPicture,
          sub: mockSub
        }, res);
      }
    }

    // Реальная верификация Google токена
    if (!googleClient) {
      console.log('Google client not initialized');
      return res.status(500).json({ message: 'Google OAuth не настроен' });
    }

    console.log('Verifying Google token with client ID:', process.env.GOOGLE_CLIENT_ID);
    
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      
      const payload = ticket.getPayload();
      console.log('Google token verified, user email:', payload.email);
      
      return await handleGoogleUser(payload, res);
    } catch (verifyError) {
      console.error('Google token verification failed:', verifyError.message);
      
      // В режиме разработки используем fallback
      if (process.env.NODE_ENV === 'development') {
        console.log('Using development fallback for Google auth');
        const mockUser = {
          email: `dev_google_${Date.now()}@gmail.com`,
          name: 'Google Development User',
          picture: 'https://via.placeholder.com/150',
          sub: `dev_google_${Date.now()}`
        };
        return await handleGoogleUser(mockUser, res);
      }
      
      throw verifyError;
    }
    
  } catch (error) {
    console.error('Google auth error:', error.message);
    console.error('Full error:', error);
    
    res.status(500).json({ 
      message: 'Ошибка авторизации через Google',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Обработчик Google пользователя - ИСПРАВЛЕННАЯ ВЕРСИЯ
async function handleGoogleUser(payload, res) {
  try {
    console.log('Processing Google user with payload:', {
      email: payload.email,
      name: payload.name,
      sub: payload.sub
    });
    
    const { email, name, picture, sub } = payload;
    
    if (!email) {
      return res.status(400).json({ message: 'Email не получен от Google' });
    }

    // Нормализуем email
    const normalizedEmail = email.toLowerCase();
    
    // Ищем существующего пользователя по email или googleId
    let user = await User.findOne({ 
      $or: [
        { email: normalizedEmail },
        { googleId: sub }
      ] 
    });
    
    console.log('Found existing user:', !!user);
    
    if (!user) {
      // Генерируем уникальное имя пользователя
      const baseUsername = name || normalizedEmail.split('@')[0];
      const username = await User.generateUniqueUsername(baseUsername);
      
      // Создаем нового пользователя из данных Google
      user = new User({
        username,
        email: normalizedEmail,
        password: await bcrypt.hash(Math.random().toString(36) + Date.now(), 10),
        avatar: picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`,
        timezone: 'Europe/Moscow',
        googleId: sub,
        isGoogleAuth: true
      });
      
      await user.save();
      console.log(`Created new Google user: ${user.email} with username: ${user.username}`);
    } else {
      // Обновляем существующего пользователя
      if (!user.googleId) {
        user.googleId = sub;
      }
      if (!user.isGoogleAuth) {
        user.isGoogleAuth = true;
      }
      if (picture && !user.avatar) {
        user.avatar = picture;
      }
      
      await user.save();
      console.log(`Updated existing user with Google auth: ${user.email}`);
    }
    
    // Создаем JWT токен
    const jwtToken = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log('JWT token created for user:', user.email);
    
    res.json({
      token: jwtToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        timezone: user.timezone,
        avatar: user.avatar,
        isGoogleAuth: true
      }
    });
  } catch (error) {
    console.error('Error in handleGoogleUser:', error);
    
    // Обрабатываем ошибки дублирования
    if (error.code === 11000) {
      if (error.keyPattern && error.keyPattern.email) {
        return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
      }
      if (error.keyPattern && error.keyPattern.googleId) {
        return res.status(400).json({ message: 'Этот Google аккаунт уже привязан к другому пользователю' });
      }
    }
    
    res.status(500).json({ message: 'Ошибка обработки пользователя Google' });
  }
}

// Получение текущего пользователя
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;