// src/entities/scene/model.ts
import { createStore, createEvent } from 'effector';
import { Scene } from '../../shared/types/visualNovel';

// Events
export const setCurrentScene = createEvent<Scene | null>();
export const clearScene = createEvent();

// Current scene store
export const $currentScene = createStore<Scene | null>(null)
  .on(setCurrentScene, (_, scene) => scene)
  .reset(clearScene);

// Event history store - keeps track of previous text for scrollback
export const $sceneHistory = createStore<{text: string, character?: string}[]>([])
  .on(setCurrentScene, (history, scene) => {
    if (!scene) return history;
    
    const newEntry = {
      text: scene.text,
      character: scene.character?.name
    };
    
    return [...history, newEntry].slice(-50); // Keep last 50 entries
  });

// Scene loading state
export const setSceneLoading = createEvent<boolean>();
export const $sceneLoading = createStore<boolean>(false)
  .on(setSceneLoading, (_, isLoading) => isLoading);

// Scene transition effects
export type TransitionEffect = 'fade' | 'slide' | 'dissolve' | 'none';
export const setTransitionEffect = createEvent<TransitionEffect>();
export const $transitionEffect = createStore<TransitionEffect>('fade')
  .on(setTransitionEffect, (_, effect) => effect);

// Scene sound effects
export const playSound = createEvent<string>();
export const $currentSound = createStore<string | null>(null)
  .on(playSound, (_, sound) => sound);

// Text display speed
export const setTextSpeed = createEvent<number>(); // in ms per character
export const $textSpeed = createStore<number>(30) // default: 30ms per character
  .on(setTextSpeed, (_, speed) => speed);