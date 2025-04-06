import { useReducer, useEffect, useCallback } from 'react';
import { Id } from '../../convex/_generated/dataModel';
import { useLocalStorage } from './useLocalStorage';

export interface MapPoint {
  title: string;
  lat: number;
  lng: number;
  qrCode?: string;
}

export interface Message {
  id: string;
  title: string;
  sender: string;
  date: string;
  read: boolean;
  content: string;
  sceneKey?: string;
  mapPoints?: MapPoint[];
}

// Типы действий для reducer
type MessageAction = 
  | { type: 'MARK_AS_READ'; messageId: string }
  | { type: 'SET_ACTIVE_MESSAGE'; message: Message | null }
  | { type: 'INIT_MESSAGES'; messages: Message[] }
  | { type: 'ADD_MESSAGE'; message: Message };

// Интерфейс состояния
interface MessagesState {
  messages: Message[];
  activeMessage: Message | null;
}

// Reducer для управления состоянием сообщений
function messagesReducer(state: MessagesState, action: MessageAction): MessagesState {
  switch (action.type) {
    case 'MARK_AS_READ':
      return {
        ...state,
        messages: state.messages.map(msg => 
          msg.id === action.messageId ? { ...msg, read: true } : msg
        )
      };
    
    case 'SET_ACTIVE_MESSAGE':
      return {
        ...state,
        activeMessage: action.message
      };
    
    case 'INIT_MESSAGES':
      return {
        ...state,
        messages: action.messages
      };
    
    case 'ADD_MESSAGE':
      // Проверяем, есть ли уже сообщение с таким ID
      if (state.messages.some(msg => msg.id === action.message.id)) {
        return state;
      }
      return {
        ...state,
        messages: [...state.messages, action.message]
      };
      
    default:
      return state;
  }
}

// Демо-сообщения для инициализации
const DEMO_MESSAGES: Message[] = [
  {
    id: '1',
    title: 'Новое задание',
    sender: 'Командование',
    date: '10.08.2023',
    read: false,
    content: 'Новичок, есть работа. Торговец недавно привёз партию ценных запчастей. Забери их и доставь мастеровому по имени Дитер в центральную мастерскую города. Координаты я приложил. Действуй аккуратно, товар ценный!',
    sceneKey: 'new_delivery_quest',
    mapPoints: [
      {
        title: 'Торговец',
        lat: 51.5074,
        lng: -0.1278,
        qrCode: 'grenz_npc_trader_01'
      },
      {
        title: 'Мастерская Дитера',
        lat: 51.5074,
        lng: -0.1378,
        qrCode: 'grenz_npc_craftsman_01'
      }
    ]
  },
  {
    id: '2',
    title: 'Приветствие',
    sender: 'Система',
    date: '08.08.2023',
    read: true,
    content: 'Добро пожаловать в Гренцландер! Ваша миссия - выжить в этом опасном мире и раскрыть его тайны. Удачи, сталкер!'
  }
];

interface UseMessagesResult {
  messages: Message[];
  newMessages: Message[];
  archiveMessages: Message[];
  hasUnreadMessages: boolean;
  activeMessage: Message | null;
  setActiveMessage: (message: Message | null) => void;
  markMessageAsRead: (messageId: string) => void;
  addMessage: (message: Message) => void;
}

/**
 * Хук для управления сообщениями с использованием reducer и debounced localStorage
 */
export function useMessagesReducer(playerId?: Id<"players">): UseMessagesResult {
  // Используем localStorage для хранения прочитанности сообщений
  const [readStatus, setReadStatus] = useLocalStorage<Record<string, boolean>>(
    `message_read_status_${playerId || 'default'}`,
    {},
    500 // debounce в 500мс
  );
  
  // Инициализируем начальное состояние
  const initialState: MessagesState = {
    messages: DEMO_MESSAGES.map(msg => ({
      ...msg,
      read: playerId ? (readStatus[msg.id] || msg.read) : msg.read
    })),
    activeMessage: null
  };
  
  // Используем reducer для управления состоянием
  const [state, dispatch] = useReducer(messagesReducer, initialState);
  
  // Обновляем localStorage при изменении статуса прочтения
  useEffect(() => {
    if (!playerId) return;
    
    // Создаем новый объект со статусами прочтения
    const newReadStatus: Record<string, boolean> = {};
    state.messages.forEach(msg => {
      if (msg.read) {
        newReadStatus[msg.id] = true;
      }
    });
    
    // Обновляем localStorage только если что-то изменилось
    if (JSON.stringify(newReadStatus) !== JSON.stringify(readStatus)) {
      setReadStatus(newReadStatus);
    }
  }, [state.messages, playerId, readStatus, setReadStatus]);
  
  // Создаем мемоизированные функции для работы с сообщениями
  const markMessageAsRead = useCallback((messageId: string) => {
    dispatch({ type: 'MARK_AS_READ', messageId });
  }, []);
  
  const setActiveMessage = useCallback((message: Message | null) => {
    dispatch({ type: 'SET_ACTIVE_MESSAGE', message });
    
    // Если выбрано сообщение, автоматически отмечаем его как прочитанное
    if (message) {
      dispatch({ type: 'MARK_AS_READ', messageId: message.id });
    }
  }, []);
  
  const addMessage = useCallback((message: Message) => {
    dispatch({ type: 'ADD_MESSAGE', message });
  }, []);
  
  // Фильтрованные списки сообщений
  const newMessages = state.messages.filter(msg => !msg.read);
  const archiveMessages = state.messages.filter(msg => msg.read);
  const hasUnreadMessages = newMessages.length > 0;
  
  return {
    messages: state.messages,
    newMessages,
    archiveMessages,
    hasUnreadMessages,
    activeMessage: state.activeMessage,
    setActiveMessage,
    markMessageAsRead,
    addMessage
  };
}