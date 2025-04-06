import { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';

/**
 * Хук для работы с localStorage с debounce для оптимизации записи
 * @param key Ключ для хранения в localStorage
 * @param initialValue Начальное значение
 * @param debounceMs Задержка для debounce (мс)
 */
export function useLocalStorage<T>(
  key: string, 
  initialValue: T, 
  debounceMs: number = 300
): [T, (value: T | ((val: T) => T)) => void] {
  // Состояние для хранения текущего значения
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // Пытаемся получить значение из localStorage
      const item = window.localStorage.getItem(key);
      // Возвращаем разобранное значение или initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return initialValue;
    }
  });

  // Функция для обновления и сохранения значения
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      // Обновляем состояние React
      setStoredValue(prevValue => {
        const valueToStore = value instanceof Function ? value(prevValue) : value;
        return valueToStore;
      });
    } catch (error) {
      console.error('Error setting value in useState:', error);
    }
  }, []);

  // Делаем мемоизированную функцию с debounce для сохранения в localStorage
  const debouncedSave = useCallback(
    debounce((newValue: T) => {
      try {
        // Сохраняем значение в localStorage
        window.localStorage.setItem(key, JSON.stringify(newValue));
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
    }, debounceMs),
    [key, debounceMs]
  );

  // Эффект для сохранения значения в localStorage при его изменении
  useEffect(() => {
    debouncedSave(storedValue);
  }, [storedValue, debouncedSave]);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      debouncedSave.flush();
    };
  }, [debouncedSave]);

  return [storedValue, setValue];
}