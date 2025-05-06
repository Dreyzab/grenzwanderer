/**
 * Scene feature model using Effector
 */
import { createStore, createEvent, createEffect, sample } from 'effector';
import { SceneData, SceneId, SceneTransition } from './types';
import { QuestActionEnum } from '../quest/types';
import { convexClient } from '../../utils/convex';
import { LOCAL_SCENES } from './scenes';

// --- Events ---
export const sceneRequested = createEvent<SceneId>();
export const sceneLoaded = createEvent<SceneData>();
export const sceneTransitionRequested = createEvent<SceneTransition>();
export const sceneExited = createEvent();
export const fullTextRequested = createEvent(); // For showing all text immediately

// --- Effects ---
export const fetchSceneEffect = createEffect(async (id: SceneId) => {
  try {
    // Try to load from server
    const result = await convexClient.query('quest.getSceneByKey', { 
      sceneKey: id 
    });
    
    if (result) {
      return adaptServerScene(result);
    }
    
    // Fallback to local scenes
    if (LOCAL_SCENES[id]) {
      return LOCAL_SCENES[id];
    }
    
    throw new Error(`Scene not found: ${id}`);
  } catch (error) {
    console.error(`Failed to fetch scene ${id}:`, error);
    
    // Last resort fallback
    if (LOCAL_SCENES[id]) {
      return LOCAL_SCENES[id];
    }
    
    throw error;
  }
});

// --- Stores ---
export const $currentScene = createStore<SceneData | null>(null)
  .on(sceneLoaded, (_, scene) => scene)
  .reset(sceneExited);

export const $sceneLoading = createStore(false)
  .on(sceneRequested, () => true)
  .on(sceneLoaded, () => false)
  .on(fetchSceneEffect.fail, () => false);

export const $sceneError = createStore<string | null>(null)
  .on(fetchSceneEffect.fail, (_, { error }) => 
    error instanceof Error ? error.message : 'Failed to load scene'
  )
  .reset([sceneLoaded, sceneRequested, sceneExited]);

export const $sceneHistory = createStore<SceneId[]>([])
  .on(sceneLoaded, (history, scene) => {
    if (!history.includes(scene.id)) {
      return [...history, scene.id];
    }
    return history;
  })
  .reset(sceneExited);

// Text animation state
export const $displayedText = createStore<string>('')
  .on(sceneLoaded, () => '')
  .on(fullTextRequested, (_, currentScene) => currentScene?.text || '')
  .reset(sceneExited);

export const $isTextFullyTyped = createStore<boolean>(false)
  .on(sceneLoaded, () => false)
  .on(fullTextRequested, () => true)
  .reset(sceneExited);

// Text typing speed in ms per character
export const $textSpeed = createStore<number>(30);

// --- Connections ---

// When a scene is requested, fetch it
sample({
  clock: sceneRequested,
  target: fetchSceneEffect,
});

// When a scene is successfully fetched, set it as current
sample({
  clock: fetchSceneEffect.doneData,
  target: sceneLoaded,
});

// --- Helper Functions ---

/**
 * Adapts server scene format to client format
 */
function adaptServerScene(serverScene: any): SceneData {
  // Convert choice data from server format
  const choices = serverScene.choices?.map((choice: any, index: number) => ({
    id: choice.id || `choice_${index}`,
    text: choice.text,
    nextSceneId: choice.nextSceneId || undefined,
    action: choice.action || undefined,
    statChanges: choice.statChanges || undefined,
    requiredStats: choice.requiredStats || undefined
  })) || [];
  
  // Build scene data in client format
  return {
    id: serverScene._id || serverScene.sceneKey,
    title: serverScene.title,
    background: serverScene.background,
    text: serverScene.text,
    character: serverScene.character,
    choices: choices,
    onEnterActions: serverScene.onEnterActions || [],
    onExitActions: serverScene.onExitActions || [],
    time: serverScene.time,
    date: serverScene.date,
    location: serverScene.location,
    soundEffect: serverScene.soundEffect,
    backgroundMusic: serverScene.backgroundMusic,
    isEnding: serverScene.isEnding,
    transitionIn: serverScene.transitionIn,
    transitionOut: serverScene.transitionOut
  };
} 