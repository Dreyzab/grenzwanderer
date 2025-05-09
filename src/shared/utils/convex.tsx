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