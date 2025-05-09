import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Опции для конфигурации QueryClient
 */
interface QueryProviderOptions {
  /**
   * Время кэширования успешных запросов (в мс)
   * @default 1000 * 60 * 5 (5 минут)
   */
  staleTime?: number;
  /**
   * Время хранения данных после размонтирования компонента (в мс)
   * @default 1000 * 60 * 10 (10 минут)
   */
  gcTime?: number;
  /**
   * Повторное выполнение запроса при фокусе окна
   * @default true
   */
  refetchOnWindowFocus?: boolean;
  /**
   * Повторное выполнение запроса при подключении к сети
   * @default true
   */
  refetchOnReconnect?: boolean;
  /**
   * Включение режима разработки
   * @default process.env.NODE_ENV !== 'production'
   */
  devMode?: boolean;
}

/**
 * Провайдер для TanStack Query, оборачивает приложение
 * и предоставляет доступ к функционалу кэширования запросов
 */
export const QueryProvider: React.FC<React.PropsWithChildren<QueryProviderOptions>> = ({
  children,
  staleTime = 1000 * 60 * 5, // 5 минут
  gcTime = 1000 * 60 * 10, // 10 минут
  refetchOnWindowFocus = true,
  refetchOnReconnect = true,
  devMode = process.env.NODE_ENV !== 'production'
}) => {
  // Создаем инстанс QueryClient с настройками по умолчанию
  const [queryClient] = React.useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime,
        gcTime,
        refetchOnWindowFocus,
        refetchOnReconnect,
        retry: 1, // По умолчанию пытаемся повторить запрос 1 раз
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

export default QueryProvider; 