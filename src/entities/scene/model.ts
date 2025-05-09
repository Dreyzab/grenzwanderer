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

// Event history store упрощен и объединен с dialogHistory

// Событие для записи каждой строки диалога в историю
export const dialogueLineDisplayed = createEvent<{ text: string, speakerName?: string }>();

// История диалогов
export const $dialogHistory = createStore<{ text: string, speakerName?: string }[]>([])
  .on(dialogueLineDisplayed, (history, newLine) => {
    if (newLine.text) {
      return [...history, newLine].slice(-50); // Сохраняем последние 50 записей
    }
    return history;
  })
  .reset(clearScene);

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