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
  console.log('Инициализация хука useLocation');
  
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
      console.log('Текущий статус разрешения геолокации:', permissionState);
      
      permissionStateRef.current = permissionState;
      
      if (permissionState === 'denied') {
        setState(prev => ({
          ...prev,
          permissionDenied: true,
          loading: false
        }));
        
        // Автоматически переключаемся на координаты по умолчанию
        if (!state.position) {
          console.log('Доступ к геолокации запрещен, используем координаты по умолчанию');
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
    
    // Очищаем таймер обновления позиции при размонтировании
    if (positionUpdateTimerRef.current) {
      clearTimeout(positionUpdateTimerRef.current);
      positionUpdateTimerRef.current = null;
    }
    
    pendingPositionUpdateRef.current = false;
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
  
  // Настройка троттлинга обновления позиции
  const throttledPositionUpdate = useCallback((newPosition: [number, number]) => {
    if (throttleTimer.current) {
      return; // Пропускаем обновление, если уже идет отложенное обновление
    }
    
    throttleTimer.current = window.setTimeout(() => {
      if (isMounted.current) {
        setState(prev => ({
          ...prev,
          position: newPosition,
          error: null,
          loading: false,
          permissionDenied: false,
          isUsingDefaultLocation: false
        }));
      }
      
      throttleTimer.current = null;
    }, 500); // Ограничиваем частоту обновлений до 2 раз в секунду
  }, []);
  
  // Реализация updatePosition как обертки над throttledPositionUpdate
  const updatePosition = useCallback((newPosition: [number, number]) => {
    if (!isMounted.current) return;
    
    console.log('Ручное обновление позиции:', newPosition);
    throttledPositionUpdate(newPosition);
  }, [throttledPositionUpdate]);
  
  // Функция обработки ошибок геолокации
  const handleError = useCallback((error: GeolocationPositionError) => {
    if (!isMounted.current) return;
    
    // Увеличиваем счетчик попыток
    attemptCount.current += 1;
    
    // Выводим полное представление ошибки
    console.log('Полное строковое представление ошибки геолокации:', error);
    
    // Создаем детальную информацию об ошибке для дальнейшего анализа
    const errorDetails = createErrorDetails(error, 'handleError');
    
    // Если это ошибка из-за отказа в разрешении (код 1)
    if (error.code === 1) {
      clearGeolocationResources();
      
      // Устанавливаем флаг, что пользователь отказал в доступе
      console.log('Обнаружен отказ в разрешении, обновляем состояние permissionDenied');
      
      // Сохраняем статус в localStorage
      savePermissionState('denied');
      permissionStateRef.current = 'denied';
      
      // Обновляем состояние
      setState(prev => ({
        ...prev,
        permissionDenied: true,
        error: getGeoErrorMessage(error.code),
        loading: false,
        errorDetails
      }));
      
      // Используем фиксированные координаты при отказе в доступе
      console.log('Использование фиксированных координат:', DEFAULT_LOCATION);
      useDefaultLocation();
      
      return;
    }
    
    // Обновляем состояние с информацией об ошибке
    setState(prev => ({
      ...prev,
      error: getGeoErrorMessage(error.code),
      loading: false,
      errorDetails
    }));
    
    // Выводим информацию об ошибке для диагностики
    console.error('Ошибка наблюдателя геолокации:', getGeoErrorMessage(error.code), error.code, error.message, {
      permissionDenied: state.permissionDenied,
      errorString: String(error),
      timestamp: new Date().toISOString()
    });
    
    // При ошибках с кодом 2 (POSITION_UNAVAILABLE) и 3 (TIMEOUT)
    // можно реализовать логику повторных попыток или других стратегий
    if ((error.code === 2 || error.code === 3) && attemptCount.current < MAX_ATTEMPTS) {
      // При временных ошибках можно попробовать получить позицию еще раз через некоторое время
      if (retryTimerId.current === null) {
        console.log(`Ошибка геолокации, попытка ${attemptCount.current}/${MAX_ATTEMPTS}. Повторный запрос через 5 секунд...`);
        retryTimerId.current = window.setTimeout(() => {
          if (isMounted.current && requestGeolocationRef.current) {
            retryTimerId.current = null;
            requestGeolocationRef.current();
          }
        }, 5000);
      }
    } else {
      // После исчерпания всех попыток или при других ошибках используем фиксированную локацию
      useDefaultLocation();
    }
  }, [state.permissionDenied, useDefaultLocation, createErrorDetails]);
  
  // Обновляем функцию успешного обновления позиции
  const handleSuccess = useCallback((position: GeolocationPosition) => {
    if (!isMounted.current) return;
    
    // Очищаем счетчик попыток при успешном получении позиции
    attemptCount.current = 0;
    
    // Сохраняем статус разрешения как "granted"
    savePermissionState('granted');
    permissionStateRef.current = 'granted';
    
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    
    console.log('Получены новые координаты:', latitude, longitude);
    
    setState(prev => ({
      ...prev,
      position: [longitude, latitude],
      error: null,
      loading: false,
      permissionDenied: false,
      isUsingDefaultLocation: false
    }));
    
    throttledPositionUpdate([latitude, longitude]);
  }, [throttledPositionUpdate]);
  
  // Предварительное объявление функции для разрешения циклической зависимости
  const requestGeolocationRef = useRef<() => void>();

  // Функция для запроса геолокации
  const requestGeolocation = useCallback(async () => {
    // Если компонент размонтирован, выходим
    if (!isMounted.current) {
      console.log('Компонент размонтирован, отмена запроса геолокации');
      return;
    }
    
    // Проверяем поддержку геолокации в браузере
    if (!checkGeolocationSupport()) {
      console.log('Геолокация не поддерживается в этом браузере');
      setState(prev => ({
        ...prev,
        error: 'Геолокация не поддерживается в вашем браузере',
        loading: false
      }));
      useDefaultLocation();
      return;
    }
    
    // Проверяем состояние разрешения перед запросом
    const permissionState = await updatePermissionState();
    console.log('Проверка разрешения перед запросом геолокации:', permissionState);
    
    // Если разрешение уже отклонено, используем координаты по умолчанию
    if (permissionState === 'denied') {
      console.log('Разрешение на геолокацию отклонено, используем координаты по умолчанию');
      useDefaultLocation();
      return;
    }
    
    // Если у нас уже есть позиция и разрешение предоставлено, не запрашиваем снова
    if (state.position && permissionState === 'granted' && !state.error) {
      console.log('Позиция уже определена и разрешение получено, пропускаем повторный запрос');
      return;
    }
    
    // Если мы уже пытались получить геолокацию слишком много раз и достигли лимита
    if (attemptCount.current >= MAX_ATTEMPTS) {
      console.log(`Достигнут лимит попыток (${MAX_ATTEMPTS}), используем координаты по умолчанию`);
      useDefaultLocation();
      return;
    }
    
    // Если инициализация уже произошла и мы превысили количество попыток инициализации
    if (hasInitialized.current && initAttemptCount.current >= MAX_INIT_ATTEMPTS) {
      console.log(`Достигнут лимит попыток инициализации (${MAX_INIT_ATTEMPTS}), пропускаем повторный запрос`);
      return;
    }
    
    // Увеличиваем счетчик попыток инициализации
    initAttemptCount.current += 1;
    console.log(`Попытка инициализации геолокации ${initAttemptCount.current}/${MAX_INIT_ATTEMPTS}`);
    
    setState(prev => ({ ...prev, loading: true }));
    
    // Запрашиваем текущую позицию с расширенными настройками
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000
      }
    );
    
    // Устанавливаем наблюдатель только если нет активного и мы не получили отказ в разрешении
    if (watcherId.current === null && permissionState !== 'denied') {
      console.log('Устанавливаем наблюдатель геолокации');
      
      watcherId.current = navigator.geolocation.watchPosition(
        handleSuccess,
        handleError,
        {
          enableHighAccuracy: true,
          timeout: 30000, // Увеличенный таймаут для наблюдателя
          maximumAge: 15000
        }
      );
    }
  }, [
    handleSuccess, 
    handleError, 
    state.permissionDenied, 
    state.position, 
    state.error, 
    useDefaultLocation, 
    checkGeolocationSupport,
    updatePermissionState
  ]);

  // Сохраняем ссылку на функцию запроса геолокации
  requestGeolocationRef.current = requestGeolocation;
  
  // Эффект для инициализации и очистки ресурсов
  useEffect(() => {
    isMounted.current = true;
    
    // Асинхронная функция для инициализации геолокации
    const initializeGeolocation = async () => {
      if (!hasInitialized.current) {
        hasInitialized.current = true;
        console.log('Первичная инициализация хука useLocation');
        
        // Проверяем состояние разрешения перед запросом
        await updatePermissionState();
        
        // Запрашиваем геолокацию только если разрешение не отклонено
        if (permissionStateRef.current !== 'denied') {
          requestGeolocation();
        } else {
          console.log('Разрешение уже отклонено при инициализации, используем координаты по умолчанию');
          useDefaultLocation();
        }
      }
    };
    
    initializeGeolocation();
    
    // Функция очистки ресурсов при размонтировании
    return () => {
      console.log('Очистка ресурсов геолокации при размонтировании');
      isMounted.current = false;
      clearGeolocationResources();
      
      // Очищаем таймеры
      if (positionUpdateTimerRef.current) {
        clearTimeout(positionUpdateTimerRef.current);
        positionUpdateTimerRef.current = null;
      }
      
      if (retryTimerId.current) {
        clearTimeout(retryTimerId.current);
        retryTimerId.current = null;
      }
      
      if (throttleTimer.current) {
        clearTimeout(throttleTimer.current);
        throttleTimer.current = null;
      }
    };
  }, [requestGeolocation, clearGeolocationResources, updatePermissionState, useDefaultLocation]);
  
  return {
    ...state,
    requestGeolocation,
    useDefaultLocation,
    updatePosition
  };
};