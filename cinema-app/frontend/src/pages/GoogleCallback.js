import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import '../styles/pages/GoogleCallback.css';

const GoogleCallback = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        // Получаем параметры из URL
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const idToken = params.get('id_token');
        
        console.log('Google callback received');
        console.log('ID Token found:', !!idToken);

        if (!idToken) {
          // Пробуем получить из query params (для старых версий OAuth)
          const urlParams = new URLSearchParams(window.location.search);
          const idTokenFromQuery = urlParams.get('id_token');
          
          if (idTokenFromQuery) {
            console.log('Found ID token in query params');
            await processIdToken(idTokenFromQuery);
            return;
          }
          
          throw new Error('Не удалось получить токен от Google');
        }

        await processIdToken(idToken);
        
      } catch (error) {
        console.error('Google auth error:', error);
        console.error('Error details:', error.response?.data);
        setError(error.response?.data?.message || 'Ошибка авторизации через Google');
        toast.error('Ошибка авторизации через Google');
        
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    const processIdToken = async (token) => {
      console.log('Sending ID token to backend...');
      
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/google`, {
        token: token
      });

      console.log('Backend response:', response.data);
      const { token: jwtToken, user } = response.data;
      
      // Сохраняем токен и пользователя
      localStorage.setItem('token', jwtToken);
      localStorage.setItem('user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`;
      
      toast.success('Успешный вход через Google!');
      
      // Перенаправляем на главную страницу
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    };

    handleGoogleCallback();
  }, [navigate]);

  if (loading) {
    return (
      <div className="google-callback-container">
        <div className="spinner"></div>
        <p>Обработка входа через Google...</p>
        <p className="small-text">Пожалуйста, подождите</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="google-callback-container">
        <div className="error-icon">❌</div>
        <h3>Ошибка авторизации</h3>
        <p>{error}</p>
        <button 
          className="btn btn-primary"
          onClick={() => navigate('/login')}
        >
          Вернуться к входу
        </button>
      </div>
    );
  }

  return (
    <div className="google-callback-container">
      <div className="success-icon">✅</div>
      <h3>Успешно!</h3>
      <p>Перенаправление на главную страницу...</p>
    </div>
  );
};

export default GoogleCallback;