/**
 * Типы для квестов, действий и состояний квестовой системы
 */

// Состояния квестов
export enum QuestState {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

// Совместимость с QuestSessionState из constants
export type QuestStateEnum = QuestState;

// Типы квестов
export enum QuestType {
  MAIN = 'main',
  SIDE = 'side',
  REPEATABLE = 'repeatable',
  DAILY = 'daily',
  FACTION = 'faction'
}

// Действия в квестах
export enum QuestAction {
  SCAN_QR = 'scanQr',
  TALK_TO_NPC = 'talkToNpc',
  COLLECT_ITEM = 'collectItem',
  DELIVER_ITEM = 'deliverItem',
  REACH_LOCATION = 'reachLocation',
  ACTIVATE_DEVICE = 'activateDevice',
  COMPLETE_SCENE = 'completeScene',
  START_GAME = 'startGame' // Добавлено для совместимости с QuestActionEnum
}

// Совместимость с QuestActionEnum из constants
export type QuestActionEnum = QuestAction;

// Условия для квестов
export interface QuestCondition {
  type: QuestAction;
  targetId: string;
  count?: number;
  completed: boolean;
}

// Награды за квесты
export interface QuestReward {
  type: 'item' | 'currency' | 'experience' | 'reputation';
  id?: string;
  amount: number;
  factionId?: string;
}

// Структура квеста
export interface Quest {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  state: QuestState;
  level: number;
  conditions: QuestCondition[];
  rewards: QuestReward[];
  nextQuestId?: string;
  requiredQuestIds?: string[];
  sceneId?: string;
  factionId?: string;
}

// Структура состояния квеста для игрока
export interface PlayerQuestState {
  playerId: string;
  questId: string;
  state: QuestState;
  progress: {
    conditionId: string;
    completed: boolean;
    count?: number;
  }[];
  startedAt: number;
  completedAt?: number;
  choices?: {
    sceneId: string;
    choiceId: string;
    timestamp: number;
  }[];
}

// Результат сканирования QR кода
export interface QRScanResult {
  message: string;
  questState?: QuestState;
  sceneId?: string;
  completedStep?: string;
  action?: QuestAction;
}

// Результат запуска квеста
export interface QuestStartResult {
  message: string;
  questState?: QuestState;
  sceneId?: string;
  action?: QuestAction;
}

// Результат выполнения действия в квесте
export interface QuestActionResult {
  message: string;
  questState?: QuestState;
  sceneId?: string;
  completedStep?: string;
  action?: QuestAction;
} 