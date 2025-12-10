import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaFilm, FaUser, FaShoppingCart, FaSignOutAlt, FaBars, FaTimes } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import '../styles/components/Navbar.css';

// Функциональный компонент со стрелочной функцией (требование 2)
const Navbar = ({ currentTime }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [timezone, setTimezone] = useState('Europe/Moscow');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleTimezoneChange = (e) => {
    setTimezone(e.target.value);
    // В реальном приложении сохраняем в профиль пользователя
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/" className="navbar-logo">
            <FaFilm className="logo-icon" />
            <span>Кинотеатр</span>
          </Link>
          
          <div className="time-display">
            <span>Локальное: {currentTime.toLocaleTimeString()}</span>
            <span>UTC: {currentTime.toUTCString().split(' ')[4]}</span>
          </div>
        </div>

        <button className="menu-toggle" onClick={toggleMenu}>
          {isMenuOpen ? <FaTimes /> : <FaBars />}
        </button>

        <div className={`navbar-menu ${isMenuOpen ? 'active' : ''}`}>
          <div className="navbar-links">
            <Link to="/" className="nav-link" onClick={() => setIsMenuOpen(false)}>
              Главная
            </Link>
            <Link to="/movies" className="nav-link" onClick={() => setIsMenuOpen(false)}>
              Фильмы
            </Link>
            <Link to="/about" className="nav-link" onClick={() => setIsMenuOpen(false)}>
              О компании
            </Link>
            
            {isAuthenticated && (
              <Link to="/my-orders" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                <FaShoppingCart /> Мои заказы
              </Link>
            )}
          </div>

          <div className="navbar-actions">
            <select 
              className="timezone-select"
              value={timezone}
              onChange={handleTimezoneChange}
            >
              <option value="Europe/Moscow">Москва (GMT+3)</option>
              <option value="Europe/London">Лондон (GMT+0)</option>
              <option value="America/New_York">Нью-Йорк (GMT-5)</option>
              <option value="Asia/Tokyo">Токио (GMT+9)</option>
            </select>

            {isAuthenticated ? (
              <div className="user-section">
                <span className="username">
                  <FaUser /> {user?.username}
                </span>
                <button onClick={handleLogout} className="logout-btn">
                  <FaSignOutAlt /> Выйти
                </button>
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="btn btn-login">
                  Войти
                </Link>
                <Link to="/register" className="btn btn-register">
                  Регистрация
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;