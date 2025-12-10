const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const { OAuth2Client } = require('google-auth-library');

const router = express.Router();

// Google OAuth client (инициализация с проверкой)
let googleClient;
if (process.env.GOOGLE_CLIENT_ID) {
  googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
}

// Register
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
    
    // Check if user exists
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      return res.status(400).json({ message: 'Пользователь уже существует' });
    }

    // Create new user
    user = new User({
      username,
      email,
      password,
      timezone: timezone || 'Europe/Moscow',
      isGoogleAuth: false
    });

    await user.save();

    // Create token
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
        timezone: user.timezone,
        isGoogleAuth: false
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Login
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
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Неверные учетные данные' });
    }

    // Check if user registered via Google
    if (user.isGoogleAuth) {
      return res.status(400).json({ 
        message: 'Этот аккаунт зарегистрирован через Google. Пожалуйста, войдите через Google.' 
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Неверные учетные данные' });
    }

    // Create token
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
        timezone: user.timezone,
        isGoogleAuth: false
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Google OAuth login
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'Токен Google отсутствует' });
    }

    // If no Google client configured, return mock
    if (!googleClient) {
      console.warn('Google OAuth not configured, using mock');
      
      // Mock Google user
      const mockUser = {
        email: 'test@gmail.com',
        name: 'Google Test User',
        picture: 'https://via.placeholder.com/150',
        sub: 'google123'
      };
      
      return handleGoogleUser(mockUser, res);
    }

    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    return handleGoogleUser(payload, res);
    
  } catch (error) {
    console.error('Google auth error:', error.message);
    
    // Fallback for development
    if (process.env.NODE_ENV === 'development') {
      console.log('Using development fallback for Google auth');
      const mockUser = {
        email: 'dev@gmail.com',
        name: 'Development User',
        picture: 'https://via.placeholder.com/150',
        sub: 'dev123'
      };
      return handleGoogleUser(mockUser, res);
    }
    
    res.status(500).json({ message: 'Ошибка авторизации через Google' });
  }
});

// Helper function to handle Google user
async function handleGoogleUser(payload, res) {
  const { email, name, picture, sub } = payload;
  
  let user = await User.findOne({ 
    $or: [{ email }, { googleId: sub }] 
  });
  
  if (!user) {
    // Create new user from Google data
    user = new User({
      username: name,
      email,
      password: await bcrypt.hash(Math.random().toString(36), 10),
      avatar: picture,
      timezone: 'Europe/Moscow',
      googleId: sub,
      isGoogleAuth: true
    });
    
    await user.save();
  } else {
    // Update existing user with Google info if needed
    if (!user.googleId) {
      user.googleId = sub;
      user.isGoogleAuth = true;
      if (picture && !user.avatar) user.avatar = picture;
      await user.save();
    }
  }
  
  // Create JWT token
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

// Google callback for frontend
router.post('/google-callback', async (req, res) => {
  try {
    const { accessToken } = req.body;
    
    if (!accessToken) {
      return res.status(400).json({ message: 'Токен отсутствует' });
    }
    
    // In a real app, you would validate the access token with Google
    // For now, we'll use a simplified version
    return res.status(200).json({ 
      message: 'Callback received',
      token: accessToken 
    });
    
  } catch (error) {
    console.error('Google callback error:', error);
    res.status(500).json({ message: 'Ошибка обработки Google callback' });
  }
});

// Get current user
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