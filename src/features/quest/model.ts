/**
 * Quest feature model using Effector
 */
import { createStore, createEvent, createEffect, sample } from 'effector';
import { QuestStateEnum, QuestActionEnum, QuestAction, QuestTransition } from './types';
import { convexClient } from '../../utils/convex';
import { api } from '../../../convex/_generated/api';

// --- Events ---
export const questActionPerformed = createEvent<QuestAction>();
export const questStateChanged = createEvent<QuestStateEnum>();
export const questStepCompleted = createEvent<string>();
export const questReset = createEvent();

// --- Effects ---
export const updateServerQuestStateEffect = createEffect(async ({
  playerId,
  state,
  action
}: {
  playerId: string;
  state: QuestStateEnum;
  action: QuestActionEnum;
}) => {
  try {
    return await convexClient.mutation("player:updateQuestState", {
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
export const $questState = createStore<QuestStateEnum>(QuestStateEnum.REGISTERED)
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
  [state in QuestStateEnum]?: Partial<Record<QuestActionEnum, QuestStateEnum>>
} = {
  [QuestStateEnum.REGISTERED]: {
    [QuestActionEnum.START_GAME]: QuestStateEnum.CHARACTER_CREATION,
    [QuestActionEnum.START_DELIVERY_QUEST]: QuestStateEnum.DELIVERY_STARTED,
  },
  [QuestStateEnum.CHARACTER_CREATION]: {
    [QuestActionEnum.END_CHARACTER_CREATION]: QuestStateEnum.TRAINING_MISSION,
  },
  [QuestStateEnum.TRAINING_MISSION]: {
    [QuestActionEnum.COMPLETE_TRAINING]: QuestStateEnum.NEW_MESSAGE,
  },
  [QuestStateEnum.NEW_MESSAGE]: {
    [QuestActionEnum.START_DELIVERY_QUEST]: QuestStateEnum.DELIVERY_STARTED,
  },
  [QuestStateEnum.DELIVERY_STARTED]: {
    [QuestActionEnum.TAKE_PARTS]: QuestStateEnum.PARTS_COLLECTED,
  },
  [QuestStateEnum.PARTS_COLLECTED]: {
    [QuestActionEnum.ACCEPT_ARTIFACT_QUEST]: QuestStateEnum.ARTIFACT_HUNT,
    [QuestActionEnum.DECLINE_ARTIFACT_QUEST]: QuestStateEnum.QUEST_COMPLETION,
  },
  [QuestStateEnum.ARTIFACT_HUNT]: {
    [QuestActionEnum.FIND_ARTIFACT]: QuestStateEnum.ARTIFACT_FOUND,
  },
  [QuestStateEnum.ARTIFACT_FOUND]: {
    [QuestActionEnum.RETURN_TO_CRAFTSMAN]: QuestStateEnum.QUEST_COMPLETION,
  },
  [QuestStateEnum.QUEST_COMPLETION]: {
    [QuestActionEnum.COMPLETE_DELIVERY_QUEST]: QuestStateEnum.FREE_ROAM,
  },
  [QuestStateEnum.FREE_ROAM]: {
    // Free roam can transition to new quests in the future
  },
};

// Define marker visibility for each quest state
const questStateMarkers: Record<QuestStateEnum, string[]> = {
  [QuestStateEnum.REGISTERED]: [],
  [QuestStateEnum.CHARACTER_CREATION]: [],
  [QuestStateEnum.TRAINING_MISSION]: ['training_zone'],
  [QuestStateEnum.NEW_MESSAGE]: [],
  [QuestStateEnum.DELIVERY_STARTED]: ['trader'],
  [QuestStateEnum.PARTS_COLLECTED]: ['craftsman'],
  [QuestStateEnum.ARTIFACT_HUNT]: ['anomaly'],
  [QuestStateEnum.ARTIFACT_FOUND]: ['craftsman'],
  [QuestStateEnum.QUEST_COMPLETION]: [],
  [QuestStateEnum.FREE_ROAM]: ['trader', 'craftsman', 'anomaly'],
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
    currentState: QuestStateEnum; 
    nextState: QuestStateEnum | null; 
    action: QuestAction 
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