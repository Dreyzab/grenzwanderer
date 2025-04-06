import { useReducer, useEffect, useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { useUnit } from 'effector-react';
import { $currentUser } from '../entities/user/model';
import { QuestState } from './useQuestState';

// Интерфейсы для строгой типизации
export interface PlayerLocation {
  lat: number;
  lng: number;
  timestamp: number;
}

export interface PlayerReputation {
  officers: number;
  villains: number;
  neutrals: number;
  survivors: number;
}

export interface PlayerEquipment {
  primary: string;
  secondary?: string;
  consumables: string[];
}

export interface PlayerProfile {
  _id: Id<"players">;
  userId: Id<"users">;
  nickname: string;
  avatar?: string;
  faction: 'officers' | 'villains' | 'neutrals' | 'survivors';
  reputation: PlayerReputation;
  equipment: PlayerEquipment;
  questState: QuestState;
  creationStep?: number;
  locationHistory: PlayerLocation[];
  inventory?: string[];
  discoveredNpcs?: Id<"npcs">[];
  activeQuests?: string[];
  completedQuests?: string[];
  experience?: number;
}

// Состояние для reducer
interface PlayerState {
  player: PlayerProfile | null;
  loading: boolean;
  error: string | null;
}

// Типы действий
type PlayerAction =
  | { type: 'SET_PLAYER'; player: PlayerProfile }
  | { type: 'UPDATE_PLAYER'; updates: Partial<PlayerProfile> }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'CLEAR_PLAYER' };

// Reducer для управления состоянием игрока
function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case 'SET_PLAYER':
      return {
        ...state,
        player: action.player,
        loading: false
      };
    
    case 'UPDATE_PLAYER':
      return {
        ...state,
        player: state.player ? { ...state.player, ...action.updates } : null
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.isLoading
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.error,
        loading: false
      };
    
    case 'CLEAR_PLAYER':
      return {
        ...state,
        player: null
      };
      
    default:
      return state;
  }
}

// Начальное состояние
const initialState: PlayerState = {
  player: null,
  loading: true,
  error: null
};

interface UsePlayerResult {
  player: PlayerProfile | null;
  loading: boolean;
  error: string | null;
  updatePlayer: (updates: Partial<PlayerProfile>) => Promise<void>;
  updatePlayerLocation: (lat: number, lng: number) => Promise<void>;
}

/**
 * Хук для загрузки и управления профилем игрока с использованием reducer
 */
export function usePlayerReducer(): UsePlayerResult {
  const user = useUnit($currentUser);
  const [state, dispatch] = useReducer(playerReducer, initialState);
  
  // Получаем мутации Convex с правильной типизацией
  const getOrCreatePlayer = useMutation(api.player.getOrCreatePlayer);
  
  const updatePlayerLocation = useMutation(api.player.updatePlayerLocation);
  
  // Загрузка профиля игрока
  useEffect(() => {
    if (!user) {
      dispatch({ type: 'SET_LOADING', isLoading: false });
      return;
    }
    
    const loadPlayer = async () => {
      try {
        dispatch({ type: 'SET_LOADING', isLoading: true });
        
        const response = await getOrCreatePlayer({ userId: user.id as any });
        
        if (response) {
          dispatch({ type: 'SET_PLAYER', player: response as PlayerProfile });
        } else {
          dispatch({ type: 'SET_ERROR', error: "Не удалось загрузить профиль игрока" });
        }
      } catch (err) {
        console.error("Error loading player profile:", err);
        dispatch({ 
          type: 'SET_ERROR', 
          error: err instanceof Error ? err.message : "Неизвестная ошибка при загрузке профиля" 
        });
      }
    };
    
    loadPlayer();
  }, [user, getOrCreatePlayer]);
  
  // Функция для обновления данных игрока
  const updatePlayer = useCallback(async (updates: Partial<PlayerProfile>) => {
    if (!state.player) return;
    
    try {
      // Здесь должна быть мутация для обновления профиля игрока
      // Например: await updatePlayerProfile({ playerId: state.player._id, updates });
      
      // Обновляем локальное состояние
      dispatch({ type: 'UPDATE_PLAYER', updates });
    } catch (err) {
      console.error("Error updating player:", err);
      dispatch({ 
        type: 'SET_ERROR', 
        error: err instanceof Error ? err.message : "Ошибка при обновлении профиля" 
      });
    }
  }, [state.player]);
  
  // Функция для обновления позиции игрока
  const updateLocation = useCallback(async (lat: number, lng: number) => {
    if (!state.player) return;
    
    try {
      await updatePlayerLocation({
        playerId: state.player._id,
        lat,
        lng
      });
      
      // Создаем новую запись о местоположении
      const newLocation: PlayerLocation = {
        lat,
        lng,
        timestamp: Date.now()
      };
      
      // Обновляем локальное состояние
      dispatch({
        type: 'UPDATE_PLAYER',
        updates: {
          locationHistory: [...(state.player.locationHistory || []), newLocation].slice(-20) // Ограничиваем историю 20 записями
        }
      });
    } catch (err) {
      console.error("Error updating player location:", err);
      // Не показываем ошибку пользователю, т.к. это не критично
    }
  }, [state.player, updatePlayerLocation]);
  
  return {
    player: state.player,
    loading: state.loading,
    error: state.error,
    updatePlayer,
    updatePlayerLocation: updateLocation
  };
}