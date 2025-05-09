import React from 'react';
import { QRScanner } from '../../widgets/qrScanner/QRScanner';
import { SignOutButton } from '../../widgets/signOutButton/SignOutButton';
import { GameScreen } from '../../widgets/gameScreen/GameScreen';
import { GameView } from '../../shared/types/gameScreen';
import { useGamePage } from '../../features/game/api/useGamePage';
import './GamePage.css';

export const GamePage: React.FC = () => {
  const {
    activeTab,
    loading,
    error,
    player,
    currentSceneId,
    questState,
    hasNewMessage,
    handleTabClick,
    handleExit,
    handleQRScanSuccess,
    handleNovelExit,
    handleViewChange
  } = useGamePage();
  
  // Если загрузка, показываем индикатор
  if (loading) {
    return (
      <div className="game-loading">
        <div className="loading-spinner"></div>
        <p>Загрузка игры...</p>
      </div>
    );
  }
  
  // Если ошибка, показываем сообщение
  if (error) {
    return (
      <div className="game-error">
        <p>Произошла ошибка: {error}</p>
        <button onClick={() => window.location.reload()}>
          Попробовать снова
        </button>
      </div>
    );
  }
  
  // Функция для проверки возможности переключения между вкладками
  const canSwitchTo = (targetTab: GameView): boolean => {
    // Всегда можно переключиться на сканер, карту или сообщения
    if (targetTab === GameView.SCANNER || targetTab === GameView.MAP || targetTab === GameView.MESSAGES) {
      // Но если активна вкладка 'novel' (диалог с NPC), то запрещаем переключение
      // на другие вкладки до завершения сцены
      if (activeTab === GameView.NOVEL) {
        return false;
      }
      return true;
    }
    
    // По умолчанию разрешаем переключение
    return true;
  };
  
  // Обновленный обработчик клика по вкладке с проверкой возможности переключения
  const handleTabClickWithCheck = (tab: GameView) => {
    if (canSwitchTo(tab)) {
      handleTabClick(tab);
    } else {
      // Можно добавить уведомление о невозможности переключения
      alert('Невозможно переключиться на эту вкладку во время диалога. Сначала завершите текущий диалог.');
    }
  };
  
  return (
    <div className="game-page">
      {/* Навигационная панель */}
      <div className="game-nav">
        <div className="nav-buttons">
          <SignOutButton />
          <button className="exit-button" onClick={handleExit}>
            Выйти в меню
          </button>
        </div>
        
        <div className="game-tabs">
          <button
            className={`game-tab ${activeTab === GameView.MAP ? 'active' : ''}`}
            onClick={() => handleTabClickWithCheck(GameView.MAP)}
          >
            Карта
          </button>
          <button
            className={`game-tab ${activeTab === GameView.MESSAGES ? 'active' : ''}`}
            onClick={() => handleTabClickWithCheck(GameView.MESSAGES)}
          >
            Сообщения
            {hasNewMessage && <span className="notification-badge">!</span>}
          </button>
          <button
            className={`game-tab ${activeTab === GameView.SCANNER ? 'active' : ''}`}
            onClick={() => handleTabClickWithCheck(GameView.SCANNER)}
          >
            Сканер
          </button>
        </div>
      </div>
      
      {/* Основной контент */}
      <div className="game-content">
        {activeTab === GameView.SCANNER && (
          <QRScanner 
            onSuccess={handleQRScanSuccess} 
            onCancel={() => handleTabClickWithCheck(GameView.MAP)}
          />
        )}
        
        {(activeTab === GameView.MAP || activeTab === GameView.MESSAGES || activeTab === GameView.NOVEL) && (
          <GameScreen 
            initialView={activeTab}
            onViewChange={handleViewChange}
            playerId={player?.id}
          />
        )}
      </div>
    </div>
  );
};