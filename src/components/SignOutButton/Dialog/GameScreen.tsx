import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import './GameScreen.css';

interface GameScreenProps {
  playerId: string;
  onExit: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({ playerId, onExit }) => {
  const [currentScene, setCurrentScene] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleChoice = async (choice: any) => {
    try {
      // Обработка выбора
      if (choice.action === 'end_character_creation') {
        onExit();
        return;
      }

      if (choice.nextSceneId) {
        // Загрузка следующей сцены
        setLoading(true);
        // TODO: Загрузить следующую сцену
      }
    } catch (err) {
      setError('Ошибка при обработке выбора');
    }
  };

  if (loading) {
    return (
      <div className="game-screen-loading">
        <div className="loading-spinner"></div>
        <p>Загрузка сцены...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="game-screen-error">
        <p>{error}</p>
        <button onClick={onExit}>Вернуться на карту</button>
      </div>
    );
  }

  if (!currentScene) {
    return (
      <div className="game-screen-empty">
        <p>Нет активной сцены</p>
        <button onClick={onExit}>Вернуться на карту</button>
      </div>
    );
  }

  return (
    <div className="game-screen">
      {currentScene.background && (
        <div 
          className="game-screen-background"
          style={{ backgroundImage: `url(${currentScene.background})` }}
        />
      )}
      
      <div className="game-screen-content">
        <div className="game-screen-text">
          {currentScene.text}
        </div>
        
        <div className="game-screen-choices">
          {currentScene.choices.map((choice: any, index: number) => (
            <button
              key={index}
              className="choice-button"
              onClick={() => handleChoice(choice)}
            >
              {choice.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}; 