import { createEvent, createStore, restore } from 'effector';
import { QuestAction } from '../../../shared/types/quest.types';

// Создаем событие для обработки действий квеста
export const questActionPerformed = createEvent<QuestAction>();

// Создаем стор для хранения истории действий
export const $questActionsHistory = createStore<QuestAction[]>([])
  .on(questActionPerformed, (state, action) => [...state, action]);

// Создаем стор для хранения последнего действия
export const $lastQuestAction = restore<QuestAction | null>(
  questActionPerformed.map(action => action), 
  null
);

// Хелпер-функция для создания действия определенного типа
export function createQuestAction(
  type: QuestAction, 
  payload?: Record<string, any>
): { type: QuestAction } & Record<string, any> {
  return {
    type,
    ...payload
  };
} 