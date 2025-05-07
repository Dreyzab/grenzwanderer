import { createStore, createEvent } from 'effector';
import { MarkerData, MarkerType, NpcClass, Faction, MarkerInteraction } from '../../shared/types/markers';
import { QuestStateEnum } from '../../shared/constants/quest';

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

// QR коды для тестов
export const QR_CODES = {
  TRADER: 'grenz_npc_trader_01',
  CRAFTSMAN: 'grenz_npc_craftsman_01',
  ARTIFACT: 'ARTIFACT_ITEM_2023',
  ANOMALY_ZONE: 'location_anomaly_001',
  ENCOUNTER: 'encounter_001'
};

// Хранилище взаимодействий
export const $markerInteractions = createStore<MarkerInteraction[]>([])
  .on(addInteraction, (state, interaction) => [...state, interaction]);

// Функция для обновления видимости маркеров в зависимости от состояния квеста
export function updateMarkersByQuestState(state: QuestStateEnum) {
  // Сначала скрываем все маркеры
  initialMarkers.forEach(marker => hideMarker(marker.id));
  
  // Затем показываем нужные в зависимости от состояния
  switch (state) {
    case QuestStateEnum.DELIVERY_STARTED:
      showMarker('trader');
      break;
    case QuestStateEnum.PARTS_COLLECTED:
      showMarker('craftsman');
      break;
    case QuestStateEnum.ARTIFACT_HUNT:
      showMarker('anomaly_zone');
      showMarker('encounter');
      break;
    case QuestStateEnum.ARTIFACT_FOUND:
      showMarker('craftsman');
      break;
    case QuestStateEnum.FREE_ROAM:
      showMarker('trader');
      showMarker('craftsman');
      showMarker('anomaly_zone');
      break;
    default:
      // Ничего не показываем
      break;
  }
} 