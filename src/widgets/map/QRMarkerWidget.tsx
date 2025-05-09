import React from 'react';

export type MarkerStatus = 'active' | 'completed' | 'hidden' | 'locked' | 'new';
export type MarkerType = 'quest' | 'location' | 'npc' | 'shop' | 'shelter' | 'danger';

export interface Marker {
  id: string;
  title: string;
  description?: string;
  type: MarkerType;
  status: MarkerStatus;
  coordinates: { latitude: number, longitude: number };
  questId?: string;
  icon?: string;
}

interface QRMarkerWidgetProps {
  marker: Marker;
  onClick: () => void;
}

/**
 * Виджет для отображения маркера на карте
 * Включает иконку, состояние и обработку нажатия
 */
export const QRMarkerWidget: React.FC<QRMarkerWidgetProps> = ({
  marker,
  onClick
}) => {
  // Если маркер скрыт, не отрисовываем его
  if (marker.status === 'hidden') {
    return null;
  }
  
  // Получаем иконку и цвет в зависимости от типа и статуса маркера
  const getMarkerStyles = () => {
    // Базовые цвета для разных типов маркеров
    const typeColors = {
      quest: 'text-warning',
      location: 'text-info',
      npc: 'text-success',
      shop: 'text-primary',
      shelter: 'text-accent',
      danger: 'text-error',
    };
    
    // Иконки для разных типов маркеров
    const typeIcons = {
      quest: '⚔️',
      location: '📍',
      npc: '👤',
      shop: '🛒',
      shelter: '🏠',
      danger: '⚠️',
    };
    
    // Корректировка стилей в зависимости от статуса
    let statusModifier = '';
    let scaleClass = 'scale-100';
    let opacityClass = 'opacity-100';
    let animationClass = '';
    
    switch (marker.status) {
      case 'locked':
        opacityClass = 'opacity-50';
        break;
      case 'completed':
        statusModifier = 'line-through';
        opacityClass = 'opacity-75';
        break;
      case 'active':
        scaleClass = 'scale-110';
        animationClass = 'animate-pulse';
        break;
      case 'new':
        animationClass = 'animate-bounce';
        break;
    }
    
    return {
      icon: marker.icon || typeIcons[marker.type] || '📍',
      colorClass: typeColors[marker.type] || 'text-text-primary',
      statusClass: `${statusModifier} ${scaleClass} ${opacityClass} ${animationClass}`
    };
  };
  
  const { icon, colorClass, statusClass } = getMarkerStyles();
  
  // В реальном приложении здесь был бы код для позиционирования маркера на карте
  // на основе marker.coordinates. Здесь мы используем абсолютное позиционирование
  // с условными значениями
  const positionStyle = {
    // Вычисляем позицию на основе координат (это упрощенная реализация)
    left: `${50 + (marker.coordinates.longitude * 100) % 70}%`,
    top: `${50 + (marker.coordinates.latitude * 100) % 70}%`,
  };
  
  return (
    <div 
      className={`
        absolute transform -translate-x-1/2 -translate-y-1/2 z-20
        transition-all duration-300 ease-in-out
        ${statusClass}
      `}
      style={positionStyle}
      onClick={onClick}
    >
      <div className={`
        w-10 h-10 rounded-full bg-surface shadow-lg
        flex items-center justify-center text-xl
        cursor-pointer hover:scale-110 transition-transform
        border-2 border-surface-variant
        ${colorClass}
      `}>
        {icon}
      </div>
      
      {/* Название маркера */}
      {marker.status === 'active' && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-surface px-2 py-0.5 rounded-full shadow-md text-xs">
          {marker.title}
        </div>
      )}
    </div>
  );
};

export default QRMarkerWidget; 