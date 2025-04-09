import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { QRScanner } from '../../components/SignOutButton/QR/QRScanner';
import { SignOutButton } from '../../components/SignOutButton/SignOutButton';
import { GameScreen } from '../../components/SignOutButton/Dialog/GameScreen';
import { VisualNovel } from '../visualNovel/VisualNovel';
import './GamePage.css';

type GameTab = 'map' | 'dialog' | 'scanner' | 'novel';

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
  const [currentSceneId, setCurrentSceneId] = useState<string | null>(null);
  const [questState, setQuestState] = useState<string>('REGISTERED');
  
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
          
          // Устанавливаем текущее состояние квеста
          if (playerData.questState) {
            setQuestState(playerData.questState);
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
      case GameView.NOVEL:
        // Если открывается визуальный роман, переключаемся на вкладку novel
        setActiveTab('novel');
        break;
      default:
        break;
    }
  };
  
  // Обработка успешного сканирования QR-кода
  const handleQRScanSuccess = async (code: string) => {
    if (!player) return;
    
    try {
      setLoading(true);
      
      // Сбрасываем текущую сцену перед активацией новой
      setCurrentSceneId(null);
      
      let result;
      
      try {
        result = await activateQuestByQR({
          playerId: player._id,
          qrCode: code
        });
      } catch (error) {
        console.warn('API error while activating QR code:', error);
        
        // Используем мок данные для тестирования в зависимости от считанного кода
        switch (code) {
          case 'grenz_npc_trader_01':
            result = {
              message: "Вы встретили торговца",
              sceneId: "trader_meeting", // ID сцены для встречи с торговцем
              questState: "DELIVERY_STARTED"
            };
            break;
          case 'grenz_npc_craftsman_01':
            result = {
              message: "Вы встретили мастера Дитера",
              sceneId: "craftsman_meeting", // ID сцены для встречи с мастером
              questState: "PARTS_COLLECTED"
            };
            break;
          case 'ARTIFACT_ITEM_2023':
            result = {
              message: "Вы нашли артефакт!",
              sceneId: "artifact_found", // ID сцены для находки артефакта
              questState: "ARTIFACT_FOUND"
            };
            break;
          case 'location_anomaly_001':
            result = {
              message: "Вы прибыли в аномальную зону",
              sceneId: "artifact_area", // ID сцены для аномальной зоны
              questState: "ARTIFACT_HUNT"
            };
            break;
          case 'encounter_001':
            result = {
              message: "Неожиданная встреча в лесу",
              sceneId: "ork_encounter", // ID сцены для встречи в лесу
              questState: "ARTIFACT_HUNT"
            };
            break;
          default:
            result = {
              message: "QR-код активирован (тестовый режим)",
              sceneId: "artifact_task", // ID тестовой сцены для принятия задания с артефактом
              questState: "DELIVERY_STARTED"
            };
        }
      }
      
      if (result) {
        // Если есть sceneId, открываем визуальный роман
        if (result.sceneId) {
          // Небольшая задержка для гарантированного обновления сцены
          const sceneId = String(result.sceneId);
          setTimeout(() => {
            setCurrentSceneId(sceneId);
            setActiveTab('novel');
          }, 100);
        }
        
        // Обновляем состояние квеста, если оно изменилось
        if (result.questState) {
          setQuestState(result.questState);
        }
      }
    } catch (error) {
      alert(`Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Обработчик выхода из визуального романа
  const handleNovelExit = () => {
    setActiveTab('map');
    setCurrentSceneId(null);
  };
  
  // Обработчик обновления состояния квеста
  const updateQuestState = (newState: string) => {
    setQuestState(newState);
    
    // Здесь также можно сохранить новое состояние на сервере, если нужно
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
        
        {activeTab === 'novel' && currentSceneId && (
          <div className="novel-content" style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0,
            width: '100%', 
            height: '100%', 
            zIndex: 9000 
          }}>
            <VisualNovel
              initialSceneId={currentSceneId}
              playerId={player?._id}
              onExit={handleNovelExit}
              questState={{
                currentState: questState,
                updateState: updateQuestState
              }}
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