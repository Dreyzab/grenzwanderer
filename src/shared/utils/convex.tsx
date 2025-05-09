/**
 * Инициализация и экспорт клиента Convex
 */
import { ConvexReactClient } from "convex/react";
import { ConvexProvider } from "convex/react";
import React from "react";

// Инициализация клиента Convex
export const convex = new ConvexReactClient(process.env.CONVEX_URL || "");

// Обертка для использования Convex в приложении
export const ConvexClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
};

// Хелпер для обработки ошибок API
export const handleApiError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return "Неизвестная ошибка при взаимодействии с API";
};

// Хелпер для логирования API-вызовов (может использоваться для отладки)
export const logApiCall = (functionName: string, args?: any, result?: any): void => {
  if (process.env.NODE_ENV === "development") {
    console.log(`API Call: ${functionName}`, {
      args,
      result,
    });
  }
};

/**
 * Типы для стандартизированного мокирования данных
 */

export interface MockDataOptions {
  /** Задержка в мс для имитации сетевого запроса */
  delay?: number;
  /** Вероятность ошибки (от 0 до 1) */
  errorRate?: number;
  /** Сообщение об ошибке */
  errorMessage?: string;
}

/**
 * Создает мок-функцию для Convex запроса с настраиваемыми параметрами
 * 
 * @param mockData - Данные, которые вернет запрос
 * @param options - Опции мокирования (задержка, вероятность ошибки)
 * @returns Функция, имитирующая запрос к API
 */
export function createMockQuery<T, Args = any>(
  mockData: T | ((args: Args) => T),
  options: MockDataOptions = {}
): (args: Args) => Promise<T> {
  const { delay = 300, errorRate = 0, errorMessage = "Ошибка запроса" } = options;
  
  return async (args: Args): Promise<T> => {
    await simulateNetworkDelay(delay);
    
    // Имитируем случайную ошибку с заданной вероятностью
    if (errorRate > 0 && Math.random() < errorRate) {
      throw new Error(errorMessage);
    }
    
    // Возвращаем мок-данные, при необходимости вызывая функцию-генератор
    return typeof mockData === 'function' 
      ? (mockData as Function)(args) as T
      : mockData;
  };
}

/**
 * Создает мок-функцию для Convex мутации с настраиваемыми параметрами
 * 
 * @param mockResponseFn - Функция для генерации ответа на основе входящих данных
 * @param options - Опции мокирования (задержка, вероятность ошибки)
 * @returns Функция, имитирующая мутацию API
 */
export function createMockMutation<T, Args = any>(
  mockResponseFn: (args: Args) => T,
  options: MockDataOptions = {}
): (args: Args) => Promise<T> {
  const { delay = 500, errorRate = 0, errorMessage = "Ошибка мутации" } = options;
  
  return async (args: Args): Promise<T> => {
    await simulateNetworkDelay(delay);
    
    // Имитируем случайную ошибку с заданной вероятностью
    if (errorRate > 0 && Math.random() < errorRate) {
      throw new Error(errorMessage);
    }
    
    return mockResponseFn(args);
  };
}

/**
 * Утилита для имитации сетевой задержки
 */
export function simulateNetworkDelay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Хелпер для определения, нужно ли использовать мок-данные
 * 
 * @param shouldUseMocks - Флаг для включения моков (опционально)
 * @returns Использовать ли моки
 */
export function shouldUseMockData(shouldUseMocks?: boolean): boolean {
  // Используем моки, если явно указано, в режиме разработки, или если нет URL Convex
  return shouldUseMocks === true || 
         (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_MOCKS === 'true') ||
         !process.env.CONVEX_URL;
} 