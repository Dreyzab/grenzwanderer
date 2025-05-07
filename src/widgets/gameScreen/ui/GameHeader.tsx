import React from 'react';

interface GameHeaderProps {
  onOpenMessages: () => void;
  hasUnreadMessages: boolean;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  onOpenMessages,
  hasUnreadMessages
}) => {
  return (
    <div className="quest-map-header">
      <h2>Карта квестов</h2>
      <button
        className="messages-button"
        onClick={onOpenMessages}
      >
        Сообщения
        {hasUnreadMessages && <div className="notification-badge"></div>}
      </button>
    </div>
  );
}; 