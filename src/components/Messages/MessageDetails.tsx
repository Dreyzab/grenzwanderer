import React from 'react';
import { Message } from '../../hooks/useMessages';
import './MessageStyles.css';

interface MessageDetailsProps {
  message: Message;
  onBackClick: () => void;
  onMapClick: () => void;
  onStartQuest: () => void;
}

export const MessageDetails: React.FC<MessageDetailsProps> = ({ 
  message, 
  onBackClick, 
  onMapClick,
  onStartQuest 
}) => {
  return (
    <div className="message-details">
      <div className="message-header">
        <h2>{message.title}</h2>
        <div className="message-meta">
          <span>От: {message.sender}</span>
          <span>Дата: {message.date}</span>
        </div>
      </div>
      
      <div className="message-content">
        <p>{message.content}</p>
      </div>
      
      <div className="message-actions">
        {message.mapPoints && (
          <button 
            className="action-button map"
            onClick={onMapClick}
          >
            Посмотреть на карте
          </button>
        )}
        {/* Показываем кнопку "Начать задание" только для новых сообщений */}
        {message.sceneKey && !message.read && (
          <button 
            className="action-button primary"
            onClick={onStartQuest}
          >
            Начать задание
          </button>
        )}
        <button 
          className="action-button secondary"
          onClick={onBackClick}
        >
          Назад к списку
        </button>
      </div>
    </div>
  );
};