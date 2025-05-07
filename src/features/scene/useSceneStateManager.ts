import { useState, useEffect } from 'react';
import { useUnit } from 'effector-react';
import { $playerStats, updatePlayerStat } from '../../entities/player/model';
import { $questState, $completedSteps } from '../../features/quest/model';
import { PlayerStats } from '../../shared/types/visualNovel';
import { QuestStateEnum } from '../../shared/constants/quest';

interface Inventory {
  items: Array<{
    id: string;
    name: string;
    description?: string;
    quantity: number;
  }>;
}

interface ScriptPayload {
  type: string;
  params: Record<string, any>;
}

interface ConditionObject {
  type: 'STAT_CHECK' | 'QUEST_STATE' | 'HAS_ITEM' | 'CUSTOM';
  data: Record<string, any>;
}

export function useSceneStateManager(
  playerId?: string,
  initialQuestState?: Record<string, any>,
  initialPlayerStats?: Partial<PlayerStats>
) {
  // Используем Effector стор для Player Stats
  const playerStatsFromStore = useUnit($playerStats);
  
  // Локальное состояние
  const [questState, setQuestState] = useState<Record<string, any>>(initialQuestState || {});
  const [playerStats, setPlayerStats] = useState<PlayerStats>(
    initialPlayerStats as PlayerStats || playerStatsFromStore
  );
  const [inventory, setInventory] = useState<Inventory>({ items: [] });
  
  // Инициализация стейта из сторов Effector (если нет переданных начальных значений)
  useEffect(() => {
    if (!initialPlayerStats) {
      setPlayerStats(playerStatsFromStore);
    }
    
    // Можно также загрузить данные игрока с сервера по playerId, если он передан
  }, [initialPlayerStats, playerStatsFromStore, playerId]);
  
  // Геттеры для получения текущего состояния
  const getQuestState = () => questState;
  const getPlayerStats = () => playerStats;
  const getInventory = () => inventory;
  
  // Функции для обновления состояния
  const updateQuestState = (questId: string, data: any) => {
    setQuestState((prev) => ({
      ...prev,
      [questId]: { ...prev[questId], ...data }
    }));
  };
  
  const updatePlayerStatLocal = (statName: keyof PlayerStats, delta: number) => {
    // Обновляем и локальное состояние
    setPlayerStats((prev) => ({
      ...prev,
      [statName]: Math.max(0, (prev[statName] || 0) + delta)
    }));
    
    // И глобальный стор
    updatePlayerStat({ stat: statName, value: delta });
  };
  
  const givePlayerItem = (itemId: string, itemName: string, quantity = 1) => {
    setInventory((prev) => {
      const existingItemIndex = prev.items.findIndex(item => item.id === itemId);
      
      if (existingItemIndex >= 0) {
        // Если предмет уже есть, увеличиваем количество
        const updatedItems = [...prev.items];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + quantity
        };
        
        return { ...prev, items: updatedItems };
      } else {
        // Если предмета нет, добавляем новый
        return {
          ...prev,
          items: [...prev.items, { id: itemId, name: itemName, quantity }]
        };
      }
    });
  };
  
  const checkCondition = (condition?: ConditionObject): boolean => {
    if (!condition) return true;
    
    switch (condition.type) {
      case 'STAT_CHECK':
        // Проверка статов игрока
        const { stat, minValue, maxValue } = condition.data;
        const statValue = playerStats[stat as keyof PlayerStats] || 0;
        
        if (minValue !== undefined && statValue < minValue) return false;
        if (maxValue !== undefined && statValue > maxValue) return false;
        return true;
        
      case 'QUEST_STATE':
        // Проверка состояния квеста
        const { questId, stateValue } = condition.data;
        return questState[questId]?.state === stateValue;
        
      case 'HAS_ITEM':
        // Проверка наличия предмета
        const { itemId, count = 1 } = condition.data;
        const item = inventory.items.find(i => i.id === itemId);
        return !!item && item.quantity >= count;
        
      case 'CUSTOM':
        // Сложная кастомная проверка, можно реализовать по-разному
        console.warn('Custom condition checks not fully implemented');
        return true;
        
      default:
        return true;
    }
  };
  
  const executeScript = (scriptPayload: ScriptPayload) => {
    // Интерпретатор скриптов для выполнения кастомных действий
    // Здесь может быть сложная логика в зависимости от нужд игры
    const { type, params } = scriptPayload;
    
    switch (type) {
      case 'UPDATE_STATS':
        // Обновляем несколько статов одновременно
        if (params.stats) {
          Object.entries(params.stats).forEach(([stat, value]) => {
            updatePlayerStatLocal(stat as keyof PlayerStats, Number(value));
          });
        }
        break;
        
      case 'GIVE_ITEMS':
        // Даём несколько предметов
        if (params.items) {
          params.items.forEach((item: any) => {
            givePlayerItem(item.id, item.name, item.quantity || 1);
          });
        }
        break;
        
      case 'SET_QUEST_STATE':
        // Обновляем состояние квеста
        if (params.questId && params.state) {
          updateQuestState(params.questId, { state: params.state });
        }
        break;
        
      default:
        console.warn(`Unknown script type: ${type}`);
    }
  };
  
  return {
    getQuestState,
    getPlayerStats,
    getInventory,
    updateQuestState,
    updatePlayerStat: updatePlayerStatLocal,
    givePlayerItem,
    checkCondition,
    executeScript
  };
} 