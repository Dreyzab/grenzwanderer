import { useEffect, useReducer } from 'react';
import { Id } from '../../../../convex/_generated/dataModel';

export interface Message {
  id: string;
  title: string;
  content: string;
  timestamp: number;
  read: boolean;
  isArchived: boolean;
  category?: string;
  sender?: string;
  questState?: string;
}

interface MessagesState {
  newMessages: Message[];
  archiveMessages: Message[];
  hasUnreadMessages: boolean;
}

type MessagesAction = 
  | { type: 'LOAD_MESSAGES'; messages: Message[] }
  | { type: 'MARK_AS_READ'; messageId: string }
  | { type: 'ARCHIVE_MESSAGE'; messageId: string }
  | { type: 'ADD_MESSAGE'; message: Message };

function messagesReducer(state: MessagesState, action: MessagesAction): MessagesState {
  switch (action.type) {
    case 'LOAD_MESSAGES':
      return {
        newMessages: action.messages.filter(msg => !msg.isArchived),
        archiveMessages: action.messages.filter(msg => msg.isArchived),
        hasUnreadMessages: action.messages.some(msg => !msg.read)
      };
    case 'MARK_AS_READ':
      // Обновляем статус сообщения в обоих списках
      const updatedNew = state.newMessages.map(msg => 
        msg.id === action.messageId ? { ...msg, read: true } : msg
      );
      
      const updatedArchive = state.archiveMessages.map(msg => 
        msg.id === action.messageId ? { ...msg, read: true } : msg
      );
      
      return {
        newMessages: updatedNew,
        archiveMessages: updatedArchive,
        hasUnreadMessages: [...updatedNew, ...updatedArchive].some(msg => !msg.read)
      };
    case 'ARCHIVE_MESSAGE':
      // Находим сообщение для архивации
      const messageToArchive = state.newMessages.find(msg => msg.id === action.messageId);
      
      if (!messageToArchive) {
        return state;
      }
      
      // Удаляем из новых и добавляем в архив
      return {
        newMessages: state.newMessages.filter(msg => msg.id !== action.messageId),
        archiveMessages: [...state.archiveMessages, { ...messageToArchive, isArchived: true }],
        hasUnreadMessages: state.hasUnreadMessages
      };
    case 'ADD_MESSAGE':
      return {
        newMessages: [...state.newMessages, action.message],
        archiveMessages: state.archiveMessages,
        hasUnreadMessages: true
      };
    default:
      return state;
  }
}

export function useMessagesReducer(playerId: Id<"players"> | undefined) {
  const [state, dispatch] = useReducer(messagesReducer, {
    newMessages: [],
    archiveMessages: [],
    hasUnreadMessages: false
  });
  
  // Функция для получения сообщений из хранилища
  const loadMessages = () => {
    if (!playerId) return;
    
    try {
      const storedMessages = localStorage.getItem(`messages_${playerId}`);
      
      if (storedMessages) {
        const messages = JSON.parse(storedMessages) as Message[];
        dispatch({ type: 'LOAD_MESSAGES', messages });
      }
    } catch (e) {
      console.error('Ошибка при загрузке сообщений:', e);
    }
  };
  
  // Загружаем сообщения при монтировании
  useEffect(() => {
    if (playerId) {
      loadMessages();
    }
  }, [playerId]);
  
  // Функция для сохранения сообщений в хранилище
  const saveMessages = (messages: Message[]) => {
    if (!playerId) return;
    
    try {
      localStorage.setItem(`messages_${playerId}`, JSON.stringify(messages));
    } catch (e) {
      console.error('Ошибка при сохранении сообщений:', e);
    }
  };
  
  // Сохраняем изменения в хранилище
  useEffect(() => {
    if (playerId) {
      const allMessages = [...state.newMessages, ...state.archiveMessages];
      saveMessages(allMessages);
    }
  }, [state.newMessages, state.archiveMessages, playerId]);
  
  // Функция для отметки сообщения как прочитанного
  const markMessageAsRead = (messageId: string) => {
    dispatch({ type: 'MARK_AS_READ', messageId });
  };
  
  // Функция для архивации сообщения
  const archiveMessage = (messageId: string) => {
    dispatch({ type: 'ARCHIVE_MESSAGE', messageId });
  };
  
  // Функция для добавления нового сообщения
  const addMessage = (message: Message) => {
    dispatch({ type: 'ADD_MESSAGE', message });
  };
  
  return {
    ...state,
    markMessageAsRead,
    archiveMessage,
    addMessage,
    loadMessages
  };
} 