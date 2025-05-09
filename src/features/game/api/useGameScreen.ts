import { useState, useEffect } from 'react';
import { usePlayer } from '../../../entities/player/api/usePlayer';
import { useQuestActions } from '../../quest/api/useQuestActions';
import { useMessagesReducer } from '../../messages/api/useMessages';
import { useMarkers } from '../../markers/api/useMarkers';
import { QuestSessionState } from '../../../shared/constants/quest';
import { GameView } from '../../../shared/types/game.types';
import type { ExtendedMarkerData } from '../../../entities/markers';

/**
 * Кастомный хук для управления состоянием игрового экрана
 * Центральный оркестратор различных состояний и действий в игре
 */
export function useGameScreen({ 
  initialSceneKey = null,
  onViewChange,
  playerId 
}: {
  initialSceneKey?: string | null;
  onViewChange?: (view: GameView) => void;
  playerId?: string;
}) {
  // Состояние представления (вкладки)
  const [currentView, setCurrentView] = useState<GameView>(GameView.MAP);
  const [sceneKey, setSceneKey] = useState<string | null>(initialSceneKey);
  const [ready, setReady] = useState<boolean>(false);

  // Получаем данные игрока
  const { player, loading: playerLoading } = usePlayer(playerId);

  // Инициализируем хуки для квестов, сообщений и маркеров
  const { 
    scanQRCode, 
    startQuest, 
    questState 
  } = useQuestActions({
    playerId,
    onStateChange: (state) => {
      console.log('Quest state changed:', state);
      // Дополнительная логика при изменении состояния квеста
    },
    onSceneOpen: (sceneId) => {
      setSceneKey(sceneId);
      setCurrentView(GameView.NOVEL);
    },
    onStepComplete: (stepId) => {
      console.log('Step completed:', stepId);
      // Логика при завершении шага
    }
  });

  // Получаем данные о сообщениях
  const { 
    messages, 
    unreadCount, 
    markAsRead, 
    addMessage 
  } = useMessagesReducer(playerId);

  // Получаем данные о маркерах
  const { 
    markers, 
    activeMarkers, 
    addMarkerInteraction,
    updateMarkersByQuest,
    toggleComplete
  } = useMarkers();

  // Эффект для отслеживания готовности всех компонентов
  useEffect(() => {
    if (!playerLoading) {
      setReady(true);
    }
  }, [playerLoading]);

  // Функция смены представления (вкладки)
  const changeView = (view: GameView) => {
    setCurrentView(view);
    if (onViewChange) {
      onViewChange(view);
    }
  };

  // Обработчик сканирования QR
  const handleQRScan = async (code: string) => {
    return await scanQRCode(code);
  };

  // Функция для запуска игры
  const startGame = async () => {
    return await startQuest();
  };

  // Функция для отметки маркера как завершенного
  const toggleMarkerComplete = (markerId: string) => {
    toggleComplete(markerId);
  };

  return {
    currentView,
    changeView,
    sceneKey,
    setSceneKey,
    player,
    ready,
    messages,
    unreadCount,
    markAsRead,
    addMessage,
    markers,
    activeMarkers,
    addMarkerInteraction,
    handleQRScan,
    startGame,
    questState,
    toggleMarkerComplete
  };
} 