// frontend/src/pages/Admin.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaEdit, FaTrash, FaPlus, FaSave, FaTimes, FaUpload, 
  FaFilm, FaCalendar, FaClock, FaDollarSign, FaUserShield,
  FaSpinner
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import '../styles/pages/Admin.css';

const Admin = () => {
  const [movies, setMovies] = useState([]);
  const [editingMovie, setEditingMovie] = useState(null);
  const [newMovie, setNewMovie] = useState({
    title: '',
    description: '',
    genre: '',
    duration: 120,
    year: new Date().getFullYear(),
    director: '',
    actors: '',
    rating: 7.5,
    price: 500,
    poster: null,
    trailer: null
  });
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchMovies();
    }
  }, [user]);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/movies?limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMovies(response.data.movies);
    } catch (error) {
      console.error('Error fetching movies:', error);
      toast.error('Ошибка загрузки фильмов');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e, field) => {
    setNewMovie({
      ...newMovie,
      [field]: e.target.files[0]
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMovie({
      ...newMovie,
      [name]: name === 'duration' || name === 'year' || name === 'rating' || name === 'price' 
        ? parseFloat(value) 
        : value
    });
  };

  const handleAddMovie = async () => {
    if (!newMovie.title.trim() || !newMovie.description.trim()) {
      toast.error('Заполните обязательные поля');
      return;
    }

    setIsAdding(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      // Add all fields to formData
      Object.keys(newMovie).forEach(key => {
        if (key === 'poster' || key === 'trailer') {
          if (newMovie[key]) {
            formData.append(key, newMovie[key]);
          }
        } else if (key === 'genre') {
          formData.append(key, JSON.stringify(newMovie[key].split(',').map(g => g.trim())));
        } else if (key === 'actors') {
          formData.append(key, JSON.stringify(newMovie[key].split(',').map(a => a.trim())));
        } else {
          formData.append(key, newMovie[key]);
        }
      });

      // Add default session
      const defaultSession = {
        date: new Date(),
        time: '18:00',
        hall: 'A',
        totalSeats: 100,
        availableSeats: 100,
        bookedSeats: []
      };
      formData.append('sessions', JSON.stringify([defaultSession]));

      await axios.post(`${process.env.REACT_APP_API_URL}/api/movies`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Фильм успешно добавлен');
      setNewMovie({
        title: '',
        description: '',
        genre: '',
        duration: 120,
        year: new Date().getFullYear(),
        director: '',
        actors: '',
        rating: 7.5,
        price: 500,
        poster: null,
        trailer: null
      });
      fetchMovies();
    } catch (error) {
      console.error('Error adding movie:', error);
      toast.error(error.response?.data?.message || 'Ошибка добавления фильма');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteMovie = async (movieId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот фильм?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/movies/${movieId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Фильм удален');
      fetchMovies();
    } catch (error) {
      console.error('Error deleting movie:', error);
      toast.error('Ошибка удаления фильма');
    }
  };

  const handleEditMovie = (movie) => {
    setEditingMovie(movie);
    setNewMovie({
      title: movie.title,
      description: movie.description,
      genre: movie.genre.join(', '),
      duration: movie.duration,
      year: movie.year,
      director: movie.director,
      actors: movie.actors.join(', '),
      rating: movie.rating,
      price: movie.price,
      poster: null,
      trailer: null
    });
  };

  const handleUpdateMovie = async () => {
    if (!editingMovie) return;
    
    setIsAdding(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      Object.keys(newMovie).forEach(key => {
        if (key === 'poster' || key === 'trailer') {
          if (newMovie[key]) {
            formData.append(key, newMovie[key]);
          }
        } else if (key === 'genre') {
          formData.append(key, JSON.stringify(newMovie[key].split(',').map(g => g.trim())));
        } else if (key === 'actors') {
          formData.append(key, JSON.stringify(newMovie[key].split(',').map(a => a.trim())));
        } else {
          formData.append(key, newMovie[key]);
        }
      });

      await axios.put(`${process.env.REACT_APP_API_URL}/api/movies/${editingMovie._id}`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Фильм обновлен');
      setEditingMovie(null);
      setNewMovie({
        title: '',
        description: '',
        genre: '',
        duration: 120,
        year: new Date().getFullYear(),
        director: '',
        actors: '',
        rating: 7.5,
        price: 500,
        poster: null,
        trailer: null
      });
      fetchMovies();
    } catch (error) {
      console.error('Error updating movie:', error);
      toast.error('Ошибка обновления фильма');
    } finally {
      setIsAdding(false);
    }
  };

  const cancelEdit = () => {
    setEditingMovie(null);
    setNewMovie({
      title: '',
      description: '',
      genre: '',
      duration: 120,
      year: new Date().getFullYear(),
      director: '',
      actors: '',
      rating: 7.5,
      price: 500,
      poster: null,
      trailer: null
    });
  };

  // Проверка прав администратора
  if (!user || user.role !== 'admin') {
    return (
      <div className="admin-page">
        <div className="access-denied">
          <FaUserShield size={64} />
          <h2>Доступ запрещен</h2>
          <p>У вас недостаточно прав для доступа к этой странице.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-page">
        <div className="loading">
          <FaSpinner className="spinner" />
          <p>Загрузка данных...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1><FaUserShield /> Панель администратора</h1>
        <p>Управление фильмами и контентом</p>
      </div>
      
      <div className="admin-sections">
        <section className="movie-form-section">
          <h2>{editingMovie ? 'Редактировать фильм' : 'Добавить новый фильм'}</h2>
          
          <div className="movie-form">
            <div className="form-row">
              <div className="form-group">
                <label>Название фильма *</label>
                <input
                  type="text"
                  name="title"
                  value={newMovie.title}
                  onChange={handleInputChange}
                  placeholder="Введите название"
                  disabled={isAdding}
                />
              </div>
              
              <div className="form-group">
                <label>Год выпуска *</label>
                <input
                  type="number"
                  name="year"
                  value={newMovie.year}
                  onChange={handleInputChange}
                  min="1900"
                  max={new Date().getFullYear()}
                  disabled={isAdding}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Описание *</label>
              <textarea
                name="description"
                value={newMovie.description}
                onChange={handleInputChange}
                placeholder="Введите описание фильма"
                rows="3"
                disabled={isAdding}
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Жанры (через запятую) *</label>
                <input
                  type="text"
                  name="genre"
                  value={newMovie.genre}
                  onChange={handleInputChange}
                  placeholder="Например: Комедия, Драма, Приключения"
                  disabled={isAdding}
                />
              </div>
              
              <div className="form-group">
                <label>Длительность (минут) *</label>
                <input
                  type="number"
                  name="duration"
                  value={newMovie.duration}
                  onChange={handleInputChange}
                  min="1"
                  disabled={isAdding}
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Режиссер *</label>
                <input
                  type="text"
                  name="director"
                  value={newMovie.director}
                  onChange={handleInputChange}
                  placeholder="Введите имя режиссера"
                  disabled={isAdding}
                />
              </div>
              
              <div className="form-group">
                <label>Актеры (через запятую)</label>
                <input
                  type="text"
                  name="actors"
                  value={newMovie.actors}
                  onChange={handleInputChange}
                  placeholder="Введите имена актеров"
                  disabled={isAdding}
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Рейтинг</label>
                <input
                  type="number"
                  name="rating"
                  value={newMovie.rating}
                  onChange={handleInputChange}
                  step="0.1"
                  min="0"
                  max="10"
                  disabled={isAdding}
                />
              </div>
              
              <div className="form-group">
                <label>Цена (₽) *</label>
                <input
                  type="number"
                  name="price"
                  value={newMovie.price}
                  onChange={handleInputChange}
                  min="0"
                  disabled={isAdding}
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Постер</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'poster')}
                  disabled={isAdding}
                />
              </div>
              
              <div className="form-group">
                <label>Трейлер (MP4)</label>
                <input
                  type="file"
                  accept="video/mp4"
                  onChange={(e) => handleFileChange(e, 'trailer')}
                  disabled={isAdding}
                />
              </div>
            </div>
            
            <div className="form-actions">
              {editingMovie ? (
                <>
                  <button 
                    className="btn btn-primary"
                    onClick={handleUpdateMovie}
                    disabled={isAdding}
                  >
                    {isAdding ? <FaSpinner className="spinner" /> : <FaSave />}
                    {isAdding ? 'Обновление...' : 'Обновить фильм'}
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={cancelEdit}
                    disabled={isAdding}
                  >
                    <FaTimes /> Отмена
                  </button>
                </>
              ) : (
                <button 
                  className="btn btn-primary"
                  onClick={handleAddMovie}
                  disabled={isAdding}
                >
                  {isAdding ? <FaSpinner className="spinner" /> : <FaPlus />}
                  {isAdding ? 'Добавление...' : 'Добавить фильм'}
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="movies-list-section">
          <h2>Список фильмов ({movies.length})</h2>
          
          <div className="movies-table-container">
            <table className="movies-table">
              <thead>
                <tr>
                  <th>Постер</th>
                  <th>Название</th>
                  <th>Год</th>
                  <th>Рейтинг</th>
                  <th>Цена</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {movies.map(movie => (
                  <tr key={movie._id}>
                    <td>
                      <img 
                        src={`${process.env.REACT_APP_API_URL}/uploads/${movie.poster}`}
                        alt={movie.title}
                        className="movie-poster-small"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/60x90?text=No+Poster';
                        }}
                      />
                    </td>
                    <td>
                      <div className="movie-title-cell">
                        <strong>{movie.title}</strong>
                        <small>{movie.genre.join(', ')}</small>
                      </div>
                    </td>
                    <td>{movie.year}</td>
                    <td>
                      <span className={`rating-badge ${movie.rating >= 7 ? 'high' : movie.rating >= 5 ? 'medium' : 'low'}`}>
                        {movie.rating.toFixed(1)}
                      </span>
                    </td>
                    <td>{movie.price} ₽</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn btn-edit"
                          onClick={() => handleEditMovie(movie)}
                          title="Редактировать"
                        >
                          <FaEdit />
                        </button>
                        <button 
                          className="btn btn-danger"
                          onClick={() => handleDeleteMovie(movie._id)}
                          title="Удалить"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {movies.length === 0 && (
              <div className="no-movies">
                <p>Нет фильмов для отображения</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Admin;