// src/components/SignOutButton/Dialog/GameScreen.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { useUnit } from 'effector-react';
import { $currentUser } from '../../../entities/user/model';
import { VisualNovel } from '../../../pages/visualNovel/VisualNovel';
import { QuestMap, QuestMarker as MapQuestMarker, MarkerType } from '../Map/QuestMap';
import './GameScreen.css';

interface GameScreenProps {
  onExit: () => void;
}

type DialogTab = 'new' | 'archive';
type GameView = 'messages' | 'map' | 'novel';

interface Message {
  id: string;
  title: string;
  sender: string;
  date: string;
  read: boolean;
  content: string;
  sceneKey?: string;
  mapPoints?: {
    title: string;
    lat: number;
    lng: number;
    qrCode?: string;
    isArea?: boolean;
    radius?: number;
  }[];
}

// QR-коды для тестирования
const QR_CODES = {
  TRADER: 'grenz_npc_trader_01',
  CRAFTSMAN: 'grenz_npc_craftsman_01',
  ARTIFACT: 'grenz_area_artifact_01'
};

interface QuestMarker {
  id: string;
  title: string;
  lat: number;
  lng: number;
  isActive: boolean;
  isCompleted: boolean;
  qrCode?: string;
  markerType?: string;
  radius?: number;
}

