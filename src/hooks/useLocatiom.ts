import { useState, useEffect, useCallback, useRef } from 'react';

// Фиксированные координаты для использования при отказе геолокации
// 47°59'42.1"N 7°50'45.1"E
export const DEFAULT_LOCATION: [number, number] = [47.9950278, 7.8458611];

// Интерфейс для ошибок геолокации с расширенной диагностикой
interface GeoLocationErrorDetails {
  code: number;
  message: string;
  source: string;
  timestamp: number;
  attempts: number;
  browserInfo: string;
  isPermissionDenied: boolean;
}

interface LocationState {
  position: [number, number] | null;
  error: string | null;
  timestamp: number | null;
  updatePosition: (newPosition: [number, number]) => void;
  requestGeolocation: () => void;
  loading: boolean;
  permissionDenied: boolean;
  useDefaultLocation: () => void;
  isUsingDefaultLocation: boolean;
  errorDetails: GeoLocationErrorDetails | null;
}

export const useLocation = (options?: PositionOptions): LocationState => {
  const [state, setState] = useState<{
    position: [number, number] | null;
    error: string | null;
    timestamp: number | null;
    loading: boolean;
    permissionDenied: boolean;
    isUsingDefaultLocation: boolean;
    errorDetails: GeoLocationErrorDetails | null;
  }>({
    position: null,
    error: null,
    timestamp: null,
    loading: false,
    permissionDenied: false,
    isUsingDefaultLocation: false,
    errorDetails: null
  });
  
  // Добавляем ref для контроля состояния монтирования
  const isMounted = useRef(true);
  // Добавляем ref для отслеживания количества попыток
  const attemptCount = useRef(0);
  // Добавляем ref для хранения ID watchPosition
  const watcherId = useRef<number | null>(null);
  // Добавляем ref для таймера повторных попыток
  const retryTimerId = useRef<number | null>(null);
  // Добавляем ref для отслеживания последней ошибки
  const lastErrorRef = useRef<GeoLocationErrorDetails | null>(null);
  
  // Создаем функцию для сохранения деталей ошибки
  const createErrorDetails = useCallback((error: GeolocationPositionError | Error | unknown, source: string): GeoLocationErrorDetails => {
    const browserInfo = `${navigator.userAgent} | Geolocation supported: ${navigator.geolocation ? 'Yes' : 'No'}`;
    
    // Дополнительная проверка для объектов ошибок
    const isObjectError = error && typeof error === 'object';
    
    // Улучшенное определение типа ошибки
    const isGeoError = isObjectError && 'code' in error && typeof (error as any).code === 'number';
    const isStringError = isObjectError && typeof (error as any).toString === 'function';
    
    // Извлекаем более точную информацию об ошибке
    let errorCode = -1;
    let errorMessage = 'Неизвестная ошибка';
    
    if (isGeoError) {
      const geoError = error as GeolocationPositionError;
      errorCode = geoError.code;
      errorMessage = geoError.message || getGeoErrorMessage(geoError.code);
    } else if (error instanceof Error) {
      errorMessage = error.message;
    } else if (isStringError) {
      errorMessage = String(error);
    }
    
    // Проверка на "User denied Geolocation" в сообщении ошибки
    const isPermissionDenied = 
      errorCode === 1 || 
      (typeof errorMessage === 'string' && 
        (errorMessage.includes('denied') || 
         errorMessage.includes('PERMISSION_DENIED') || 
         errorMessage.toLowerCase().includes('permission')));
    
    const details: GeoLocationErrorDetails = {
      code: errorCode,
      message: errorMessage,
      source,
      timestamp: Date.now(),
      attempts: attemptCount.current,
      browserInfo,
      isPermissionDenied
    };
    
    // Сохраняем детали ошибки для последующего анализа
    lastErrorRef.current = details;
    
    // Выводим расширенную диагностику в консоль
    console.log('Расширенная диагностика ошибки геолокации:', {
      ...details,
      permissionState: state.permissionDenied ? 'Denied' : 'Unknown',
      usingDefault: state.isUsingDefaultLocation,
      mounted: isMounted.current,
      options,
      errorObject: error
    });
    
    // Если определили, что это ошибка разрешения, обновляем состояние
    if (isPermissionDenied && !state.permissionDenied) {
      console.log('Обнаружен отказ в разрешении, обновляем состояние permissionDenied');
      setState(prev => ({
        ...prev,
        permissionDenied: true
      }));
    }
    
    return details;
  }, [options, state.permissionDenied, state.isUsingDefaultLocation]);
  
  // Добавляем функцию для получения понятного сообщения об ошибке
  const getGeoErrorMessage = (code: number): string => {
    switch(code) {
      case 1: // PERMISSION_DENIED
        return 'Доступ к геолокации запрещен. Проверьте настройки разрешений вашего браузера.';
      case 2: // POSITION_UNAVAILABLE
        return 'Информация о вашем местоположении недоступна.';
      case 3: // TIMEOUT
        return 'Превышено время ожидания при определении местоположения.';
      default:
        return 'Неизвестная ошибка при получении местоположения';
    }
  };
  
  // Проверяем поддержку геолокации
  const checkGeolocationSupport = useCallback((): boolean => {
    if (!navigator.geolocation) {
      console.error('Геолокация не поддерживается в этом браузере.', {
        userAgent: navigator.userAgent,
        platform: navigator.platform
      });
      return false;
    }
    return true;
  }, []);
  
  // Функция для очистки ресурсов геолокации
  const clearGeolocationResources = useCallback(() => {
    if (watcherId.current !== null) {
      console.log('Очистка наблюдателя геолокации:', watcherId.current);
      try {
        navigator.geolocation.clearWatch(watcherId.current);
      } catch (err) {
        console.error('Ошибка при очистке наблюдателя геолокации:', err);
      }
      watcherId.current = null;
    }
    
    // Очищаем таймер повторных попыток
    if (retryTimerId.current !== null) {
      window.clearTimeout(retryTimerId.current);
      retryTimerId.current = null;
    }
  }, []);
  
  // Функция для использования фиксированных координат
  const useDefaultLocation = useCallback(() => {
    if (!isMounted.current) return;
    
    console.log('Использование фиксированных координат:', DEFAULT_LOCATION);
    
    setState(prev => ({
      ...prev,
      position: DEFAULT_LOCATION,
      error: null,
      timestamp: Date.now(),
      loading: false,
      isUsingDefaultLocation: true
    }));
    
    // Очищаем ресурсы геолокации, так как они больше не нужны
    clearGeolocationResources();
  }, [clearGeolocationResources]);
  
  // Ручное обновление позиции
  const updatePosition = useCallback((newPosition: [number, number]) => {
    if (!isMounted.current) return;
    
    setState(prev => ({
      ...prev,
      position: newPosition,
      error: null,
      timestamp: Date.now(),
      loading: false,
      isUsingDefaultLocation: false
    }));
  }, []);
  
  // Запрос геолокации вручную
  const requestGeolocation = useCallback(() => {
    // Не делаем ничего, если компонент размонтирован
    if (!isMounted.current) {
      console.log('Пропуск запроса геолокации, компонент размонтирован');
      return;
    }
    
    // Если ранее было явно отказано в разрешении и пользователь не решил проблему
    if (state.permissionDenied) {
      console.log('Доступ к геолокации запрещен, использование фиксированных координат');
      useDefaultLocation();
      return;
    }
    
    // Проверяем поддержку геолокации
    if (!checkGeolocationSupport()) {
      setState(prev => ({
        ...prev,
        error: 'Геолокация не поддерживается вашим браузером',
        loading: false,
        errorDetails: createErrorDetails(
          new Error('Геолокация не поддерживается браузером'),
          'requestGeolocation.checkSupport'
        )
      }));
      
      // При отсутствии поддержки используем фиксированные координаты
      useDefaultLocation();
      return;
    }
    
    // Очищаем предыдущие ресурсы
    clearGeolocationResources();
    
    // Увеличиваем счетчик попыток
    attemptCount.current += 1;
    
    // Устанавливаем флаг загрузки
    setState(prev => ({
      ...prev,
      loading: true,
      error: null
    }));
    
    // Настройки геолокации с увеличенным таймаутом при повторных попытках
    // Если видны повторяющиеся ошибки PERMISSION_DENIED, ограничиваем количество попыток
    const maxAttempts = lastErrorRef.current && lastErrorRef.current.code === 1 ? 1 : 3;
    
    if (attemptCount.current > maxAttempts && lastErrorRef.current && lastErrorRef.current.code === 1) {
      console.log(`Достигнуто максимальное количество попыток (${maxAttempts}) при отказе в разрешении, переключение на фиксированные координаты`);
      setState(prev => ({
        ...prev,
        loading: false,
        permissionDenied: true,
        error: 'Доступ к геолокации запрещен, переключение на фиксированное местоположение'
      }));
      useDefaultLocation();
      return;
    }
    
    const timeoutValue = Math.min(30000, 15000 + attemptCount.current * 5000);
    
    const locationOptions: PositionOptions = {
      enableHighAccuracy: options?.enableHighAccuracy ?? true,
      timeout: options?.timeout ?? timeoutValue,
      maximumAge: options?.maximumAge ?? 0
    };
    
    console.log(`Запрос геолокации (попытка ${attemptCount.current}), таймаут: ${locationOptions.timeout}мс, максимальное время хранения: ${locationOptions.maximumAge}мс`);
    
    try {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!isMounted.current) {
            console.log('Позиция получена, но компонент уже размонтирован');
            return;
          }
          
          console.log('Получены координаты:', position.coords.latitude, position.coords.longitude, {
            accuracy: position.coords.accuracy,
            timestamp: new Date(position.timestamp).toISOString()
          });
          
          setState(prev => ({
            ...prev,
            position: [
              position.coords.latitude,
              position.coords.longitude
            ],
            error: null,
            timestamp: position.timestamp,
            loading: false,
            isUsingDefaultLocation: false,
            errorDetails: null // Сбрасываем детали ошибки при успехе
          }));
          
          // Сбрасываем счетчик попыток при успехе
          attemptCount.current = 0;
          
          // Сбрасываем последнюю ошибку
          lastErrorRef.current = null;
        },
        (error) => {
          if (!isMounted.current) {
            console.log('Ошибка геолокации получена, но компонент уже размонтирован');
            return;
          }
          
          let errorMessage = 'Неизвестная ошибка при получении местоположения';
          let recoverable = true;
          let useDefault = false;
          
          const errorDetails = createErrorDetails(error, 'requestGeolocation.getCurrentPosition');
          
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Доступ к геолокации запрещен. Проверьте настройки разрешений вашего браузера.';
              recoverable = false;
              useDefault = true;
              
              // Устанавливаем флаг отказа в разрешении
              setState(prev => ({
                ...prev,
                permissionDenied: true,
                errorDetails
              }));
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Информация о вашем местоположении недоступна.';
              useDefault = attemptCount.current >= 3;
              break;
            case error.TIMEOUT:
              errorMessage = 'Превышено время ожидания при определении местоположения.';
              useDefault = attemptCount.current >= 3;
              break;
          }
          
          console.error('Ошибка геолокации:', errorMessage, error.code, error.message, {
            attempt: attemptCount.current,
            recoverable,
            useDefault,
            permissionDenied: error.code === error.PERMISSION_DENIED
          });
          
          if (useDefault) {
            console.log('Переключение на фиксированные координаты после ошибки');
            useDefaultLocation();
          } else {
            setState(prev => ({
              ...prev,
              error: errorMessage,
              loading: false,
              errorDetails
            }));
            
            // Если ошибка восстановимая и не превышено число попыток, повторяем
            if (recoverable && attemptCount.current < 5) {
              // Увеличиваем задержку с каждой попыткой
              const delay = attemptCount.current * 1000;
              console.log(`Планирование повторной попытки геолокации через ${delay}мс`);
              
              if (retryTimerId.current) {
                window.clearTimeout(retryTimerId.current);
              }
              
              retryTimerId.current = window.setTimeout(() => {
                if (isMounted.current) {
                  console.log(`Выполнение запланированной повторной попытки (попытка ${attemptCount.current + 1})`);
                  requestGeolocation();
                } else {
                  console.log('Отмена запланированной повторной попытки, компонент размонтирован');
                }
              }, delay);
            } else if (!recoverable || attemptCount.current >= 5) {
              console.log('Достигнуто максимальное количество попыток или ошибка невосстановимая, переключение на фиксированные координаты');
              useDefaultLocation();
            }
          }
        },
        locationOptions
      );
    } catch (e) {
      const errorDetails = createErrorDetails(
        e instanceof Error ? e : new Error(String(e)),
        'requestGeolocation.exception'
      );
      
      console.error('Исключение при запросе геолокации:', e, {
        stack: e instanceof Error ? e.stack : undefined,
        attempt: attemptCount.current
      });
      
      setState(prev => ({
        ...prev,
        error: 'Ошибка при запросе геолокации: ' + (e instanceof Error ? e.message : String(e)),
        loading: false,
        errorDetails
      }));
      
      // При непредвиденной ошибке используем фиксированные координаты
      if (attemptCount.current >= 2) {
        useDefaultLocation();
      }
    }
  }, [
    options?.enableHighAccuracy, 
    options?.maximumAge, 
    options?.timeout, 
    clearGeolocationResources, 
    useDefaultLocation, 
    state.permissionDenied,
    checkGeolocationSupport,
    createErrorDetails
  ]);
  
  // Основной эффект для настройки геолокации
  useEffect(() => {
    // Устанавливаем флаг монтирования
    isMounted.current = true;
    console.log('Инициализация хука useLocation');
    
    // Проверка разрешения через Permissions API (если доступно)
    if (navigator.permissions && typeof navigator.permissions.query === 'function') {
      try {
        navigator.permissions.query({ name: 'geolocation' as PermissionName }).then(result => {
          console.log('Статус разрешения геолокации из Permissions API:', result.state);
          
          if (result.state === 'denied') {
            console.log('Разрешение геолокации явно запрещено через Permissions API');
            setState(prev => ({
              ...prev,
              permissionDenied: true,
              error: 'Доступ к геолокации запрещен в настройках браузера (определено через Permissions API)'
            }));
            
            // При запрете прав сразу используем фиксированную локацию
            useDefaultLocation();
          }
          
          // Подписываемся на изменения статуса разрешений
          result.addEventListener('change', () => {
            console.log('Статус разрешения геолокации изменился:', result.state);
            
            if (result.state === 'denied' && isMounted.current) {
              setState(prev => ({
                ...prev,
                permissionDenied: true,
                error: 'Доступ к геолокации был запрещен в настройках браузера'
              }));
              useDefaultLocation();
            } else if (result.state === 'granted' && isMounted.current) {
              setState(prev => ({
                ...prev,
                permissionDenied: false,
                error: null
              }));
              requestGeolocation();
            }
          });
        }).catch(err => {
          console.warn('Ошибка при запросе статуса разрешения через Permissions API:', err);
        });
      } catch (permErr) {
        console.warn('Ошибка при использовании Permissions API:', permErr);
      }
    }
    
    // Проверяем поддержку геолокации
    if (!checkGeolocationSupport()) {
      const errorDetails = createErrorDetails(
        new Error('Геолокация не поддерживается браузером'),
        'useEffect.checkSupport'
      );
      
      setState(prev => ({
        ...prev,
        error: 'Геолокация не поддерживается вашим браузером',
        errorDetails
      }));
      
      // При отсутствии поддержки используем фиксированные координаты
      useDefaultLocation();
      return () => {
        console.log('Очистка хука useLocation (геолокация не поддерживается)');
        isMounted.current = false;
        clearGeolocationResources();
      };
    }
    
    // Устанавливаем флаг загрузки
    setState(prev => ({ ...prev, loading: true }));
    
    // Настройки геолокации
    const locationOptions: PositionOptions = {
      enableHighAccuracy: options?.enableHighAccuracy ?? true,
      timeout: options?.timeout ?? 15000,
      maximumAge: options?.maximumAge ?? 0
    };
    
    // Обработчик успешного получения локации
    const handleSuccess = (position: GeolocationPosition) => {
      if (!isMounted.current) {
        console.log('Позиция получена от наблюдателя, но компонент уже размонтирован');
        return;
      }
      
      console.log('Геолокация обновлена:', position.coords.latitude, position.coords.longitude, {
        accuracy: position.coords.accuracy,
        timestamp: new Date(position.timestamp).toISOString()
      });
      
      setState(prev => ({
        ...prev,
        position: [
          position.coords.latitude,
          position.coords.longitude
        ],
        error: null,
        timestamp: position.timestamp,
        loading: false,
        isUsingDefaultLocation: false,
        errorDetails: null // Сбрасываем детали ошибки при успешном получении позиции
      }));
      
      // Сбрасываем счетчик попыток при успехе
      attemptCount.current = 0;
      
      // Сбрасываем последнюю ошибку
      lastErrorRef.current = null;
    };
    
    // Обработчик ошибки
    const handleError = (error: GeolocationPositionError) => {
      if (!isMounted.current) {
        console.log('Ошибка получена от наблюдателя, но компонент уже размонтирован');
        return;
      }
      
      // Проверяем строковое представление ошибки для дополнительной диагностики
      const errorString = String(error);
      console.log('Полное строковое представление ошибки геолокации:', errorString);
      
      let errorMessage = 'Неизвестная ошибка при получении местоположения';
      const errorDetails = createErrorDetails(error, 'useEffect.watchPosition');
      const isPermissionError = error.code === 1 || errorDetails.isPermissionDenied;
      
      switch(error.code) {
        case 1: // error.PERMISSION_DENIED
          errorMessage = 'Доступ к геолокации запрещен. Проверьте настройки разрешений вашего браузера.';
          
          // Обновляем состояние для отображения соответствующего UI
          setState(prev => ({
            ...prev,
            permissionDenied: true,
            errorDetails
          }));
          
          // Переключаемся на фиксированные координаты
          useDefaultLocation();
          break;
        case 2: // error.POSITION_UNAVAILABLE
          errorMessage = 'Информация о вашем местоположении недоступна.';
          // Продолжаем использовать наблюдателя, но устанавливаем флаг ошибки
          break;
        case 3: // error.TIMEOUT
          errorMessage = 'Превышено время ожидания при определении местоположения.';
          // Для ошибки таймаута не предпринимаем специальных действий
          break;
        default:
          // Если код ошибки неизвестен, но текст содержит упоминание разрешения
          if (errorString.toLowerCase().includes('denied') || 
              errorString.toLowerCase().includes('permission')) {
            errorMessage = 'Доступ к геолокации запрещен (определено по тексту ошибки).';
            
            setState(prev => ({
              ...prev,
              permissionDenied: true,
              errorDetails
            }));
            
            useDefaultLocation();
          }
      }
      
      console.error('Ошибка наблюдателя геолокации:', errorMessage, error.code, error.message, {
        permissionDenied: isPermissionError,
        errorString,
        timestamp: new Date().toISOString()
      });
      
      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false,
        errorDetails
      }));
    };
    
    // Запрашиваем текущую позицию
    try {
      console.log('Запрос начальной позиции с параметрами:', locationOptions);
      navigator.geolocation.getCurrentPosition(
        handleSuccess,
        handleError,
        locationOptions
      );
    } catch (e) {
      console.error('Полное исключение при запросе геолокации:', e);
      
      // Проверяем, содержит ли ошибка текст об отказе в разрешении
      const errorStr = String(e);
      const isPossiblePermissionError = 
        errorStr.toLowerCase().includes('denied') || 
        errorStr.toLowerCase().includes('permission');
      
      const errorDetails = createErrorDetails(
        e instanceof Error ? e : new Error(String(e)),
        'useEffect.initialGetCurrentPosition'
      );
      
      console.error('Исключение при начальном запросе геолокации:', e, {
        stack: e instanceof Error ? e.stack : undefined,
        errorStr,
        isPossiblePermissionError
      });
      
      setState(prev => ({
        ...prev,
        error: 'Ошибка при запросе геолокации: ' + (e instanceof Error ? e.message : String(e)),
        loading: false,
        errorDetails,
        permissionDenied: prev.permissionDenied || isPossiblePermissionError || errorDetails.isPermissionDenied
      }));
      
      // При ошибке используем фиксированные координаты
      useDefaultLocation();
    }
    
    // Создаем watcher для отслеживания изменений позиции
    try {
      console.log('Создание наблюдателя геолокации с параметрами:', {
        ...locationOptions,
        timeout: (locationOptions.timeout || 15000) * 2
      });
      
      watcherId.current = navigator.geolocation.watchPosition(
        handleSuccess,
        handleError,
        {
          ...locationOptions,
          // Увеличиваем таймаут для наблюдателя
          timeout: (locationOptions.timeout || 15000) * 2
        }
      );
      console.log('Геолокация активирована, ID:', watcherId.current);
    } catch (err) {
      const errorDetails = createErrorDetails(
        err instanceof Error ? err : new Error(String(err)),
        'useEffect.watchPosition'
      );
      
      console.error('Ошибка при активации отслеживания геолокации:', err, {
        stack: err instanceof Error ? err.stack : undefined
      });
      
      setState(prev => ({
        ...prev,
        error: 'Ошибка при активации отслеживания геолокации: ' + (err instanceof Error ? err.message : String(err)),
        errorDetails
      }));
      
      // При ошибке используем фиксированные координаты
      if (!state.position) {
        useDefaultLocation();
      }
    }
  }, [
    options?.enableHighAccuracy, 
    options?.maximumAge, 
    options?.timeout, 
    clearGeolocationResources, 
    useDefaultLocation, 
    state.position,
    checkGeolocationSupport,
    createErrorDetails
  ]);
  
  return {
    ...state,
    updatePosition,
    requestGeolocation,
    useDefaultLocation
  };
};