import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { QuestMap, QuestMarker } from '../Map/QuestMap';
import { VisualNovel } from '../../../pages/visualNovel/VisualNovel';
import './GameScreen.css';

// Temporary interfaces for typing
interface Message {
  id: string;
  title: string;
  sender: string;
  date: string;
  read: boolean;
  content: string;
  sceneKey?: string;
}

interface PlayerData {
  _id: string;
  name: string;
  locationHistory: any[];
  equipment: Record<string, any>;
}

interface DialogScreenProps {
  newMessages: Message[];
  archiveMessages: Message[];
  onExitClick: () => void;
  onOpenMap: () => void;
  onOpenNovel: (message: Message) => void;
  markMessageAsRead: (id: string) => void;
}

// DialogScreen component will be implemented later
const DialogScreen: React.FC<DialogScreenProps> = (props) => (
  <div className="dialog-screen">
    <h2>Messages</h2>
    <p>Dialog component in development</p>
    <button onClick={props.onOpenMap}>Go to Map</button>
    <button onClick={props.onExitClick}>Return</button>
  </div>
);

export enum QuestState {
  REGISTERED = 'registered',
  CHARACTER_CREATION = 'character_creation',
  TRAINING = 'training',
  DELIVERY_STARTED = 'delivery_started',
  PARTS_COLLECTED = 'parts_collected',
  ARTIFACT_HUNT = 'artifact_hunt',
  ARTIFACT_FOUND = 'artifact_found',
  QUEST_COMPLETION = 'quest_completion',
  FREE_ROAM = 'free_roam'
}

interface GameScreenProps {
  onExit: () => void;
  initialView?: GameView;
}

export enum GameView {
  MESSAGES = 'messages',
  MAP = 'map',
  NOVEL = 'novel'
}

