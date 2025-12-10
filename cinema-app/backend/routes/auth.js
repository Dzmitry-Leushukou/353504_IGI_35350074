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
    
    // Проверяем, существует ли пользователь
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      return res.status(400).json({ message: 'Пользователь уже существует' });
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

// Google OAuth вход
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'Токен Google отсутствует' });
    }

    // Если в режиме разработки и нет Google Client ID, используем мок
    if (process.env.NODE_ENV === 'development' && !process.env.GOOGLE_CLIENT_ID) {
      console.log('Development mode: Using mock Google auth');
      
      // Генерируем мок пользователя Google
      const mockEmail = `google_user_${Date.now()}@gmail.com`;
      const mockName = 'Google User';
      const mockPicture = 'https://via.placeholder.com/150';
      const mockSub = `google_${Date.now()}`;
      
      return handleGoogleUser({
        email: mockEmail,
        name: mockName,
        picture: mockPicture,
        sub: mockSub
      }, res);
    }

    // Реальная верификация Google токена
    if (!googleClient) {
      return res.status(500).json({ message: 'Google OAuth не настроен' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    return handleGoogleUser(payload, res);
    
  } catch (error) {
    console.error('Google auth error:', error.message);
    
    // Fallback для разработки
    if (process.env.NODE_ENV === 'development') {
      console.log('Using development fallback for Google auth');
      const mockUser = {
        email: `dev_google_${Date.now()}@gmail.com`,
        name: 'Google Development User',
        picture: 'https://via.placeholder.com/150',
        sub: `dev_google_${Date.now()}`
      };
      return handleGoogleUser(mockUser, res);
    }
    
    res.status(500).json({ message: 'Ошибка авторизации через Google' });
  }
});

// Обработчик Google пользователя
async function handleGoogleUser(payload, res) {
  const { email, name, picture, sub } = payload;
  
  // Ищем существующего пользователя по email или googleId
  let user = await User.findOne({ 
    $or: [{ email }, { googleId: sub }] 
  });
  
  if (!user) {
    // Создаем нового пользователя из данных Google
    user = new User({
      username: name || email.split('@')[0],
      email,
      password: await bcrypt.hash(Math.random().toString(36), 10),
      avatar: picture,
      timezone: 'Europe/Moscow',
      googleId: sub,
      isGoogleAuth: true
    });
    
    await user.save();
  } else {
    // Обновляем существующего пользователя
    if (!user.googleId) user.googleId = sub;
    if (!user.isGoogleAuth) user.isGoogleAuth = true;
    if (picture && !user.avatar) user.avatar = picture;
    if (name && !user.username.includes('@')) user.username = name;
    
    await user.save();
  }
  
  // Создаем JWT токен
  const jwtToken = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  
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