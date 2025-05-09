import { useState, useEffect } from 'react';

export interface PlayerData {
  id: string;
  name: string;
  level: number;
  experience: number;
  avatar: string;
  health: number;
  maxHealth: number;
  energy: number;
  maxEnergy: number;
  inventory: string[];
  stats: Record<string, number>;
}

export const usePlayer = () => {
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        setLoading(true);
        // Здесь были бы запросы к API, но пока используем моковые данные
        const mockPlayer: PlayerData = {
          id: "player-1",
          name: "Путник",
          level: 5,
          experience: 2500,
          avatar: "👤",
          health: 85,
          maxHealth: 100,
          energy: 70,
          maxEnergy: 100,
          inventory: ["med_kit", "energy_drink", "data_chip"],
          stats: {
            strength: 6,
            dexterity: 8,
            intelligence: 7,
            willpower: 5,
            charisma: 6
          }
        };
        
        // Имитация задержки сети
        setTimeout(() => {
          setPlayer(mockPlayer);
          setLoading(false);
        }, 500);
      } catch (err) {
        setError('Ошибка загрузки данных игрока');
        setLoading(false);
      }
    };
    
    fetchPlayer();
  }, []);
  
  return { player, loading, error };
}; 