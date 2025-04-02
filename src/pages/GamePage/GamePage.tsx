import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { QRScanner } from '../../components/SignOutButton/QR/QRScanner';
import { GameScreen } from '../../components/SignOutButton/Dialog/GameScreen';
import { QuestMap, MarkerType, NpcClass, Faction, QuestMarker } from '../../components/SignOutButton/Map/QuestMap';
import { SignOutButton } from '../../components/SignOutButton/SignOutButton';
import { useUnit } from 'effector-react';
import { $currentUser } from '../../entities/user/model';
import { useLocation } from '../../hooks/useLocatiom';
import './GamePage.css';

export const GamePage: React.FC = () => {
  const user = useUnit($currentUser);
  const navigate = useNavigate();
  const { position } = useLocation();
  const [activeScreen, setActiveScreen] = useState<'map' | 'dialog' | 'scanner'>('map');
  
  // Состояния для загрузки данных и ошибок
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get player profile
  const getOrCreatePlayer = useMutation(api.player.getOrCreatePlayer);
  const activateQuestByQR = useMutation(api.quest.activateQuestByQR);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [playerQuestState, setPlayerQuestState] = useState<string | null>(null);
  
  // Маркеры квестов с указанием типов
  const [questMarkers, setQuestMarkers] = useState<QuestMarker[]>([]);
  
  // Получаем текущую сцену для определения наличия нового сообщения
  const getCurrentScene = useQuery(
    api.quest.getCurrentScene, 
    playerId ? { playerId: playerId as any } : "skip"
  );
  
  // Инициализация данных игрока
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    const initializePlayer = async () => {
      try {
        setLoading(true);
        
        // Получаем или создаем профиль игрока
        const player = await getOrCreatePlayer({ userId: user.id as any });
        if (player) {
          setPlayerId(player._id);
          setPlayerQuestState(player.questState);
          
          // Проверяем наличие новых сообщений
          if (player.questState === 'NEW_MESSAGE' || player.questState === 'REGISTERED') {
            setHasNewMessage(true);
          }
        }
      } catch (error) {
        console.error('Error getting player profile:', error);
        setError(error instanceof Error ? error.message : 'Неизвестная ошибка при загрузке профиля');
      } finally {
        setLoading(false);
      }
    };
    
    initializePlayer();
  }, [user, navigate, getOrCreatePlayer]);
  
  // Обновляем маркеры квестов при изменении состояния игрока
  useEffect(() => {
    if (playerId && playerQuestState) {
      loadQuestMarkers(playerQuestState);
    }
  }, [playerId, playerQuestState]);
  
  // Используем useMemo для оптимизации рендеринга маркеров
  const memoizedMarkers = useMemo(() => questMarkers, [questMarkers]);
  
  // Загрузка маркеров квестов
  const loadQuestMarkers = (questState: string) => {
    try {
      // В реальном приложении здесь должен быть запрос к API для получения маркеров
      // В данной реализации используем фиктивные данные в зависимости от состояния игрока
      
      const markers: QuestMarker[] = [
        {
          id: 'trader',
          title: 'Торговец',
          description: 'Здесь можно найти торговца с запчастями',
          markerType: MarkerType.NPC,
          npcClass: NpcClass.TRADER,
          faction: Faction.TRADERS,
          lat: 59.9391,
          lng: 30.3156,
          isActive: questState === 'DELIVERY_STARTED',
          isCompleted: questState === 'PARTS_COLLECTED' || questState === 'QUEST_COMPLETION' || questState === 'FREE_ROAM',
          qrCode: 'grenz_npc_trader_01'
        },
        {
          id: 'craftsman',
          title: 'Мастерская Дитера',
          description: 'Центральная мастерская города',
          markerType: MarkerType.NPC,
          npcClass: NpcClass.CRAFTSMAN,
          faction: Faction.CRAFTSMEN,
          lat: 59.9391,
          lng: 30.2956,
          isActive: questState === 'PARTS_COLLECTED',
          isCompleted: questState === 'QUEST_COMPLETION' || questState === 'FREE_ROAM',
          qrCode: 'grenz_npc_craftsman_01'
        },
        {
          id: 'artifact_area',
          title: 'Аномальная зона',
          description: 'В этом районе можно найти ценные артефакты',
          markerType: MarkerType.QUEST_AREA,
          lat: 59.9371, 
          lng: 30.3056,
          radius: 100, // радиус области в метрах
          isActive: questState === 'ARTIFACT_HUNT',
          isCompleted: questState === 'ARTIFACT_FOUND' || questState === 'QUEST_COMPLETION' || questState === 'FREE_ROAM',
          qrCode: 'grenz_area_artifact_01'
        }
      ];
      
      setQuestMarkers(markers);
    } catch (error) {
      console.error('Error loading quest markers:', error);
      setError('Ошибка при загрузке маркеров квестов');
    }
  };
  
  // Обработка клика по маркеру
  const handleMarkerClick = async (marker: QuestMarker) => {
    if (!playerId || !marker.qrCode) return;
    
    try {
      setLoading(true);
      
      const result = await activateQuestByQR({
        playerId: playerId as any,
        qrCode: marker.qrCode
      });
      
      if (result && result.message) {
        alert(result.message);
        
        // Если есть сцена, переходим к диалогу
        if (result.sceneId) {
          setActiveScreen('dialog');
        }
        
        // Обновляем состояние квеста, если оно изменилось
        if (result.questState && result.questState !== playerQuestState) {
          setPlayerQuestState(result.questState);
        }
      }
    } catch (error) {
      console.error('Error activating QR code:', error);
      alert(`Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Check for new messages when player is loaded
  useEffect(() => {
    if (getCurrentScene) {
      setHasNewMessage(true);
    }
  }, [getCurrentScene]);
  
  // Handle scanner success
  const handleScannerSuccess = async (code: string) => {
    if (!playerId) return;
    
    try {
      setLoading(true);
      
      const result = await activateQuestByQR({
        playerId: playerId as any,
        qrCode: code
      });
      
      if (result && result.message) {
        alert(result.message);
        
        if (result.sceneId) {
          setActiveScreen('dialog');
        }
        
        // Обновляем состояние квеста, если оно изменилось
        if (result.questState && result.questState !== playerQuestState) {
          setPlayerQuestState(result.questState);
        }
      }
    } catch (error) {
      console.error('Error activating QR code:', error);
      alert(`Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle exit to main page
  const handleExit = () => {
    navigate('/');
  };
  
  // Обработка закрытия диалога
  const handleDialogClose = () => {
    setActiveScreen('map');
    setHasNewMessage(false);
  };
  
  // If loading, show loading spinner
  if (loading && !playerId) {
    return (
      <div className="game-loading">
        <div className="loading-spinner"></div>
        <p>Загрузка профиля игрока...</p>
      </div>
    );
  }
  
  // If error occurred, show error message
  if (error) {
    return (
      <div className="game-error">
        <div className="error-icon">❌</div>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Попробовать снова
        </button>
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
      
      {/* Индикатор загрузки для операций */}
      {loading && playerId && (
        <div className="operation-loading">
          <div className="loading-spinner-small"></div>
        </div>
      )}
      
      {/* Active screen */}
      <div className="game-content">
        {activeScreen === 'map' && (
          <QuestMap 
            markers={memoizedMarkers}
            onMarkerClick={handleMarkerClick}
            center={position ? [position[1], position[0]] : undefined}
            followPlayer={true}
          />
        )}
        
        {activeScreen === 'dialog' && (
          <GameScreen 
            onExit={handleDialogClose}
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