/**
 * Типы для маркеров на карте
 * @module MarkerTypes
 */

// Перечисления для типов маркеров
export enum MarkerType {
  QUEST_POINT = 'quest_point',
  NPC = 'npc',
  PLAYER = 'player',
  LOCATION = 'location',
  ITEM = 'item',
  QUEST_AREA = 'quest_area'
}

// Перечисления для класса NPC
export enum NpcClass {
  TRADER = 'trader',
  CRAFTSMAN = 'craftsman',
  GUARD = 'guard',
  QUEST_GIVER = 'quest_giver',
  STORY = 'story',
  GUILD_MASTER = 'guild_master'
}

// Перечисления для фракций
export enum Faction {
  NEUTRALS = 'neutrals',
  TRADERS = 'traders',
  CRAFTSMEN = 'craftsmen',
  GUARDS = 'guards',
  BANDITS = 'bandits',
  SURVIVORS = 'survivors',
  SCIENTISTS = 'scientists'
}

// Определение базового типа для маркера
export interface MarkerData {
  id: string;
  title: string;
  description?: string;
  markerType: MarkerType;
  npcClass?: NpcClass;
  faction?: Faction;
  lat: number;
  lng: number;
  radius?: number;
  isActive?: boolean;
  isCompleted?: boolean;
  qrCode?: string;
}

// Расширенный тип для маркеров квестов
export interface QuestMarker extends MarkerData {
  isActive: boolean;
  isCompleted: boolean;
  qrCode: string;
}

// Интерфейс для взаимодействия с маркером
export interface MarkerInteraction {
  markerId: string;
  interactionType: string;
  timestamp: number;
  data?: any;
  playerId?: string;
} 