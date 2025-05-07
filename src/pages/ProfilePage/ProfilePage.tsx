import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useUnit } from 'effector-react';
import { $currentUser } from '../../entities/user/model';
import { SignOutButton } from '../../widgets/signOutButton/SignOutButton';
import './ProfilePage.css';

export const ProfilePage: React.FC = () => {
  const user = useUnit($currentUser);
  const navigate = useNavigate();
  
  // Get player profile
  const getOrCreatePlayer = useMutation(api.player.getOrCreatePlayer);
  const [playerId, setPlayerId] = useState<string | null>(null);
  
  // State for player data
  const [nickname, setNickname] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
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
          setNickname(player.nickname);
        }
      })
      .catch(error => {
        console.error('Error getting player profile:', error);
      });
  }, [user, navigate, getOrCreatePlayer]);
  
  // If no player ID yet, show loading
  if (!playerId) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>Загрузка профиля...</p>
      </div>
    );
  }
  
  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1>Профиль игрока</h1>
        <div className="profile-actions">
          <button className="back-button" onClick={() => navigate('/')}>
            На главную
          </button>
          <SignOutButton />
        </div>
      </div>
      
      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-avatar">
            {/* Placeholder avatar */}
            <div className="avatar-placeholder">
              {nickname.charAt(0).toUpperCase()}
            </div>
          </div>
          
          <div className="profile-info">
            <div className="profile-row">
              <span className="profile-label">Никнейм:</span>
              {isEditing ? (
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="profile-input"
                />
              ) : (
                <span className="profile-value">{nickname}</span>
              )}
            </div>
            
            <div className="profile-row">
              <span className="profile-label">Email:</span>
              <span className="profile-value">{user?.email}</span>
            </div>
            
            <div className="profile-row">
              <span className="profile-label">Фракция:</span>
              <span className="profile-value">Нейтралы</span>
            </div>
          </div>
          
          <div className="profile-controls">
            {isEditing ? (
              <>
                <button className="save-button">Сохранить</button>
                <button 
                  className="cancel-button"
                  onClick={() => setIsEditing(false)}
                >
                  Отмена
                </button>
              </>
            ) : (
              <button 
                className="edit-button"
                onClick={() => setIsEditing(true)}
              >
                Редактировать
              </button>
            )}
          </div>
        </div>
        
        <div className="profile-card">
          <h2>Игровая статистика</h2>
          
          <div className="stat-grid">
            <div className="stat-item">
              <span className="stat-label">Основное оружие</span>
              <span className="stat-value">Не выбрано</span>
            </div>
            
            <div className="stat-item">
              <span className="stat-label">Дополнительное снаряжение</span>
              <span className="stat-value">Не выбрано</span>
            </div>
            
            <div className="stat-item">
              <span className="stat-label">Этап квеста</span>
              <span className="stat-value">Начальный</span>
            </div>
            
            <div className="stat-item">
              <span className="stat-label">Пройдено точек</span>
              <span className="stat-value">0</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="profile-footer">
        <button 
          className="start-game-button"
          onClick={() => navigate('/game')}
        >
          Начать игру
        </button>
      </div>
    </div>
  );
};