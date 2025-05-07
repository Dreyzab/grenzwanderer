import React, { useMemo } from 'react';
import { QuestMap } from '../../widgets/questMap/QuestMap';
import { Messages } from '../../widgets/messages/Messages';
import { VisualNovel } from '../../pages/visualNovel/VisualNovel';
import { GameScreenProps, GameView } from '../../shared/types/gameScreen';
import { QuestStateEnum } from '../../shared/constants/quest';
import { Header } from './Header';
import { LoadingIndicator } from './ui/LoadingIndicator';
import { ErrorDisplay } from './ui/ErrorDisplay';
import { GameNavButtons } from './ui/GameNavButtons';
import { useGameScreen } from '../../features/game/api/useGameScreen';
import { QR_CODES } from '../../shared/types/markers';
import { Message as HookMessage } from '../../hooks/useMessages';
import { Message as ApiMessage } from '../../features/messages/api/useMessages';
import './GameScreen.css';

// Адаптер для преобразования формата сообщений
const adaptMessagesToHookFormat = (messages: ApiMessage[]): HookMessage[] => {
  return messages.map(msg => ({
    id: msg.id,
    title: msg.title,
    content: msg.content,
    sender: msg.sender || 'Система',
    date: new Date(msg.timestamp).toLocaleDateString(),
    read: msg.read,
    // Дополнительные поля можно добавить по необходимости
  }));
};

export const GameScreen: React.FC<GameScreenProps> = ({ 
  onExit, 
  initialView, 
  onViewChange 
}) => {
  const {
    // Состояние
    questState,
    gameView,
    sceneKey,
    player,
    
    // Сообщения
    newMessages: apiNewMessages,
    archiveMessages: apiArchiveMessages,
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
    handleQRScanSuccess
  } = useGameScreen(initialView, onViewChange);
  
  // Адаптируем сообщения к ожидаемому формату
  const newMessages = useMemo(() => 
    adaptMessagesToHookFormat(apiNewMessages), [apiNewMessages]
  );
  
  const archiveMessages = useMemo(() => 
    adaptMessagesToHookFormat(apiArchiveMessages), [apiArchiveMessages]
  );
  
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
      <VisualNovel
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
          <Header 
            onOpenDialog={handleOpenMessages}
            onOpenInventory={() => {}} // TODO: Реализовать открытие инвентаря
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