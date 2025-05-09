import React, { useState, useEffect, useRef } from 'react';

interface MapDisplayWidgetProps {
  playerPosition?: { latitude: number; longitude: number };
  isLoading?: boolean;
  children?: React.ReactNode;
}

// Мокап карты без использования real-world библиотек карт
export const MapDisplayWidget: React.FC<MapDisplayWidgetProps> = ({
  playerPosition,
  isLoading = false,
  children
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(15); // Уровень увеличения карты
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });
  
  // Эффект для центрирования карты на позиции игрока при изменении местоположения
  useEffect(() => {
    if (playerPosition && mapRef.current) {
      // Сбрасываем смещение карты, чтобы центрировать на игроке
      setMapOffset({ x: 0, y: 0 });
    }
  }, [playerPosition]);
  
  // Обработчики взаимодействия с картой
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      setMapOffset({
        x: mapOffset.x + deltaX,
        y: mapOffset.y + deltaY
      });
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  const handleZoomIn = () => {
    setZoom(Math.min(zoom + 1, 20));
  };
  
  const handleZoomOut = () => {
    setZoom(Math.max(zoom - 1, 10));
  };
  
  // Координаты игрока для отображения на карте
  const getPlayerMarkerPosition = () => {
    if (!playerPosition) return { top: '50%', left: '50%' };
    
    // В реальной реализации здесь был бы перевод GPS координат в пиксели на карте
    // Для мокапа позиционируем по центру
    return { top: 'calc(50% - 12px)', left: 'calc(50% - 12px)' };
  };
  
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Карта */}
      <div 
        ref={mapRef}
        className={`
          w-full h-full 
          bg-surface-variant bg-opacity-30 
          cursor-${isDragging ? 'grabbing' : 'grab'}
        `}
        style={{
          backgroundImage: "url('/assets/images/map_background.png')",
          backgroundSize: `${zoom * 5}%`,
          backgroundPosition: `calc(50% + ${mapOffset.x}px) calc(50% + ${mapOffset.y}px)`,
          transition: isDragging ? 'none' : 'background-position 0.3s ease'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Маркер игрока */}
        {playerPosition && (
          <div 
            className="absolute w-6 h-6 bg-accent rounded-full border-2 border-surface shadow-lg z-30 animate-pulse"
            style={getPlayerMarkerPosition()}
          />
        )}
        
        {/* Маркеры точек интереса и квестов */}
        <div 
          className="absolute inset-0"
          style={{
            transform: `translate(${mapOffset.x}px, ${mapOffset.y}px)`,
            transition: isDragging ? 'none' : 'transform 0.3s ease'
          }}
        >
          {children}
        </div>
      </div>
      
      {/* Индикатор загрузки */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-40">
          <div className="bg-surface p-4 rounded-lg shadow-lg">
            <div className="text-accent text-lg">Определение местоположения...</div>
          </div>
        </div>
      )}
      
      {/* Кнопки управления картой */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-30">
        <button 
          className="w-10 h-10 bg-surface rounded-lg shadow-lg flex items-center justify-center"
          onClick={handleZoomIn}
        >
          <span className="text-xl">+</span>
        </button>
        <button 
          className="w-10 h-10 bg-surface rounded-lg shadow-lg flex items-center justify-center"
          onClick={handleZoomOut}
        >
          <span className="text-xl">−</span>
        </button>
        <button 
          className="w-10 h-10 bg-surface rounded-lg shadow-lg flex items-center justify-center"
          onClick={() => setMapOffset({ x: 0, y: 0 })}
        >
          <span className="material-icons text-lg">my_location</span>
        </button>
      </div>
    </div>
  );
};

export default MapDisplayWidget; 