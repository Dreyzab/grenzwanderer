import { useState, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';

export function useUnreadMessages(userId?: string) {
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [playerId, setPlayerId] = useState<Id<"players"> | null>(null);
  
  // Get Convex mutations and queries
  const getOrCreatePlayer = useMutation(api.player.getOrCreatePlayer);
  
  // Инициализация игрока
  useEffect(() => {
    if (!userId) return;
    
    const initializePlayer = async () => {
      try {
        // Get player profile
        const player = await getOrCreatePlayer({ userId: userId as any });
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
  }, [userId, getOrCreatePlayer]);
  
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
      }
    } catch (e) {
      console.error("Ошибка при проверке статуса сообщений:", e);
    }
  };
  
  // Периодически проверяем новые сообщения
  useEffect(() => {
    if (!playerId) return;
    
    // Проверяем при монтировании
    checkUnreadMessages(playerId);
    
    // Устанавливаем интервал для периодической проверки
    const intervalId = setInterval(() => {
      checkUnreadMessages(playerId);
    }, 300000); // Проверяем каждые 5 минут
    
    return () => clearInterval(intervalId);
  }, [playerId]);
  
  return { hasUnreadMessages };
} 