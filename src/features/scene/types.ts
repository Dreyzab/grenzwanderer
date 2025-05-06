/**
 * Types for Scene feature
 */
import { Scene as BaseScene, Choice as BaseChoice, PlayerStats } from '../../schared/types/visualNovel';

/**
 * Scene identifier type
 */
export type SceneId = string;

/**
 * Scene transition types
 */
export type TransitionType = 'fade' | 'slide' | 'dissolve' | 'none';

/**
 * Scene transition request
 */
export interface SceneTransition {
  type: TransitionType;
  sceneId: SceneId;
}

/**
 * Extends the base Scene with additional properties for the feature
 */
export interface SceneData extends BaseScene {
  // Quest hooks - actions to perform when entering/exiting scene
  onEnterActions?: string[];
  onExitActions?: string[];
  
  // Special effects
  soundEffect?: string;
  backgroundMusic?: string;
  
  // Special flags
  isEnding?: boolean;
  transitionIn?: TransitionType;
  transitionOut?: TransitionType;
}

/**
 * Scene category for organization
 */
export enum SceneCategory {
  MAIN_QUEST = 'main',
  SIDE_QUEST = 'side',
  ENCOUNTER = 'encounter',
  DIALOG = 'dialog',
  TUTORIAL = 'tutorial'
}

/**
 * Scene metadata for scene registry
 */
export interface SceneMetadata {
  id: SceneId;
  title: string;
  category: SceneCategory;
  description?: string;
  requiredQuestState?: string;
  requiredItems?: string[];
  tags?: string[];
}

/**
 * Scene cache entry
 */
export interface SceneCacheEntry {
  scene: SceneData;
  timestamp: number;
}

/**
 * Scene registry type
 */
export type SceneRegistry = Record<SceneId, SceneData>; 