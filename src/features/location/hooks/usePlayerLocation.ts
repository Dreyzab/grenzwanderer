import { useState, useEffect } from 'react';
import { GeoCoordinates } from '@/shared/types/geo';

interface UsePlayerLocationResult {
  playerLocation: GeoCoordinates | null;
  isLocationLoading: boolean;
  error: string | null;
}

/**
 * Хук для работы с геолокацией игрока
 */
export const usePlayerLocation = (): UsePlayerLocationResult => {
  const [playerLocation, setPlayerLocation] = useState<GeoCoordinates | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Функция для получения геолокации
    const getLocation = () => {
      if (!navigator.geolocation) {
        setError('Геолокация не поддерживается вашим браузером');
        setIsLocationLoading(false);
        return;
      }

      // Запрашиваем текущую позицию
      navigator.geolocation.getCurrentPosition(
        // Успешное получение
        (position) => {
          setPlayerLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setIsLocationLoading(false);
        },
        // Ошибка
        (error) => {
          console.error('Ошибка получения геолокации:', error);
          setError('Не удалось получить местоположение');
          setIsLocationLoading(false);
          
          // Для разработки используем моковые координаты Москвы
          setPlayerLocation({
            latitude: 55.751244,
            longitude: 37.618423
          });
        },
        // Опции
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    };

    getLocation();

    // Настраиваем отслеживание изменений местоположения
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setPlayerLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setIsLocationLoading(false);
      },
      (error) => {
        console.error('Ошибка отслеживания геолокации:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );

    // Очистка при размонтировании
    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return {
    playerLocation,
    isLocationLoading,
    error
  };
}; 