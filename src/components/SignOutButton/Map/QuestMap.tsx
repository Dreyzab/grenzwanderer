import React, { useState, useEffect } from 'react';
import './QuestMap.css';

interface QuestMapProps {
}

export const QuestMap: React.FC<QuestMapProps> = () => {
  const [loading, setLoading] = useState(true);
  const [error, _] = useState<string | null>(null);
  
  useEffect(() => {
    // Имитация загрузки данных карты
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (loading) {
    return (
      <div className="quest-map-loading">
        <div className="loading-spinner"></div>
        <p>Загрузка карты...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="quest-map-error">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Обновить
        </button>
      </div>
    );
  }
  
  return (
    <div className="quest-map">
      <div className="quest-map-container">
        <div className="map-placeholder">
          <div className="map-info">
            <h3>Карта заданий</h3>
            <p>Здесь будет интерактивная карта с точками квестов.</p>
            <p>Исследуйте мир и находите новые локации!</p>
          </div>
          
          <div className="map-point">
            <div className="point-marker"></div>
            <div className="point-pulse"></div>
            <div className="point-label">Тренировочная зона</div>
          </div>
        </div>
        
        <div className="map-controls">
          <button className="map-button">
            <span className="map-icon">⊕</span>
            Приблизить
          </button>
          <button className="map-button">
            <span className="map-icon">⊖</span>
            Отдалить
          </button>
          <button className="map-button">
            <span className="map-icon">◎</span>
            Мое положение
          </button>
        </div>
      </div>
      
      <div className="map-legend">
        <div className="legend-item">
          <div className="legend-marker active"></div>
          <span>Активные точки</span>
        </div>
        <div className="legend-item">
          <div className="legend-marker inactive"></div>
          <span>Недоступные точки</span>
        </div>
        <div className="legend-item">
          <div className="legend-marker completed"></div>
          <span>Завершенные точки</span>
        </div>
      </div>
    </div>
  );
};