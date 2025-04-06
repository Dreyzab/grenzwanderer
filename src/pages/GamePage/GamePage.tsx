import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { QRScanner } from '../../components/SignOutButton/QR/QRScanner';
import { SignOutButton } from '../../components/SignOutButton/SignOutButton';
import { GameScreen } from '../../components/SignOutButton/Dialog/GameScreen';
import './GamePage.css';

type GameTab = 'map' | 'dialog' | 'scanner';

// Импортируем перечисление из GameScreen
import { GameView } from '../../components/SignOutButton/Dialog/GameScreen';

export const GamePage: React.FC = () => {
  const navigate = useNavigate();
  
  // Состояние компонента
  const [activeTab, setActiveTab] = useState<GameTab>('map');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [player, setPlayer] = useState<any>(null);
  
  // Получение API методов
  const activateQuestByQR = useMutation(api.quest.activateQuestByQR);
  const getOrCreatePlayer = useMutation(api.player.getOrCreatePlayer);
  
  // Инициализация данных игрока
  useEffect(() => {
    const initPlayer = async () => {
      try {
        setLoading(true);
        // Здесь мы предполагаем, что ID пользователя хранится где-то (например, localStorage)
        const userId = localStorage.getItem('userId');
        
        if (!userId) {
          // Если нет ID пользователя, перенаправляем на страницу логина
          navigate('/login');
          return;
        }
        
        // Получаем или создаем профиль игрока
        const playerData = await getOrCreatePlayer({ userId: userId as any });
        if (playerData) {
          setPlayer(playerData);
          
          // Проверяем наличие новых сообщений
          if (playerData.questState === 'NEW_MESSAGE' || playerData.questState === 'REGISTERED') {
            setHasNewMessage(true);
          }
        }
      } catch (error) {
        console.error('Error initializing player:', error);
        setError(error instanceof Error ? error.message : 'Неизвестная ошибка при загрузке профиля');
      } finally {
        setLoading(false);
      }
    };
    
    initPlayer();
  }, [navigate, getOrCreatePlayer]);
  
  // Обработка клика по вкладке
  const handleTabClick = (tab: GameTab) => {
    setActiveTab(tab);
  };
  
  // Обработка выхода в главное меню
  const handleExit = () => {
    navigate('/');
  };
  
  // Функция синхронизации представления GameScreen с активной вкладкой
  const handleViewChange = (view: GameView) => {
    switch (view) {
      case GameView.MAP:
        setActiveTab('map');
        break;
      case GameView.MESSAGES:
        setActiveTab('dialog');
        break;
      // Другие представления можно обрабатывать здесь
      default:
        break;
    }
  };
  
  // Обработка успешного сканирования QR-кода
  const handleQRScanSuccess = async (code: string) => {
    if (!player) return;
    
    try {
      const result = await activateQuestByQR({
        playerId: player._id,
        qrCode: code
      });
      
      if (result) {
        alert(result.message);
        
        // Если есть sceneId, переключаемся на диалог
        if (result.sceneId) {
          setActiveTab('dialog');
        }
      }
    } catch (error) {
      alert(`Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    } finally {
      // Возвращаемся к карте после сканирования
      setActiveTab('map');
    }
  };
  
  // Если загрузка, показываем индикатор
  if (loading) {
    return (
      <div className="game-loading">
        <div className="loading-spinner"></div>
        <p>Загрузка игры...</p>
      </div>
    );
  }
  
  // Если ошибка, показываем сообщение
  if (error) {
    return (
      <div className="game-error">
        <p>Произошла ошибка: {error}</p>
        <button onClick={() => window.location.reload()}>
          Попробовать снова
        </button>
      </div>
    );
  }
  
  return (
    <div className="game-page">
      {/* Навигационная панель */}
      <div className="game-nav">
        <div className="nav-buttons">
          <SignOutButton />
          <button className="exit-button" onClick={handleExit}>
            Выйти в меню
          </button>
        </div>
        
        <div className="game-tabs">
          <button
            className={`game-tab ${activeTab === 'map' ? 'active' : ''}`}
            onClick={() => handleTabClick('map')}
          >
            Карта
          </button>
          <button
            className={`game-tab ${activeTab === 'dialog' ? 'active' : ''}`}
            onClick={() => handleTabClick('dialog')}
          >
            Диалог
            {hasNewMessage && <span className="notification-badge">!</span>}
          </button>
          <button
            className={`game-tab ${activeTab === 'scanner' ? 'active' : ''}`}
            onClick={() => handleTabClick('scanner')}
          >
            Сканер
          </button>
        </div>
      </div>
      
      {/* Содержимое активной вкладки */}
      <div className="game-content">
        {activeTab === 'map' && (
          <div className="map-content">
            <GameScreen 
              onExit={() => setActiveTab('map')}
              initialView={GameView.MAP}
              onViewChange={handleViewChange}
            />
          </div>
        )}
        
        {activeTab === 'dialog' && (
          <div className="dialog-content">
            <GameScreen 
              onExit={() => setActiveTab('map')}
              initialView={GameView.MESSAGES}
              onViewChange={handleViewChange}
            />
          </div>
        )}
        
        {activeTab === 'scanner' && (
          <div className="scanner-container">
            <QRScanner 
              onSuccess={handleQRScanSuccess}
              onCancel={() => setActiveTab('map')}
            />
          </div>
        )}
      </div>
    </div>
  );
};