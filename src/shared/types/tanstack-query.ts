/**
 * Типы для работы с TanStack Query
 */

import { 
  QueryObserverResult, 
  UseMutationResult
} from '@tanstack/react-query';

/**
 * Результат запроса Convex с TanStack Query
 */
export type ConvexTanStackQueryResult<TData, TError = Error> = QueryObserverResult<TData, TError> & {
  refetch: () => Promise<QueryObserverResult<TData, TError>>;
};

/**
 * Результат мутации Convex с TanStack Query
 */
export type ConvexTanStackMutationResult<TData = unknown, TError = Error, TVariables = void, TContext = unknown> = 
  UseMutationResult<TData, TError, TVariables, TContext> & {
  mutate: (variables: TVariables) => void;
  mutateAsync: (variables: TVariables) => Promise<TData>;
};

/**
 * Результат запроса Convex без TanStack Query
 */
export interface ConvexQueryResult<TData, TError = Error> {
  data: TData | undefined;
  isLoading: boolean;
  error: TError | null;
  isError: boolean;
  isSuccess: boolean;
}

/**
 * Результат мутации Convex без TanStack Query
 */
export interface ConvexMutationResult<TData, TError = Error, TVariables = void> {
  mutate: (variables: TVariables) => Promise<TData | undefined>;
  data: TData | undefined;
  error: TError | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  reset: () => void;
}

/**
 * Общий тип для результата запроса (с TanStack Query или без)
 */
export type ConvexQueryResultGeneric<TData, TError = Error> = 
  | ConvexTanStackQueryResult<TData, TError>
  | ConvexQueryResult<TData, TError>;

/**
 * Общий тип для результата мутации (с TanStack Query или без)
 */
export type ConvexMutationResultGeneric<TData, TError = Error, TVariables = void, TContext = unknown> = 
  | ConvexTanStackMutationResult<TData, TError, TVariables, TContext>
  | ConvexMutationResult<TData, TError, TVariables>; 