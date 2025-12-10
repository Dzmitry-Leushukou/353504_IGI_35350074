const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getAllMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
  streamTrailer
} = require('../controllers/movieController');

// GET /api/movies - получение списка фильмов с поиском и сортировкой
router.get('/', getAllMovies);

// GET /api/movies/:id - получение фильма по ID
router.get('/:id', getMovieById);

// POST /api/movies - создание фильма (только для авторизованных пользователей)
router.post('/', authMiddleware, createMovie);

// PUT /api/movies/:id - обновление фильма (только для авторизованных пользователей)
router.put('/:id', authMiddleware, updateMovie);

// DELETE /api/movies/:id - удаление фильма (только для авторизованных пользователей)
router.delete('/:id', authMiddleware, deleteMovie);

// GET /api/movies/:id/trailer - stream trailer for a movie
router.get('/:id/trailer', streamTrailer);

module.exports = router;