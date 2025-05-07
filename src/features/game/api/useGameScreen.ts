import { useState, useCallback, useEffect } from 'react';
import { QuestStateEnum } from '../../../shared/constants/quest';
import { GameView } from '../../../shared/types/gameScreen';
import { usePlayer } from '../../player/api/usePlayer';
import { useQuestActions } from '../../quest/api/useQuestActions';
import { useMessagesReducer, Message } from '../../messages/api/useMessages';
import { useMarkers } from '../../markers/api';

interface GameScreenResult {
  // Состояние
  questState: QuestStateEnum;
  completedSteps: string[];
  gameView: GameView;
  sceneKey: string | null;
  player: any;
  
  // Сообщения
  newMessages: Message[];
  archiveMessages: Message[];
  hasUnreadMessages: boolean;
  markMessageAsRead: (id: string) => void;
  
  // Загрузка и ошибки
  playerLoading: boolean;
  playerError: string | null;
  questLoading: boolean;
  questError: string | null;
  
  // Обработчики
  handleOpenMap: () => void;
  handleOpenMessages: () => void;
  handleNovelExit: () => void;
  handleMarkerClick: (marker: any) => Promise<void>;
  handleStartDeliveryQuest: () => Promise<void>;
  handleQRScanSuccess: (code: string) => Promise<void>;
  
  // Утилиты
  completeQuestStep: (stepId: string) => void;
  openScene: (sceneId: string) => void;
}

export function useGameScreen(initialView?: GameView, onViewChange?: (view: GameView) => void): GameScreenResult {
  // Состояние игры и квеста
  const [questState, setQuestState] = useState<QuestStateEnum>(QuestStateEnum.REGISTERED);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [gameView, setGameView] = useState<GameView>(initialView || GameView.MAP);
  const [sceneKey, setSceneKey] = useState<string | null>(null);
  
  // Данные игрока
  const { player, loading: playerLoading, error: playerError } = usePlayer();
  
  // Маркеры
  const { updateMarkersByQuest } = useMarkers();
  
  // Сообщения
  const { 
    newMessages, 
    archiveMessages, 
    hasUnreadMessages, 
    markMessageAsRead
  } = useMessagesReducer(player?._id);
  
  // Квестовые действия
  const { 
    loading: questLoading, 
    error: questError,
    handleQRScanSuccess, 
    handleStartDeliveryQuest 
  } = useQuestActions(
    player,
    setQuestState,
    completeQuestStep,
    openScene
  );
  
  // Обновляем маркеры при изменении состояния квеста
  useEffect(() => {
    updateMarkersByQuest(questState);
  }, [questState, updateMarkersByQuest]);
  
  // Уведомляем родительский компонент при изменении представления
  useEffect(() => {
    if (onViewChange) {
      onViewChange(gameView);
    }
  }, [gameView, onViewChange]);
  
  // Обработчики вью
  const handleOpenMap = useCallback(() => {
    setGameView(GameView.MAP);
  }, []);
  
  const handleOpenMessages = useCallback(() => {
    setGameView(GameView.MESSAGES);
  }, []);
  
  const handleNovelExit = useCallback(() => {
    setGameView(GameView.MAP);
    setSceneKey(null);
  }, []);
  
  // Вспомогательные функции
  function completeQuestStep(stepId: string) {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps(prev => [...prev, stepId]);
    }
  }
  
  function openScene(sceneId: string) {
    setSceneKey(sceneId);
    setGameView(GameView.NOVEL);
  }
  
  // Обработка клика по маркеру на карте
  const handleMarkerClick = useCallback(async (marker: any) => {
    if (!marker.qrCode) return;
    await handleQRScanSuccess(marker.qrCode);
  }, [handleQRScanSuccess]);
  
  return {
    // Состояние
    questState,
    completedSteps,
    gameView,
    sceneKey,
    player,
    
    // Сообщения
    newMessages,
    archiveMessages,
    hasUnreadMessages,
    markMessageAsRead,
    
    // Загрузка и ошибки
    playerLoading,
    playerError,
    questLoading,
    questError,
    
    // Обработчики
    handleOpenMap,
    handleOpenMessages,
    handleNovelExit,
    handleMarkerClick,
    handleStartDeliveryQuest,
    handleQRScanSuccess,
    
    // Утилиты
    completeQuestStep,
    openScene
  };
} 