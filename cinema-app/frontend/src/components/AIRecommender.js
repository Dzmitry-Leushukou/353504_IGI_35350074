// frontend/src/components/AIRecommender.js
import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { FaRobot, FaSpinner, FaLightbulb } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import '../styles/components/AIRecommender.css';

const AIRecommender = ({ movies, onRecommendationsChange, initialRecommendations }) => {
  const [preference, setPreference] = useState('');
  const [recommendations, setRecommendations] = useState(initialRecommendations || '');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (onRecommendationsChange) {
      onRecommendationsChange(recommendations);
    }
  }, [recommendations, onRecommendationsChange]);

  const handlePreferenceChange = (e) => {
    setPreference(e.target.value);
  };

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!preference.trim()) {
      toast.error('Пожалуйста, введите ваши предпочтения');
      return;
    }

    if (movies.length === 0) {
      toast.error('Нет фильмов для рекомендации');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/ai/recommend`,
        {
          movies: movies.slice(0, 10),
          preference
        }
      );

      setRecommendations(response.data.recommendations);
      setPreference('');
      
      toast.success('Рекомендации получены!');
    } catch (error) {
      console.error('AI recommendation error:', error);
      toast.error('Ошибка получения рекомендаций');
    } finally {
      setIsLoading(false);
    }
  }, [preference, movies]);

  const handleExampleClick = () => {
    const examples = [
      'про путешествие',
      'комедию',
      'что-то драматичное',
      'фантастику',
      'семейный фильм'
    ];
    const randomExample = examples[Math.floor(Math.random() * examples.length)];
    setPreference(randomExample);
  };

  return (
    <div className="ai-recommender">
      <div className="ai-header">
        <FaRobot className="ai-icon" />
        <h3>AI-Консультант по фильмам</h3>
      </div>

      <form onSubmit={handleSubmit} className="ai-form">
        <div className="form-group">
          <label htmlFor="preference">
            <FaLightbulb /> Что вы хотите посмотреть?
          </label>
          <div className="input-with-example">
            <input
              type="text"
              id="preference"
              value={preference}
              onChange={handlePreferenceChange}
              placeholder="Например: про путешествие, комедию, драму..."
              disabled={isLoading}
            />
            <button 
              type="button" 
              className="example-btn"
              onClick={handleExampleClick}
              disabled={isLoading}
            >
              Пример
            </button>
          </div>
          <small>AI проанализирует доступные фильмы и даст рекомендации</small>
        </div>

        <div className="form-buttons">
          <button 
            type="submit" 
            className="submit-btn"
            disabled={isLoading || !preference.trim()}
          >
            {isLoading ? (
              <>
                <FaSpinner className="spinner" />
                Анализируем...
              </>
            ) : (
              'Получить рекомендации'
            )}
          </button>
          {/* Убрана кнопка очистки рекомендаций */}
        </div>
      </form>

      {recommendations && (
        <div className="recommendations-container">
          <div className="recommendations-header">
            <h4>Рекомендации AI:</h4>
          </div>
          <div className="recommendations-content">
            {recommendations.split('\n').map((line, index) => (
              <p key={index} className="recommendation-line">
                {line}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIRecommender;