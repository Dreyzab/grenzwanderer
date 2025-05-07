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
  
  // Функция для проверки возможности переключения между вкладками
  const canSwitchTo = (targetTab: GameTab): boolean => {
    // Всегда можно переключиться на сканер с любой вкладки
    if (targetTab === 'scanner') {
      return true;
    }
    
    // Если активна вкладка 'novel' (диалог с NPC), то запрещаем переключение
    // на карту или диалог до завершения сцены
    if (activeTab === 'novel') {
      return false;
    }
    
    // Запрещаем переключаться с диалогов на карту
    if (activeTab === 'dialog' && targetTab === 'map') {
      return false;
    }
    
    // Запрещаем переключаться с карты на диалоги, если активна сцена
    if (activeTab === 'map' && targetTab === 'dialog' && currentSceneId) {
      return false;
    }
    
    return true;
  };
  
  // Обновленный обработчик клика по вкладке с проверкой возможности переключения
  const handleTabClickWithCheck = (tab: GameTab) => {
    if (canSwitchTo(tab)) {
      handleTabClick(tab);
    } else {
      // Можно добавить уведомление о невозможности переключения
      alert('Невозможно переключиться на эту вкладку сейчас.');
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
            className={`game-tab ${activeTab === 'map' ? 'active' : ''}`}
            onClick={() => handleTabClickWithCheck('map')}
          >
            Карта
          </button>
          <button
            className={`game-tab ${activeTab === 'dialog' ? 'active' : ''}`}
            onClick={() => handleTabClickWithCheck('dialog')}
          >
            Диалог
            {hasNewMessage && <span className="notification-badge">!</span>}
          </button>
          <button
            className={`game-tab ${activeTab === 'scanner' ? 'active' : ''}`}
            onClick={() => handleTabClickWithCheck('scanner')}
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
            onCancel={() => handleTabClickWithCheck('map')}
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