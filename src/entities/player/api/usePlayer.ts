import { useState, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';

// Тип данных игрока
export interface PlayerData {
  _id: Id<'players'>;
  name?: string;
  nickname?: string;
  stats?: Record<string, number>;
  location?: {
    lat: number;
    lng: number;
    lastUpdated: number;
  };
  inventory?: string[];
  questState?: string;
  userId?: string;
  [key: string]: any;
}

// Мок-данные игрока для локальной разработки
const MOCK_PLAYER_DATA: PlayerData = {
  _id: 'players:mock' as Id<'players'>,
  nickname: 'Тестовый игрок',
  stats: {
    strength: 10,
    agility: 8,
    intelligence: 12,
    technique: 9,
    biopotential: 7,
    ritualKnowledge: 6
  },
  location: {
    lat: 55.751244,
    lng: 37.618423,
    lastUpdated: Date.now()
  },
  inventory: ['item:test1', 'item:test2'],
  questState: 'REGISTERED'
};

/**
 * Хук для получения и управления данными игрока
 * @param playerId - ID игрока (опционально, если не предоставлен, будет использоваться ID из localStorage)
 */
export function usePlayer(playerId?: string) {
  // Состояние
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [geolocationEnabled, setGeolocationEnabled] = useState<boolean>(false);

  // Мутации Convex
  const getOrCreatePlayer = useMutation(api.player.getOrCreatePlayer);
  const updateLocation = useMutation(api.player.updatePlayerLocation);

  // Инициализация игрока
  const initPlayer = async () => {
    try {
      setLoading(true);
      
      // Если передан playerId, используем его, иначе берем из localStorage
      const userId = playerId || localStorage.getItem('userId');
      
      if (!userId) {
        // Если нет userId, используем мок-данные для локальной разработки
        console.warn('UserId не найден. Используются мок-данные игрока.');
        setPlayer(MOCK_PLAYER_DATA);
        return;
      }
      
      // Получаем или создаем игрока через API Convex
      const playerData = await getOrCreatePlayer({ 
        userId: userId as Id<"users">,
        nickname: undefined
      });
      
      if (playerData) {
        const playerWithTypeCorrection: PlayerData = {
          ...playerData,
          _id: playerData._id as Id<'players'>,
          name: playerData.nickname || 'Новый игрок',
          stats: {
            strength: 10,
            agility: 8,
            intelligence: 12,
            ...(playerData.stats || {})
          }
        };
        setPlayer(playerWithTypeCorrection);
      } else {
        // Если API вернуло пустой результат, используем мок-данные
        console.warn('Данные игрока не получены. Используются мок-данные.');
        setPlayer(MOCK_PLAYER_DATA);
      }
    } catch (error) {
      console.error('Ошибка при инициализации игрока:', error);
      setError(error instanceof Error ? error.message : 'Неизвестная ошибка');
      
      // При ошибке API используем мок-данные
      setPlayer(MOCK_PLAYER_DATA);
    } finally {
      setLoading(false);
    }
  };

  // Инициализация при монтировании компонента
  useEffect(() => {
    initPlayer();
  }, [playerId]);

  // Отслеживание геолокации
  useEffect(() => {
    if (!geolocationEnabled) return;
    
    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Обновляем локальное состояние
        if (player) {
          setPlayer({
            ...player,
            location: {
              lat: latitude,
              lng: longitude,
              lastUpdated: Date.now()
            }
          });
        }
        
        // Обновляем геолокацию на сервере
        try {
          if (player?._id) {
            await updateLocation({ 
              playerId: player._id,
              lat: latitude,
              lng: longitude
            });
          }
        } catch (error) {
          console.error('Ошибка при обновлении геолокации:', error);
        }
      },
      (error) => {
        console.error('Ошибка отслеживания геолокации:', error);
        setGeolocationEnabled(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 30000,
        timeout: 27000
      }
    );
    
    // Очистка при размонтировании
    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [player, geolocationEnabled]);

  // Включение/выключение отслеживания геолокации
  const toggleGeolocation = () => {
    setGeolocationEnabled(prev => !prev);
  };

  return {
    player,
    loading,
    error,
    geolocationEnabled,
    toggleGeolocation,
    refreshPlayer: initPlayer
  };
} 