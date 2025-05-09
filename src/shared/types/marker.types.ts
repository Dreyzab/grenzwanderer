/**
 * Типы для маркеров на карте
 */

// Виды маркеров
export enum MarkerType {
  QUEST = 'quest',
  NPC = 'npc',
  POINT_OF_INTEREST = 'poi',
  SHOP = 'shop',
  SHELTER = 'shelter',
  DANGER = 'danger'
}

// Классы NPC
export enum NPCClass {
  TRADER = 'trader',
  QUEST_GIVER = 'questGiver',
  FACTION_LEADER = 'factionLeader',
  INFORMANT = 'informant',
  COMPANION = 'companion'
}

// Фракции 
export enum Faction {
  NEUTRAL = 'neutral',
  SCAVENGERS = 'scavengers',
  MILITARY = 'military',
  SCIENTISTS = 'scientists',
  NOMADS = 'nomads'
}

// Данные маркера
export interface MarkerData {
  id: string;
  type: MarkerType;
  position: {
    lat: number;
    lng: number;
  };
  title: string;
  description?: string;
  isVisible: boolean;
  isCompleted?: boolean;
  questId?: string;
  npcClass?: NPCClass;
  faction?: Faction;
  iconUrl?: string;
}

// Интерфейс для маркера квеста
export interface QuestMarker extends MarkerData {
  type: MarkerType.QUEST;
  questId: string;
}

// Интерфейс для маркера NPC
export interface NPCMarker extends MarkerData {
  type: MarkerType.NPC;
  npcClass: NPCClass;
  faction: Faction;
}

// Коды взаимодействия с маркерами
export enum MarkerInteractionType {
  SCAN = 'scan',
  DIALOG = 'dialog',
  TRADE = 'trade',
  CRAFT = 'craft'
} 