import { useMutation as useConvexOriginalMutation } from "convex/react";
import { useState, useCallback } from "react";
import { useMutation as useTanStackMutation } from "@tanstack/react-query";
import { handleApiError, logApiCall } from "../../utils/convex.ts";
import { 
  ConvexMutationResult, 
  ConvexTanStackMutationResult, 
  ConvexMutationResultGeneric 
} from "../../types/tanstack-query";

/**
 * Расширенный хук для работы с мутациями Convex с поддержкой TanStack Query
 * Добавляет обработку состояний загрузки, ошибок и колбэки успеха/неудачи
 * 
 * @param mutationFunc - Функция мутации из Convex API
 * @param options - Дополнительные опции
 * @returns Объект с функцией мутации и состояниями
 */
export function useConvexMutation<TData, TVariables = any>(
  mutationFunc: any,
  options: {
    onSuccess?: (data: TData) => void;
    onError?: (error: Error) => void;
    onSettled?: (data: TData | undefined, error: Error | null) => void;
    logMutation?: boolean;
    useTanStack?: boolean;
    gcTime?: number;
    retry?: number | boolean | ((failureCount: number, error: Error) => boolean);
    retryDelay?: number | ((failureCount: number, error: Error) => number);
  } = {}
): ConvexMutationResultGeneric<TData, Error, TVariables> {
  const { 
    onSuccess, 
    onError, 
    onSettled, 
    logMutation = false,
    useTanStack = false,
    gcTime,
    retry,
    retryDelay
  } = options;
  
  // Если используем TanStack Query
  if (useTanStack) {
    // Создаем функцию для мутации, которая будет использоваться в TanStack Query
    const mutateFunction = useCallback(async (variables: TVariables): Promise<TData> => {
      try {
        // Логируем вызов мутации, если включена опция
        if (logMutation) {
          const funcName = mutationFunc._name || 'unknown';
          logApiCall(funcName, variables);
        }
        
        // Выполняем мутацию через Promise, так как Convex использует свой тип Promise
        return await new Promise<TData>((resolve, reject) => {
          const convexMutation = useConvexOriginalMutation(mutationFunc);
          convexMutation(variables as any)
            .then((result: TData) => {
              // Логируем результат, если включена опция
              if (logMutation) {
                const funcName = mutationFunc._name || 'unknown';
                logApiCall(`${funcName} (result)`, undefined, result);
              }
              resolve(result as TData);
            })
            .catch((error: any) => {
              const wrappedError = handleApiError(error);
              
              // Логируем ошибку, если включена опция
              if (logMutation) {
                const funcName = mutationFunc._name || 'unknown';
                console.error(`Error in mutation ${funcName}:`, wrappedError);
              }
              
              reject(wrappedError);
            });
        });
      } catch (error) {
        throw handleApiError(error);
      }
    }, [mutationFunc, logMutation]);
    
    // Используем TanStack Query для управления мутацией
    return useTanStackMutation<TData, Error, TVariables>({
      mutationFn: mutateFunction,
      gcTime,
      retry,
      retryDelay,
      onSuccess,
      onError,
      onSettled
    }) as ConvexTanStackMutationResult<TData, Error, TVariables>;
  }
  
  // Для обратной совместимости используем предыдущую реализацию
  const [data, setData] = useState<TData | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Получаем стандартную функцию мутации из Convex
  const convexMutation = useConvexOriginalMutation(mutationFunc);
  
  // Оборачиваем мутацию для добавления обработки состояний и колбэков
  const mutate = useCallback(
    async (variables: TVariables): Promise<TData | undefined> => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Логируем вызов мутации, если включена опция
        if (logMutation) {
          const funcName = mutationFunc._name || 'unknown';
          logApiCall(funcName, variables);
        }
        
        // Выполняем мутацию
        const result = await convexMutation(variables as any);
        
        // Обрабатываем успешный результат
        setData(result as TData);
        setIsLoading(false);
        
        if (onSuccess) {
          onSuccess(result as TData);
        }
        
        if (onSettled) {
          onSettled(result as TData, null);
        }
        
        // Логируем результат, если включена опция
        if (logMutation) {
          const funcName = mutationFunc._name || 'unknown';
          logApiCall(`${funcName} (result)`, undefined, result);
        }
        
        return result as TData;
      } catch (e) {
        // Обрабатываем ошибку
        const caughtError = e instanceof Error ? e : new Error(String(e));
        setError(caughtError);
        setIsLoading(false);
        
        if (onError) {
          onError(caughtError);
        }
        
        if (onSettled) {
          onSettled(undefined, caughtError);
        }
        
        // Логируем ошибку, если включена опция
        if (logMutation) {
          const funcName = mutationFunc._name || 'unknown';
          console.error(`Error in mutation ${funcName}:`, caughtError);
        }
        
        return undefined;
      }
    },
    [convexMutation, onSuccess, onError, onSettled, logMutation, mutationFunc]
  );
  
  return {
    mutate,
    data,
    error,
    isLoading,
    isError: error !== null,
    isSuccess: data !== undefined && error === null,
    reset: useCallback(() => {
      setData(undefined);
      setError(null);
    }, [])
  } as ConvexMutationResult<TData, Error, TVariables>;
} 