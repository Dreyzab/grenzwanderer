import { useState, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';

export interface PlayerData {
  _id: Id<"players">;
  name: string;
  locationHistory: any[];
  equipment: Record<string, any>;
}

export function usePlayer() {
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const getOrCreatePlayer = useMutation(api.player.getOrCreatePlayer);
  
  // Initialize data
  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        
        // Получаем ID пользователя из localStorage
        const userId = localStorage.getItem('userId');
        
        if (!userId) {
          console.warn("User ID not found in localStorage, using mock data");
          // Используем мок данные для игрока
          setPlayer({
            _id: "temporary-player-id" as unknown as Id<"players">,
            name: "Test Player",
            equipment: {},
            locationHistory: []
          });
        } else {
          // Пытаемся получить игрока из API
          try {
            const playerData = await getOrCreatePlayer({ userId: userId as any });
            if (playerData) {
              setPlayer(playerData as unknown as PlayerData);
            }
          } catch (apiError) {
            console.error("API Error:", apiError);
            // Если API недоступно, используем мок данные
            setPlayer({
              _id: "temporary-player-id" as unknown as Id<"players">,
              name: "Test Player",
              equipment: {},
              locationHistory: []
            });
          }
        }
      } catch (err) {
        console.error('Error initializing player data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    
    initData();
  }, [getOrCreatePlayer]);
  
  // Отслеживание геолокации игрока
  useEffect(() => {
    if (player && navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          // Update player position
          const newPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: Date.now()
          };
          
          setPlayer((prevPlayer) => {
            if (!prevPlayer) return prevPlayer;
            return {
              ...prevPlayer,
              locationHistory: [...(prevPlayer.locationHistory || []), newPosition].slice(-20)
            };
          });
        },
        (error) => {
          console.warn('Geolocation error:', error.message);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
      
      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    }
  }, [player]);
  
  return { player, loading, error };
} 