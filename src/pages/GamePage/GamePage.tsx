import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { QRScanner } from '../../components/SignOutButton/QR/QRScanner';
import { GameScreen } from '../../components/SignOutButton/Dialog/GameScreen';
import { QuestMap } from '../../components/SignOutButton/Map/QuestMap';
import { SignOutButton } from '../../components/SignOutButton/SignOutButton';
import { useUnit } from 'effector-react';
import { $currentUser } from '../../entities/user/model';
import './GamePage.css';

export const GamePage: React.FC = () => {
  const user = useUnit($currentUser);
  const navigate = useNavigate();
  const [activeScreen, setActiveScreen] = useState<'map' | 'dialog' | 'scanner'>('map');
  
  // Get player profile
  const getOrCreatePlayer = useMutation(api.player.getOrCreatePlayer);
  const activateQuestByQR = useMutation(api.quest.activateQuestByQR);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  
  // Получаем текущую сцену для определения наличия нового сообщения
  const getCurrentScene = useQuery(
    api.quest.getCurrentScene, 
    playerId ? { playerId: playerId as any } : "skip"
  );
  
  // Get player profile on load
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    getOrCreatePlayer({ userId: user.id as any })
      .then(player => {
        if (player) {
          setPlayerId(player._id);
        }
      })
      .catch(error => {
        console.error('Error getting player profile:', error);
      });
  }, [user, navigate, getOrCreatePlayer]);
  
  // Check for new messages when player is loaded
  useEffect(() => {
    if (getCurrentScene) {
      setHasNewMessage(true);
    } else {
      setHasNewMessage(false);
    }
  }, [getCurrentScene]);
  
  // Handle scanner success
  const handleScannerSuccess = async (code: string) => {
    if (!playerId) return;
    
    try {
      // Здесь вызываем функцию активации квеста по QR-коду
      const result = await activateQuestByQR({
        playerId: playerId as any,
        qrCode: code
      });
      
      // Если получен ответ с сообщением, показываем его
      if (result && result.message) {
        alert(result.message);
        
        // Если есть сцена, переходим к диалогу
        if (result.sceneId) {
          setActiveScreen('dialog');
        }
      }
    } catch (error) {
      alert(`Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  };
  
  // Handle exit to main page
  const handleExit = () => {
    navigate('/');
  };
  
  // If no player ID yet, show loading
  if (!playerId) {
    return (
      <div className="game-loading">
        <div className="loading-spinner"></div>
        <p>Загрузка профиля игрока...</p>
      </div>
    );
  }
  
  return (
    <div className="game-page">
      {/* Navigation buttons */}
      <div className="game-nav">
        <div className="nav-buttons">
          <SignOutButton />
          <button className="exit-button" onClick={handleExit}>
            Выйти в главное меню
          </button>
        </div>
        
        <div className="game-tabs">
          <button
            className={`game-tab ${activeScreen === 'map' ? 'active' : ''}`}
            onClick={() => setActiveScreen('map')}
          >
            Карта
          </button>
          <button
            className={`game-tab ${activeScreen === 'dialog' ? 'active' : ''}`}
            onClick={() => setActiveScreen('dialog')}
          >
            Диалог
            {hasNewMessage && <span className="notification-badge">!</span>}
          </button>
          <button
            className={`game-tab ${activeScreen === 'scanner' ? 'active' : ''}`}
            onClick={() => setActiveScreen('scanner')}
          >
            Сканер
          </button>
        </div>
      </div>
      
      {/* Active screen */}
      <div className="game-content">
        {activeScreen === 'map' && (
          <QuestMap />
        )}
        
        {activeScreen === 'dialog' && (
          <GameScreen 
            onExit={() => setActiveScreen('map')}
          />
        )}
        
        {activeScreen === 'scanner' && (
          <div className="scanner-container">
            <QRScanner 
              onSuccess={handleScannerSuccess}
              onCancel={() => setActiveScreen('map')}
            />
          </div>
        )}
      </div>
    </div>
  );
};