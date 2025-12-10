const Movie = require('../models/Movie');

// Получение списка фильмов с возможностью поиска и сортировки
const getAllMovies = async (req, res) => {
  try {
    const { search, sortBy, order, page = 1, limit = 10 } = req.query;
    
    // Формирование фильтра для поиска
    let filter = { isActive: true }; // По умолчанию показываем только активные фильмы
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } }, // Поиск по названию (без учета регистра)
        { description: { $regex: search, $options: 'i' } }, // Поиск по описанию
        { director: { $regex: search, $options: 'i' } }, // Поиск по режиссеру
        { cast: { $in: [new RegExp(search, 'i')] } } // Поиск по актерам
      ];
    }
    
    // Определение поля для сортировки
    let sort = {};
    if (sortBy) {
      // Проверяем, что поле разрешено для сортировки
      const allowedSortFields = ['title', 'releaseDate', 'duration', 'rating', 'director', 'createdAt'];
      if (allowedSortFields.includes(sortBy)) {
        sort[sortBy] = order === 'desc' ? -1 : 1;
      }
    } else {
      // Сортировка по умолчанию
      sort.createdAt = -1;
    }
    
    // Преобразование limit в число
    const limitNum = parseInt(limit);
    const skip = (parseInt(page) - 1) * limitNum;
    
    const movies = await Movie.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();
    
    const total = await Movie.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      data: movies,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        hasNext: skip + movies.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching movies:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching movies',
      error: error.message
    });
  }
};

// Получение фильма по ID
const getMovieById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const movie = await Movie.findById(id);
    
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }
    
    if (!movie.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Movie is not active'
      });
    }
    
    res.status(200).json({
      success: true,
      data: movie
    });
  } catch (error) {
    console.error('Error fetching movie by ID:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid movie ID format'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while fetching movie',
      error: error.message
    });
  }
};

// Создание нового фильма
const createMovie = async (req, res) => {
  try {
    const movieData = req.body;
    
    // Проверка на дубликаты (по названию и дате выхода)
    const existingMovie = await Movie.findOne({
      title: movieData.title,
      releaseDate: movieData.releaseDate
    });
    
    if (existingMovie) {
      return res.status(409).json({
        success: false,
        message: 'A movie with this title and release date already exists'
      });
    }
    
    const movie = new Movie({
      ...movieData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    const savedMovie = await movie.save();
    
    res.status(201).json({
      success: true,
      data: savedMovie,
      message: 'Movie created successfully'
    });
  } catch (error) {
    console.error('Error creating movie:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while creating movie',
      error: error.message
    });
  }
};

// Обновление фильма по ID
const updateMovie = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Удаляем поля, которые не должны обновляться
    delete updateData.createdAt;
    updateData.updatedAt = new Date();
    
    const updatedMovie = await Movie.findByIdAndUpdate(
      id,
      updateData,
      { 
        new: true, // Возвращает обновленный документ
        runValidators: true // Запускает валидацию
      }
    );
    
    if (!updatedMovie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: updatedMovie,
      message: 'Movie updated successfully'
    });
  } catch (error) {
    console.error('Error updating movie:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid movie ID format'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while updating movie',
      error: error.message
    });
  }
};

// Удаление фильма (логическое удаление)
const deleteMovie = async (req, res) => {
  try {
    const { id } = req.params;
    
    const movie = await Movie.findByIdAndUpdate(
      id,
      { 
        isActive: false,
        updatedAt: new Date()
      },
      { 
        new: true // Возвращает обновленный документ
      }
    );
    
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: movie,
      message: 'Movie deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting movie:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid movie ID format'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while deleting movie',
      error: error.message
    });
  }
};

module.exports = {
  getAllMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie
};