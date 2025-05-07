// src/shared/types/visualNovel.ts

export interface Character {
    id: string;
    name: string;
    image: string;
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
  
  export interface Choice {
    id: string;
    text: string;
    nextSceneId?: string;
    statChanges?: Partial<PlayerStats>;
    action?: string;
    requiredStats?: Partial<PlayerStats>;
  }
  
  export interface Scene {
    id: string;
    title: string;
    background?: string;
    text: string;
    character?: Character;
    choices: Choice[];
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