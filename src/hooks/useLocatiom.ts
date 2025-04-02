import { useState, useEffect } from 'react';

interface LocationState {
  position: [number, number] | null;
  error: string | null;
  timestamp: number | null;
}

export const useLocation = (options?: PositionOptions): LocationState => {
  const [state, setState] = useState<LocationState>({
    position: null,
    error: null,
    timestamp: null
  });
  
  useEffect(() => {
    let mounted = true;
    
    // Проверяем поддержку геолокации
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Геолокация не поддерживается вашим браузером'
      }));
      return;
    }
    
    // Настройки геолокации
    const locationOptions: PositionOptions = {
      enableHighAccuracy: options?.enableHighAccuracy ?? true,
      timeout: options?.timeout ?? 10000,
      maximumAge: options?.maximumAge ?? 0
    };
    
    // Обработчик успешного получения локации
    const handleSuccess = (position: GeolocationPosition) => {
      if (!mounted) return;
      
      setState({
        position: [
          position.coords.latitude,
          position.coords.longitude
        ],
        error: null,
        timestamp: position.timestamp
      });
    };
    
    // Обработчик ошибки
    const handleError = (error: GeolocationPositionError) => {
      if (!mounted) return;
      
      let errorMessage = 'Неизвестная ошибка при получении местоположения';
      
      switch(error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Доступ к геолокации запрещен. Проверьте настройки разрешений вашего браузера.';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Информация о вашем местоположении недоступна.';
          break;
        case error.TIMEOUT:
          errorMessage = 'Превышено время ожидания при определении местоположения.';
          break;
      }
      
      setState(prev => ({
        ...prev,
        error: errorMessage
      }));
    };
    
    // Запрашиваем текущую позицию
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      locationOptions
    );
    
    // Создаем watcher для отслеживания изменений позиции
    const watcherId = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      locationOptions
    );
    
    // Очистка при размонтировании
    return () => {
      mounted = false;
      navigator.geolocation.clearWatch(watcherId);
    };
  }, [options?.enableHighAccuracy, options?.maximumAge, options?.timeout]);
  
  return state;
};