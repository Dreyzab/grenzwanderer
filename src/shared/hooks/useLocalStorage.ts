import { useState, useEffect, useCallback } from 'react';

/**
 * Хук для работы с localStorage с поддержкой типизации и debounce
 * @param key Ключ для хранения в localStorage
 * @param initialValue Начальное значение
 * @param debounceMs Время задержки в мс перед сохранением (опционально)
 * @returns [value, setValue] Пара значение и функция для его обновления
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  debounceMs = 0
): [T, (value: T) => void] {
  // Получаем начальное значение из localStorage или используем initialValue
  const getStoredValue = (): T => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Ошибка при получении значения из localStorage по ключу ${key}:`, error);
      return initialValue;
    }
  };

  const [storedValue, setStoredValue] = useState<T>(getStoredValue);
  
  // Функция для установки значения, опционально с задержкой
  const setValue = useCallback((value: T) => {
    // Обновляем состояние React немедленно
    setStoredValue(value);
    
    // Функция для непосредственного сохранения в localStorage
    const saveToStorage = () => {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error(`Ошибка при сохранении значения в localStorage по ключу ${key}:`, error);
      }
    };
    
    // Если указан debounce, используем setTimeout
    if (debounceMs > 0) {
      const timeoutId = setTimeout(saveToStorage, debounceMs);
      return () => clearTimeout(timeoutId);
    } else {
      // Иначе сохраняем немедленно
      saveToStorage();
      return undefined;
    }
  }, [key, debounceMs]);
  
  // Синхронизируем значение при изменении ключа
  useEffect(() => {
    setStoredValue(getStoredValue());
  }, [key]);
  
  return [storedValue, setValue];
} 