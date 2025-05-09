import React from 'react';
import { QuestMap } from '../../widgets/questMap/QuestMap';
import { PlayerMessages } from '../../widgets/playerMessages/PlayerMessages';
import { VisualNovel } from '../../pages/VisualNovelPage/VisualNovel';
import { GameScreenProps, GameView } from '../../shared/types/gameScreen';
import { QuestStateEnum } from '../../shared/constants/quest';
import { Header } from './Header';
import { LoadingIndicator } from './ui/LoadingIndicator';
import { ErrorDisplay } from './ui/ErrorDisplay';
import { GameNavButtons } from './ui/GameNavButtons';
import { useGameScreen } from '../../features/game/api/useGameScreen';
import { QR_CODES } from '../../shared/constants/marker';
import './GameScreen.css';
import { MarkerData } from '../../shared/types/marker.types';
import { PlayerData } from '../../entities/player/api/usePlayer';
import { PlayerStats } from '../../shared/types/visualNovel';

export const GameScreen: React.FC<GameScreenProps> = ({ 
  onExit, 
  initialView, 
  onViewChange,
  playerId
}) => {
  const gameScreenState = useGameScreen({ 
    initialSceneKey: null,
    onViewChange,
    playerId
  });
  
  const {
    currentView,
    sceneKey,
    player,
    questState,
    ready,
    changeView,
    handleQRScan,
    startGame,
    toggleMarkerComplete
  } = gameScreenState;
  
  // Извлекаем дополнительные поля из хука для проверки ошибок
  const playerLoading = (gameScreenState as any).playerLoading || false;
  const playerError = (gameScreenState as any).playerError || null;
  
  // Показываем загрузку
  if (playerLoading || !ready) {
    return <LoadingIndicator fullScreen message="Загрузка игры..." />;
  }
  
  // Показываем ошибку
  if (playerError) {
    return <ErrorDisplay message={playerError} onRetry={onExit} />;
  }
  
  // Показываем визуальную новеллу
  if (currentView === GameView.NOVEL && sceneKey && player) {
    // Преобразуем типы для соответствия ожидаемым в VisualNovel
    const defaultPlayerStats: PlayerStats = {
      energy: 100,
      money: 0,
      attractiveness: 10,
      willpower: 10,
      fitness: 10,
      intelligence: 10,
      corruption: 0
    };
    
    // Объединяем значения по умолчанию с фактическими данными игрока
    const playerStats: PlayerStats = {
      ...defaultPlayerStats,
      ...(player.stats || {})
    };
    
    return (
      <VisualNovel
        initialSceneId={sceneKey}
        playerId={player._id}
        initialQuestState={{}}
        initialPlayerStats={playerStats}
        onExit={() => changeView(GameView.MAP)}
      />
    );
  }
  
  // Показываем сообщения
  if (currentView === GameView.MESSAGES) {
    return (
      <div className="messages-screen">
        <PlayerMessages
          playerId={playerId}
          className="h-full"
        />
        <button 
          className="back-button fixed bottom-4 left-4"
          onClick={() => changeView(GameView.MAP)}
        >
          Назад к карте
        </button>
      </div>
    );
  }
  
  // Обработчик клика по маркеру - адаптер
  const handleMarkerClick = async (marker: MarkerData) => {
    if (marker.id) {
      toggleMarkerComplete(marker.id);
    }
    return Promise.resolve();
  };
  
  // Показываем карту
  return (
    <div className="game-screen">
      {currentView === GameView.MAP && (
        <div className="quest-map-wrapper">
          <Header 
            onOpenDialog={() => changeView(GameView.MESSAGES)}
            onOpenInventory={() => {}} // TODO: Реализовать открытие инвентаря
          />
          
          <div className="map-container">
            <QuestMap 
              onMarkerClick={handleMarkerClick}
              followPlayer={true}
            />
          </div>
          
          {!ready && <LoadingIndicator message="Загрузка..." />}
          
          <GameNavButtons 
            questState={questState || QuestStateEnum.REGISTERED}
            onStartQuest={startGame}
            onQRScanTest={handleQRScan}
            onExit={onExit}
            qrCodes={QR_CODES}
          />
        </div>
      )}
    </div>
  );
};