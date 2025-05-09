import React from 'react';
import { Marker } from './QRMarkerWidget';

interface MarkerInfoPopupWidgetProps {
  marker: Marker;
  onClose: () => void;
  onNavigate: () => void;
  onScan: () => void;
  onToggleComplete: () => void;
}

/**
 * Виджет всплывающего окна с информацией о маркере
 * Отображает название, описание и доступные действия для маркера
 */
export const MarkerInfoPopupWidget: React.FC<MarkerInfoPopupWidgetProps> = ({
  marker,
  onClose,
  onNavigate,
  onScan,
  onToggleComplete
}) => {
  // Тип информации для отображения в зависимости от типа маркера
  const getTypeInfo = (type: string): { label: string; icon: string } => {
    switch (type) {
      case 'quest':
        return { label: 'Квест', icon: '⚔️' };
      case 'location':
        return { label: 'Место', icon: '📍' };
      case 'npc':
        return { label: 'Персонаж', icon: '👤' };
      case 'shop':
        return { label: 'Магазин', icon: '🛒' };
      case 'shelter':
        return { label: 'Убежище', icon: '🏠' };
      case 'danger':
        return { label: 'Опасность', icon: '⚠️' };
      default:
        return { label: 'Точка', icon: '📍' };
    }
  };
  
  // Проверка, заблокирован ли маркер
  const isLocked = marker.status === 'locked';
  
  // Информация о типе маркера
  const typeInfo = getTypeInfo(marker.type);
  
  return (
    <div className="fixed inset-x-4 bottom-20 bg-surface rounded-lg shadow-xl z-50 max-w-md mx-auto">
      {/* Заголовок с кнопкой закрытия */}
      <div className="flex justify-between items-center p-4 border-b border-surface-variant">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{typeInfo.icon}</span>
          <div>
            <h3 className="text-lg font-medium">{marker.title}</h3>
            <div className="text-xs text-text-secondary">{typeInfo.label}</div>
          </div>
        </div>
        <button 
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-variant"
          onClick={onClose}
          aria-label="Закрыть"
        >
          <span className="text-xl">×</span>
        </button>
      </div>
      
      {/* Основное содержимое */}
      <div className="p-4">
        {/* Описание маркера */}
        {marker.description && (
          <div className="mb-4 text-text-primary">
            {marker.description}
          </div>
        )}
        
        {/* Статус */}
        <div className="mb-4 flex items-center gap-2">
          <div className="text-sm text-text-secondary">Статус:</div>
          <div className={`
            text-sm px-2 py-0.5 rounded-full 
            ${marker.status === 'active' ? 'bg-accent/20 text-accent' : ''}
            ${marker.status === 'completed' ? 'bg-success/20 text-success' : ''}
            ${marker.status === 'locked' ? 'bg-surface-variant text-text-disabled' : ''}
            ${marker.status === 'new' ? 'bg-primary/20 text-primary' : ''}
          `}>
            {marker.status === 'active' && 'Активно'}
            {marker.status === 'completed' && 'Завершено'}
            {marker.status === 'locked' && 'Заблокировано'}
            {marker.status === 'new' && 'Новое'}
          </div>
        </div>
      </div>
      
      {/* Действия */}
      <div className="flex border-t border-surface-variant">
        {/* Кнопка навигации */}
        <button 
          className={`
            flex-1 py-3 flex items-center justify-center gap-1
            ${isLocked ? 'text-text-disabled' : 'text-accent'}
          `}
          disabled={isLocked}
          onClick={onNavigate}
        >
          <span className="material-icons text-sm">directions</span>
          <span>Маршрут</span>
        </button>
        
        {/* Кнопка сканирования */}
        <button 
          className={`
            flex-1 py-3 flex items-center justify-center gap-1 border-l border-surface-variant
            ${isLocked ? 'text-text-disabled' : 'text-accent'}
          `}
          disabled={isLocked}
          onClick={onScan}
        >
          <span className="material-icons text-sm">qr_code_scanner</span>
          <span>Сканировать</span>
        </button>
        
        {/* Кнопка для отметки как выполненное */}
        {['active', 'completed'].includes(marker.status) && (
          <button 
            className={`
              flex-1 py-3 flex items-center justify-center gap-1 border-l border-surface-variant
              ${marker.status === 'completed' ? 'text-success' : 'text-accent'}
            `}
            onClick={onToggleComplete}
          >
            <span className="material-icons text-sm">
              {marker.status === 'completed' ? 'undo' : 'check'}
            </span>
            <span>
              {marker.status === 'completed' ? 'Отменить' : 'Выполнено'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

export default MarkerInfoPopupWidget; 