import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaUser, FaLock, FaGoogle } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import '../styles/pages/Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleScriptLoaded, setIsGoogleScriptLoaded] = useState(false);
  const googleButtonRef = useRef(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Загружаем Google Identity Services при монтировании компонента
    if (!window.google && !isGoogleScriptLoaded) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        setIsGoogleScriptLoaded(true);
        initializeGoogleSignIn();
      };
      
      script.onerror = () => {
        console.log('Failed to load Google Identity Services');
        setIsGoogleScriptLoaded(false);
      };
      
      document.head.appendChild(script);
    } else if (window.google) {
      setIsGoogleScriptLoaded(true);
      initializeGoogleSignIn();
    }
    
    return () => {
      // Очистка при размонтировании
      if (window.google && window.google.accounts && window.google.accounts.id) {
        window.google.accounts.id.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (isGoogleScriptLoaded && googleButtonRef.current) {
      initializeGoogleSignIn();
    }
  }, [isGoogleScriptLoaded]);

  const initializeGoogleSignIn = () => {
    if (!window.google || !process.env.REACT_APP_GOOGLE_CLIENT_ID) {
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
        auto_select: false,
        cancel_on_tap_outside: false,
        context: 'signin',
        ux_mode: 'popup'
      });

      // Рендерим кнопку Google Sign-In
      if (googleButtonRef.current) {
        window.google.accounts.id.renderButton(
          googleButtonRef.current,
          {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            type: 'standard'
          }
        );

        // Показываем One Tap диалог
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Если One Tap не показан, ничего не делаем
            console.log('One Tap not displayed');
          }
        });
      }
    } catch (error) {
      console.error('Error initializing Google Sign-In:', error);
    }
  };

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

  const handleFallbackGoogleLogin = () => {
    // Fallback метод для старых браузеров или если GSI не работает
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    const redirectUri = encodeURIComponent(`${window.location.origin}/google-callback`);
    const scope = encodeURIComponent('email profile');
    const responseType = 'id_token';
    
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=${responseType}&scope=${scope}&nonce=${Math.random().toString(36).substring(2)}&prompt=select_account`;
    
    console.log('Using fallback Google auth');
    window.location.href = googleAuthUrl;
  };

  const handleGoogleLoginClick = () => {
    if (isGoogleScriptLoaded && window.google) {
      // Если GIS загружен, инициируем One Tap или просто полагаемся на кнопку
      try {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Если One Tap не показан, ничего не делаем - кнопка уже отрендерена
            console.log('One Tap not displayed, using rendered button');
          }
        });
      } catch (error) {
        console.error('Error prompting Google Sign-In:', error);
        handleFallbackGoogleLogin();
      }
    } else {
      // Если GIS не загружен, используем fallback
      handleFallbackGoogleLogin();
    }
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

          {isGoogleScriptLoaded ? (
            <div 
              ref={googleButtonRef} 
              style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
            />
          ) : (
            <button 
              type="button" 
              className="btn btn-google"
              onClick={handleGoogleLoginClick}
              disabled={isLoading}
            >
              <FaGoogle /> Войти через Google
            </button>
          )}
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