import React, { useState } from 'react';
import { Message } from '../../hooks/useMessages';
import { MessageList } from './MessageList';
import { MessageDetails } from './MessageDetails';
import './MessageStyles.css';

interface DialogScreenProps {
  newMessages: Message[];
  archiveMessages: Message[];
  onExitClick: () => void;
  onOpenMap: () => void;
  onOpenNovel: (message: Message) => void;
  markMessageAsRead: (messageId: string) => void;
}

export const DialogScreen: React.FC<DialogScreenProps> = ({ 
  newMessages, 
  archiveMessages, 
  onExitClick, 
  onOpenMap, 
  onOpenNovel,
  markMessageAsRead
}) => {
  const [activeTab, setActiveTab] = useState<'new' | 'archive'>('new');
  const [activeMessage, setActiveMessage] = useState<Message | null>(null);
  
  // Получаем список сообщений в зависимости от активной вкладки
  const currentMessages = activeTab === 'new' ? newMessages : archiveMessages;
  
  // Обработчик клика по сообщению
  const handleMessageClick = (message: Message) => {
    setActiveMessage(message);
    markMessageAsRead(message.id);
  };
  
  // Обработчик возврата к списку сообщений
  const handleBackClick = () => {
    setActiveMessage(null);
  };
  
  // Обработчик перехода к карте
  const handleMapClick = () => {
    if (activeMessage) {
      markMessageAsRead(activeMessage.id);
    }
    onOpenMap();
  };
  
  // Обработчик начала задания
  const handleStartQuest = () => {
    if (activeMessage) {
      onOpenNovel(activeMessage);
    }
  };
  
  // Показываем детали сообщения, если выбрано сообщение
  if (activeMessage) {
    return (
      <MessageDetails 
        message={activeMessage}
        onBackClick={handleBackClick}
        onMapClick={handleMapClick}
        onStartQuest={handleStartQuest}
      />
    );
  }
  
  return (
    <div className="dialog-screen">
      <div className="dialog-header">
        <h2>Коммуникатор</h2>
        <div className="dialog-tabs">
          <button 
            className={`dialog-tab ${activeTab === 'new' ? 'active' : ''}`}
            onClick={() => setActiveTab('new')}
          >
            Новые сообщения
            {newMessages.length > 0 && (
              <span className="messages-count">{newMessages.length}</span>
            )}
          </button>
          <button 
            className={`dialog-tab ${activeTab === 'archive' ? 'active' : ''}`}
            onClick={() => setActiveTab('archive')}
          >
            Архив
          </button>
        </div>
      </div>
      
      <div className="dialog-content">
        <MessageList 
          messages={currentMessages}
          onMessageClick={handleMessageClick}
          activeTab={activeTab}
        />
      </div>
      
      <div className="dialog-footer">
        <button className="exit-dialog" onClick={onExitClick}>
          Вернуться к карте
        </button>
      </div>
    </div>
  );
};