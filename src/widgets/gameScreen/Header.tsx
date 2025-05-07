import React from 'react';
import { useUnit } from 'effector-react';
import { $currentUser } from '../../entities/user/model';
import { HeaderProps } from '../../shared/types/gameScreen';
import { useUnreadMessages } from '../../features/messages/api/useUnreadMessages';
import './Header.css';

export const Header: React.FC<HeaderProps> = ({ onOpenDialog, onOpenInventory }) => {
  const user = useUnit($currentUser);
  const { hasUnreadMessages } = useUnreadMessages(user?.id);
  
  return (
    <header className="game-header">
      <div className="header-controls">
        <button 
          className="header-button dialog-button"
          onClick={onOpenDialog}
        >
          Диалог
          {hasUnreadMessages && <div className="message-indicator"></div>}
        </button>
        <button 
          className="header-button inventory-button"
          onClick={onOpenInventory}
        >
          Инвентарь
        </button>
      </div>
    </header>
  );
}; 