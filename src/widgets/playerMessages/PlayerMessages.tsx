import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { useMessagesReducer, Message as ApiMessage } from '../../features/messages/api/useMessages';

export type PlayerMessageType = 'quest' | 'npc' | 'system' | 'event';
export type MessagePriority = 'low' | 'normal' | 'high' | 'urgent';

export interface MessageAction {
  label: string;
  onClick: () => void;
}

export interface EnhancedMessage extends ApiMessage {
  priority?: MessagePriority;
  actions?: MessageAction[];
}

interface PlayerMessagesProps {
  playerId?: string;
  className?: string;
}

// Адаптер для преобразования API сообщения в формат для отображения
const adaptMessage = (message: ApiMessage): EnhancedMessage => {
  let priority: MessagePriority = 'normal';
  
  if (message.metadata?.priority) {
    priority = message.metadata.priority as MessagePriority;
  } else if (message.type === 'quest') {
    priority = 'high';
  } else if (message.type === 'system') {
    priority = 'urgent';
  }
  
  return {
    ...message,
    priority
  };
};

export const PlayerMessages: React.FC<PlayerMessagesProps> = ({
  playerId,
  className
}) => {
  const [activeTab, setActiveTab] = useState<'new' | 'archive'>('new');
  const [selectedMessage, setSelectedMessage] = useState<EnhancedMessage | null>(null);
  const [sortedMessages, setSortedMessages] = useState<Record<string, EnhancedMessage[]>>({});
  const [showDropdown, setShowDropdown] = useState(false);
  const [sortBy, setSortBy] = useState<'time' | 'sender' | 'type'>('time');

  // Используем хук из features вместо дублирования логики
  const { 
    messages,
    archivedMessages,
    markAsRead,
    archiveMessage,
    hasUnreadMessages
  } = useMessagesReducer(playerId);
  
  // Сортировка и группировка сообщений
  useEffect(() => {
    const currentMessages = activeTab === 'new' ? messages : archivedMessages;
    const adaptedMessages = currentMessages.map(adaptMessage);
    
    // Сортировка по времени
    const sortedByTime = [...adaptedMessages].sort((a, b) => 
      b.timestamp - a.timestamp
    );
    
    if (sortBy === 'time') {
      setSortedMessages({ '': sortedByTime });
      return;
    }
    
    // Группировка по отправителям или типам
    const grouped = sortedByTime.reduce<Record<string, EnhancedMessage[]>>((acc, message) => {
      const key = sortBy === 'sender' ? (message.senderId || 'Система') : message.type;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(message);
      return acc;
    }, {});
    
    setSortedMessages(grouped);
  }, [messages, archivedMessages, activeTab, sortBy]);

  const handleMessageClick = (message: EnhancedMessage) => {
    setSelectedMessage(selectedMessage?.id === message.id ? null : message);
    
    if (!message.isRead) {
      markAsRead(message.id);
    }
  };

  const handleArchiveMessage = (messageId: string) => {
    archiveMessage(messageId);
    setSelectedMessage(null);
  };

  const handleTabChange = (tab: 'new' | 'archive') => {
    setActiveTab(tab);
    setSelectedMessage(null);
  };

  const getMessagePriorityClasses = (priority: MessagePriority = 'normal') => {
    switch (priority) {
      case 'urgent':
        return 'border-l-4 border-error bg-error/10';
      case 'high':
        return 'border-l-4 border-warning bg-warning/5';
      case 'low':
        return 'border-l-4 border-info/50 bg-info/5';
      default:
        return 'border-l-4 border-gray-600 bg-surface-hover/30';
    }
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'quest':
        return (
          <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"></path>
          </svg>
        );
      case 'npc':
      case 'character':
        return (
          <svg className="w-5 h-5 text-warning" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
          </svg>
        );
      case 'system':
        return (
          <svg className="w-5 h-5 text-info" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
          </svg>
        );
      case 'location':
        return (
          <svg className="w-5 h-5 text-error" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z" clipRule="evenodd"></path>
          </svg>
        );
      default:
        return null;
    }
  };

  const unreadCount = messages.filter(msg => !msg.isRead).length;

  return (
    <div className={clsx("bg-surface rounded-lg border border-gray-800 shadow-xl overflow-hidden", className)}>
      <div className="border-b border-gray-800">
        <div className="flex justify-between items-center p-3">
          <h2 className="text-lg font-heading text-text-primary flex items-center">
            <svg className="w-5 h-5 mr-2 text-accent" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
            </svg>
            Сообщения
          </h2>
          
          <div className="relative">
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-2 rounded-full hover:bg-surface-hover/50 active:scale-95 transition-all duration-150"
            >
              <svg className="w-5 h-5 text-text-secondary" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path>
              </svg>
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 top-full mt-1 bg-surface-hover border border-gray-700 rounded-md shadow-lg z-dropdown animate-scale-in">
                <div className="py-1 text-sm">
                  <button 
                    className="px-4 py-2 hover:bg-black/20 w-full text-left flex items-center gap-2"
                    onClick={() => { setSortBy('time'); setShowDropdown(false); }}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path>
                    </svg>
                    По времени
                  </button>
                  <button 
                    className="px-4 py-2 hover:bg-black/20 w-full text-left flex items-center gap-2"
                    onClick={() => { setSortBy('sender'); setShowDropdown(false); }}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
                    </svg>
                    По отправителям
                  </button>
                  <button 
                    className="px-4 py-2 hover:bg-black/20 w-full text-left flex items-center gap-2"
                    onClick={() => { setSortBy('type'); setShowDropdown(false); }}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd"></path>
                    </svg>
                    По типу
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex border-t border-gray-800">
          <button
            className={clsx(
              "py-2 px-4 relative text-sm font-medium flex-1 flex items-center justify-center hover:bg-surface-hover/30 transition-colors",
              activeTab === 'new' ? 'text-accent' : 'text-text-secondary',
              "border-b-2",
              activeTab === 'new' ? 'border-accent' : 'border-transparent'
            )}
            onClick={() => handleTabChange('new')}
          >
            Новые
            {unreadCount > 0 && (
              <span className="ml-2 bg-accent text-black text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          
          <button
            className={clsx(
              "py-2 px-4 text-sm font-medium flex-1 hover:bg-surface-hover/30 transition-colors",
              activeTab === 'archive' ? 'text-accent' : 'text-text-secondary',
              "border-b-2",
              activeTab === 'archive' ? 'border-accent' : 'border-transparent'
            )}
            onClick={() => handleTabChange('archive')}
          >
            Архив
          </button>
        </div>
      </div>
      
      <div className="message-list">
        {/* Если нет сообщений, показываем пустое состояние */}
        {Object.keys(sortedMessages).length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 px-4">
            <svg className="w-16 h-16 text-gray-600 mb-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd"></path>
            </svg>
            <p className="text-gray-500 text-center">
              {activeTab === 'new' ? 'У вас нет новых сообщений' : 'Ваш архив пуст'}
            </p>
          </div>
        )}
        
        {/* Отображаем сгруппированные сообщения */}
        {Object.entries(sortedMessages).map(([key, messages]) => (
          <div key={key} className="message-group">
            {key && sortBy !== 'time' && (
              <div className="message-group-header px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-gray-900/30">
                {key}
              </div>
            )}
            
            {messages.map((message) => {
              return (
                <div
                  key={message.id}
                  className={clsx(
                    "px-4 py-3 border-b border-gray-800 hover:bg-surface-hover/40 cursor-pointer",
                    getMessagePriorityClasses(message.priority),
                    !message.isRead && "bg-accent/5",
                    selectedMessage?.id === message.id && "bg-surface-hover"
                  )}
                  onClick={() => handleMessageClick(message)}
                >
                  <div className="flex items-start gap-3">
                    <div className="message-icon p-2 rounded-full bg-gray-800/50">
                      {getMessageTypeIcon(message.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm text-text-primary truncate pr-4">
                        {message.title}
                      </h3>
                      
                      <p className="text-xs text-text-secondary line-clamp-2 mt-1">
                        {message.content}
                      </p>
                      
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-500">
                          {new Date(message.timestamp).toLocaleString()}
                        </span>
                        
                        {!message.isRead && (
                          <span className="bg-accent/90 h-2 w-2 rounded-full"></span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {selectedMessage?.id === message.id && (
                    <div className="message-actions mt-3 pt-3 border-t border-gray-700/50 flex gap-2">
                      <button 
                        className="text-xs py-1 px-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleArchiveMessage(message.id);
                        }}
                      >
                        {activeTab === 'new' ? 'Архивировать' : 'Удалить'}
                      </button>
                      
                      {message.actions?.map((action: MessageAction, index: number) => (
                        <button
                          key={index}
                          className="text-xs py-1 px-2 bg-accent/20 hover:bg-accent/30 text-accent rounded"
                          onClick={(e) => {
                            e.stopPropagation();
                            action.onClick();
                          }}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}; 