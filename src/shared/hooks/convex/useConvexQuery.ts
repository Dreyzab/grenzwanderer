import { useQuery as useConvexOriginalQuery } from "convex/react";
import { useState, useEffect, useCallback } from "react";
import { useQuery as useTanStackQuery } from "@tanstack/react-query";
import { handleApiError } from "../../utils/convex.ts";
import { 
  ConvexQueryResult, 
  ConvexTanStackQueryResult, 
  ConvexQueryResultGeneric 
} from "../../types/tanstack-query";

/**
 * Расширенный хук для работы с запросами Convex с поддержкой TanStack Query
 * Добавляет обработку ошибок, состояния загрузки и возможность использовать fallback данные
 * 
 * @param queryFunc - Функция запроса из Convex API
 * @param args - Аргументы для запроса
 * @param options - Дополнительные опции
 * @returns Объект с данными, состоянием загрузки и ошибкой
 */
export function useConvexQuery<TData, TArgs extends object = {}>(
  queryFunc: any,
  args: TArgs,
  options: {
    fallbackData?: TData;
    enabled?: boolean;
    onSuccess?: (data: TData) => void;
    onError?: (error: Error) => void;
    staleTime?: number;
    gcTime?: number;
    refetchOnWindowFocus?: boolean;
    refetchOnMount?: boolean | "always";
    useTanStack?: boolean;
  } = {}
): ConvexQueryResultGeneric<TData, Error> {
  const { 
    fallbackData, 
    enabled = true, 
    onSuccess, 
    onError,
    staleTime,
    gcTime,
    refetchOnWindowFocus = true,
    refetchOnMount = true,
    useTanStack = false
  } = options;
  
  // Определяем функцию запроса для TanStack Query
  const fetchQuery = useCallback(async () => {
    try {
      if (!enabled) {
        throw new Error("Query is disabled");
      }
      
      // Используем системный Promise для вызова Convex функции
      return await new Promise<TData>((resolve, reject) => {
        // Здесь нужен workaround, так как Convex возвращает Promise, но это не стандартный Promise
        // и мы не можем нормально использовать await с ним в контексте TanStack Query
        queryFunc(args)
          .then((result: TData) => resolve(result))
          .catch((error: Error) => reject(handleApiError(error)));
      });
    } catch (error) {
      throw handleApiError(error);
    }
  }, [queryFunc, args, enabled]);
  
  // Если используем TanStack Query
  if (useTanStack) {
    // @ts-ignore - Обходим строгую типизацию TanStack Query
    return useTanStackQuery({
      queryKey: [queryFunc._name, args],
      queryFn: fetchQuery,
      enabled,
      initialData: fallbackData,
      staleTime,
      gcTime,
      refetchOnWindowFocus,
      refetchOnMount,
      onSuccess,
      onError,
    }) as ConvexTanStackQueryResult<TData, Error>;
  }
  
  // Если используем нативный Convex Query (обратная совместимость)
  const [error, setError] = useState<Error | null>(null);
  
  // Используем стандартный useQuery из Convex, но с обработкой enabled
  const result = useConvexOriginalQuery(
    enabled ? queryFunc : null,
    enabled ? args : undefined
  );
  
  // Обрабатываем успешный результат и ошибки
  useEffect(() => {
    if (result !== undefined) {
      if (onSuccess && result !== null) {
        onSuccess(result as TData);
      }
    }
  }, [result, onSuccess]);
  
  useEffect(() => {
    if (result === undefined && enabled) {
      // Запрос в процессе загрузки, но еще нет ошибки
      setError(null);
    }
  }, [result, enabled]);
  
  // Обработка ошибок (в Convex ошибки могут приходить как исключения)
  useEffect(() => {
    try {
      if (result instanceof Error) {
        setError(result);
        if (onError) {
          onError(result);
        }
      }
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      setError(error);
      if (onError) {
        onError(error);
      }
    }
  }, [result, onError]);
  
  // Определяем состояние загрузки
  const isLoading = result === undefined && enabled;
  
  // Возвращаем данные или fallback, если данные еще не загружены
  const data = (result !== undefined && result !== null)
    ? result as TData
    : fallbackData;
  
  return {
    data,
    isLoading,
    error,
    isError: error !== null,
    // Данные успешно загружены, если есть результат и нет ошибки
    isSuccess: result !== undefined && result !== null && !error,
  } as ConvexQueryResult<TData, Error>;
} 