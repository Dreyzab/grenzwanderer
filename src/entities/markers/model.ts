import { createStore, createEvent } from 'effector';
import { QuestStateEnum } from '../../shared/constants/quest';

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
  qrCode?: string;
}

// Расширенный тип для маркеров квестов
export interface QuestMarker extends MarkerData {
  isActive: boolean;
  isCompleted: boolean;
  qrCode: string;
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

// --- Events ---
export const showMarker = createEvent<string>();
export const hideMarker = createEvent<string>();
export const markersReset = createEvent();
export const addMarker = createEvent<MarkerData>();
export const toggleMarkerActive = createEvent<string>();
export const toggleMarkerComplete = createEvent<string>();
export const addInteraction = createEvent<MarkerInteraction>();

// --- Initial data ---
export const initialMarkers: MarkerData[] = [
  {
    id: 'trader',
    title: 'Торговец',
    description: 'Здесь можно найти торговца с запчастями',
    markerType: MarkerType.NPC,
    npcClass: NpcClass.TRADER,
    faction: Faction.TRADERS,
    lat: 59.9391,
    lng: 30.3156,
    isActive: false,
    isCompleted: false
  },
  {
    id: 'craftsman',
    title: 'Мастерская Дитера',
    description: 'Центральная мастерская города',
    markerType: MarkerType.NPC,
    npcClass: NpcClass.CRAFTSMAN, 
    faction: Faction.CRAFTSMEN,
    lat: 59.9391,
    lng: 30.2956,
    isActive: false,
    isCompleted: false
  },
  {
    id: 'anomaly_zone',
    title: 'Аномальная зона',
    description: 'В этом районе можно найти ценные артефакты',
    markerType: MarkerType.QUEST_AREA,
    lat: 59.9371,
    lng: 30.3056,
    radius: 100,
    isActive: false,
    isCompleted: false
  },
  {
    id: 'encounter',
    title: 'Странные звуки',
    description: 'Отсюда доносятся странные звуки',
    markerType: MarkerType.QUEST_POINT,
    lat: 59.9401,
    lng: 30.3086,
    isActive: false,
    isCompleted: false
  }
];

// --- Stores ---
export const $markers = createStore<MarkerData[]>(initialMarkers)
  .on(showMarker, (state, markerId) => 
    state.map(marker => 
      marker.id === markerId 
        ? { ...marker, isActive: true }
        : marker
    )
  )
  .on(hideMarker, (state, markerId) => 
    state.map(marker => 
      marker.id === markerId 
        ? { ...marker, isActive: false }
        : marker
    )
  )
  .on(toggleMarkerActive, (state, markerId) => 
    state.map(marker => 
      marker.id === markerId 
        ? { ...marker, isActive: !marker.isActive }
        : marker
    )
  )
  .on(toggleMarkerComplete, (state, markerId) => 
    state.map(marker => 
      marker.id === markerId 
        ? { ...marker, isCompleted: !marker.isCompleted }
        : marker
    )
  )
  .on(addMarker, (state, marker) => [...state, marker])
  .reset(markersReset);

// --- Selectors ---
export const $activeMarkers = $markers.map(markers => 
  markers.filter(marker => marker.isActive)
);

// Хранилище взаимодействий
export const $markerInteractions = createStore<MarkerInteraction[]>([])
  .on(addInteraction, (state, interaction) => [...state, interaction]); 