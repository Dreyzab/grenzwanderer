import { useState, useEffect, useCallback, useRef } from 'react';

// Фиксированные координаты для использования при отказе геолокации
// 47°59'42.1"N 7°50'45.1"E
export const DEFAULT_LOCATION: [number, number] = [47.9950278, 7.8458611];

// Максимальное количество попыток геолокации
const MAX_ATTEMPTS = 3;

// Ключ для хранения статуса разрешения в localStorage
const PERMISSION_STATE_KEY = 'geolocation_permission_state';

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

// Функция для проверки разрешения геолокации через Permissions API
const checkGeolocationPermission = async (): Promise<string> => {
  try {
    // Проверяем поддержку Permissions API
    if (navigator.permissions) {
      const permissionStatus = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      return permissionStatus.state; // "granted", "denied" или "prompt"
    }
    
    // Если Permissions API не поддерживается, пробуем прочитать из localStorage
    const savedPermission = localStorage.getItem(PERMISSION_STATE_KEY);
    if (savedPermission) {
      return savedPermission;
    }
  } catch (err) {
    console.error('Ошибка при проверке разрешений:', err);
  }
  
  // По умолчанию требуется запрос
  return 'prompt';
};

// Сохраняем состояние разрешения в localStorage
const savePermissionState = (state: string): void => {
  try {
    localStorage.setItem(PERMISSION_STATE_KEY, state);
  } catch (err) {
    console.error('Ошибка при сохранении статуса разрешения:', err);
  }
};

