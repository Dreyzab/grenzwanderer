import React from 'react';
import { Message } from '../../hooks/useMessages';
import './MessageStyles.css';

interface MessageListProps {
  messages: Message[];
  onMessageClick: (message: Message) => void;
  activeTab?: 'new' | 'archive';
}

export const MessageList: React.FC<MessageListProps> = ({ 
  messages, 
  onMessageClick,
  activeTab
}) => {
  if (messages.length === 0) {
    return (
      <div className="empty-messages">
        <p>
          {activeTab === 'new' 
            ? 'У вас нет новых сообщений' 
            : 'Архив сообщений пуст'}
        </p>
      </div>
    );
  }

  return (
    <div className="message-list">
      {messages.map((message) => (
        <div 
          key={message.id}
          className={`message-item ${!message.read ? 'unread' : ''}`}
          onClick={() => onMessageClick(message)}
        >
          <div className="message-title">{message.title}</div>
          <div className="message-info">
            <span className="message-sender">{message.sender}</span>
            <span className="message-date">{message.date}</span>
          </div>
        </div>
      ))}
    </div>
  );
}; 