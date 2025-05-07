import React, { useState, useCallback } from 'react';
import { QuestMap } from '../../widgets/questMap/QuestMap';
import { VisualNovelPage } from '../../pages/VisualNovelPage/VisualNovelPage';
import { Messages } from '../../widgets/messages/Messages';
import { useMessagesReducer } from '../../hooks/useMessages';
import { updateMarkersByQuestState, QR_CODES } from '../../entities/markers/model';
import { QuestStateEnum } from '../../shared/constants/quest';
import { GameView, GameScreenProps, QuestMarker } from './model/types';
import { usePlayer } from '../../features/player/api/usePlayer';
import { useQuestActions } from '../../features/quest/api/useQuestActions';
import { GameHeader } from './ui/GameHeader';
import { GameNavButtons } from './ui/GameNavButtons';
import { LoadingIndicator } from './ui/LoadingIndicator';
import { ErrorDisplay } from './ui/ErrorDisplay';
import './GameScreen.css';

export const GameScreen: React.FC<GameScreenProps> = ({ 
  onExit, 
  initialView, 
  onViewChange 
}) => {
  // Состояние игры и квеста
  const [questState, setQuestState] = useState<QuestStateEnum>(QuestStateEnum.REGISTERED);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [gameView, setGameView] = useState<GameView>(initialView || GameView.MAP);
  const [sceneKey, setSceneKey] = useState<string | null>(null);
  
  // Данные игрока
  const { player, loading: playerLoading, error: playerError } = usePlayer();
  
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
  React.useEffect(() => {
    updateMarkersByQuestState(questState);
  }, [questState]);
  
  // Уведомляем родительский компонент при изменении представления
  React.useEffect(() => {
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
  const handleMarkerClick = useCallback(async (marker: QuestMarker) => {
    if (!marker.qrCode) return;
    await handleQRScanSuccess(marker.qrCode);
  }, [handleQRScanSuccess]);
  
  // Показываем загрузку
  if (playerLoading) {
    return <LoadingIndicator fullScreen message="Loading game..." />;
  }
  
  // Показываем ошибку
  if (playerError || questError) {
    return <ErrorDisplay message={playerError || questError} onRetry={onExit} />;
  }
  
  // Показываем визуальную новеллу
  if (gameView === GameView.NOVEL && sceneKey && player) {
    return (
      <VisualNovelPage
        initialSceneId={sceneKey}
        playerId={player._id}
        initialQuestState={questState}
        initialPlayerStats={player.stats}
        onExit={handleNovelExit}
      />
    );
  }
  
  // Показываем сообщения
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
  
  // Показываем карту
  return (
    <div className="game-screen">
      {gameView === GameView.MAP && (
        <div className="quest-map-wrapper">
          <GameHeader 
            onOpenMessages={handleOpenMessages}
            hasUnreadMessages={hasUnreadMessages}
          />
          
          <div className="map-container">
            <QuestMap 
              onMarkerClick={handleMarkerClick}
              followPlayer={true}
            />
          </div>
          
          {questLoading && <LoadingIndicator message="Загрузка..." />}
          
          <GameNavButtons 
            questState={questState}
            onStartQuest={handleStartDeliveryQuest}
            onQRScanTest={handleQRScanSuccess}
            onExit={onExit}
            qrCodes={QR_CODES}
          />
        </div>
      )}
    </div>
  );
};