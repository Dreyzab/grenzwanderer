/**
 * Детальные типы для системы визуальной новеллы 
 * (персонажи, сцены, диалоги, выборы, статистика игрока)
 */

// Возможные представления игрового экрана
export enum GameView {
  MAP = 'map',
  NOVEL = 'novel',
  INVENTORY = 'inventory',
  MESSAGES = 'messages',
  SCANNER = 'scanner'
}

// Позиции персонажей на экране
export enum CharacterPosition {
  LEFT = 'left',
  CENTER = 'center',
  RIGHT = 'right',
  OFF_SCREEN = 'offScreen'
}

// Эмоции персонажей
export enum CharacterEmotion {
  NEUTRAL = 'neutral',
  HAPPY = 'happy',
  SAD = 'sad',
  ANGRY = 'angry',
  SURPRISED = 'surprised',
  THOUGHTFUL = 'thoughtful',
  AFRAID = 'afraid',
  CONFIDENT = 'confident'
}

// Персонаж в сцене
export interface Character {
  id: string;
  name: string;
  baseImageUrl?: string;
  expressions: {
    [key in CharacterEmotion]?: string;
  };
  faction?: string;
  relationship?: number; // от -100 до 100
  color?: string; // цвет текста для персонажа
  position?: CharacterPosition; // позиция персонажа на экране
}

// Фон сцены
export interface SceneBackground {
  id: string;
  imageUrl: string;
  name: string;
  description?: string;
  overlay?: string; // возможный наложенный эффект (туман, дождь и т.д.)
}

// Звуковые эффекты
export interface SoundEffect {
  id: string;
  soundUrl: string;
  name: string;
  volume?: number; // от 0 до 1
  loop?: boolean;
}

// Музыка
export interface Music {
  id: string;
  musicUrl: string;
  name: string;
  volume?: number; // от 0 до 1
  fadeIn?: number; // время плавного появления в мс
  fadeOut?: number; // время плавного исчезновения в мс
}

// Анимационные эффекты для сцены
export enum SceneEffect {
  RAIN = 'rain',
  SNOW = 'snow',
  FOG = 'fog',
  GLITCH = 'glitch',
  SHAKE = 'shake',
  FLASH = 'flash',
  FADE = 'fade'
}

// Типы переходов между сценами
export enum TransitionType {
  FADE = 'fade',
  SLIDE_LEFT = 'slideLeft',
  SLIDE_RIGHT = 'slideRight',
  DISSOLVE = 'dissolve',
  WIPE = 'wipe',
  NONE = 'none'
}

// Данные перехода
export interface Transition {
  type: TransitionType;
  duration: number; // время перехода в мс
}

// Ответ игрока в диалоге
export interface DialogChoice {
  id: string;
  text: string;
  nextSceneId?: string;
  condition?: {
    type: 'stat' | 'item' | 'quest' | 'relationship';
    id: string;
    value: number;
    operator: '>' | '<' | '=' | '>=' | '<=' | '!=';
  };
  effect?: Array<{
    type: 'stat' | 'item' | 'quest' | 'relationship';
    id: string;
    value: number;
    operator: '+' | '-' | '=' | '*' | '/';
  }>;
  tooltip?: string;
}

// Линия диалога
export interface DialogLine {
  id: string;
  characterId?: string; // если null, то рассказчик
  text: string;
  emotion?: CharacterEmotion;
  position?: CharacterPosition;
  animation?: string;
  choices?: DialogChoice[];
  autoAdvance?: boolean;
  delay?: number; // задержка перед показом в мс
}

// Полная сцена визуальной новеллы
export interface Scene {
  id: string;
  title: string;
  background: SceneBackground;
  characters: {
    id: string;
    position: CharacterPosition;
    emotion: CharacterEmotion;
    active: boolean;
  }[];
  dialog: DialogLine[];
  music?: Music;
  soundEffects?: SoundEffect[];
  effects?: SceneEffect[];
  transition?: Transition;
  isQuestScene?: boolean;
  questId?: string;
  timeLimit?: number; // ограничение времени для принятия решения в мс
  visited?: boolean;
}

// Статистика игрока в рамках визуальной новеллы
export interface PlayerStats {
  attributes: {
    strength: number;      // сила
    intelligence: number;  // интеллект
    charisma: number;      // харизма
    agility: number;       // ловкость
    wisdom: number;        // мудрость
    endurance: number;     // выносливость
  };
  resources: {
    health: number;        // здоровье
    energy: number;        // энергия
    money: number;         // деньги
    reputation: number;    // репутация
  };
  skills: {
    [key: string]: number; // навыки
  };
  relationships: {
    [characterId: string]: number; // отношения с персонажами
  };
} 