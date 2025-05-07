import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { QuestMap } from '../../widgets/questMap/QuestMap';
import type { QuestMarker } from '../../widgets/questMap/QuestMap';
import { VisualNovel } from '../../pages/visualNovel/VisualNovel';
import { Messages } from '../../widgets/messages/Messages';
import { useMessagesReducer } from '../../hooks/useMessages';
import { 
  showMarker, 
  hideMarker, 
  completeMarker, 
  addInteraction,
  updateMarkersByQuestState,
  QR_CODES
} from '../../entities/markers/model';
import './GameScreen.css';

// Импортируем константы квеста
import { QuestStateEnum } from '../../shared/constants/quest';

// Interfaces
interface PlayerData {
  _id: Id<"players">;
  name: string;
  locationHistory: any[];
  equipment: Record<string, any>;
}

interface GameScreenProps {
  onExit: () => void;
  initialView?: GameView;
  onViewChange?: (view: GameView) => void;
}

export enum GameView {
  MESSAGES = 'messages',
  MAP = 'map',
  NOVEL = 'novel'
}

export const GameScreen: React.FC<GameScreenProps> = ({ onExit, initialView, onViewChange }) => {
  // Component state
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [playerLoading, setPlayerLoading] = useState(true);
  const [playerError, setPlayerError] = useState<string | null>(null);
  
  const [questState, setQuestState] = useState<QuestStateEnum>(QuestStateEnum.REGISTERED);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  
  const [activeMessage, setActiveMessage] = useState<null>(null);
  const [gameView, setGameView] = useState<GameView>(initialView || GameView.MAP);
  const [sceneKey, setSceneKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize hooks
  const { 
    messages, 
    newMessages, 
    archiveMessages, 
    hasUnreadMessages, 
    markMessageAsRead, 
    addMessage 
  } = useMessagesReducer(player?._id);
  
  // Get API mutations
  const activateQuestByQR = useMutation(api.quest.activateQuestByQR);
  const startDeliveryQuest = useMutation(api.quest.startDeliveryQuest);
  const getOrCreatePlayer = useMutation(api.player.getOrCreatePlayer);
  
  // Обновляем маркеры при изменении состояния квеста
  useEffect(() => {
    // Обновляем видимость маркеров на основе текущего состояния квеста
    updateMarkersByQuestState(questState);
  }, [questState]);
  
  // Уведомляем родительский компонент при изменении представления
  useEffect(() => {
    if (onViewChange) {
      onViewChange(gameView);
    }
  }, [gameView, onViewChange]);
  
  // Initialize data
  useEffect(() => {
    const initData = async () => {
      try {
        setPlayerLoading(true);
        
        // Получаем ID пользователя из localStorage
        const userId = localStorage.getItem('userId');
        
        if (!userId) {
          console.warn("User ID not found in localStorage, using mock data");
          // Используем мок данные для игрока
          setPlayer({
            _id: "temporary-player-id" as unknown as Id<"players">,
            name: "Test Player",
            equipment: {},
            locationHistory: []
          });
        } else {
          // Пытаемся получить игрока из API
          try {
            const playerData = await getOrCreatePlayer({ userId: userId as any });
            if (playerData) {
              setPlayer(playerData as unknown as PlayerData);
            }
          } catch (apiError) {
            console.error("API Error:", apiError);
            // Если API недоступно, используем мок данные
            setPlayer({
              _id: "temporary-player-id" as unknown as Id<"players">,
              name: "Test Player",
              equipment: {},
              locationHistory: []
            });
          }
        }
        
        // Set initial quest state
        setQuestState(QuestStateEnum.REGISTERED);
        
      } catch (err) {
        console.error('Error initializing data:', err);
        setPlayerError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setPlayerLoading(false);
      }
    };
    
    initData();
  }, [getOrCreatePlayer]);
  
  // Update player location when geolocation is received
  useEffect(() => {
    if (player && navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          // Update player position
          const newPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: Date.now()
          };
          
          setPlayer((prevPlayer) => {
            if (!prevPlayer) return prevPlayer;
            return {
              ...prevPlayer,
              locationHistory: [...(prevPlayer.locationHistory || []), newPosition].slice(-20)
            };
          });
        },
        (error) => {
          console.warn('Geolocation error:', error.message);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
      
      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    }
  }, [player]);
  
  // Complete quest step
  const completeQuestStep = useCallback((stepId: string) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps(prev => [...prev, stepId]);
    }
  }, [completedSteps]);
  
  // Update quest state
  const updateQuestState = useCallback((newState: QuestStateEnum) => {
    setQuestState(newState);
  }, []);
  
  // Обработка успешного сканирования QR-кода и интеграция с VisualNovel
  const handleQRScanSuccess = useCallback(async (code: string) => {
    if (!player) return;
    
    try {
      setLoading(true);
      
      let result;
      
      try {
        // Проверяем, что ID игрока имеет правильный формат для API
        if (typeof player._id === 'string' && player._id.startsWith('players:')) {
          result = await activateQuestByQR({
            playerId: player._id,
            qrCode: code
          });
        } else {
          throw new Error("Invalid player ID format for API call");
        }
      } catch (apiError) {
        console.warn("API call failed, using mock data for QR activation:", apiError);
        
        // Используем моковые данные в зависимости от кода
        switch (code) {
          case QR_CODES.TRADER:
          case 'grenz_npc_trader_01':
            result = {
              message: "Вы встретили торговца",
              sceneId: "trader_meeting", // ID сцены для встречи с торговцем
              questState: QuestStateEnum.DELIVERY_STARTED
            };
            break;
          case QR_CODES.CRAFTSMAN:
          case 'grenz_npc_craftsman_01':
            result = {
              message: "Вы встретили мастера Дитера",
              sceneId: "craftsman_meeting", // ID сцены для встречи с мастером
              questState: QuestStateEnum.PARTS_COLLECTED
            };
            break;
          case QR_CODES.ARTIFACT:
          case 'ARTIFACT_ITEM_2023':
            result = {
              message: "Вы нашли артефакт!",
              sceneId: "artifact_found", // ID сцены для находки артефакта
              questState: QuestStateEnum.ARTIFACT_FOUND
            };
            break;
          case 'Grenz_loc_anomaly_01':
          case 'location_anomaly_001':
            result = {
              message: "Вы прибыли в аномальную зону",
              sceneId: "artifact_hunt_start", // ID сцены для начала охоты за артефактом
              questState: QuestStateEnum.ARTIFACT_HUNT
            };
            break;
          case 'encounter_001':
            result = {
              message: "Неожиданная встреча в лесу",
              sceneId: "ork_encounter", // ID сцены для встречи в лесу
              questState: QuestStateEnum.ARTIFACT_HUNT
            };
            break;
          default:
            result = {
              message: "Неизвестный QR-код",
              sceneId: undefined,
              questState: undefined
            };
        }
      }
      
      if (result) {
        // Показываем уведомление
        alert(result.message);
        
        // Обрабатываем результат
        if (result.sceneId) {
          // Открываем сцену в VisualNovel
          setSceneKey(result.sceneId);
          setGameView(GameView.NOVEL);
          if (onViewChange) onViewChange(GameView.NOVEL);
        }
        
        // Обновляем состояние квеста, если оно изменилось
        if (result.questState && Object.values(QuestStateEnum).includes(result.questState as QuestStateEnum)) {
          updateQuestState(result.questState as QuestStateEnum);
          
          // Обновляем видимость маркеров на основе нового состояния
          updateMarkersByQuestState(result.questState);
        }
      }
    } catch (err) {
      console.error('Error activating QR code:', err);
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [player, activateQuestByQR, updateQuestState, onViewChange]);
  
  // Handle quest start
  const handleStartDeliveryQuest = useCallback(async () => {
    if (!player) return;
    
    try {
      setLoading(true);
      
      let result;
      
      // Пытаемся вызвать реальное API, но при ошибке используем мок
      try {
        // Проверяем, что ID игрока имеет правильный формат
        if (typeof player._id === 'string' && player._id.startsWith('players:')) {
          result = await startDeliveryQuest({ 
            playerId: player._id
          });
        } else {
          throw new Error("Invalid player ID format for API call");
        }
      } catch (apiError) {
        console.warn("API call failed, using mock data:", apiError);
        // Используем моковые данные
        result = {
          message: "Задание получено!",
          sceneId: "mock-scene-id" as string | undefined,
        };
      }
      
      if (result && result.sceneId) {
        // Обновляем состояние квеста
        updateQuestState(QuestStateEnum.DELIVERY_STARTED);
        
        // Отмечаем шаг квеста как выполненный
        completeQuestStep('start_delivery');
        
        // Показываем маркер торговца на карте
        showMarker('trader');
        
        // Переключаемся на карту
        setGameView(GameView.MAP);
        if (onViewChange) onViewChange(GameView.MAP);
      }
    } catch (err) {
      setError(`Error starting quest: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [player, startDeliveryQuest, updateQuestState, completeQuestStep, onViewChange]);
  
  // View handlers
  const handleNovelExit = useCallback(() => {
    setGameView(GameView.MAP);
    if (onViewChange) onViewChange(GameView.MAP);
    setSceneKey(null);
  }, [onViewChange]);
  
  const handleOpenMap = useCallback(() => {
    setGameView(GameView.MAP);
    if (onViewChange) onViewChange(GameView.MAP);
  }, [onViewChange]);
  
  const handleOpenMessages = useCallback(() => {
    setGameView(GameView.MESSAGES);
    if (onViewChange) onViewChange(GameView.MESSAGES);
  }, [onViewChange]);
  
  // Обработка клика по маркеру на карте
  const handleMarkerClick = useCallback(async (marker: QuestMarker) => {
    if (!player || !marker.qrCode) return;
    
    try {
      setLoading(true);
      
      // Регистрируем взаимодействие с маркером
      addInteraction({
        markerId: marker.id,
        action: 'activated',
        data: { timestamp: Date.now() }
      });
      
      // Если маркер - это задание, отмечаем его как выполненное
      if (marker.markerType === 'quest_point') {
        completeMarker(marker.id);
      }
      
      // Отмечаем шаг как выполненный
      completeQuestStep(marker.id);
      
      // Обрабатываем QR-код маркера
      await handleQRScanSuccess(marker.qrCode);
    } catch (err) {
      console.error('Error activating marker:', err);
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [player, handleQRScanSuccess, completeQuestStep, addInteraction, completeMarker]);
  
  // Show loading
  if (playerLoading) {
    return (
      <div className="game-screen-loading">
        <div className="loading-spinner"></div>
        <p>Loading game...</p>
      </div>
    );
  }
  
  // Show error
  if (playerError || error) {
    return (
      <div className="game-screen-error">
        <p>{playerError || error}</p>
        <button onClick={onExit}>Return to map</button>
      </div>
    );
  }
  
  // Show dialog scene if active
  if (gameView === GameView.NOVEL && sceneKey && player) {
    return (
      <VisualNovel
        initialSceneId={sceneKey}
        playerId={player._id}
        onExit={handleNovelExit}
      />
    );
  }
  
  // Show messages view
  if (gameView === GameView.MESSAGES) {
    return (
      <Messages
        newMessages={newMessages}
        archiveMessages={archiveMessages}
        onBackClick={handleOpenMap}
        onOpenMap={handleOpenMap}
        onStartQuest={handleStartDeliveryQuest}
        markMessageAsRead={markMessageAsRead}
      />
    );
  }
  
  // Show map view
  return (
    <div className="game-screen">
      {gameView === GameView.MAP && (
        <div className="quest-map-wrapper">
          <div className="quest-map-header">
            <h2>Карта квестов</h2>
            <button
              className="messages-button"
              onClick={handleOpenMessages}
            >
              Сообщения
              {hasUnreadMessages && <div className="notification-badge"></div>}
            </button>
          </div>
          
          <div className="map-container">
            <QuestMap 
              onMarkerClick={handleMarkerClick}
              followPlayer={true}
            />
          </div>
          
          {loading && (
            <div className="operation-loading">
              <div className="loading-spinner-small"></div>
              <p>Загрузка...</p>
            </div>
          )}
          
          <div className="game-nav-buttons">
            {questState === QuestStateEnum.REGISTERED && (
              <button 
                className="game-nav-btn"
                onClick={handleStartDeliveryQuest}
              >
                Начать задание доставки
              </button>
            )}
            
            {/* Тестовые кнопки для запуска сцен визуальной новеллы */}
            <div className="test-vn-buttons">
              <button 
                className="game-nav-btn test-vn-btn"
                onClick={() => handleQRScanSuccess(QR_CODES.TRADER)}
              >
                Тест: Встреча с торговцем
              </button>
              <button 
                className="game-nav-btn test-vn-btn"
                onClick={() => handleQRScanSuccess(QR_CODES.CRAFTSMAN)}
              >
                Тест: Мастерская Дитера
              </button>
              <button 
                className="game-nav-btn test-vn-btn"
                onClick={() => handleQRScanSuccess(QR_CODES.ANOMALY_ZONE)}
              >
                Тест: Аномальная зона
              </button>
              <button 
                className="game-nav-btn test-vn-btn"
                onClick={() => handleQRScanSuccess(QR_CODES.ENCOUNTER)}
              >
                Тест: Неожиданная встреча
              </button>
            </div>
            
            <button 
              className="exit-btn"
              onClick={onExit}
            >
              Выйти
            </button>
          </div>
        </div>
      )}
    </div>
  );
};