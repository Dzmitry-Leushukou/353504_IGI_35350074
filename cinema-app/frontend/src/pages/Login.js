import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaUser, FaLock, FaGoogle } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import '../styles/pages/Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await login(email, password);
    if (result.success) {
      navigate('/');
    }
    
    setIsLoading(false);
  };

  const handleGoogleLogin = () => {
    // Упрощенная Google авторизация для локальной разработки
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.REACT_APP_GOOGLE_CLIENT_ID}&redirect_uri=${window.location.origin}/google-callback&response_type=token&scope=email%20profile`;
    window.location.href = googleAuthUrl;
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h2>Вход в систему</h2>
          <p>Добро пожаловать обратно!</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">
              <FaUser /> Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите ваш пароль"
              required
              disabled={isLoading}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary login-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Вход...' : 'Войти'}
          </button>

          <div className="divider">
            <span>или</span>
          </div>

          <button 
            type="button" 
            className="btn btn-google"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <FaGoogle /> Войти через Google
          </button>
        </form>

        <div className="login-footer">
          <p>
            Нет аккаунта?{' '}
            <Link to="/register" className="link">
              Зарегистрируйтесь
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

export default Login;