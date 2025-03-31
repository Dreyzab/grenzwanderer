import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { QRScanner } from '../../components/SignOutButton/QR/QRScanner';
import { GameScreen } from '../../components/SignOutButton/Dialog/GameScreen';
import { QuestMap } from '../../components/SignOutButton/Map/QuestMap';
import { SignOutButton } from '../../components/SignOutButton/SignOutButton';
import { useStore } from 'effector-react';
import { $currentUser } from '../../entities/user/model';
import './GamePage.css';

export const GamePage: React.FC = () => {
  const user = useStore($currentUser);
  const navigate = useNavigate();
  const [activeScreen, setActiveScreen] = useState<'map' | 'dialog' | 'scanner'>('map');
  
  // Get player profile
  const getOrCreatePlayer = useMutation(api.player.getOrCreatePlayer);
  const [playerId, setPlayerId] = useState<string | null>(null);
  
  // Get player profile on load
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    getOrCreatePlayer({ userId: user.id as any })
      .then(player => {
        if (player) {
          setPlayerId(player._id);
        }
      })
      .catch(error => {
        console.error('Error getting player profile:', error);
      });
  }, [user, navigate, getOrCreatePlayer]);
  
  // Handle scanner success
  const handleScannerSuccess = (message: string) => {
    alert(message);
    setActiveScreen('dialog');
  };
  
  // If no player ID yet, show loading
  if (!playerId) {
    return (
      <div className="game-loading">
        <div className="loading-spinner"></div>
        <p>Загрузка профиля игрока...</p>
      </div>
    );
  }
  
  return (
    <div className="game-page">
      {/* Navigation buttons */}
      <div className="game-nav">
        <SignOutButton />
        
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
          </button>
          <button
            className={`game-tab ${activeScreen === 'scanner' ? 'active' : ''}`}
            onClick={() => setActiveScreen('scanner')}
          >
            Сканер
          </button>
        </div>
      </div>
      
      {/* Active screen */}
      <div className="game-content">
        {activeScreen === 'map' && (
          <QuestMap 
            playerId={playerId}
          />
        )}
        
        {activeScreen === 'dialog' && (
          <GameScreen 
            playerId={playerId}
            onExit={() => setActiveScreen('map')}
          />
        )}
        
        {activeScreen === 'scanner' && (
          <div className="scanner-container">
            <QRScanner 
              playerId={playerId}
              onSuccess={handleScannerSuccess}
              onCancel={() => setActiveScreen('map')}
            />
          </div>
        )}
      </div>
    </div>
  );
};