// frontend/src/pages/Home.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaFilm, FaCalendarAlt, FaTicketAlt, FaStar, FaPlay } from 'react-icons/fa';
import MovieList from '../components/MovieList';
import AIRecommender from '../components/AIRecommender';
import { toast } from 'react-hot-toast';
import '../styles/pages/Home.css';

const Home = () => {
  const [movies, setMovies] = useState([]);
  const [featuredMovie, setFeaturedMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);
  const navigate = useNavigate();
  
  // Сохраняем рекомендации в localStorage
  const [aiRecommendations, setAiRecommendations] = useState(
    localStorage.getItem('ai_recommendations') || ''
  );

  useEffect(() => {
    fetchMovies();
    
    return () => {
      // Очищаем таймеры при размонтировании
    };
  }, []);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/movies`, {
        params: { limit: 20 }
      });
      
      setMovies(response.data.movies);
      
      if (response.data.movies.length > 0) {
        // Каждый раз при загрузке выбираем случайный фильм
        const randomIndex = Math.floor(Math.random() * response.data.movies.length);
        setFeaturedMovie(response.data.movies[randomIndex]);
      }
      
    } catch (error) {
      console.error('Error fetching movies:', error);
      toast.error('Ошибка загрузки фильмов');
    } finally {
      setLoading(false);
    }
  };

  const handleTrailerClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowTrailer(true);
  };

  const handleQuickBooking = (movieId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    navigate(`/movies/${movieId}`);
  };

  const handleNewsletterSignup = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    
    if (!email) {
      toast.error('Введите email');
      return;
    }
    
    new Promise((resolve) => {
      localStorage.setItem('newsletter_email', email);
      setTimeout(() => resolve(), 1000);
    })
    .then(() => {
      toast.success('Вы успешно подписались на рассылку!');
      e.target.reset();
    })
    .catch(() => {
      toast.error('Ошибка подписки');
    });
  };

  const saveAIRecommendations = (recommendations) => {
    setAiRecommendations(recommendations);
    localStorage.setItem('ai_recommendations', recommendations);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Загрузка фильмов...</p>
      </div>
    );
  }

  return (
    <div className="home-page">
      {featuredMovie && (
        <section className="hero-section">
          <div className="hero-content">
            <h1>{featuredMovie.title}</h1>
            <p className="hero-description">{featuredMovie.description.substring(0, 150)}...</p>
            <div className="hero-meta">
              <span><FaStar /> {featuredMovie.rating.toFixed(1)}</span>
              <span><FaCalendarAlt /> {featuredMovie.year}</span>
              <span><FaFilm /> {featuredMovie.genre[0]}</span>
            </div>
            <div className="hero-actions">
              <button 
                className="btn btn-primary"
                onClick={(e) => handleQuickBooking(featuredMovie._id, e)}
              >
                <FaTicketAlt /> Забронировать
              </button>
              {featuredMovie.trailer && (
                <button 
                  className="btn btn-secondary"
                  onClick={handleTrailerClick}
                >
                  <FaPlay /> Смотреть трейлер
                </button>
              )}
            </div>
          </div>
          <div className="hero-poster">
            <img 
              src={`${process.env.REACT_APP_API_URL}/uploads/${featuredMovie.poster}`} 
              alt={featuredMovie.title}
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/400x600?text=No+Poster';
              }}
            />
          </div>
        </section>
      )}

      <section className="ai-section">
        <AIRecommender 
          movies={movies} 
          onRecommendationsChange={saveAIRecommendations}
          initialRecommendations={aiRecommendations}
        />
      </section>

      <section className="movies-section">
        <h2>Сейчас в кино</h2>
        <MovieList movies={movies} />
      </section>

      <section className="newsletter-section">
        <h2>Подпишитесь на новости</h2>
        <form onSubmit={handleNewsletterSignup} className="newsletter-form">
          <input
            type="email"
            name="email"
            placeholder="Ваш email"
            required
          />
          <button type="submit" className="btn btn-primary">
            Подписаться
          </button>
        </form>
      </section>

      {showTrailer && featuredMovie?.trailer && (
        <div className="trailer-modal-overlay">
          <div className="trailer-modal">
            <div className="trailer-modal-header">
              <h3>Трейлер: {featuredMovie.title}</h3>
              <button 
                className="close-btn"
                onClick={() => setShowTrailer(false)}
              >
                ×
              </button>
            </div>
            <div className="trailer-modal-content">
              <video 
                controls 
                autoPlay 
                className="trailer-video"
              >
                <source 
                  src={`${process.env.REACT_APP_API_URL}/uploads/trailers/${featuredMovie.trailer}`} 
                  type="video/mp4" 
                />
                Ваш браузер не поддерживает видео.
              </video>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;