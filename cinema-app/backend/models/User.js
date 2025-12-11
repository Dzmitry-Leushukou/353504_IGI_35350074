const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: function() {
      return !this.isGoogleAuth; // Пароль обязателен только для не-Google пользователей
    },
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  timezone: {
    type: String,
    default: 'Europe/Moscow'
  },
  avatar: {
    type: String
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true // Разрешает null значения для не-Google пользователей
  },
  isGoogleAuth: {
    type: Boolean,
    default: false
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

// Убираем уникальный индекс с username, чтобы разрешить дублирование
userSchema.index({ username: 1 }, { unique: false });

// Hash password before saving (только если не Google auth и пароль изменился)
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || this.isGoogleAuth) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (this.isGoogleAuth) {
    // Для Google-пользователей пароль не используется
    return false;
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

// Метод для генерации уникального имени пользователя
userSchema.statics.generateUniqueUsername = async function(baseUsername) {
  let username = baseUsername;
  let counter = 1;
  
  // Проверяем, существует ли пользователь с таким именем
  let existingUser = await this.findOne({ username });
  
  // Если существует, добавляем числа пока не найдем уникальное
  while (existingUser) {
    username = `${baseUsername}${counter}`;
    existingUser = await this.findOne({ username });
    counter++;
  }
  
  return username;
};

module.exports = mongoose.model('User', userSchema);