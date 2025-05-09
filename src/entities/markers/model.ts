import { createStore, createEvent } from 'effector';
import { QuestSessionState } from '../../shared/constants/quest';
import { 
  MarkerType, 
  NPCClass, 
  Faction, 
  MarkerData, 
  QuestMarker,
  MarkerInteractionType 
} from '../../shared/types/marker.types';
import { QR_CODE_PREFIXES } from '../../shared/constants/marker';

// --- Events ---
export const showMarker = createEvent<string>();
export const hideMarker = createEvent<string>();
export const markersReset = createEvent();
export const addMarker = createEvent<MarkerData>();
export const toggleMarkerActive = createEvent<string>();
export const toggleMarkerComplete = createEvent<string>();
export const addInteraction = createEvent<MarkerInteractionType>();

// --- Initial data ---
export const initialMarkers: MarkerData[] = [
  {
    id: 'trader',
    title: 'Торговец',
    description: 'Здесь можно найти торговца с запчастями',
    type: MarkerType.NPC,
    npcClass: NPCClass.TRADER,
    faction: Faction.SCAVENGERS,
    position: {
      lat: 47.9959,
      lng: 7.8494
    },
    isVisible: true,
    isCompleted: false
  },
  {
    id: 'craftsman',
    title: 'Мастерская Дитера',
    description: 'Центральная мастерская города',
    type: MarkerType.NPC,
    npcClass: NPCClass.TRADER, 
    faction: Faction.SCIENTISTS,
    position: {
      lat: 47.9979,
      lng: 7.8444
    },
    isVisible: true,
    isCompleted: false
  },
  {
    id: 'anomaly_zone',
    title: 'Аномальная зона',
    description: 'В этом районе можно найти ценные артефакты',
    type: MarkerType.POINT_OF_INTEREST,
    position: {
      lat: 47.9929,
      lng: 7.8514
    },
    isVisible: true,
    isCompleted: false
  },
  {
    id: 'encounter',
    title: 'Странные звуки',
    description: 'Отсюда доносятся странные звуки',
    type: MarkerType.QUEST,
    position: {
      lat: 47.9989,
      lng: 7.8474
    },
    isVisible: true,
    isCompleted: false,
    questId: "encounter_quest"
  }
];

// Добавляем поле isActive к MarkerData для внутреннего использования
export interface ExtendedMarkerData extends MarkerData {
  isActive?: boolean;
}

// --- Stores ---
export const $markers = createStore<ExtendedMarkerData[]>(initialMarkers)
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
export const $markerInteractions = createStore<MarkerInteractionType[]>([])
  .on(addInteraction, (state, interaction) => [...state, interaction]); 