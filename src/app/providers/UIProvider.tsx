import { ReactNode, createContext, useContext, useState } from 'react';
import { Modal } from '@/shared/ui';

// Типы для глобальных модальных окон
type ModalId = 'settings' | 'confirm' | 'notification';

// Типы для контекста UI
interface UIContextType {
  // Методы для модальных окон
  openModal: (id: ModalId, data?: any) => void;
  closeModal: (id: ModalId) => void;
  
  // Методы для уведомлений
  showNotification: (message: string, type?: 'info' | 'success' | 'error' | 'warning') => void;
}

// Создаем контекст
const UIContext = createContext<UIContextType>({
  openModal: () => {},
  closeModal: () => {},
  showNotification: () => {}
});

// Хук для использования UI контекста
export const useUI = () => useContext(UIContext);

// Компонент для подтверждения действия
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  onConfirm: () => void;
}

const ConfirmModal = ({
  isOpen,
  onClose,
  title,
  message,
  onConfirm
}: ConfirmModalProps) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
    >
      <div className="p-md">
        <p className="text-text-primary mb-lg">{message}</p>
        <div className="flex justify-end gap-md">
          <button 
            className="px-md py-sm rounded bg-surface hover:bg-surface-hover text-text-primary"
            onClick={onClose}
          >
            Отмена
          </button>
          <button 
            className="px-md py-sm rounded bg-error hover:bg-error/80 text-white"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Подтвердить
          </button>
        </div>
      </div>
    </Modal>
  );
};

// Компонент для уведомлений
interface NotificationProps {
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
  onClose: () => void;
}

const Notification = ({ message, type, onClose }: NotificationProps) => {
  // Определяем цвета на основе типа
  let bgColor = 'bg-info';
  if (type === 'success') bgColor = 'bg-success';
  if (type === 'error') bgColor = 'bg-error';
  if (type === 'warning') bgColor = 'bg-warning';
  
  return (
    <div className={`${bgColor} text-white p-md rounded-lg shadow-md flex justify-between items-center`}>
      <span>{message}</span>
      <button 
        onClick={onClose}
        className="ml-md text-white/80 hover:text-white"
      >
        ×
      </button>
    </div>
  );
};

// Провайдер UI
export const UIProvider = ({ children }: { children: ReactNode }) => {
  // Состояние для модальных окон
  const [modals, setModals] = useState<Record<ModalId, { isOpen: boolean; data?: any }>>({
    settings: { isOpen: false },
    confirm: { isOpen: false, data: { title: '', message: '', onConfirm: () => {} } },
    notification: { isOpen: false, data: { message: '', type: 'info' } }
  });
  
  // Состояние для уведомлений
  const [notifications, setNotifications] = useState<{ id: number; message: string; type: 'info' | 'success' | 'error' | 'warning' }[]>([]);
  
  // Методы для модальных окон
  const openModal = (id: ModalId, data?: any) => {
    setModals(prev => ({
      ...prev,
      [id]: { isOpen: true, data }
    }));
  };
  
  const closeModal = (id: ModalId) => {
    setModals(prev => ({
      ...prev,
      [id]: { ...prev[id], isOpen: false }
    }));
  };
  
  // Методы для уведомлений
  const showNotification = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    
    // Автоматически удаляем уведомление через 5 секунд
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };
  
  return (
    <UIContext.Provider value={{ openModal, closeModal, showNotification }}>
      {children}
      
      {/* Глобальные модальные окна */}
      <Modal 
        isOpen={modals.settings.isOpen} 
        onClose={() => closeModal('settings')}
        title="Настройки"
      >
        {/* Содержимое настроек */}
        <div className="p-md">
          <p>Содержимое настроек</p>
        </div>
      </Modal>
      
      {/* Модальное окно подтверждения */}
      <ConfirmModal 
        isOpen={modals.confirm.isOpen}
        onClose={() => closeModal('confirm')}
        title={modals.confirm.data?.title || 'Подтверждение'}
        message={modals.confirm.data?.message || 'Вы уверены?'}
        onConfirm={modals.confirm.data?.onConfirm || (() => {})}
      />
      
      {/* Контейнер для уведомлений */}
      {notifications.length > 0 && (
        <div className="fixed top-0 right-0 p-md flex flex-col gap-md z-index-toast">
          {notifications.map(notification => (
            <Notification 
              key={notification.id}
              message={notification.message}
              type={notification.type}
              onClose={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
            />
          ))}
        </div>
      )}
    </UIContext.Provider>
  );
}; 