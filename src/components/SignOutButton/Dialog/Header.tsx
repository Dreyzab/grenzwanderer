import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { $currentUser } from '../../../entities/user/model';
import { useUnit } from 'effector-react';
import './Header.css';

interface HeaderProps {
  onOpenDialog: () => void;
  onOpenInventory: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenDialog, onOpenInventory }) => {
  const user = useUnit($currentUser);
  const [playerId, setPlayerId] = useState<Id<"players"> | null>(null);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  
  // Get Convex mutations and queries
  const getOrCreatePlayer = useMutation(api.player.getOrCreatePlayer);
  
  // Инициализация игрока
  useEffect(() => {
    if (!user) return;
    
    const initializePlayer = async () => {
      try {
        // Get player profile
        const player = await getOrCreatePlayer({ userId: user.id as any });
        if (player) {
          setPlayerId(player._id);
          
          // Проверяем наличие новых сообщений из локального хранилища
          checkUnreadMessages(player._id);
        }
      } catch (err) {
        console.error("Error initializing player:", err);
      }
    };
    
    initializePlayer();
  }, [user, getOrCreatePlayer]);
  
  // Проверка новых сообщений
  const checkUnreadMessages = (playerId: Id<"players">) => {
    try {
      // Загружаем статус прочтения сообщений из локального хранилища
      const savedMessagesData = localStorage.getItem(`messages_${playerId}`);
      if (savedMessagesData) {
        const savedMessages = JSON.parse(savedMessagesData);
        // Если есть хотя бы одно непрочитанное сообщение, показываем индикатор
        const hasUnread = savedMessages.some((msg: {id: string, read: boolean}) => !msg.read);
        setHasUnreadMessages(hasUnread);
      } else {
        // Если нет сохраненных данных, предполагаем, что есть новые сообщения
        setHasUnreadMessages(true);
      }
    } catch (e) {
      console.error("Ошибка при проверке статуса сообщений:", e);
    }
  };
  
  // Периодически проверяем новые сообщения (можно также вызывать при определенных событиях)
  useEffect(() => {
    if (!playerId) return;
    
    // Проверяем при монтировании
    checkUnreadMessages(playerId);
    
    // Устанавливаем интервал для периодической проверки
    const intervalId = setInterval(() => {
      checkUnreadMessages(playerId);
    }, 30000); // Проверяем каждые 30 секунд
    
    return () => clearInterval(intervalId);
  }, [playerId]);
  
  return (
    <header className="game-header">
      <div className="header-controls">
        <button 
          className="header-button dialog-button"
          onClick={onOpenDialog}
        >
          Диалог
          {hasUnreadMessages && <div className="message-indicator"></div>}
        </button>
        <button 
          className="header-button inventory-button"
          onClick={onOpenInventory}
        >
          Инвентарь
        </button>
      </div>
    </header>
  );
}; 