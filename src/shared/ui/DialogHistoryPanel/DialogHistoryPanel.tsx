import React from 'react';

export interface DialogHistoryItem {
  speaker?: string;
  text: string;
}

export interface DialogHistoryPanelProps {
  /**
   * Массив элементов истории диалогов
   */
  history: DialogHistoryItem[];
  
  /**
   * Флаг, определяющий открыто ли панель истории
   */
  isOpen: boolean;
  
  /**
   * Callback, вызываемый при закрытии панели
   */
  onClose: () => void;
}

/**
 * Компонент для отображения истории диалогов в визуальной новелле
 */
export const DialogHistoryPanel: React.FC<DialogHistoryPanelProps> = ({
  history,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[80vh] overflow-auto bg-surface p-6 rounded-lg shadow-lg">
        <button 
          className="absolute top-2 right-2 text-text-secondary hover:text-text-primary" 
          onClick={onClose}
        >
          ✕
        </button>
        
        <h2 className="text-2xl font-heading mb-4 text-text-primary">История диалогов</h2>
        
        <div className="space-y-4">
          {history.length > 0 ? (
            history.map((item, index) => (
              <div key={index} className="mb-3 last:mb-0">
                {item.speaker && (
                  <p className="text-accent font-bold">{item.speaker}</p>
                )}
                <p className="text-text-primary">{item.text}</p>
              </div>
            ))
          ) : (
            <p className="text-text-secondary italic">История диалогов пуста</p>
          )}
        </div>
      </div>
    </div>
  );
}; 