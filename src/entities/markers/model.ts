import { createStore, createEvent } from 'effector';
import { QuestStateEnum } from '../../shared/constants/quest';
import { 
  MarkerType, 
  NpcClass, 
  Faction, 
  MarkerData, 
  QuestMarker,
  MarkerInteraction 
} from '../../shared/types/marker.types';
import { QR_CODES } from '../../shared/constants/marker';

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