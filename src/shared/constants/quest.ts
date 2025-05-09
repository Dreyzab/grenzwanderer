/**
 * Перечисления (enum) для состояний квестов и возможных действий игрока
 */

// Импортируем типы из types/quest.types.ts для обратной совместимости
import { QuestState, QuestAction } from '../types/quest.types';

/**
 * Состояния квеста в рамках игровой сессии
 */
export enum QuestSessionState {
  NOT_STARTED = 'NOT_STARTED',   // Квест еще не начат
  IN_PROGRESS = 'IN_PROGRESS',   // Квест в процессе выполнения
  COMPLETED = 'COMPLETED',       // Квест успешно завершен
  FAILED = 'FAILED'              // Квест провален
}

// Обратная совместимость с устаревшими импортами
export type QuestStateEnum = QuestState;
export type QuestActionEnum = QuestAction;

// Реэкспорт QuestState как QuestStateEnum для использования в качестве значения
export const QuestStateEnum = QuestState;

/**
 * Доступные игроку действия в рамках квеста
 */
export enum QuestPlayerAction {
  ACCEPT_QUEST = 'ACCEPT_QUEST',       // Принять квест
  DECLINE_QUEST = 'DECLINE_QUEST',     // Отклонить квест
  SCAN_ITEM = 'SCAN_ITEM',             // Отсканировать предмет
  COLLECT_ITEM = 'COLLECT_ITEM',       // Собрать предмет
  DELIVER_ITEM = 'DELIVER_ITEM',       // Доставить предмет
  TALK_TO_NPC = 'TALK_TO_NPC',         // Поговорить с NPC
  CHOOSE_DIALOG_OPTION = 'CHOOSE_DIALOG_OPTION', // Выбрать вариант диалога
  COMPLETE_OBJECTIVE = 'COMPLETE_OBJECTIVE', // Выполнить задачу
  REACH_LOCATION = 'REACH_LOCATION',    // Достичь определенной локации
  ABANDON_QUEST = 'ABANDON_QUEST'       // Отказаться от квеста
}

/**
 * Типы наград за квесты
 */
export enum QuestRewardType {
  ITEM = 'ITEM',                // Предмет
  CURRENCY = 'CURRENCY',        // Валюта
  EXPERIENCE = 'EXPERIENCE',    // Опыт
  REPUTATION = 'REPUTATION',    // Репутация
  SKILL_POINT = 'SKILL_POINT',  // Очки навыков
  UNLOCK_AREA = 'UNLOCK_AREA',  // Разблокировка локации
  UNLOCK_RECIPE = 'UNLOCK_RECIPE', // Разблокировка рецепта крафта
  PERK = 'PERK'                 // Перк/особая способность
}

/**
 * Категории квестов
 */
export enum QuestCategory {
  MAIN = 'MAIN',                // Основной сюжет
  SIDE = 'SIDE',                // Побочный квест
  DAILY = 'DAILY',              // Ежедневный квест
  FACTION = 'FACTION',          // Квест фракции
  TUTORIAL = 'TUTORIAL',        // Обучающий квест
  CHALLENGE = 'CHALLENGE',      // Испытание
  EVENT = 'EVENT'               // Квест события
}