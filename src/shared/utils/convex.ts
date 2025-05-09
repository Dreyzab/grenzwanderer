/**
 * Утилиты для работы с Convex API
 */

// Реэкспортируем клиент Convex из приложения
export { convex } from '../../app/convex';

interface ConvexErrorData {
  code?: string | number;
  [key: string]: any;
}

/**
 * Обрабатывает ошибки API Convex и возвращает стандартизированный объект ошибки
 * @param error Исходная ошибка
 * @returns Стандартизированная ошибка
 */
export function handleApiError(error: any): Error {
  if (error instanceof Error) {
    // Добавляем дополнительную информацию к ошибке, если необходимо
    if ('data' in error && typeof error.data === 'object' && error.data !== null) {
      const convexErrorData = error.data as ConvexErrorData;
      // В некоторых средах Error может не поддерживать второй параметр, поэтому используем более безопасный подход
      const enhancedError = new Error(
        `${error.message} (код: ${convexErrorData?.code || 'неизвестен'})`
      );
      // Добавляем cause вручную для обратной совместимости
      (enhancedError as any).cause = error;
      return enhancedError;
    }
    return error;
  }
  
  // Если это строка или другой тип данных, создаем новую ошибку
  return new Error(
    typeof error === 'string' ? error : 'Произошла неизвестная ошибка'
  );
}

/**
 * Логирует вызов API (в режиме разработки)
 * @param functionName Название функции API
 * @param args Аргументы вызова (опционально)
 * @param result Результат выполнения (опционально)
 */
export function logApiCall(
  functionName: string,
  args?: any,
  result?: any
): void {
  if (process.env.NODE_ENV !== 'production') {
    if (args) {
      console.group(`API Call: ${functionName}`);
      console.log('Arguments:', args);
      if (result !== undefined) {
        console.log('Result:', result);
      }
      console.groupEnd();
    } else if (result !== undefined) {
      console.group(`API Result: ${functionName}`);
      console.log(result);
      console.groupEnd();
    }
  }
}

/**
 * Создает мок данных для режима разработки
 * @param mockData Мок-данные
 * @param delay Задержка в мс
 * @returns Промис с мок-данными
 */
export function createMockData<T>(mockData: T, delay = 500): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockData);
    }, delay);
  });
}

/**
 * Проверяет, находится ли приложение в режиме мокирования данных
 * Использует env-переменную VITE_USE_MOCK_DATA
 */
export function isMockMode(): boolean {
  return import.meta.env.VITE_USE_MOCK_DATA === 'true';
} 