import React, { useState, useCallback } from 'react'; // Убираем useEffect если он не используется
import axios from 'axios';
import { FaRobot, FaSpinner, FaLightbulb } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import '../styles/components/AIRecommender.css';

const AIRecommender = ({ movies }) => {
  const [preference, setPreference] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);

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

      const newRecommendation = {
        id: Date.now(),
        preference,
        response: response.data.recommendations,
        timestamp: new Date().toISOString()
      };

      setRecommendations(response.data.recommendations);
      setChatHistory(prev => [newRecommendation, ...prev.slice(0, 4)]);
      setPreference('');
      
      toast.success('Рекомендации получены!');
    } catch (error) {
      console.error('AI recommendation error:', error);
      toast.error('Ошибка получения рекомендаций');
    } finally {
      setIsLoading(false);
    }
  }, [preference, movies]);

  const handleClearHistory = () => {
    setChatHistory([]);
    setRecommendations('');
    toast('История очищена');
  };

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
      </form>

      {recommendations && (
        <div className="recommendations-container">
          <h4>Рекомендации AI:</h4>
          <div className="recommendations-content">
            {recommendations.split('\n').map((line, index) => (
              <p key={index} className="recommendation-line">
                {line}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="ai-history">
        <div className="history-header">
          <button 
            className="history-toggle"
            onClick={() => setShowHistory(!showHistory)}
          >
            История запросов {showHistory ? '▲' : '▼'}
          </button>
          {chatHistory.length > 0 && (
            <button 
              className="clear-history-btn"
              onClick={handleClearHistory}
            >
              Очистить
            </button>
          )}
        </div>

        {showHistory && chatHistory.length > 0 && (
          <div className="history-list">
            {chatHistory.map((item) => (
              <div key={item.id} className="history-item">
                <div className="history-question">
                  <strong>Вопрос:</strong> {item.preference}
                </div>
                <div className="history-response">
                  <strong>Ответ:</strong> {item.response.substring(0, 100)}...
                </div>
                <div className="history-time">
                  {new Date(item.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIRecommender;