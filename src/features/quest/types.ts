/**
 * Types for Quest feature
 */

/**
 * Quest states as enum for better type safety
 */
export enum QuestStateEnum {
  REGISTERED = 'REGISTERED',
  CHARACTER_CREATION = 'CHARACTER_CREATION',
  TRAINING_MISSION = 'TRAINING_MISSION',
  NEW_MESSAGE = 'NEW_MESSAGE',
  DELIVERY_STARTED = 'DELIVERY_STARTED',
  PARTS_COLLECTED = 'PARTS_COLLECTED',
  ARTIFACT_HUNT = 'ARTIFACT_HUNT',
  ARTIFACT_FOUND = 'ARTIFACT_FOUND',
  QUEST_COMPLETION = 'QUEST_COMPLETION',
  FREE_ROAM = 'FREE_ROAM'
}

/**
 * Quest action types as enum
 */
export enum QuestActionEnum {
  START_GAME = 'START_GAME',
  END_CHARACTER_CREATION = 'END_CHARACTER_CREATION',
  COMPLETE_TRAINING = 'COMPLETE_TRAINING',
  START_DELIVERY_QUEST = 'START_DELIVERY_QUEST',
  TAKE_PARTS = 'TAKE_PARTS',
  ACCEPT_ARTIFACT_QUEST = 'ACCEPT_ARTIFACT_QUEST',
  DECLINE_ARTIFACT_QUEST = 'DECLINE_ARTIFACT_QUEST',
  FIND_ARTIFACT = 'FIND_ARTIFACT',
  HELP_ORK = 'HELP_ORK',
  KILL_BOTH = 'KILL_BOTH',
  IGNORE_ENCOUNTER = 'IGNORE_ENCOUNTER',
  RETURN_TO_CRAFTSMAN = 'RETURN_TO_CRAFTSMAN',
  COMPLETE_DELIVERY_QUEST = 'COMPLETE_DELIVERY_QUEST'
}

/**
 * Quest action interface
 */
export interface QuestAction {
  type: QuestActionEnum;
  stepId: string;
  payload?: Record<string, any>;
}

/**
 * Quest transition definition
 */
export interface QuestTransition {
  fromState: QuestStateEnum;
  action: QuestActionEnum;
  toState: QuestStateEnum;
  triggerSceneId?: string;
}

/**
 * Quest progress interface
 */
export interface QuestProgress {
  questId: string;
  state: QuestStateEnum;
  completedSteps: string[];
  startedAt: number;
  lastUpdateAt: number;
}

/**
 * Quest definition interface for server-side records
 */
export interface QuestDefinition {
  questId: string;
  title: string;
  description: string;
  startSceneId: string;
  endSceneId: string;
  states: QuestStateEnum[];
  stateTransitions: QuestTransition[];
  rewards?: {
    items?: string[];
    experience?: number;
    reputation?: {
      faction: string;
      amount: number;
    }
  }
} 