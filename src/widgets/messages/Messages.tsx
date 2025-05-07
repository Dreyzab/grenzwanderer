import React, { useState } from 'react';
import { Message } from '../../hooks/useMessages';
import { MessageList } from './MessageList';
import { MessageDetails } from './MessageDetails';
import './MessageStyles.css';

interface MessagesProps {
  newMessages: Message[];
  archiveMessages: Message[];
  onBackClick: () => void;
  onOpenMap: () => void;
  onStartQuest: () => void;
  markMessageAsRead: (id: string) => void;
}

export const Messages: React.FC<MessagesProps> = ({
  newMessages,
  archiveMessages,
  onBackClick,
  onOpenMap,
  onStartQuest,
  markMessageAsRead
}) => {
  const [activeTab, setActiveTab] = useState<'new' | 'archive'>('new');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  const handleMessageClick = (message: Message) => {
    setSelectedMessage(message);
    if (!message.read) {
      markMessageAsRead(message.id);
    }
  };

  const handleBackToList = () => {
    setSelectedMessage(null);
  };

  // Если выбрано сообщение, показываем его детали
  if (selectedMessage) {
    return (
      <MessageDetails 
        message={selectedMessage} 
        onBackClick={handleBackToList}
        onMapClick={onOpenMap}
        onStartQuest={onStartQuest}
      />
    );
  }

  return (
    <div className="messages-container">
      <div className="messages-header">
        <h1>Сообщения</h1>
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'new' ? 'active' : ''}`}
            onClick={() => setActiveTab('new')}
          >
            Новые {newMessages.length > 0 && <span className="badge">{newMessages.length}</span>}
          </button>
          <button 
            className={`tab ${activeTab === 'archive' ? 'active' : ''}`}
            onClick={() => setActiveTab('archive')}
          >
            Архив
          </button>
        </div>
      </div>
      
      <div className="messages-content">
        <MessageList
          messages={activeTab === 'new' ? newMessages : archiveMessages}
          onMessageClick={handleMessageClick}
          activeTab={activeTab}
        />
      </div>
      
      <div className="messages-footer">
        <button className="back-button" onClick={onBackClick}>
          Вернуться к карте
        </button>
      </div>
    </div>
  );
}; 