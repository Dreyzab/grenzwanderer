import { useState, useEffect } from 'react';
import { GeoCoordinates } from '@/shared/types/geo';
import { usePlayerLocation } from '@/features/location/hooks/usePlayerLocation';

interface UseARNavigationResult {
  targetDirection: number;
  distanceToTarget: number;
  startARNavigation: (targetCoords: GeoCoordinates) => void;
  isNavigating: boolean;
  stopNavigation: () => void;
}

/**
 * Хук для работы с AR навигацией к маркерам
 */
export const useARNavigation = (): UseARNavigationResult => {
  const [targetCoordinates, setTargetCoordinates] = useState<GeoCoordinates | null>(null);
  const [targetDirection, setTargetDirection] = useState<number>(0);
  const [distanceToTarget, setDistanceToTarget] = useState<number>(0);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  
  // Получаем текущую позицию игрока
  const { playerLocation } = usePlayerLocation();
  
  // Функция запуска навигации
  const startARNavigation = (targetCoords: GeoCoordinates) => {
    setTargetCoordinates(targetCoords);
    setIsNavigating(true);
  };
  
  // Функция остановки навигации
  const stopNavigation = () => {
    setIsNavigating(false);
    setTargetCoordinates(null);
  };
  
  // Расчет направления и расстояния до цели
  useEffect(() => {
    if (!isNavigating || !targetCoordinates || !playerLocation) {
      return;
    }
    
    // Функция для расчета расстояния между двумя точками по формуле гаверсинуса
    const calculateDistance = (point1: GeoCoordinates, point2: GeoCoordinates): number => {
      const R = 6371; // Радиус Земли в км
      const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
      const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
      
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c * 1000; // Расстояние в метрах
      
      return distance;
    };
    
    // Функция для расчета направления от одной точки к другой
    const calculateBearing = (point1: GeoCoordinates, point2: GeoCoordinates): number => {
      const lat1 = point1.latitude * Math.PI / 180;
      const lat2 = point2.latitude * Math.PI / 180;
      const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
      
      const y = Math.sin(dLon) * Math.cos(lat2);
      const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
      
      let bearing = Math.atan2(y, x) * 180 / Math.PI;
      bearing = (bearing + 360) % 360; // нормализуем от 0 до 360 градусов
      
      return bearing;
    };
    
    // Рассчитываем направление и расстояние
    const distance = calculateDistance(playerLocation, targetCoordinates);
    const direction = calculateBearing(playerLocation, targetCoordinates);
    
    setDistanceToTarget(distance);
    setTargetDirection(direction);
    
    // Настраиваем интервал для периодического обновления направления и расстояния
    const intervalId = setInterval(() => {
      if (playerLocation && targetCoordinates) {
        const updatedDistance = calculateDistance(playerLocation, targetCoordinates);
        const updatedDirection = calculateBearing(playerLocation, targetCoordinates);
        
        setDistanceToTarget(updatedDistance);
        setTargetDirection(updatedDirection);
      }
    }, 1000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [isNavigating, targetCoordinates, playerLocation]);
  
  return {
    targetDirection,
    distanceToTarget,
    startARNavigation,
    isNavigating,
    stopNavigation
  };
}; 