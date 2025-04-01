// src/components/SignOutButton/Dialog/GameScreen.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { useUnit } from 'effector-react';
import { $currentUser } from '../../../entities/user/model';
import { VisualNovel } from '../../../pages/visualNovel/VisualNovel';
import { QuestMap } from '../Map/QuestMap';
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
  }[];
}

// QR-коды для тестирования
const QR_CODES = {
  TRADER: 'grenz_npc_trader_01',
  CRAFTSMAN: 'grenz_npc_craftsman_01',
  ARTIFACT: 'grenz_item_artifact_01'
};

interface QuestMarker {
  id: string;
  title: string;
  lat: number;
  lng: number;
  isActive: boolean;
  isCompleted: boolean;
  qrCode?: string;
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
          lat: 51.5074,
          lng: -0.1278,
          qrCode: QR_CODES.TRADER
        },
        {
          title: 'Мастерская Дитера',
          lat: 51.5074,
          lng: -0.1378,
          qrCode: QR_CODES.CRAFTSMAN
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
        
        if (playerQuestState === 'DELIVERY_STARTED' && isTrader) {
          isActive = true;
        } else if (playerQuestState === 'PARTS_COLLECTED' && isCraftsman) {
          isActive = true;
          // Если это состояние PARTS_COLLECTED, то торговец (первая точка) уже посещен
          isCompleted = isTrader;
        } else if (playerQuestState === 'QUEST_COMPLETION') {
          isCompleted = true;
        }
        
        return {
          id: `marker_${index}`,
          title: point.title,
          lat: point.lat,
          lng: point.lng,
          // Если игрок в начальном состоянии, показываем все точки как активные
          isActive: isActive || playerQuestState === 'REGISTERED',
          isCompleted,
          qrCode: point.qrCode
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
        setQuestProgress('QUEST_STARTED');
        
        // Переключаемся на карту после прочтения сообщения
        setGameView('map');
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
      
      console.log(`Обработка QR-кода: ${qrCode}`);
      
      // Проверяем, соответствует ли код одной из точек квеста
      const matchingMarker = questMarkers.find(marker => marker.qrCode === qrCode);
      
      if (matchingMarker) {
        // Активируем квест через серверный API
        const result = await activateQuestByQR({
          playerId,
          qrCode
        });
        
        console.log('Результат активации QR-кода:', result);
        
        // Если есть sceneId, запускаем визуальную новеллу
        if (result.sceneId) {
          // Обновляем прогресс квеста в зависимости от типа QR-кода
          if (qrCode === QR_CODES.TRADER) {
            setQuestProgress('TRADER_MET');
          } else if (qrCode === QR_CODES.CRAFTSMAN) {
            setQuestProgress('CRAFTSMAN_MET');
          }
          
          // Обновляем маркеры
          updateMarkersBasedOnProgress();
          
          // Переходим к визуальной новелле
          setSceneKey(result.sceneId);
          setGameView('novel');
        } else {
          alert(result.message);
        }
      } else {
        // Отображаем сообщение, если QR-код не соответствует ни одной из точек
        alert(`QR-код "${qrCode}" не распознан или не соответствует текущему заданию.`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(`Ошибка при обработке QR-кода: ${errorMessage}`);
      alert(`Ошибка: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Обновление маркеров на основе прогресса квеста
  const updateMarkersBasedOnProgress = () => {
    if (!questProgress) return;
    
    const updatedMarkers = questMarkers.map(marker => {
      let isActive = marker.isActive;
      let isCompleted = marker.isCompleted;
      
      if (questProgress === 'TRADER_MET' && marker.qrCode === QR_CODES.TRADER) {
        isCompleted = true;
        // Активируем следующую точку
        if (marker.qrCode === QR_CODES.TRADER) {
          const craftsman = questMarkers.find(m => m.qrCode === QR_CODES.CRAFTSMAN);
          if (craftsman) {
            isActive = false;
          }
        }
      } else if (questProgress === 'CRAFTSMAN_MET' && marker.qrCode === QR_CODES.CRAFTSMAN) {
        isCompleted = true;
      }
      
      return {
        ...marker,
        isActive,
        isCompleted
      };
    });
    
    setQuestMarkers(updatedMarkers);
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
  const handleTestQRButton = (marker: QuestMarker | string) => {
    // Если передан объект маркера, используем его QR-код
    if (typeof marker === 'object' && marker.qrCode) {
      handleQRCodeScan(marker.qrCode);
    } 
    // Если передана строка, используем ее как QR-код
    else if (typeof marker === 'string') {
      handleQRCodeScan(marker);
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
          markers={questMarkers}
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
                  Координаты: {marker.lat.toFixed(4)}, {marker.lng.toFixed(4)}
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