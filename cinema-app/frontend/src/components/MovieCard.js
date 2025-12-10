// frontend/src/components/MovieCard.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaStar, FaClock } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import '../styles/components/MovieCard.css';

function MovieCard({ movie }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? 'Удалено из избранного' : 'Добавлено в избранное');
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}ч ${mins}м`;
  };

  return (
    <Link 
      to={`/movies/${movie._id}`} 
      className="movie-card-link"
    >
      <div 
        className={`movie-card ${isHovered ? 'hovered' : ''}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="movie-card-header">
          <img 
            src={`${process.env.REACT_APP_API_URL}/uploads/${movie.poster}` || 'default-poster.jpg'} 
            alt={movie.title}
            className="movie-poster"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/300x450?text=No+Poster';
            }}
          />
          
          <div className="movie-overlay">
            <button 
              className="favorite-btn"
              onClick={handleFavoriteClick}
              aria-label={isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
            >
              <FaStar className={isFavorite ? 'filled' : ''} />
            </button>
          </div>
        </div>

        <div className="movie-card-body">
          <h3 className="movie-title">{movie.title}</h3>
          <p className="movie-year">{movie.year}</p>
          
          <div className="movie-meta">
            <span className="movie-rating">
              <FaStar /> {movie.rating.toFixed(1)}
            </span>
            <span className="movie-duration">
              <FaClock /> {formatDuration(movie.duration)}
            </span>
          </div>
          
          <div className="movie-genres">
            {movie.genre.slice(0, 2).map((genre, index) => (
              <span key={index} className="genre-tag">
                {genre}
              </span>
            ))}
          </div>
          
          <p className="movie-price">
            от {movie.price} ₽
          </p>
        </div>
      </div>
    </Link>
  );
}

export default MovieCard;