export const useLocation = (options?: PositionOptions): LocationState => {
  // Предотвращаем множественные инициализации
  const hasInitialized = useRef(false);
  
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
  // Добавляем ref для хранения статуса разрешения
  const permissionStateRef = useRef<string>('prompt');
  
  // Добавляем переменные для троттлинга и блокировки одновременных запросов
  const MIN_UPDATE_INTERVAL = 3000; // Минимальный интервал между обновлениями в миллисекундах
  const lastUpdateTimestampRef = useRef<number>(0);
  const pendingPositionUpdateRef = useRef<boolean>(false);
  const positionUpdateTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Максимальное количество попыток инициализации
  const MAX_INIT_ATTEMPTS = 3;
  const initAttemptCount = useRef(0);
  
  // Добавляем ref для троттлинга
  const throttleTimer = useRef<number | null>(null);
  
  // Функция для проверки и обновления состояния разрешения
  const updatePermissionState = useCallback(async () => {
    try {
      const permissionState = await checkGeolocationPermission();
      
      permissionStateRef.current = permissionState;
      
      if (permissionState === 'denied') {
        setState(prev => ({
          ...prev,
          permissionDenied: true,
          loading: false
        }));
        
        // Автоматически переключаемся на координаты по умолчанию
        if (!state.position) {
          useDefaultLocation();
        }
      } else if (permissionState === 'granted' && state.permissionDenied) {
        // Если разрешение было дано, но у нас ранее был установлен флаг отказа
        setState(prev => ({
          ...prev,
          permissionDenied: false
        }));
      }
      
      return permissionState;
    } catch (err) {
      console.error('Ошибка при обновлении состояния разрешения:', err);
      return 'error';
    }
  }, [state.permissionDenied, state.position]);
  
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
    
    // Если определили, что это ошибка разрешения, обновляем состояние
    if (isPermissionDenied && !state.permissionDenied) {
      setState(prev => ({
        ...prev,
        permissionDenied: true
      }));
      
      // Сохраняем статус разрешения
      savePermissionState('denied');
      permissionStateRef.current = 'denied';
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
  
  // Инициализируем геолокацию
  const initializeGeolocation = useCallback(async () => {
    // Проверяем, был ли уже инициализирован хук
    if (hasInitialized.current) {
      return;
    }
    
    // Увеличиваем счетчик попыток
    initAttemptCount.current += 1;
    
    // Проверяем поддержку геолокации
    if (!checkGeolocationSupport()) {
      setState(prev => ({
        ...prev,
        error: 'Геолокация не поддерживается в этом браузере.',
        loading: false
      }));
      return;
    }
    
    // Устанавливаем флаг инициализации
    hasInitialized.current = true;
    
    try {
      // Проверяем разрешение геолокации
      const permissionState = await updatePermissionState();
      
      // Если разрешение было отказано, не продолжаем
      if (permissionState === 'denied') {
        if (!state.position) {
          useDefaultLocation();
        }
        return;
      }
      
      // Запрашиваем позицию
      setState(prev => ({ ...prev, loading: true }));
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Геолокация успешно получена
          if (isMounted.current) {
            const newPosition: [number, number] = [
              position.coords.latitude,
              position.coords.longitude
            ];
            
            setState(prev => ({
              ...prev,
              position: newPosition,
              error: null,
              timestamp: position.timestamp,
              loading: false,
              isUsingDefaultLocation: false,
              errorDetails: null
            }));
            
            // Сбрасываем счетчик попыток
            attemptCount.current = 0;
            
            // Запоминаем последнее время обновления
            lastUpdateTimestampRef.current = Date.now();
            
            // Сохраняем разрешение как предоставленное
            if (permissionStateRef.current === 'prompt') {
              savePermissionState('granted');
              permissionStateRef.current = 'granted';
            }
          }
        },
        (error) => {
          // Ошибка при получении геолокации
          if (isMounted.current) {
            // Создаем детальную информацию об ошибке
            const errorDetails = createErrorDetails(error, 'getCurrentPosition');
            
            // Если ошибка связана с отказом в разрешении
            if (error.code === 1) {
              // Используем дефолтные координаты
              useDefaultLocation();
            } else if (attemptCount.current < MAX_ATTEMPTS) {
              // Увеличиваем счетчик попыток
              attemptCount.current += 1;
              
              // Пробуем снова через экспоненциальный backoff
              const backoffTime = Math.min(1000 * Math.pow(2, attemptCount.current), 10000);
              
              retryTimerId.current = window.setTimeout(() => {
                if (isMounted.current) {
                  console.log(`Повторная попытка получения геолокации (#${attemptCount.current})...`);
                  requestGeolocation();
                }
              }, backoffTime);
            } else {
              // Исчерпали все попытки - используем дефолтные координаты
              console.log('Исчерпаны все попытки получения геолокации, используем координаты по умолчанию.');
              useDefaultLocation();
            }
            
            setState(prev => ({
              ...prev,
              error: getGeoErrorMessage(error.code),
              loading: false,
              errorDetails
            }));
          }
        },
        options
      );
    } catch (err) {
      // Системная ошибка при инициализации геолокации
      if (isMounted.current) {
        const errorDetails = createErrorDetails(err, 'initializeGeolocation');
        
        setState(prev => ({
          ...prev,
          error: 'Системная ошибка при инициализации геолокации',
          loading: false,
          errorDetails
        }));
        
        // Если превысили лимит попыток инициализации, используем координаты по умолчанию
        if (initAttemptCount.current >= MAX_INIT_ATTEMPTS && !state.position) {
          useDefaultLocation();
        }
      }
    }
  }, [
    checkGeolocationSupport,
    createErrorDetails,
    updatePermissionState,
    state.position,
    options
  ]);
  
  // Функция для использования координат по умолчанию
  const useDefaultLocation = useCallback(() => {
    setState(prev => ({
      ...prev,
      position: DEFAULT_LOCATION,
      isUsingDefaultLocation: true,
      loading: false
    }));
  }, []);
  
  // Функция для запроса геолокации
  const requestGeolocation = useCallback(() => {
    // Если в данный момент идет загрузка, не запускаем новый запрос
    if (state.loading) return;
    
    // Если геолокация не поддерживается, используем координаты по умолчанию
    if (!checkGeolocationSupport()) {
      useDefaultLocation();
      return;
    }
    
    // Обновляем состояние для показа загрузки
    setState(prev => ({ ...prev, loading: true }));
    
    // Запрашиваем текущую позицию
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (isMounted.current) {
          const newPosition: [number, number] = [
            position.coords.latitude,
            position.coords.longitude
          ];
          
          setState(prev => ({
            ...prev,
            position: newPosition,
            error: null,
            timestamp: position.timestamp,
            loading: false,
            isUsingDefaultLocation: false,
            errorDetails: null
          }));
          
          // Сбрасываем счетчик попыток
          attemptCount.current = 0;
          
          // Обновляем время последнего обновления
          lastUpdateTimestampRef.current = Date.now();
          
          // Обновляем состояние разрешения
          if (permissionStateRef.current === 'prompt') {
            savePermissionState('granted');
            permissionStateRef.current = 'granted';
          }
        }
      },
      (error) => {
        if (isMounted.current) {
          // Создаем детальную информацию об ошибке
          const errorDetails = createErrorDetails(error, 'requestGeolocation');
          
          // Если ошибка связана с отказом в разрешении
          if (error.code === 1) {
            useDefaultLocation();
          }
          
          setState(prev => ({
            ...prev,
            error: getGeoErrorMessage(error.code),
            loading: false,
            errorDetails
          }));
        }
      },
      options
    );
  }, [state.loading, checkGeolocationSupport, createErrorDetails, useDefaultLocation, options]);
  
  // Функция для обновления позиции
  const updatePosition = useCallback((newPosition: [number, number]) => {
    // Отклоняем обновления, которые приходят слишком часто
    const now = Date.now();
    const elapsed = now - lastUpdateTimestampRef.current;
    
    if (elapsed < MIN_UPDATE_INTERVAL) {
      // Если обновление пришло слишком рано, откладываем его
      if (!pendingPositionUpdateRef.current) {
        pendingPositionUpdateRef.current = true;
        
        // Очищаем предыдущий таймер, если он есть
        if (positionUpdateTimerRef.current) {
          clearTimeout(positionUpdateTimerRef.current);
        }
        
        // Запланируем обновление через оставшееся время до минимального интервала
        positionUpdateTimerRef.current = setTimeout(() => {
          setState(prev => ({
            ...prev,
            position: newPosition,
            isUsingDefaultLocation: false
          }));
          
          pendingPositionUpdateRef.current = false;
          lastUpdateTimestampRef.current = Date.now();
        }, MIN_UPDATE_INTERVAL - elapsed);
      }
      return;
    }
    
    // Обновляем состояние с новой позицией
    setState(prev => ({
      ...prev,
      position: newPosition,
      isUsingDefaultLocation: false
    }));
    
    lastUpdateTimestampRef.current = now;
  }, []);
  
  // Эффект для инициализации геолокации при монтировании
  useEffect(() => {
    // Инициализируем геолокацию
    initializeGeolocation();
    
    // Очистка при размонтировании
    return () => {
      isMounted.current = false;
      
      // Очищаем все таймеры
      if (retryTimerId.current !== null) {
        clearTimeout(retryTimerId.current);
        retryTimerId.current = null;
      }
      
      if (throttleTimer.current !== null) {
        clearTimeout(throttleTimer.current);
        throttleTimer.current = null;
      }
      
      if (positionUpdateTimerRef.current !== null) {
        clearTimeout(positionUpdateTimerRef.current);
        positionUpdateTimerRef.current = null;
      }
      
      // Останавливаем watchPosition, если он был запущен
      if (watcherId.current !== null) {
        navigator.geolocation.clearWatch(watcherId.current);
        watcherId.current = null;
      }
    };
  }, [initializeGeolocation]);
  
  // Возвращаем состояние и функции для работы с геолокацией
  return {
    position: state.position,
    error: state.error,
    timestamp: state.timestamp,
    updatePosition,
    requestGeolocation,
    loading: state.loading,
    permissionDenied: state.permissionDenied,
    useDefaultLocation,
    isUsingDefaultLocation: state.isUsingDefaultLocation,
    errorDetails: state.errorDetails
  };
}; 