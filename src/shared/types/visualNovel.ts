// src/shared/types/visualNovel.ts

export interface Character {
    id: string;
    name: string;
    spriteUrl: string;
    position?: 'left' | 'center' | 'right';
  }
  
  export interface PlayerStats {
    energy: number;
    money: number;
    attractiveness: number;
    willpower: number;
    fitness: number;
    intelligence: number;
    corruption: number;
  }
  
  export interface StatChange {
    stat: keyof PlayerStats;
    value: number;
    message?: string;
  }
  
  export interface ScriptPayload {
    type: string;
    params: Record<string, any>;
  }
  
  export interface ConditionObject {
    type: 'STAT_CHECK' | 'QUEST_STATE' | 'HAS_ITEM' | 'CUSTOM';
    data: Record<string, any>;
  }
  
  export interface ActionObject {
    type: string;
    payload: Record<string, any>;
  }
  
  export interface DialogueLine {
    text: string;
    characterSpriteId?: string;
    speakerName?: string;
    emotion?: string;
    portrait?: string;
    voiceoverFile?: string;
    timing?: number; // в миллисекундах для автоматического перехода
    animation?: string;
  }
  
  export interface ChoiceOption {
    id: string;
    text: string;
    nextSceneId?: string;
    statChanges?: Partial<PlayerStats>;
    action?: ActionObject;
    requiredStats?: Partial<PlayerStats>;
    condition?: ConditionObject;
    feedbackOnFail?: string;
  }
  
  export interface Scene {
    id: string;
    title: string;
    backgroundUrl?: string;
    musicTrack?: string;
    dialogueLines: DialogueLine[];
    charactersInScene: Character[];
    choices: ChoiceOption[];
    onEnterScript?: ScriptPayload;
    onExitScript?: ScriptPayload;
    action?: ActionObject;
    time?: string;
    date?: string;
    location?: string;
    additionalInfo?: {
      energy?: number;
      money?: number;
    };
  }
  
  export interface SceneResult {
    nextSceneId?: string;
    statChanges?: StatChange[];
    gainedItems?: string[];
    specialEffects?: string[];
  }

// Квестовые типы теперь импортируются из shared/constants/quest.ts