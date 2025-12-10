import React, { useState, useEffect, useReducer } from 'react';
import axios from 'axios';
import MovieList from '../components/MovieList';
import { FaFilter, FaSortAmountDown, FaSortAmountUp } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import '../styles/pages/Movies.css';

// Reducer для управления состоянием фильтров
const filterReducer = (state, action) => {
  switch (action.type) {
    case 'SET_GENRE':
      return { ...state, genre: action.payload };
    case 'SET_YEAR':
      return { ...state, year: action.payload };
    case 'SET_RATING':
      return { ...state, minRating: action.payload };
    case 'SET_PRICE_RANGE':
      return { ...state, priceRange: action.payload };
    case 'RESET':
      return {
        genre: '',
        year: '',
        minRating: 0,
        priceRange: [0, 1000]
      };
    default:
      return state;
  }
};

// Компонент с использованием useReducer
const Movies = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [sortAscending, setSortAscending] = useState(true);
  
  const [filters, dispatch] = useReducer(filterReducer, {
    genre: '',
    year: '',
    minRating: 0,
    priceRange: [0, 1000]
  });

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/movies`);
      setMovies(response.data.movies);
    } catch (error) {
      console.error('Error fetching movies:', error);
      toast.error('Ошибка загрузки фильмов');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterToggle = () => {
    setShowFilters(!showFilters);
  };

  const handleSortToggle = () => {
    setSortAscending(!sortAscending);
  };

  const handleFilterChange = (type, value) => {
    dispatch({ type, payload: value });
  };

  const handleResetFilters = () => {
    dispatch({ type: 'RESET' });
  };

  const handleSaveSearch = () => {
    const searchParams = {
      ...filters,
      sortAscending,
      timestamp: new Date().toISOString()
    };
    
    // Сохраняем в localStorage
    const savedSearches = JSON.parse(localStorage.getItem('savedSearches') || '[]');
    savedSearches.unshift(searchParams);
    localStorage.setItem('savedSearches', JSON.stringify(savedSearches.slice(0, 5)));
    
    toast.success('Параметры поиска сохранены');
  };

  const filteredMovies = movies.filter(movie => {
    if (filters.genre && !movie.genre.includes(filters.genre)) return false;
    if (filters.year && movie.year.toString() !== filters.year) return false;
    if (filters.minRating > 0 && movie.rating < filters.minRating) return false;
    if (movie.price < filters.priceRange[0] || movie.price > filters.priceRange[1]) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Загрузка фильмов...</p>
      </div>
    );
  }

  return (
    <div className="movies-page">
      <div className="page-header">
        <h1>Фильмы</h1>
        <div className="header-actions">
          <button 
            className="btn btn-filter"
            onClick={handleFilterToggle}
          >
            <FaFilter /> Фильтры
          </button>
          <button 
            className="btn btn-sort"
            onClick={handleSortToggle}
          >
            {sortAscending ? <FaSortAmountDown /> : <FaSortAmountUp />}
            {sortAscending ? 'По возрастанию' : 'По убыванию'}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <label>Жанр:</label>
            <select 
              value={filters.genre}
              onChange={(e) => handleFilterChange('SET_GENRE', e.target.value)}
            >
              <option value="">Все жанры</option>
              {[...new Set(movies.flatMap(m => m.genre))].map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Год:</label>
            <select 
              value={filters.year}
              onChange={(e) => handleFilterChange('SET_YEAR', e.target.value)}
            >
              <option value="">Все годы</option>
              {[...new Set(movies.map(m => m.year))].sort((a, b) => b - a).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Рейтинг от: {filters.minRating}</label>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={filters.minRating}
              onChange={(e) => handleFilterChange('SET_RATING', parseFloat(e.target.value))}
            />
          </div>

          <div className="filter-group">
            <label>Цена: {filters.priceRange[0]} - {filters.priceRange[1]} ₽</label>
            <div className="price-range">
              <input
                type="range"
                min="0"
                max="1000"
                step="50"
                value={filters.priceRange[0]}
                onChange={(e) => handleFilterChange('SET_PRICE_RANGE', [
                  parseInt(e.target.value),
                  filters.priceRange[1]
                ])}
              />
              <input
                type="range"
                min="0"
                max="1000"
                step="50"
                value={filters.priceRange[1]}
                onChange={(e) => handleFilterChange('SET_PRICE_RANGE', [
                  filters.priceRange[0],
                  parseInt(e.target.value)
                ])}
              />
            </div>
          </div>

          <div className="filter-actions">
            <button 
              className="btn btn-secondary"
              onClick={handleResetFilters}
            >
              Сбросить
            </button>
            <button 
              className="btn btn-primary"
              onClick={handleSaveSearch}
            >
              Сохранить поиск
            </button>
          </div>
        </div>
      )}

      <div className="movies-container">
        <div className="movies-info">
          <p>Найдено фильмов: {filteredMovies.length}</p>
          {filters.genre || filters.year || filters.minRating > 0 ? (
            <div className="active-filters">
              Активные фильтры:
              {filters.genre && <span className="filter-tag">{filters.genre}</span>}
              {filters.year && <span className="filter-tag">{filters.year} год</span>}
              {filters.minRating > 0 && <span className="filter-tag">Рейтинг ≥ {filters.minRating}</span>}
            </div>
          ) : null}
        </div>

        {filteredMovies.length > 0 ? (
          <MovieList movies={filteredMovies} />
        ) : (
          <div className="no-results">
            <p>Фильмы не найдены по заданным критериям.</p>
            <button 
              className="btn btn-primary"
              onClick={handleResetFilters}
            >
              Показать все фильмы
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Movies;