export const GameScreen: React.FC<GameScreenProps> = ({ onExit, initialView }) => {
  // Component state
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [playerLoading, setPlayerLoading] = useState(true);
  const [playerError, setPlayerError] = useState<string | null>(null);
  
  const [questState, setQuestState] = useState<QuestState>(QuestState.REGISTERED);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessages, setNewMessages] = useState<Message[]>([]);
  const [archiveMessages, setArchiveMessages] = useState<Message[]>([]);
  const [activeMessage, setActiveMessage] = useState<Message | null>(null);
  
  const [gameView, setGameView] = useState<GameView>(initialView || GameView.MESSAGES);
  const [sceneKey, setSceneKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get API mutations
  const activateQuestByQR = useMutation(api.quest.activateQuestByQR);
  const startDeliveryQuest = useMutation(api.quest.startDeliveryQuest);
  const getOrCreatePlayer = useMutation(api.player.getOrCreatePlayer);
  
  // Initialize data
  useEffect(() => {
    const initData = async () => {
      try {
        setPlayerLoading(true);
        // In a real app, this would load data from the server
        
        // Проверяем, есть ли сохраненный пользователь
        const savedUser = localStorage.getItem('currentUser');
        let userId = null;
        
        if (savedUser) {
          const user = JSON.parse(savedUser);
          userId = user.id;
          
          // Получаем или создаем игрока в Convex
          const playerData = await getOrCreatePlayer({ userId: userId as any });
          if (playerData) {
            // Используем возвращенного игрока вместо тестовых данных
            setPlayer({
              _id: playerData._id,
              name: playerData.nickname || 'Player',
              equipment: playerData.equipment || {},
              locationHistory: playerData.locationHistory || []
            });
          } else {
            // Если не получилось получить игрока, используем тестовые данные
            setPlayer({
              _id: 'player123',
              name: 'Test Player',
              equipment: {},
              locationHistory: []
            });
          }
        } else {
          // Если пользователь не найден, используем тестовые данные
          setPlayer({
            _id: 'player123',
            name: 'Test Player',
            equipment: {},
            locationHistory: []
          });
        }
        
        // Sample messages
        const sampleMessages = [
          {
            id: 'msg1',
            title: 'New Quest',
            sender: 'Coordinator',
            date: new Date().toLocaleDateString(),
            read: false,
            content: 'I have an important task for you. Meet me at point A.'
          }
        ];
        
        setMessages(sampleMessages);
        setNewMessages(sampleMessages.filter(m => !m.read));
        setArchiveMessages(sampleMessages.filter(m => m.read));
        
        // Set initial quest state
        setQuestState(QuestState.REGISTERED);
        setHasNewMessage(true);
        
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
  
  // Mark message as read
  const markMessageAsRead = useCallback((messageId: string) => {
    setMessages(prevMessages => 
      prevMessages.map(msg => 
        msg.id === messageId ? { ...msg, read: true } : msg
      )
    );
    
    // Update new and archived message lists
    setNewMessages(prevMessages => prevMessages.filter(msg => msg.id !== messageId));
    setArchiveMessages(prevMessages => [
      ...prevMessages,
      ...messages.filter(msg => msg.id === messageId && !msg.read)
    ]);
    
    // Check if there are any unread messages left
    const hasUnread = messages.some(msg => msg.id !== messageId && !msg.read);
    setHasNewMessage(hasUnread);
  }, [messages]);
  
  // Complete quest step
  const completeQuestStep = useCallback((stepId: string) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps(prev => [...prev, stepId]);
    }
  }, [completedSteps]);
  
  // Update quest state
  const updateQuestState = useCallback((newState: QuestState) => {
    setQuestState(newState);
  }, []);
  
  // Memoized quest markers
  const questMarkers = useMemo(() => {
    // In a real app, this would generate markers based on quest state
    // Sample implementation:
    return [
      {
        id: 'marker1',
        title: 'Starting Point',
        description: 'This is where your adventure begins',
        lat: 47.99443, 
        lng: 7.84638,
        isActive: true,
        isCompleted: false,
        qrCode: 'START_QUEST_2023'
      }
    ];
  }, [questState]);
  
  // Handle marker click
  const handleMarkerClick = useCallback(async (marker: QuestMarker) => {
    if (!player || !marker.qrCode) return;
    
    try {
      setLoading(true);
      
      // Проверяем, имеет ли player._id валидный ID Convex 
      if (!player._id || player._id === 'player123') {
        throw new Error("Invalid player ID. Please restart the game to create a valid player.");
      }
      
      const result = await activateQuestByQR({
        playerId: player._id as any,
        qrCode: marker.qrCode
      });
      
      if (result.message) {
        alert(result.message);
        
        // If there's a scene, go to dialog
        if (result.sceneId) {
          setSceneKey(result.sceneId);
          setGameView(GameView.NOVEL);
          
          // Mark step as completed
          completeQuestStep(marker.id);
        }
        
        // Update quest state if it changed
        if (result.questState && typeof result.questState === 'string') {
          updateQuestState(result.questState as QuestState);
        }
      }
    } catch (err) {
      console.error('Error activating QR code:', err);
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [player, activateQuestByQR, completeQuestStep, updateQuestState, questState]);
  
  // Handle quest start
  const handleStartDeliveryQuest = useCallback(async () => {
    if (!player) return;
    
    try {
      setLoading(true);
      
      // Проверяем, имеет ли player._id валидный ID Convex
      if (!player._id || player._id === 'player123') {
        throw new Error("Invalid player ID. Please restart the game to create a valid player.");
      }
      
      const result = await startDeliveryQuest({ 
        playerId: player._id as any
      });
      
      if (result && result.sceneId) {
        // Update quest state
        updateQuestState(QuestState.DELIVERY_STARTED);
        
        // Mark quest step as completed
        completeQuestStep('start_delivery');
        
        // Switch to map after reading message
        setGameView(GameView.MAP);
        
        // Reset new message flag
        setHasNewMessage(false);
      }
    } catch (err) {
      setError(`Error starting quest: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [player, startDeliveryQuest, updateQuestState, completeQuestStep]);
  
  // View handlers
  const handleOpenNovel = useCallback((message: Message) => {
    if (message.sceneKey) {
      setSceneKey(message.sceneKey);
      setGameView(GameView.NOVEL);
      
      // Mark message as read
      markMessageAsRead(message.id);
    }
  }, [markMessageAsRead]);
  
  const handleNovelExit = useCallback(() => {
    setGameView(GameView.MAP);
    
    // Reset active message
    setActiveMessage(null);
    
    // Reset new message flag
    setHasNewMessage(false);
  }, []);
  
  const handleOpenMap = useCallback(() => {
    setGameView(GameView.MAP);
    
    // If there's an active message, mark it as read
    if (activeMessage) {
      markMessageAsRead(activeMessage.id);
    }
  }, [activeMessage, markMessageAsRead]);
  
  // Switch to messages view
  const handleOpenMessages = useCallback(() => {
    setGameView(GameView.MESSAGES);
  }, []);
  
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
  
  // Show map
  if (gameView === GameView.MAP) {
    return (
      <div className="quest-map-fullscreen">
        <div className="quest-map-header">
          <h2>Quest Map</h2>
          <button 
            className="messages-button" 
            onClick={handleOpenMessages}
          >
            Messages
            {hasNewMessage && <span className="notification-badge">!</span>}
          </button>
        </div>
        
        {/* Loading indicator for operations */}
        {loading && (
          <div className="operation-loading">
            <div className="loading-spinner-small"></div>
          </div>
        )}
        
        <QuestMap 
          markers={questMarkers}
          onMarkerClick={handleMarkerClick}
          followPlayer={true}
        />
        
        {/* Game navigation */}
        <div className="game-nav-buttons">
          <button 
            className="exit-btn" 
            onClick={onExit}
          >
            Exit
          </button>
        </div>
      </div>
    );
  }
  
  // Default to messages view
  return (
    <DialogScreen 
      newMessages={newMessages}
      archiveMessages={archiveMessages}
      onExitClick={onExit}
      onOpenMap={handleOpenMap}
      onOpenNovel={handleOpenNovel}
      markMessageAsRead={markMessageAsRead}
    />
  );
};