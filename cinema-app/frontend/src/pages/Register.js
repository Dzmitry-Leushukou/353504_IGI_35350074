import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaUser, FaLock, FaEnvelope, FaGlobe } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import '../styles/pages/Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    timezone: 'Europe/Moscow'
  });
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Пароли не совпадают');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Пароль должен содержать минимум 6 символов');
      return;
    }

    setIsLoading(true);

    const result = await register(
      formData.username,
      formData.email,
      formData.password,
      formData.timezone
    );

    if (result.success) {
      navigate('/');
    }
    
    setIsLoading(false);
  };

  const timezones = [
    { value: 'Europe/Moscow', label: 'Москва (GMT+3)' },
    { value: 'Europe/London', label: 'Лондон (GMT+0)' },
    { value: 'America/New_York', label: 'Нью-Йорк (GMT-5)' },
    { value: 'Asia/Tokyo', label: 'Токио (GMT+9)' },
    { value: 'Australia/Sydney', label: 'Сидней (GMT+11)' }
  ];

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-header">
          <h2>Регистрация</h2>
          <p>Создайте новый аккаунт</p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label htmlFor="username">
              <FaUser /> Имя пользователя
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Введите имя пользователя"
              required
              minLength="3"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">
              <FaEnvelope /> Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Введите ваш email"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <FaLock /> Пароль
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Введите пароль (минимум 6 символов)"
              required
              minLength="6"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">
              <FaLock /> Подтверждение пароля
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Повторите пароль"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="timezone">
              <FaGlobe /> Часовой пояс
            </label>
            <select
              id="timezone"
              name="timezone"
              value={formData.timezone}
              onChange={handleChange}
              disabled={isLoading}
            >
              {timezones.map(tz => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary register-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>

        <div className="register-footer">
          <p>
            Уже есть аккаунт?{' '}
            <Link to="/login" className="link">
              Войдите
            </Link>
          </p>
          <p>
            <Link to="/" className="link">
              Вернуться на главную
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;