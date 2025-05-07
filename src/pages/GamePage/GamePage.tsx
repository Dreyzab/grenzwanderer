import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRScanner } from '../../widgets/qrScanner/QRScanner';
import { SignOutButton } from '../../widgets/signOutButton/SignOutButton';
import { GameScreen } from '../../widgets/gameScreen/GameScreen';
import { GameView } from '../../shared/types/gameScreen';
import { useGamePage } from '../../features/game/api/useGamePage';
import './GamePage.css';

type GameTab = 'map' | 'dialog' | 'scanner' | 'novel';

export const GamePage: React.FC = () => {
  const navigate = useNavigate();
  
  const {
    activeTab,
    loading,
    error,
    hasNewMessage,
    currentSceneId,
    handleTabClick,
    handleExit,
    handleQRScanSuccess,
    handleNovelExit,
    handleViewChange
  } = useGamePage(navigate);
  
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
            className={`game-tab ${activeTab === 'map' ? 'active' : ''}`}
            onClick={() => handleTabClick('map')}
          >
            Карта
          </button>
          <button
            className={`game-tab ${activeTab === 'dialog' ? 'active' : ''}`}
            onClick={() => handleTabClick('dialog')}
          >
            Диалог
            {hasNewMessage && <span className="notification-badge">!</span>}
          </button>
          <button
            className={`game-tab ${activeTab === 'scanner' ? 'active' : ''}`}
            onClick={() => handleTabClick('scanner')}
          >
            Сканер
          </button>
        </div>
      </div>
      
      {/* Основной контент */}
      <div className="game-content">
        {activeTab === 'scanner' && (
          <QRScanner 
            onSuccess={handleQRScanSuccess} 
            onCancel={() => handleTabClick('map')}
          />
        )}
        
        {activeTab === 'map' || activeTab === 'dialog' || activeTab === 'novel' ? (
          <GameScreen 
            onExit={handleExit}
            initialView={
              activeTab === 'map' 
                ? GameView.MAP 
                : activeTab === 'dialog' 
                  ? GameView.MESSAGES 
                  : GameView.NOVEL
            }
            onViewChange={handleViewChange}
          />
        ) : null}
      </div>
    </div>
  );
};