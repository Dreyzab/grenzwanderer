/**
 * Индексный файл для экспорта всех хуков
 * Обеспечивает единую точку входа для импорта
 * 
 * @module Hooks
 */

// Общие хуки
export { useLocalStorage } from './useLocalStorage';

// Хуки для работы с Convex
export { useConvexQuery, useConvexMutation } from './convex';

// Утилиты для работы с Effector
export {
  createEntityCrudOperations,
  type EntityCrudOperations
} from './effector';

// Хуки для работы с Context7
export {
  useContext7,
  useLibraryInfo,
  type Context7Status,
  type UseContext7Options,
  type UseContext7Result
} from './context7'; 