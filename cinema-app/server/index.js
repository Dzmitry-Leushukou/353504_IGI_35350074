const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const movieRoutes = require('./routes/movies');
app.use('/api/movies', movieRoutes);

// Basic route
app.get('/', (req, res) => {
  res.send('Cinema App API is running');
});

// Connect to MongoDB and start server
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/cinema-app')
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Database connection error:', error);
  });