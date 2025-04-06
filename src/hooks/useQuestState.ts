import { useReducer, useEffect, useCallback } from 'react';
import { Id } from '../../convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useLocalStorage } from './useLocalStorage';

// Константы состояний квеста для типизации
export enum QuestState {
  REGISTERED = 'REGISTERED',
  CHARACTER_CREATION = 'CHARACTER_CREATION',
  TRAINING_MISSION = 'TRAINING_MISSION',
  DELIVERY_STARTED = 'DELIVERY_STARTED',
  PARTS_COLLECTED = 'PARTS_COLLECTED',
  ARTIFACT_HUNT = 'ARTIFACT_HUNT',
  ARTIFACT_FOUND = 'ARTIFACT_FOUND',
  QUEST_COMPLETION = 'QUEST_COMPLETION',
  FREE_ROAM = 'FREE_ROAM',
  NEW_MESSAGE = 'NEW_MESSAGE'
}

// Интерфейс шага квеста
export interface QuestStep {
  id: string; 
  completed: boolean;
  timestamp?: number;
}

// Интерфейс состояния
interface QuestStateData {
  currentState: QuestState;
  completedSteps: QuestStep[];
  hasNewMessage: boolean;
  loading: boolean;
  error: string | null;
}

// Типы действий
type QuestAction = 
  | { type: 'SET_STATE'; state: QuestState }
  | { type: 'COMPLETE_STEP'; stepId: string }
  | { type: 'SET_NEW_MESSAGE'; hasNew: boolean }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'LOAD_STATE'; state: Partial<QuestStateData> };

// Редьюсер для управления состоянием квеста
function questReducer(state: QuestStateData, action: QuestAction): QuestStateData {
  switch (action.type) {
    case 'SET_STATE':
      return {
        ...state,
        currentState: action.state
      };
    
    case 'COMPLETE_STEP':
      // Проверяем, есть ли уже этот шаг в списке
      const stepExists = state.completedSteps.some(step => step.id === action.stepId);
      
      if (stepExists) {
        return {
          ...state,
          completedSteps: state.completedSteps.map(step => 
            step.id === action.stepId 
              ? { ...step, completed: true, timestamp: Date.now() } 
              : step
          )
        };
      } else {
        return {
          ...state,
          completedSteps: [...state.completedSteps, { 
            id: action.stepId, 
            completed: true, 
            timestamp: Date.now() 
          }]
        };
      }
    
    case 'SET_NEW_MESSAGE':
      return {
        ...state,
        hasNewMessage: action.hasNew
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.isLoading
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.error
      };
    
    case 'LOAD_STATE':
      return {
        ...state,
        ...action.state
      };
      
    default:
      return state;
  }
}

// Начальное состояние
const initialState: QuestStateData = {
  currentState: QuestState.REGISTERED,
  completedSteps: [],
  hasNewMessage: false,
  loading: true,
  error: null
};

interface UseQuestStateResult {
  questState: QuestState;
  completedSteps: QuestStep[];
  hasNewMessage: boolean;
  loading: boolean;
  error: string | null;
  updateQuestState: (newState: QuestState) => void;
  completeQuestStep: (stepId: string) => void;
  setHasNewMessage: (hasNew: boolean) => void;
}

/**
 * Хук для управления состоянием квеста с использованием reducer
 */
export function useQuestStateReducer(playerId?: Id<"players">): UseQuestStateResult {
  // Используем localStorage для хранения прогресса квеста
  const [storedQuestData, setStoredQuestData] = useLocalStorage<Partial<QuestStateData>>(
    `quest_progress_${playerId || 'default'}`,
    {},
    500 // debounce в 500мс
  );
  
  // Мержим начальное состояние с данными из localStorage
  const mergedInitialState: QuestStateData = {
    ...initialState,
    ...storedQuestData
  };
  
  // Используем reducer для управления состоянием
  const [state, dispatch] = useReducer(questReducer, mergedInitialState);
  
  // Получаем текущую сцену для определения наличия нового сообщения
  const currentScene = useQuery(
    api.quest.getCurrentScene, 
    playerId ? { playerId } : "skip"
  );
  
  // При изменении текущей сцены проверяем наличие нового сообщения
  useEffect(() => {
    if (currentScene) {
      dispatch({ type: 'SET_NEW_MESSAGE', hasNew: true });
    }
  }, [currentScene]);
  
  // Обновляем localStorage при изменении состояния
  useEffect(() => {
    if (!playerId) return;
    
    const dataToStore = {
      currentState: state.currentState,
      completedSteps: state.completedSteps,
      hasNewMessage: state.hasNewMessage
    };
    
    setStoredQuestData(dataToStore);
  }, [state.currentState, state.completedSteps, state.hasNewMessage, playerId, setStoredQuestData]);
  
  // Загружаем начальное состояние
  useEffect(() => {
    if (!playerId) {
      dispatch({ type: 'SET_LOADING', isLoading: false });
      return;
    }
    
    try {
      // Данные уже загружены из localStorage через mergedInitialState
      dispatch({ type: 'SET_LOADING', isLoading: false });
    } catch (err) {
      console.error("Error loading quest state:", err);
      dispatch({ 
        type: 'SET_ERROR', 
        error: "Ошибка при загрузке состояния квеста" 
      });
      dispatch({ type: 'SET_LOADING', isLoading: false });
    }
  }, [playerId]);
  
  // Мемоизированные функции
  const updateQuestState = useCallback((newState: QuestState) => {
    dispatch({ type: 'SET_STATE', state: newState });
  }, []);
  
  const completeQuestStep = useCallback((stepId: string) => {
    dispatch({ type: 'COMPLETE_STEP', stepId });
  }, []);
  
  const setHasNewMessage = useCallback((hasNew: boolean) => {
    dispatch({ type: 'SET_NEW_MESSAGE', hasNew });
  }, []);
  
  return {
    questState: state.currentState,
    completedSteps: state.completedSteps,
    hasNewMessage: state.hasNewMessage,
    loading: state.loading,
    error: state.error,
    updateQuestState,
    completeQuestStep,
    setHasNewMessage
  };
}