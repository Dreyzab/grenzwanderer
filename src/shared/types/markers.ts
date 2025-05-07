import { Id } from '../../../convex/_generated/dataModel';

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

// Определение типа для маркера
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
}

// QR коды для маркеров
export const QR_CODES = {
  TRADER: 'grenz_npc_trader_01',
  CRAFTSMAN: 'grenz_npc_craftsman_01',
  ARTIFACT: 'ARTIFACT_ITEM_2023',
  ANOMALY: 'location_anomaly_001',
  ENCOUNTER: 'encounter_001'
};

// Интерфейс для взаимодействия с маркером
export interface MarkerInteraction {
  markerId: string;
  interactionType: string;
  timestamp: number;
  data?: any;
  playerId?: string;
} 