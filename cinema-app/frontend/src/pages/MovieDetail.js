// frontend/src/pages/MovieDetail.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FaCalendarAlt, 
  FaClock, 
  FaTicketAlt, 
  FaStar, 
  FaFilm,
  FaArrowLeft,
  FaUser,
  FaMoneyBillWave,
  FaPlay,
  FaCreditCard
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import '../styles/pages/MovieDetail.css';

const MovieDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);

  const fetchMovie = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/movies/${id}`
      );
      setMovie(response.data);
    } catch (error) {
      console.error('Error fetching movie:', error);
      toast.error('Ошибка загрузки фильма');
      navigate('/movies');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchMovie();
  }, [fetchMovie]);

  const handleSessionSelect = (session) => {
    setSelectedSession(session);
    setSelectedSeats([]);
    setShowBookingForm(true);
  };

  const handleSeatSelect = (seatNumber) => {
    if (selectedSeats.includes(seatNumber)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seatNumber));
    } else {
      if (selectedSeats.length < 6) {
        setSelectedSeats([...selectedSeats, seatNumber]);
      } else {
        toast.error('Можно выбрать максимум 6 мест');
      }
    }
  };

  const handleBooking = async () => {
    if (!isAuthenticated) {
      toast.error('Для бронирования необходимо войти в систему');
      navigate('/login');
      return;
    }

    if (!selectedSession || selectedSeats.length === 0) {
      toast.error('Выберите сеанс и места');
      return;
    }

    try {
      const orderData = {
        movieId: id,
        sessionId: selectedSession._id,
        seats: selectedSeats,
        showDate: selectedSession.date,
        showTime: selectedSession.time,
        totalPrice: selectedSeats.length * movie.price
      };

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/orders`,
        orderData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      toast.success('Билеты успешно забронированы!');
      setShowBookingForm(false);
      setSelectedSeats([]);
      fetchMovie();
      
      setTimeout(() => {
        navigate('/my-orders');
      }, 2000);
      
    } catch (error) {
      console.error('Booking error:', error);
      toast.error(error.response?.data?.message || 'Ошибка бронирования');
    }
  };

  const generateSeats = (totalSeats, availableSeats, bookedSeats = []) => {
    const seats = [];
    
    // Создаем массив всех мест
    for (let i = 1; i <= totalSeats; i++) {
      const seatNumber = `A${i}`;
      const isBooked = bookedSeats.includes(seatNumber); // Проверяем в bookedSeats
      const isSelected = selectedSeats.includes(seatNumber);
      
      seats.push(
        <button
          key={i}
          className={`seat ${isBooked ? 'booked' : ''} ${isSelected ? 'selected' : ''}`}
          onClick={() => !isBooked && handleSeatSelect(seatNumber)}
          disabled={isBooked || !selectedSession}
          title={isBooked ? 'Занято' : `Место ${seatNumber}`}
        >
          {isBooked ? '✗' : i}
        </button>
      );
    }
    
    return seats;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Загрузка информации о фильме...</p>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="not-found">
        <h2>Фильм не найден</h2>
        <button onClick={() => navigate('/movies')} className="btn btn-primary">
          <FaArrowLeft /> Вернуться к фильмам
        </button>
      </div>
    );
  }

  return (
    <div className="movie-detail-page">
      <button 
        onClick={() => navigate('/movies')}
        className="back-btn"
      >
        <FaArrowLeft /> Назад к фильмам
      </button>

      <div className="movie-detail-container">
        <div className="movie-poster-section">
          <img 
            src={`${process.env.REACT_APP_API_URL}/uploads/${movie.poster}`}
            alt={movie.title}
            className="movie-poster-large"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/400x600?text=No+Poster';
            }}
          />
          
          <div className="movie-quick-info">
            <div className="info-item">
              <FaStar className="icon" />
              <span>Рейтинг: {movie.rating.toFixed(1)}/10</span>
            </div>
            <div className="info-item">
              <FaClock className="icon" />
              <span>Длительность: {Math.floor(movie.duration / 60)}ч {movie.duration % 60}м</span>
            </div>
            <div className="info-item">
              <FaFilm className="icon" />
              <span>Год: {movie.year}</span>
            </div>
            <div className="info-item">
              <FaUser className="icon" />
              <span>Режиссер: {movie.director}</span>
            </div>
            <div className="info-item">
              <FaMoneyBillWave className="icon" />
              <span>Цена: {movie.price} ₽</span>
            </div>
          </div>

          {movie.trailer && (
            <button 
              className="btn btn-primary trailer-btn"
              onClick={() => setShowTrailer(true)}
              style={{ width: '100%', marginTop: '20px' }}
            >
              <FaPlay /> Смотреть трейлер
            </button>
          )}
        </div>

        <div className="movie-info-section">
          <h1 className="movie-title">{movie.title}</h1>
          
          <div className="movie-genres">
            {movie.genre.map((genre, index) => (
              <span key={index} className="genre-tag">
                {genre}
              </span>
            ))}
          </div>

          <div className="movie-description">
            <h3>Описание</h3>
            <p>{movie.description}</p>
          </div>

          <div className="movie-actors">
            <h3>В ролях</h3>
            <div className="actors-list">
              {movie.actors.map((actor, index) => (
                <span key={index} className="actor-name">
                  {actor}
                </span>
              ))}
            </div>
          </div>

          <div className="movie-sessions">
            <h3>
              <FaCalendarAlt /> Сеансы
            </h3>
            
            {movie.sessions && movie.sessions.length > 0 ? (
              <div className="sessions-list">
                {movie.sessions.map((session, index) => (
                  <div 
                    key={index}
                    className={`session-card ${selectedSession?._id === session._id ? 'selected' : ''}`}
                    onClick={() => handleSessionSelect(session)}
                  >
                    <div className="session-date">
                      {new Date(session.date).toLocaleDateString('ru-RU', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short'
                      })}
                    </div>
                    <div className="session-time">{session.time}</div>
                    <div className="session-hall">Зал: {session.hall}</div>
                    <div className="session-seats">
                      Свободно: {session.availableSeats}/{session.totalSeats}
                    </div>
                    <div className="session-price">
                      {movie.price} ₽/место
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>Сеансы отсутствуют</p>
            )}
          </div>
        </div>
      </div>

      {showBookingForm && selectedSession && (
        <div className="booking-form-overlay">
          <div className="booking-form">
            <h3>Бронирование мест</h3>
            
            <div className="booking-info">
              <p><strong>Фильм:</strong> {movie.title}</p>
              <p><strong>Дата:</strong> {new Date(selectedSession.date).toLocaleDateString('ru-RU')}</p>
              <p><strong>Время:</strong> {selectedSession.time}</p>
              <p><strong>Зал:</strong> {selectedSession.hall}</p>
            </div>

            <div className="seats-selection">
              <h4>Выберите места (максимум 6):</h4>
              <div className="seats-grid">
                <div className="screen">ЭКРАН</div>
                <div className="seats-container">
                  {generateSeats(
                    selectedSession.totalSeats, 
                    selectedSession.availableSeats, 
                    selectedSession.bookedSeats || []
                  )}
                </div>
                <div className="seats-legend">
                  <div className="legend-item">
                    <span className="seat sample available"></span>
                    <span>Свободно</span>
                  </div>
                  <div className="legend-item">
                    <span className="seat sample selected"></span>
                    <span>Выбрано</span>
                  </div>
                  <div className="legend-item">
                    <span className="seat sample booked"></span>
                    <span>Занято</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="booking-summary">
              <div className="summary-item">
                <span>Выбрано мест:</span>
                <strong>{selectedSeats.length}</strong>
              </div>
              <div className="summary-item">
                <span>Цена за место:</span>
                <strong>{movie.price} ₽</strong>
              </div>
              <div className="summary-item total">
                <span>Итого:</span>
                <strong>{selectedSeats.length * movie.price} ₽</strong>
              </div>
            </div>

            <div className="booking-actions">
              <button
                onClick={() => setShowBookingForm(false)}
                className="btn btn-secondary"
              >
                Отмена
              </button>
              <button
                onClick={handleBooking}
                className="btn btn-primary"
                disabled={selectedSeats.length === 0}
              >
                <FaTicketAlt /> Забронировать ({selectedSeats.length * movie.price} ₽)
              </button>
            </div>
          </div>
        </div>
      )}

      {showTrailer && movie.trailer && (
        <div className="trailer-modal-overlay">
          <div className="trailer-modal">
            <div className="trailer-modal-header">
              <h3>Трейлер: {movie.title}</h3>
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
                  src={`${process.env.REACT_APP_API_URL}/uploads/trailers/${movie.trailer}`} 
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

export default MovieDetail;