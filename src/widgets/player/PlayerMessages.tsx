import React from 'react';

interface PlayerMessagesProps {
  messages?: Array<{
    id: string;
    content: string;
    isRead: boolean;
    timestamp: string;
    type: 'system' | 'quest' | 'social' | 'item';
  }>;
  onMessageClick?: (messageId: string) => void;
  onClearAll?: () => void;
}

/**
 * Виджет для отображения сообщений игрока
 * Используется как центр уведомлений и событий
 */
export const PlayerMessages: React.FC<PlayerMessagesProps> = ({
  messages = [],
  onMessageClick,
  onClearAll
}) => {
  if (messages.length === 0) {
    return (
      <div className="player-messages-container empty">
        <div className="player-messages-empty-state">
          <p>У вас нет новых сообщений</p>
        </div>
      </div>
    );
  }

  return (
    <div className="player-messages-container">
      <div className="player-messages-header">
        <h2>Ваши сообщения</h2>
        {messages.length > 0 && (
          <button 
            className="clear-all-button"
            onClick={onClearAll}
          >
            Очистить все
          </button>
        )}
      </div>
      
      <div className="player-messages-list">
        {messages.map(message => (
          <div 
            key={message.id}
            className={`message-item ${message.isRead ? 'read' : 'unread'} ${message.type}`}
            onClick={() => onMessageClick && onMessageClick(message.id)}
          >
            <div className="message-content">{message.content}</div>
            <div className="message-timestamp">{message.timestamp}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
