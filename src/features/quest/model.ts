/**
 * Quest feature model using Effector
 */
import { createStore, createEvent, createEffect, sample } from 'effector';
import { QuestState, QuestAction } from '../../shared/types/quest.types';
import { QuestTransition, QuestActionData } from './types';
import { convex } from '../../app/convex';
import { api } from '../../../convex/_generated/api';

// Определяем расширенные состояния для нашей игры
export enum GameQuestState {
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

// Дополнительные действия для нашей игры
export enum GameQuestAction {
  START_DELIVERY_QUEST = 'START_DELIVERY_QUEST',
  END_CHARACTER_CREATION = 'END_CHARACTER_CREATION',
  COMPLETE_TRAINING = 'COMPLETE_TRAINING',
  TAKE_PARTS = 'TAKE_PARTS',
  ACCEPT_ARTIFACT_QUEST = 'ACCEPT_ARTIFACT_QUEST',
  DECLINE_ARTIFACT_QUEST = 'DECLINE_ARTIFACT_QUEST',
  FIND_ARTIFACT = 'FIND_ARTIFACT',
  RETURN_TO_CRAFTSMAN = 'RETURN_TO_CRAFTSMAN',
  COMPLETE_DELIVERY_QUEST = 'COMPLETE_DELIVERY_QUEST'
}

// Объединяем стандартные и игровые состояния для типизации
export type AllQuestStates = QuestState | GameQuestState;
export type AllQuestActions = QuestAction | GameQuestAction;

// --- Events ---
export const questActionPerformed = createEvent<QuestActionData>();
export const questStateChanged = createEvent<AllQuestStates>();
export const questStepCompleted = createEvent<string>();
export const questReset = createEvent();

// --- Effects ---
export const updateServerQuestStateEffect = createEffect(async ({
  playerId,
  state,
  action
}: {
  playerId: string;
  state: AllQuestStates;
  action: AllQuestActions;
}) => {
  try {
    return await convex.mutation(api.player.updateQuestState, {
      playerId,
      questState: state,
      completedAction: action
    });
  } catch (error) {
    console.error('Failed to update server quest state:', error);
    return { clientOnly: true, state };
  }
});

// --- Stores ---
export const $questState = createStore<AllQuestStates>(GameQuestState.REGISTERED)
  .on(questStateChanged, (_, state) => state)
  .reset(questReset);

export const $completedSteps = createStore<string[]>([])
  .on(questStepCompleted, (steps, stepId) => {
    if (!steps.includes(stepId)) {
      return [...steps, stepId];
    }
    return steps;
  })
  .reset(questReset);

export const $questLoading = createStore(false)
  .on(updateServerQuestStateEffect, () => true)
  .on(updateServerQuestStateEffect.done, () => false)
  .on(updateServerQuestStateEffect.fail, () => false);

// --- Define the quest state machine transitions ---
const questStateMachine: {
  [key in AllQuestStates]?: Partial<Record<AllQuestActions, AllQuestStates>>
} = {
  [GameQuestState.REGISTERED]: {
    [QuestAction.START_GAME]: GameQuestState.CHARACTER_CREATION,
    [GameQuestAction.START_DELIVERY_QUEST]: GameQuestState.DELIVERY_STARTED,
  },
  [GameQuestState.CHARACTER_CREATION]: {
    [GameQuestAction.END_CHARACTER_CREATION]: GameQuestState.TRAINING_MISSION,
  },
  [GameQuestState.TRAINING_MISSION]: {
    [GameQuestAction.COMPLETE_TRAINING]: GameQuestState.NEW_MESSAGE,
  },
  [GameQuestState.NEW_MESSAGE]: {
    [GameQuestAction.START_DELIVERY_QUEST]: GameQuestState.DELIVERY_STARTED,
  },
  [GameQuestState.DELIVERY_STARTED]: {
    [GameQuestAction.TAKE_PARTS]: GameQuestState.PARTS_COLLECTED,
  },
  [GameQuestState.PARTS_COLLECTED]: {
    [GameQuestAction.ACCEPT_ARTIFACT_QUEST]: GameQuestState.ARTIFACT_HUNT,
    [GameQuestAction.DECLINE_ARTIFACT_QUEST]: GameQuestState.QUEST_COMPLETION,
  },
  [GameQuestState.ARTIFACT_HUNT]: {
    [GameQuestAction.FIND_ARTIFACT]: GameQuestState.ARTIFACT_FOUND,
  },
  [GameQuestState.ARTIFACT_FOUND]: {
    [GameQuestAction.RETURN_TO_CRAFTSMAN]: GameQuestState.QUEST_COMPLETION,
  },
  [GameQuestState.QUEST_COMPLETION]: {
    [GameQuestAction.COMPLETE_DELIVERY_QUEST]: GameQuestState.FREE_ROAM,
  },
  [GameQuestState.FREE_ROAM]: {
    // Free roam can transition to new quests in the future
  },
  // Стандартные состояния квеста также включены
  [QuestState.NOT_STARTED]: {
    [QuestAction.START_GAME]: QuestState.IN_PROGRESS,
  },
  [QuestState.IN_PROGRESS]: {
    [QuestAction.COMPLETE_SCENE]: QuestState.COMPLETED,
  },
  [QuestState.COMPLETED]: {
    // Завершенный квест
  },
  [QuestState.FAILED]: {
    // Проваленный квест
  }
};

// Define marker visibility for each quest state
const questStateMarkers: Record<string, string[]> = {
  [GameQuestState.REGISTERED]: [],
  [GameQuestState.CHARACTER_CREATION]: [],
  [GameQuestState.TRAINING_MISSION]: ['training_zone'],
  [GameQuestState.NEW_MESSAGE]: [],
  [GameQuestState.DELIVERY_STARTED]: ['trader'],
  [GameQuestState.PARTS_COLLECTED]: ['craftsman'],
  [GameQuestState.ARTIFACT_HUNT]: ['anomaly'],
  [GameQuestState.ARTIFACT_FOUND]: ['craftsman'],
  [GameQuestState.QUEST_COMPLETION]: [],
  [GameQuestState.FREE_ROAM]: ['trader', 'craftsman', 'anomaly'],
  [QuestState.NOT_STARTED]: [],
  [QuestState.IN_PROGRESS]: ['current_objective'],
  [QuestState.COMPLETED]: [],
  [QuestState.FAILED]: []
};

// --- Events for map markers ---
export const showMarker = createEvent<string>();
export const hideMarker = createEvent<string>();

// --- Connect events and logic ---

// Process quest actions and perform state transitions
sample({
  clock: questActionPerformed,
  source: $questState,
  fn: (currentState, action) => {
    const nextState = questStateMachine[currentState]?.[action.type];
    
    if (!nextState) {
      console.warn(`No transition found for action ${action.type} in state ${currentState}`);
      return { currentState, nextState: null, action };
    }
    
    return { currentState, nextState, action };
  },
  target: createEffect((payload: { 
    currentState: AllQuestStates; 
    nextState: AllQuestStates | null; 
    action: QuestActionData
  }) => {
    const { currentState, nextState, action } = payload;
    if (!nextState) return;
    
    // Update quest state
    questStateChanged(nextState);
    
    // Mark step as completed
    if (action.stepId) {
      questStepCompleted(action.stepId);
    }
    
    // Update map markers based on the new state
    const oldMarkers = questStateMarkers[currentState] || [];
    const newMarkers = questStateMarkers[nextState] || [];
    
    // Hide markers that are no longer needed
    oldMarkers.forEach((marker) => {
      if (!newMarkers.includes(marker)) {
        hideMarker(marker);
      }
    });
    
    // Show new markers that weren't in the old state
    newMarkers.forEach((marker) => {
      if (!oldMarkers.includes(marker)) {
        showMarker(marker);
      }
    });
    
    return { state: nextState, action: action.type };
  })
});