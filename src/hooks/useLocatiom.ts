import { useState, useEffect } from 'react';

interface LocationHook {
  position: [number, number] | null;
  error: string | null;
  timestamp: number | null;
}

export const useLocation = (): LocationHook => {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timestamp, setTimestamp] = useState<number | null>(null);
  
  useEffect(() => {
    // Initial permission check
    if (!navigator.geolocation) {
      setError('Геолокация не поддерживается вашим браузером');
      return;
    }
    
    // Options for geolocation
    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    };
    
    // Success handler
    const handleSuccess = (position: GeolocationPosition) => {
      setPosition([
        position.coords.latitude,
        position.coords.longitude
      ]);
      setTimestamp(position.timestamp);
      setError(null);
    };
    
    // Error handler
    const handleError = (error: GeolocationPositionError) => {
      switch (error.code) {
        case error.PERMISSION_DENIED:
          setError('Доступ к геолокации запрещен');
          break;
        case error.POSITION_UNAVAILABLE:
          setError('Информация о местоположении недоступна');
          break;
        case error.TIMEOUT:
          setError('Превышено время ожидания определения местоположения');
          break;
        default:
          setError('Неизвестная ошибка геолокации');
          break;
      }
    };
    
    // Start watching position
    const watchId = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      options
    );
    
    // Cleanup: stop watching position
    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);
  
  return { position, error, timestamp };
};