import { useReducer, useEffect } from 'react';
import { Id } from '../../../../convex/_generated/dataModel';

/**
 * Тип сообщения в системе
 */
export interface Message {
  id: string;
  title: string;
  content: string;
  timestamp: number;
  isRead: boolean;
  isArchived: boolean;
  type: 'quest' | 'system' | 'character' | 'location';
  senderId?: string;
  metadata?: Record<string, any>;
}

/**
 * Состояние сообщений
 */
interface MessagesState {
  newMessages: Message[];
  archiveMessages: Message[];
  hasUnreadMessages: boolean;
  initialized: boolean;
}

/**
 * Типы действий с сообщениями
 */
type MessagesAction = 
  | { type: 'INITIALIZE'; payload: MessagesState }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'MARK_AS_READ'; payload: string }
  | { type: 'ARCHIVE_MESSAGE'; payload: string }
  | { type: 'SET_INITIALIZED'; payload: boolean };

/**
 * Начальное состояние для сообщений
 */
const initialState: MessagesState = {
  newMessages: [],
  archiveMessages: [],
  hasUnreadMessages: false,
  initialized: false
};

/**
 * Reducer для обработки действий с сообщениями
 */
function messagesReducer(state: MessagesState, action: MessagesAction): MessagesState {
  switch (action.type) {
    case 'INITIALIZE':
      return {
        ...action.payload,
        initialized: true
      };
    
    case 'ADD_MESSAGE':
      return {
        ...state,
        newMessages: [...state.newMessages, action.payload],
        hasUnreadMessages: true
      };
    
    case 'MARK_AS_READ':
      const updatedNewMessages = state.newMessages.map(message => 
        message.id === action.payload 
          ? { ...message, isRead: true } 
          : message
      );
      
      // Проверяем, остались ли непрочитанные сообщения
      const stillHasUnread = updatedNewMessages.some(message => !message.isRead);
      
      return {
        ...state,
        newMessages: updatedNewMessages,
        hasUnreadMessages: stillHasUnread
      };
    
    case 'ARCHIVE_MESSAGE':
      // Находим сообщение для архивации
      const messageToArchive = state.newMessages.find(
        message => message.id === action.payload
      );
      
      if (!messageToArchive) {
        return state;
      }
      
      // Архивируем сообщение
      const archivedMessage = {
        ...messageToArchive,
        isArchived: true,
        isRead: true // При архивации считаем сообщение прочитанным
      };
      
      // Убираем из новых и добавляем в архив
      return {
        ...state,
        newMessages: state.newMessages.filter(
          message => message.id !== action.payload
        ),
        archiveMessages: [...state.archiveMessages, archivedMessage],
        hasUnreadMessages: state.newMessages.filter(
          message => message.id !== action.payload && !message.isRead
        ).length > 0
      };
    
    case 'SET_INITIALIZED':
      return {
        ...state,
        initialized: action.payload
      };
    
    default:
      return state;
  }
}

/**
 * Хук для управления сообщениями пользователя с сохранением в localStorage
 */
export function useMessagesReducer(playerId?: string) {
  const [state, dispatch] = useReducer(messagesReducer, initialState);
  
  // Загрузка сообщений из localStorage
  useEffect(() => {
    if (!playerId) return;
    
    const loadMessages = () => {
      try {
        const key = `messages_${playerId}`;
        const savedData = localStorage.getItem(key);
        
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          dispatch({ type: 'INITIALIZE', payload: parsedData });
        } else {
          // Если данных нет, устанавливаем только флаг инициализации
          dispatch({ type: 'SET_INITIALIZED', payload: true });
        }
      } catch (error) {
        console.error('Error loading messages from localStorage:', error);
        // В случае ошибки также устанавливаем флаг инициализации
        dispatch({ type: 'SET_INITIALIZED', payload: true });
      }
    };
    
    loadMessages();
  }, [playerId]);
  
  // Сохранение сообщений в localStorage при изменении состояния
  useEffect(() => {
    if (!playerId || !state.initialized) return;
    
    try {
      const key = `messages_${playerId}`;
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving messages to localStorage:', error);
    }
  }, [state, playerId]);
  
  // Методы для работы с сообщениями
  const markAsRead = (messageId: string) => {
    dispatch({ type: 'MARK_AS_READ', payload: messageId });
  };
  
  const archiveMessage = (messageId: string) => {
    dispatch({ type: 'ARCHIVE_MESSAGE', payload: messageId });
  };
  
  const addMessage = (message: Message) => {
    dispatch({ type: 'ADD_MESSAGE', payload: message });
  };
  
  const loadMessages = () => {
    if (!playerId) return;
    
    try {
      const key = `messages_${playerId}`;
      const savedData = localStorage.getItem(key);
      
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        dispatch({ type: 'INITIALIZE', payload: parsedData });
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };
  
  return {
    messages: state.newMessages,
    unreadCount: state.newMessages.filter(m => !m.isRead).length,
    archivedMessages: state.archiveMessages,
    hasUnreadMessages: state.hasUnreadMessages,
    markAsRead,
    archiveMessage,
    addMessage,
    loadMessages
  };
} 