export const GameScreen: React.FC<GameScreenProps> = ({ onExit }) => {
  const navigate = useNavigate();
  const user = useUnit($currentUser);
  const [playerId, setPlayerId] = useState<Id<"players"> | null>(null);
  const [sceneKey, setSceneKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DialogTab>('new');
  const [gameView, setGameView] = useState<GameView>('messages');
  const [activeMessage, setActiveMessage] = useState<Message | null>(null);
  const [questMarkers, setQuestMarkers] = useState<QuestMarker[]>([]);
  const [questProgress, setQuestProgress] = useState<string | null>(null);
  
  // Mock data for messages - в реальном приложении эти данные должны приходить с сервера и сохраняться
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      title: 'Новое задание',
      sender: 'Командование',
      date: '10.08.2023',
      read: false,
      content: 'Новичок, есть работа. Торговец недавно привёз партию ценных запчастей. Забери их и доставь мастеровому по имени Дитер в центральную мастерскую города. Координаты я приложил. Действуй аккуратно, товар ценный!',
      sceneKey: 'new_delivery_quest',
      mapPoints: [
        {
          title: 'Торговец',
          // Обновленные координаты из GeoJSON
          lat: 47.99443839098572,
          lng: 7.846383071898231,
          qrCode: QR_CODES.TRADER
        },
        {
          title: 'Мастерская Дитера',
          // Обновленные координаты из GeoJSON
          lat: 47.99378928825229,
          lng: 7.8488525930746675,
          qrCode: QR_CODES.CRAFTSMAN
        },
        {
          title: 'Аномальная зона',
          // Обновленные координаты из GeoJSON (центр полигона)
          lat: 47.99405714850842,
          lng: 7.857825214463277,
          qrCode: QR_CODES.ARTIFACT,
          isArea: true,
          radius: 40 // радиус области в метрах
        }
      ]
    },
    {
      id: '2',
      title: 'Приветствие',
      sender: 'Система',
      date: '08.08.2023',
      read: true,
      content: 'Добро пожаловать в Гренцландер! Ваша миссия - выжить в этом опасном мире и раскрыть его тайны. Удачи, сталкер!'
    }
  ]);
  
  // Get Convex mutations and queries
  const getOrCreatePlayer = useMutation(api.player.getOrCreatePlayer);
  const getCurrentScene = useQuery(api.quest.getCurrentScene, playerId ? { playerId } : "skip");
  const startDeliveryQuest = useMutation(api.quest.startDeliveryQuest);
  const activateQuestByQR = useMutation(api.quest.activateQuestByQR);
  
  // Load player and current scene
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    const initializeGame = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get player profile
        const player = await getOrCreatePlayer({ userId: user.id as any });
        if (!player) {
          throw new Error("Could not create or find player profile");
        }
        
        setPlayerId(player._id);
        
        // Загружаем прогресс квеста из локального хранилища
        const savedProgress = localStorage.getItem(`quest_progress_${player._id}`);
        if (savedProgress) {
          setQuestProgress(savedProgress);
        }
        
        // Загружаем статус прочтения сообщений из локального хранилища
        const savedMessagesData = localStorage.getItem(`messages_${player._id}`);
        if (savedMessagesData) {
          try {
            const savedMessages = JSON.parse(savedMessagesData);
            setMessages(prevMessages => {
              // Обновляем только поле read на основе сохраненных данных
              return prevMessages.map(msg => {
                const savedMsg = savedMessages.find((m: Message) => m.id === msg.id);
                if (savedMsg) {
                  return { ...msg, read: savedMsg.read };
                }
                return msg;
              });
            });
          } catch (e) {
            console.error("Ошибка при загрузке статуса сообщений:", e);
          }
        }
        
        // Загружаем метки квестов
        initQuestMarkers(player.questState);
        
      } catch (err) {
        setError(`Error initializing game: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };
    
    initializeGame();
  }, [user, navigate, getOrCreatePlayer]);
  
  // Обновляем локальное хранилище при изменении сообщений
  useEffect(() => {
    if (playerId) {
      // Сохраняем только id и статус прочтения
      const messagesToSave = messages.map(({ id, read }) => ({ id, read }));
      localStorage.setItem(`messages_${playerId}`, JSON.stringify(messagesToSave));
    }
  }, [messages, playerId]);
  
  // Обновляем локальное хранилище при изменении прогресса квеста
  useEffect(() => {
    if (playerId && questProgress) {
      localStorage.setItem(`quest_progress_${playerId}`, questProgress);
    }
  }, [questProgress, playerId]);
  
  // When we have current scene, set it
  useEffect(() => {
    if (getCurrentScene) {
      setSceneKey(getCurrentScene.sceneKey || null);
    }
  }, [getCurrentScene]);
  
  // Инициализация маркеров квестов на основе состояния квеста игрока
  const initQuestMarkers = (playerQuestState: string) => {
    // Получаем первое сообщение с квестом доставки
    const deliveryQuest = messages.find(msg => msg.id === '1');
    
    if (deliveryQuest && deliveryQuest.mapPoints) {
      // Создаем маркеры на основе точек квеста
      const markers: QuestMarker[] = deliveryQuest.mapPoints.map((point, index) => {
        // Определяем активность и завершенность маркера на основе прогресса квеста
        let isActive = false;
        let isCompleted = false;
        
        const isTrader = index === 0;
        const isCraftsman = index === 1;
        const isArtifactArea = index === 2;
        
        if (playerQuestState === 'DELIVERY_STARTED' && isTrader) {
          isActive = true;
        } else if (playerQuestState === 'PARTS_COLLECTED' && isCraftsman) {
          isActive = true;
          // Если это состояние PARTS_COLLECTED, то торговец (первая точка) уже посещен
          isCompleted = isTrader;
        } else if (playerQuestState === 'ARTIFACT_HUNT' && isArtifactArea) {
          isActive = true;
          isCompleted = isTrader || isCraftsman;
        } else if (playerQuestState === 'QUEST_COMPLETION') {
          isCompleted = isTrader || isCraftsman || isArtifactArea;
        }
        
        return {
          id: `marker_${index}`,
          title: point.title,
          lat: point.lat,
          lng: point.lng,
          // Если игрок в начальном состоянии, активируем только после принятия квеста
          isActive: isActive || (playerQuestState === 'REGISTERED' && isTrader),
          isCompleted,
          qrCode: point.qrCode,
          // Добавляем признак области и радиус, если они указаны
          ...(point.isArea && { markerType: MarkerType.QUEST_AREA, radius: point.radius })
        };
      });
      
      setQuestMarkers(markers);
    }
  };
  
  // Function to start a delivery quest
  const handleStartDeliveryQuest = async () => {
    if (!playerId) return;
    
    try {
      setLoading(true);
      const result = await startDeliveryQuest({ playerId });
      if (result && result.sceneId) {
        // Помечаем квест как начатый в локальном хранилище
        setQuestProgress('DELIVERY_STARTED');
        
        // Обновляем маркеры на основе нового прогресса
        updateMarkersBasedOnProgress('DELIVERY_STARTED');
        
        // Переключаемся на карту после прочтения сообщения
        setGameView('map');
        
        // Помечаем активное сообщение как прочитанное
        if (activeMessage) {
          markMessageAsRead(activeMessage.id);
        }
      }
    } catch (err) {
      setError(`Error starting quest: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Обработка сканирования QR-кода
  const handleQRCodeScan = async (qrCode: string) => {
    if (!playerId) return;
    
    try {
      setLoading(true);
      const result = await activateQuestByQR({ 
        playerId, 
        qrCode 
      });
      
      console.log('Результат сканирования QR-кода:', result);
      
      if (result && result.message) {
        alert(result.message);
        
        // Обновляем состояние квеста, если оно изменилось
        if (result.questState) {
          console.log('Обновление состояния квеста:', result.questState);
          
          // Сохраняем новое состояние квеста в локальном хранилище
          setQuestProgress(result.questState);
          
          // Обновляем маркеры в соответствии с новым состоянием
          updateMarkersBasedOnProgress(result.questState);
        }
        
        // Если есть sceneId, переходим к визуальному роману
        if (result.sceneId) {
          // Если есть sceneId, не нужно устанавливать sceneKey,
          // так как он будет получен при загрузке VisualNovel 
          // на основе результата запроса getCurrentScene
          setGameView('novel');
        }
      }
    } catch (err) {
      console.error('Error scanning QR code:', err);
      setError(`Error scanning QR code: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Обновление маркеров на основе прогресса квеста
  const updateMarkersBasedOnProgress = (questState?: string) => {
    const state = questState || questProgress;
    if (!state) return;
    
    // Получаем первое сообщение с квестом доставки
    const deliveryQuest = messages.find(msg => msg.id === '1');
    
    if (deliveryQuest && deliveryQuest.mapPoints) {
      // Создаем маркеры на основе точек квеста и прогресса
      const markers: QuestMarker[] = [];
      
      // Логика показа маркеров в зависимости от состояния
      switch (state) {
        case 'DELIVERY_STARTED':
          // Показываем только торговца
          {
            const traderPoint = deliveryQuest.mapPoints.find(point => point.title === 'Торговец');
            if (traderPoint) {
              markers.push({
                id: 'marker_0',
                title: traderPoint.title,
                lat: traderPoint.lat,
                lng: traderPoint.lng,
                isActive: true,
                isCompleted: false,
                qrCode: traderPoint.qrCode,
                ...(traderPoint.isArea && { markerType: MarkerType.QUEST_AREA as any, radius: traderPoint.radius })
              });
            }
          }
          break;
        
        case 'PARTS_COLLECTED':
          // Показываем только мастерскую
          {
            const craftsmanPoint = deliveryQuest.mapPoints.find(point => point.title === 'Мастерская Дитера');
            if (craftsmanPoint) {
              markers.push({
                id: 'marker_1',
                title: craftsmanPoint.title,
                lat: craftsmanPoint.lat,
                lng: craftsmanPoint.lng,
                isActive: true,
                isCompleted: false,
                qrCode: craftsmanPoint.qrCode,
                ...(craftsmanPoint.isArea && { markerType: MarkerType.QUEST_AREA as any, radius: craftsmanPoint.radius })
              });
            }
          }
          break;
        
        case 'ARTIFACT_HUNT':
          // Показываем только аномальную зону
          {
            const anomalyPoint = deliveryQuest.mapPoints.find(point => point.title === 'Аномальная зона');
            if (anomalyPoint) {
              markers.push({
                id: 'marker_2',
                title: anomalyPoint.title,
                lat: anomalyPoint.lat,
                lng: anomalyPoint.lng,
                isActive: true,
                isCompleted: false,
                qrCode: anomalyPoint.qrCode,
                ...(anomalyPoint.isArea && { markerType: MarkerType.QUEST_AREA as any, radius: anomalyPoint.radius })
              });
            }
          }
          break;
        
        case 'ARTIFACT_FOUND':
        case 'QUEST_COMPLETION':
        case 'FREE_ROAM':
          // Показываем все точки как завершенные
          deliveryQuest.mapPoints.forEach((point, index) => {
            markers.push({
              id: `marker_${index}`,
              title: point.title,
              lat: point.lat,
              lng: point.lng,
              isActive: false,
              isCompleted: true,
              qrCode: point.qrCode,
              ...(point.isArea && { markerType: MarkerType.QUEST_AREA as any, radius: point.radius })
            });
          });
          break;
      }
      
      setQuestMarkers(markers);
      console.log('Маркеры обновлены на основе прогресса:', state, markers);
    }
  };
  
  // Function to mark message as read
  const markMessageAsRead = (messageId: string) => {
    setMessages(messages.map(msg => 
      msg.id === messageId ? {...msg, read: true} : msg
    ));
  };
  
  // Handle message click
  const handleMessageClick = (message: Message) => {
    setActiveMessage(message);
    markMessageAsRead(message.id);
  };
  
  // Handle open map for message with locations
  const handleOpenMap = () => {
    if (activeMessage?.mapPoints) {
      setGameView('map');
    }
    
    // Если есть активное сообщение, отмечаем его как прочитанное
    if (activeMessage) {
      markMessageAsRead(activeMessage.id);
    }
  };
  
  // Handle open visual novel for message
  const handleOpenNovel = () => {
    if (activeMessage?.sceneKey && playerId) {
      setSceneKey(activeMessage.sceneKey);
      setGameView('novel');
    } else {
      // Если нет сцены, просто помечаем как прочитанное
      if (activeMessage) {
        markMessageAsRead(activeMessage.id);
      }
      // Возвращаемся к списку сообщений
      setActiveMessage(null);
    }
  };
  
  // Переключение вкладок
  const handleTabChange = (tab: DialogTab) => {
    setActiveTab(tab);
  };
  
  // Тестовый обработчик для кнопок QR-кодов
  const handleTestQRButton = async (marker: MapQuestMarker | string): Promise<void> => {
    // Если передан объект маркера, используем его QR-код
    if (typeof marker === 'object' && marker.qrCode) {
      await handleQRCodeScan(marker.qrCode);
    } 
    // Если передана строка, используем ее как QR-код
    else if (typeof marker === 'string') {
      await handleQRCodeScan(marker);
    }
  };
  
  // Show loading state
  if (loading) {
    return (
      <div className="game-screen-loading">
        <div className="loading-spinner"></div>
        <p>Загрузка игры...</p>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div className="game-screen-error">
        <p>{error}</p>
        <button onClick={onExit}>Вернуться к карте</button>
      </div>
    );
  }
  
  // Show visual novel if active
  if (gameView === 'novel' && sceneKey && playerId) {
    return (
      <VisualNovel
        initialSceneId={sceneKey}
        playerId={playerId}
        onExit={() => {
          setGameView('map');
          
          // Обновляем маркеры на основе прогресса
          updateMarkersBasedOnProgress();
          
          // Обновляем список прочитанных сообщений
          if (activeMessage) {
            markMessageAsRead(activeMessage.id);
            setActiveMessage(null);
          }
        }}
      />
    );
  }
  
  // Автоматический переход к карте, если нет активной сцены визуального романа
  if (gameView === 'novel') {
    setGameView('map');
    return null;
  }
  
  // Show map view if active
  if (gameView === 'map') {
    return (
      <div className="quest-map-wrapper">
        <div className="quest-map-header">
          <h2>Карта заданий</h2>
          <button 
            className="back-to-messages"
            onClick={() => setGameView('messages')}
          >
            Вернуться к сообщениям
          </button>
        </div>
        
        <QuestMap 
          markers={questMarkers.map(marker => ({
            ...marker,
            // Явно преобразуем строковое представление типа маркера в enum MarkerType
            markerType: marker.markerType === MarkerType.QUEST_AREA 
              ? MarkerType.QUEST_AREA 
              : MarkerType.QUEST_POINT,
            isActive: marker.isActive || false,
            isCompleted: marker.isCompleted || false
          } as MapQuestMarker))}
          onMarkerClick={handleTestQRButton}
        />
        
        <div className="quest-map-markers">
          <h3>Точки заданий:</h3>
          <div className="markers-list">
            {questMarkers.map(marker => (
              <div 
                key={marker.id} 
                className={`marker-item ${marker.isActive ? 'active' : ''} ${marker.isCompleted ? 'completed' : ''}`}
              >
                <div className="marker-title">{marker.title}</div>
                <div className="marker-coords">
                  Координаты: {marker.lat.toFixed(6)}, {marker.lng.toFixed(6)}
                </div>
                {marker.qrCode && marker.isActive && !marker.isCompleted && (
                  <button 
                    className="test-qr-button"
                    onClick={() => handleTestQRButton(marker)}
                  >
                    Тест QR-кода: {marker.qrCode}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <button className="exit-map" onClick={onExit}>
          Вернуться к главной карте
        </button>
      </div>
    );
  }
  
  // Filter messages based on active tab
  const newMessages = messages.filter(msg => !msg.read);
  const archiveMessages = messages.filter(msg => msg.read);
  const currentMessages = activeTab === 'new' ? newMessages : archiveMessages;
  
  // Show message details if a message is selected
  if (activeMessage) {
    return (
      <div className="message-details">
        <div className="message-header">
          <h2>{activeMessage.title}</h2>
          <div className="message-meta">
            <span>От: {activeMessage.sender}</span>
            <span>Дата: {activeMessage.date}</span>
          </div>
        </div>
        
        <div className="message-content">
          <p>{activeMessage.content}</p>
        </div>
        
        <div className="message-actions">
          {activeMessage.mapPoints && (
            <button 
              className="action-button map"
              onClick={handleOpenMap}
            >
              Посмотреть на карте
            </button>
          )}
          {/* Показываем кнопку "Начать задание" только для новых сообщений */}
          {activeMessage.sceneKey && !activeMessage.read && (
            <button 
              className="action-button primary"
              onClick={handleOpenNovel}
            >
              Начать задание
            </button>
          )}
          <button 
            className="action-button secondary"
            onClick={() => setActiveMessage(null)}
          >
            Назад к списку
          </button>
        </div>
      </div>
    );
  }
  
  // Show message list
  return (
    <div className="dialog-screen">
      <div className="dialog-header">
        <h2>Коммуникатор</h2>
        <div className="dialog-tabs">
          <button 
            className={`dialog-tab ${activeTab === 'new' ? 'active' : ''}`}
            onClick={() => handleTabChange('new')}
          >
            Новые сообщения
            {newMessages.length > 0 && (
              <span className="messages-count">{newMessages.length}</span>
            )}
          </button>
          <button 
            className={`dialog-tab ${activeTab === 'archive' ? 'active' : ''}`}
            onClick={() => handleTabChange('archive')}
          >
            Архив
          </button>
        </div>
      </div>
      
      <div className="dialog-content">
        {currentMessages.length > 0 ? (
          <div className="message-list">
            {currentMessages.map(message => (
              <div 
                key={message.id}
                className={`message-item ${!message.read ? 'unread' : ''}`}
                onClick={() => handleMessageClick(message)}
              >
                <div className="message-title">{message.title}</div>
                <div className="message-info">
                  <span className="message-sender">{message.sender}</span>
                  <span className="message-date">{message.date}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-messages">
            <p>
              {activeTab === 'new' 
                ? 'У вас нет новых сообщений' 
                : 'Архив сообщений пуст'}
            </p>
          </div>
        )}
      </div>
      
      <div className="dialog-footer">
        <button className="exit-dialog" onClick={onExit}>
          Вернуться к карте
        </button>
      </div>
    </div>
  );
};