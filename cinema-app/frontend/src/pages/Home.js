import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaFilm, FaCalendarAlt, FaTicketAlt, FaStar } from 'react-icons/fa';
import MovieList from '../components/MovieList';
import AIRecommender from '../components/AIRecommender';
import { toast } from 'react-hot-toast';
import '../styles/pages/Home.css';

// Главная страница с различными обработчиками событий
const Home = () => {
  const [movies, setMovies] = useState([]);
  const [featuredMovie, setFeaturedMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);
  const [notification, setNotification] = useState('');

  useEffect(() => {
    fetchMovies();
    
    // Автоматическое скрытие уведомления через 5 секунд (setTimeout пример)
    const notificationTimer = setTimeout(() => {
      setNotification('');
    }, 5000);

    // Периодическое обновление данных каждые 30 секунд
    const updateTimer = setInterval(() => {
      fetchMovies();
    }, 30000);

    return () => {
      clearTimeout(notificationTimer);
      clearInterval(updateTimer);
    };
  }, []);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/movies`, {
        params: { limit: 20 }
      });
      
      setMovies(response.data.movies);
      
      // Выбираем случайный фильм для показа на главной
      if (response.data.movies.length > 0) {
        const randomIndex = Math.floor(Math.random() * response.data.movies.length);
        setFeaturedMovie(response.data.movies[randomIndex]);
      }
      
      setNotification(`Обновлено: ${new Date().toLocaleTimeString()}`);
    } catch (error) {
      console.error('Error fetching movies:', error);
      toast.error('Ошибка загрузки фильмов');
    } finally {
      setLoading(false);
    }
  };

  const handleTrailerClick = () => {
    setShowTrailer(!showTrailer);
  };

  const handleQuickBooking = async (movieId) => {
    try {
      // Здесь будет логика быстрого бронирования
      toast.success('Функция быстрого бронирования скоро будет доступна!');
    } catch (error) {
      toast.error('Ошибка бронирования');
    }
  };

  const handleNewsletterSignup = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    
    if (!email) {
      toast.error('Введите email');
      return;
    }
    
    // Сохранение в localStorage (Promise пример)
    new Promise((resolve) => {
      localStorage.setItem('newsletter_email', email);
      setTimeout(() => resolve(), 1000); // Имитация асинхронной операции
    })
    .then(() => {
      toast.success('Вы успешно подписались на рассылку!');
      e.target.reset();
    })
    .catch(() => {
      toast.error('Ошибка подписки');
    });
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
      {/* Hero секция */}
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
                onClick={() => handleQuickBooking(featuredMovie._id)}
              >
                <FaTicketAlt /> Забронировать
              </button>
              <button 
                className="btn btn-secondary"
                onClick={handleTrailerClick}
              >
                Смотреть трейлер
              </button>
            </div>
          </div>
          <div className="hero-poster">
            <img 
              src={`${process.env.REACT_APP_API_URL}/uploads/${featuredMovie.poster}`} 
              alt={featuredMovie.title}
            />
          </div>
        </section>
      )}

      {/* AI рекомендации */}
      <section className="ai-section">
        <AIRecommender movies={movies} />
      </section>

      {/* Список фильмов */}
      <section className="movies-section">
        <h2>Сейчас в кино</h2>
        <MovieList movies={movies} />
      </section>

      {/* Новостная рассылка */}
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

      {/* Уведомление */}
      {notification && (
        <div className="notification">
          {notification}
          <button onClick={() => setNotification('')}>×</button>
        </div>
      )}
    </div>
  );
};

export default Home;