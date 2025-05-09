import React, { useState, useEffect } from 'react';
import { GeoCoordinates } from './MapDisplayWidget';
import { useMapData } from '@/features/map/hooks/useMapData';

interface ARModeWidgetProps {
  playerLocation?: GeoCoordinates;
  playerHeading?: number;
  targetMarkerId?: string | null;
  onClose: () => void;
}

/**
 * Виджет режима дополненной реальности
 * Отображает камеру с наложенными AR-элементами для навигации к цели
 */
export const ARModeWidget: React.FC<ARModeWidgetProps> = ({
  playerLocation,
  playerHeading = 0,
  targetMarkerId,
  onClose
}) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [direction, setDirection] = useState<number | null>(null);
  
  const { getMarkerById } = useMapData();
  const targetMarker = targetMarkerId ? getMarkerById(targetMarkerId) : null;
  
  // Инициализация камеры
  useEffect(() => {
    // Проверка поддержки API камеры
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage('Ваше устройство не поддерживает доступ к камере');
      return;
    }
    
    // Запрос доступа к камере
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        
        const videoElement = document.getElementById('ar-camera-feed') as HTMLVideoElement;
        if (videoElement) {
          videoElement.srcObject = stream;
          setIsCameraActive(true);
        }
      } catch (error) {
        console.error('Ошибка доступа к камере:', error);
        setErrorMessage('Не удалось получить доступ к камере');
      }
    };
    
    initCamera();
    
    // Очистка при размонтировании
    return () => {
      const videoElement = document.getElementById('ar-camera-feed') as HTMLVideoElement;
      if (videoElement && videoElement.srcObject) {
        const stream = videoElement.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  // Расчет расстояния и направления к маркеру
  useEffect(() => {
    if (!playerLocation || !targetMarker) {
      setDistance(null);
      setDirection(null);
      return;
    }
    
    // Расчет расстояния (упрощенный, для точности нужна формула гаверсинусов)
    const lat1 = playerLocation.latitude;
    const lon1 = playerLocation.longitude;
    const lat2 = targetMarker.coordinates.latitude;
    const lon2 = targetMarker.coordinates.longitude;
    
    // Примерный расчет расстояния в метрах по формуле гаверсинусов
    const R = 6371e3; // радиус Земли в метрах
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    setDistance(distance);
    
    // Расчет направления (азимута)
    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) -
              Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    const θ = Math.atan2(y, x);
    let bearing = (θ * 180 / Math.PI + 360) % 360; // в градусах
    
    // Направление с учетом ориентации устройства
    let relativeDirection = bearing - playerHeading;
    if (relativeDirection < 0) relativeDirection += 360;
    if (relativeDirection > 180) relativeDirection -= 360;
    
    setDirection(relativeDirection);
  }, [playerLocation, targetMarker, playerHeading]);
  
  return (
    <div className="ar-mode">
      {/* Видео с камеры */}
      <video 
        id="ar-camera-feed"
        autoPlay 
        playsInline
        className="camera-feed"
      />
      
      {/* Информация об ошибке */}
      {errorMessage && (
        <div className="ar-error">
          <p>{errorMessage}</p>
          <button onClick={onClose}>Вернуться к карте</button>
        </div>
      )}
      
      {/* Навигационные элементы */}
      {isCameraActive && targetMarker && distance !== null && direction !== null && (
        <>
          <div className="ar-target-info">
            <h3>{targetMarker.title}</h3>
            <p>Расстояние: {distance < 1000 ? `${Math.round(distance)} м` : `${(distance / 1000).toFixed(1)} км`}</p>
          </div>
          
          <div 
            className="direction-arrow"
            style={{ transform: `rotate(${direction}deg)` }}
          >
            ⬆
          </div>
          
          {/* Индикатор близости */}
          {distance < 20 && (
            <div className="proximity-indicator">
              Вы рядом с целью!
            </div>
          )}
        </>
      )}
      
      {/* Кнопка закрытия */}
      <button className="ar-close-button" onClick={onClose}>
        Закрыть AR режим
      </button>
    </div>
  );
};

export default ARModeWidget; 