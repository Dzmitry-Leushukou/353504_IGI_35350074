// frontend/src/pages/GoogleCallback.js
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const GoogleCallback = () => {
  const navigate = useNavigate();
  const { handleGoogleCallback } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      
      if (accessToken) {
        const result = await handleGoogleCallback(accessToken);
        if (result.success) {
          navigate('/');
        } else {
          navigate('/login');
        }
      } else {
        toast.error('Ошибка аутентификации через Google');
        navigate('/login');
      }
    };

    handleCallback();
  }, [handleGoogleCallback, navigate]);

  return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Обработка входа через Google...</p>
    </div>
  );
};

export default GoogleCallback;