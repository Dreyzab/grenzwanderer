import React, { useState } from 'react';
import { DialogHistoryPanel } from '@/shared/ui';

interface DialogHistoryProps {
  historyItems?: Array<{
    speakerName?: string;
    text: string;
  }>;
}

/**
 * Виджет для отображения истории диалогов
 * Используется в интерфейсе визуальной новеллы
 */
export const DialogHistory: React.FC<DialogHistoryProps> = ({
  historyItems = []
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleHistory = () => {
    setIsOpen(prev => !prev);
  };

  // Преобразуем формат истории для DialogHistoryPanel
  const formattedHistory = historyItems.map(item => ({
    speaker: item.speakerName,
    text: item.text
  }));

  return (
    <>
      <button 
        className="dialog-history-button"
        onClick={toggleHistory}
        title="История диалогов"
      >
        <span className="icon">📜</span>
      </button>
      
      <DialogHistoryPanel
        history={formattedHistory} 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </>
  );
}; 