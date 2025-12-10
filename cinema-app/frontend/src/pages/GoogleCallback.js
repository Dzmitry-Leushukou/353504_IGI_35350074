import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import '../styles/pages/Login.css';

const GoogleCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        // Получаем токен из URL
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        
        if (accessToken) {
          // Отправляем токен на бэкенд для верификации
          const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/google`, {
            token: accessToken
          });
          
          const { token, user } = response.data;
          
          // Сохраняем токен и данные пользователя
          localStorage.setItem('token', token);
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          toast.success('Вход через Google выполнен успешно!');
          navigate('/');
        } else {
          toast.error('Ошибка получения токена от Google');
          navigate('/login');
        }
      } catch (error) {
        console.error('Google callback error:', error);
        toast.error('Ошибка авторизации через Google');
        navigate('/login');
      }
    };

    handleGoogleCallback();
  }, [navigate]);

  return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Обработка входа через Google...</p>
    </div>
  );
};

export default GoogleCallback;