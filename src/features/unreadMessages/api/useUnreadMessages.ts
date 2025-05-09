import { useState, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';

/**
 * Хук для проверки наличия непрочитанных сообщений у игрока
 * Использует периодическую проверку localStorage
 */
export function useUnreadMessages() {
  const [hasUnread, setHasUnread] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [player, setPlayer] = useState<{ _id: Id<'players'>; name: string } | null>(null);
  
  // Мутация для получения или создания игрока
  const getOrCreatePlayer = useMutation(api.player.getOrCreatePlayer);
  
  // Инициализация игрока
  useEffect(() => {
    const initPlayer = async () => {
      try {
        // Получаем userId из localStorage
        const userId = localStorage.getItem('userId');
        
        if (userId) {
          // Получаем или создаем игрока
          const playerData = await getOrCreatePlayer({ userId: userId as any });
          
          if (playerData) {
            setPlayer({
              _id: playerData._id,
              name: playerData.nickname || 'Игрок'
            });
            
            // Сразу проверяем непрочитанные сообщения
            checkUnreadMessages(playerData._id);
          }
        }
      } catch (error) {
        console.error('Ошибка при инициализации игрока:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initPlayer();
  }, [getOrCreatePlayer]);
  
  // Функция проверки непрочитанных сообщений
  const checkUnreadMessages = (playerId: Id<'players'>) => {
    try {
      // Получаем сообщения из localStorage
      const key = `messages_${playerId}`;
      const storedData = localStorage.getItem(key);
      
      if (storedData) {
        const messagesState = JSON.parse(storedData);
        
        // Если в состоянии уже есть флаг непрочитанных сообщений, используем его
        if (messagesState.hasUnreadMessages !== undefined) {
          setHasUnread(messagesState.hasUnreadMessages);
        } 
        // Иначе проверяем наличие непрочитанных сообщений вручную
        else if (messagesState.newMessages && Array.isArray(messagesState.newMessages)) {
          const hasUnreadMessages = messagesState.newMessages.some(
            (msg: any) => msg.isRead === false
          );
          setHasUnread(hasUnreadMessages);
        }
      }
    } catch (error) {
      console.error('Ошибка при проверке непрочитанных сообщений:', error);
    }
  };
  
  // Периодическая проверка непрочитанных сообщений
  useEffect(() => {
    if (!player?._id) return;
    
    // Проверяем сразу после получения игрока
    checkUnreadMessages(player._id);
    
    // Настраиваем интервал для периодической проверки (каждые 5 минут)
    const interval = setInterval(() => {
      checkUnreadMessages(player._id);
    }, 5 * 60 * 1000);
    
    // Очищаем интервал при размонтировании
    return () => clearInterval(interval);
  }, [player]);
  
  return {
    hasUnreadMessages: hasUnread,
    loading,
    checkNow: player ? () => checkUnreadMessages(player._id) : () => {}
  };
} 