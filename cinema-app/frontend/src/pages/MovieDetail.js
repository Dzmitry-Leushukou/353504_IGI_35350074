// frontend/src/pages/MovieDetail.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  FaCreditCard,
  FaPause,
  FaVolumeUp,
  FaVolumeMute,
  FaDownload,
  FaSpinner
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
  
  // Состояния для XMLHttpRequest загрузки
  const [trailerLoading, setTrailerLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [totalSize, setTotalSize] = useState(0);
  const [loadedSize, setLoadedSize] = useState(0);
  const [bufferingProgress, setBufferingProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [videoBlobUrl, setVideoBlobUrl] = useState(null);
  const [xhrStatus, setXhrStatus] = useState('Ожидание...');
  
  // Детали загрузки для отображения
  const [xhrDetails, setXhrDetails] = useState({
    loaded: '0 B',
    total: '0 B',
    speed: '0 B/сек'
  });

  const videoRef = useRef(null);
  const xhrRef = useRef(null);
  const startTimeRef = useRef(0);

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
    
    return () => {
      // Очистка при размонтировании
      if (videoBlobUrl) {
        URL.revokeObjectURL(videoBlobUrl);
      }
      if (xhrRef.current) {
        xhrRef.current.abort();
      }
    };
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
    
    for (let i = 1; i <= totalSeats; i++) {
      const seatNumber = `A${i}`;
      const isBooked = bookedSeats.includes(seatNumber);
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

  // Исправленная функция formatBytes
  const formatBytes = (bytes) => {
    if (isNaN(bytes) || bytes === 0 || bytes === undefined) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const value = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
    return isNaN(value) ? '0 B' : `${value} ${sizes[i]}`;
  };

  // XMLHttpRequest загрузка трейлера
  const loadTrailerWithXHR = () => {
    if (!movie?.trailer) {
      toast.error('Трейлер недоступен');
      return;
    }

    setTrailerLoading(true);
    setLoadProgress(0);
    setTotalSize(0);
    setLoadedSize(0);
    setBufferingProgress(0);
    setXhrStatus('Начинаем загрузку...');
    setXhrDetails({
      loaded: '0 B',
      total: '0 B',
      speed: '0 B/сек'
    });

    const trailerUrl = `${process.env.REACT_APP_API_URL}/uploads/trailers/${movie.trailer}`;
    
    // Запоминаем время начала загрузки
    startTimeRef.current = Date.now();
    
    xhrRef.current = new XMLHttpRequest();
    xhrRef.current.open('GET', trailerUrl, true);
    xhrRef.current.responseType = 'blob';
    
    xhrRef.current.onloadstart = () => {
      setXhrStatus('Подключаемся к серверу...');
    };
    
    xhrRef.current.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100;
        setLoadProgress(Math.round(percentComplete));
        setTotalSize(event.total);
        setLoadedSize(event.loaded);
        
        // Обновляем статус с MB вместо Bytes
        const mbLoaded = (event.loaded / (1024 * 1024)).toFixed(2);
        const mbTotal = (event.total / (1024 * 1024)).toFixed(2);
        setXhrStatus(`Загружено: ${mbLoaded} MB / ${mbTotal} MB`);
        
        // Вычисляем скорость загрузки
        const elapsedTime = (Date.now() - startTimeRef.current) / 1000;
        let speedText = 'Вычисляется...';
        
        if (elapsedTime > 0.1 && event.loaded > 0) {
          const speedBps = event.loaded / elapsedTime;
          speedText = `${formatBytes(speedBps)}/сек`;
        }
        
        // Обновляем детали
        setXhrDetails({
          loaded: formatBytes(event.loaded),
          total: formatBytes(event.total),
          speed: speedText
        });
      }
    };
    
    xhrRef.current.onload = () => {
      if (xhrRef.current.status === 200) {
        const blob = xhrRef.current.response;
        const blobUrl = URL.createObjectURL(blob);
        setVideoBlobUrl(blobUrl);
        setXhrStatus('Загрузка завершена!');
        setXhrDetails(prev => ({
          ...prev,
          speed: 'Завершено'
        }));
        
        // Небольшая задержка перед скрытием индикатора
        setTimeout(() => {
          setTrailerLoading(false);
          // Автоматически запускаем видео
          if (videoRef.current) {
            videoRef.current.play().then(() => {
              setIsPlaying(true);
            }).catch(() => {
              console.log('Автоматическое воспроизведение заблокировано');
            });
          }
        }, 500);
        
        toast.success('Трейлер загружен!');
      } else {
        setXhrStatus('Ошибка загрузки');
        toast.error('Ошибка загрузки трейлера');
        setTrailerLoading(false);
      }
    };
    
    xhrRef.current.onerror = () => {
      setXhrStatus('Ошибка соединения');
      toast.error('Ошибка сети при загрузке трейлера');
      setTrailerLoading(false);
    };
    
    xhrRef.current.onabort = () => {
      setXhrStatus('Загрузка отменена');
      toast.info('Загрузка трейлера отменена');
      setTrailerLoading(false);
    };
    
    xhrRef.current.send();
  };

  // Улучшенная функция для открытия трейлера с проверкой кэша
  const checkCacheAndLoad = () => {
    setShowTrailer(true);
    
    // Если уже есть blob URL (видео уже было загружено)
    if (videoBlobUrl) {
      // Видео уже загружено, показываем сразу
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play().then(() => {
            setIsPlaying(true);
          }).catch(() => {
            console.log('Автовоспроизведение заблокировано');
          });
        }
      }, 100);
      return;
    }
    
    // Иначе начинаем загрузку через XMLHttpRequest
    loadTrailerWithXHR();
  };

  // Закрытие трейлера
  const handleCloseTrailer = () => {
    setShowTrailer(false);
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    
    // Отменяем загрузку, если она идет
    if (xhrRef.current && trailerLoading) {
      xhrRef.current.abort();
    }
  };

  // Видео-функции
  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleVideoProgress = () => {
    if (videoRef.current) {
      if (videoRef.current.buffered.length > 0 && duration > 0) {
        const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
        const progress = (bufferedEnd / duration) * 100;
        setBufferingProgress(progress);
      }
    }
  };

  const handleVideoCanPlay = () => {
    // Если видео готово к воспроизведению, но еще не играет
    if (videoRef.current && !isPlaying && !trailerLoading) {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        // Автоплей может быть заблокирован браузером
        console.log('Автоматическое воспроизведение заблокировано');
      });
    }
  };

  const handleDownloadTrailer = async () => {
    if (!movie?.trailer) {
      toast.error('Трейлер недоступен для скачивания');
      return;
    }

    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      const xhr = new XMLHttpRequest();
      const trailerUrl = `${process.env.REACT_APP_API_URL}/uploads/trailers/${movie.trailer}`;
      
      xhr.open('GET', trailerUrl, true);
      xhr.responseType = 'blob';
      
      xhr.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          setDownloadProgress(Math.round(percentComplete));
        }
      });
      
      xhr.onload = () => {
        if (xhr.status === 200) {
          const blob = xhr.response;
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `trailer_${movie.title.replace(/\s+/g, '_')}.mp4`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          toast.success('Трейлер скачан успешно!');
        } else {
          toast.error('Ошибка скачивания трейлера');
        }
        setIsDownloading(false);
        setDownloadProgress(0);
      };
      
      xhr.onerror = () => {
        toast.error('Ошибка скачивания трейлера');
        setIsDownloading(false);
        setDownloadProgress(0);
      };
      
      xhr.send();
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Ошибка скачивания трейлера');
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
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
              onClick={checkCacheAndLoad}
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

      {showTrailer && (
        <div className="trailer-modal-overlay">
          <div className="trailer-modal">
            <div className="trailer-modal-header">
              <h3>Трейлер: {movie.title}</h3>
              <button 
                className="close-btn"
                onClick={handleCloseTrailer}
              >
                ×
              </button>
            </div>
            
            <div className="trailer-modal-content">
              {/* Индикатор XMLHttpRequest загрузки */}
              {trailerLoading && (
                <div className="video-loading-indicator">
                  <div className="spinner">
                    <FaSpinner className="spinning-icon" />
                  </div>
                  <p>Загрузка трейлера...</p>
                  
                  <div className="xhr-progress-container">
                    <div className="xhr-progress-label">
                      <span>{xhrStatus}</span>
                      <span>{loadProgress}%</span>
                    </div>
                    <div className="xhr-progress-bar">
                      <div 
                        className="xhr-progress-fill"
                        style={{ width: `${loadProgress}%` }}
                      ></div>
                    </div>
                    <div className="xhr-details">
                      <span>
                        {xhrDetails.loaded} / {xhrDetails.total}
                      </span>
                      <span>Скорость: {xhrDetails.speed}</span>
                    </div>
                  </div>
                  
                  <div className="buffering-progress">
                    <div className="buffering-progress-bar" 
                         style={{ width: `${bufferingProgress}%` }}
                    ></div>
                    <span>Буферизация: {bufferingProgress.toFixed(1)}%</span>
                  </div>
                </div>
              )}
              
              {/* Видео контейнер */}
              {movie.trailer ? (
                <div className="video-container">
                  <video 
                    ref={videoRef}
                    controls={!trailerLoading}
                    className="trailer-video"
                    src={videoBlobUrl}
                    onLoadedMetadata={handleLoadedMetadata}
                    onTimeUpdate={handleTimeUpdate}
                    onProgress={handleVideoProgress}
                    onCanPlay={handleVideoCanPlay}
                    onEnded={() => setIsPlaying(false)}
                    onClick={handlePlayPause}
                    preload="none"
                  >
                    Ваш браузер не поддерживает видео.
                  </video>
                  
                  {/* Кастомные контролы показываем, когда видео не загружается */}
                  {!trailerLoading && (
                    <div className="video-controls">
                      <div className="controls-top">
                        <div className="playback-controls">
                          <button 
                            className="control-btn"
                            onClick={handlePlayPause}
                          >
                            {isPlaying ? <FaPause /> : <FaPlay />}
                          </button>
                          
                          <div className="time-display">
                            {formatTime(currentTime)} / {formatTime(duration)}
                          </div>
                        </div>
                        
                        <div className="volume-controls">
                          <button 
                            className="control-btn"
                            onClick={handleMuteToggle}
                          >
                            {isMuted || volume === 0 ? <FaVolumeMute /> : <FaVolumeUp />}
                          </button>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={volume}
                            onChange={handleVolumeChange}
                            className="volume-slider"
                          />
                        </div>
                        
                        <button 
                          className="control-btn download-btn"
                          onClick={handleDownloadTrailer}
                          disabled={isDownloading}
                        >
                          <FaDownload />
                          {isDownloading && (
                            <div className="download-progress-indicator">
                              <div 
                                className="download-progress-bar"
                                style={{ width: `${downloadProgress}%` }}
                              ></div>
                              <span>{downloadProgress}%</span>
                            </div>
                          )}
                        </button>
                      </div>
                      
                      <div className="progress-controls">
                        <div className="progress-container">
                          <input
                            type="range"
                            min="0"
                            max={duration || 100}
                            value={currentTime}
                            onChange={handleSeek}
                            className="progress-slider"
                          />
                          <div 
                            className="buffering-bar"
                            style={{ width: `${bufferingProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Индикатор буферизации в реальном времени */}
                  {!trailerLoading && bufferingProgress < 100 && (
                    <div className="buffering-indicator">
                      <span className="dot"></span>
                      <span>Буферизация: {bufferingProgress.toFixed(0)}%</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="no-trailer">
                  <p>Трейлер для этого фильма недоступен</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieDetail;