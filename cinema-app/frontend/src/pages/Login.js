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
    if (!email || !password) {
      toast.error('Заполните все поля');
      return;
    }
    
    setIsLoading(true);
    const result = await login(email, password);
    if (result.success) {
      navigate('/');
    }
    setIsLoading(false);
  };

  const handleGoogleLogin = () => {
    // Используем Google Identity Services (gsi) для получения ID Token
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    
    // Создаем script для загрузки Google Identity Services
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleResponse,
          auto_select: false,
        });
        
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Если всплывающее окно не показано, используем старый метод
            fallbackGoogleLogin();
          }
        });
        
        window.google.accounts.id.renderButton(
          document.getElementById('googleButton'),
          { theme: 'outline', size: 'large', width: '100%' }
        );
        
        window.google.accounts.id.requestAccessToken();
      } else {
        fallbackGoogleLogin();
      }
    };
    
    document.head.appendChild(script);
  };

  const handleGoogleResponse = async (response) => {
    try {
      console.log('Google response received');
      
      if (response.credential) {
        // Получаем ID Token
        const idToken = response.credential;
        
        // Отправляем ID Token на бэкенд
        const backendResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/google`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: idToken }),
        });
        
        const data = await backendResponse.json();
        
        if (backendResponse.ok) {
          // Сохраняем токен и пользователя
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          
          toast.success('Успешный вход через Google!');
          
          // Перенаправляем на главную
          setTimeout(() => {
            window.location.href = '/';
          }, 1000);
        } else {
          throw new Error(data.message || 'Ошибка авторизации');
        }
      }
    } catch (error) {
      console.error('Google auth error:', error);
      toast.error(error.message || 'Ошибка авторизации через Google');
    }
  };

  const fallbackGoogleLogin = () => {
    // Fallback метод для старых браузеров или если GSI не работает
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    const redirectUri = encodeURIComponent(`${window.location.origin}/google-callback`);
    const scope = encodeURIComponent('email profile');
    const responseType = 'id_token'; // Изменено на id_token
    
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=${responseType}&scope=${scope}&nonce=${Math.random().toString(36).substring(2)}&prompt=select_account`;
    
    console.log('Using fallback Google auth');
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
            id="googleButton"
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