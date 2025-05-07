import { createStore, createEvent } from 'effector';
import { QuestStateEnum } from '../../shared/constants/quest';

// Перечисления для типов маркеров
export enum MarkerType {
  QUEST_POINT = 'quest_point',
  NPC = 'npc',
  PLAYER = 'player',
  LOCATION = 'location',
  ITEM = 'item'
}

export enum Faction {
  NEUTRAL = 'neutral',
  FRIENDLY = 'friendly',
  HOSTILE = 'hostile'
}

export enum NpcClass {
  TRADER = 'trader',
  CRAFTSMAN = 'craftsman',
  GUARD = 'guard',
  CITIZEN = 'citizen',
  OUTLAW = 'outlaw'
}

// QR коды для тестов
export const QR_CODES = {
  TRADER: 'grenz_npc_trader_01',
  CRAFTSMAN: 'grenz_npc_craftsman_01',
  ARTIFACT: 'ARTIFACT_ITEM_2023',
  ANOMALY_ZONE: 'Grenz_loc_anomaly_01',
  ENCOUNTER: 'encounter_001'
};

// Базовая структура маркера
export interface MarkerData {
  id: string;
  name: string;
  description?: string;
  coordinates: [number, number]; // [lng, lat]
  markerType: MarkerType | string;
  isVisible: boolean;
  isCompleted?: boolean;
  faction?: Faction;
  npcClass?: NpcClass;
  icon?: string;
  qrCode?: string;
}

// Интерфейс для взаимодействия с маркером
export interface MarkerInteraction {
  markerId: string;
  action: 'activated' | 'viewed' | 'completed';
  data?: Record<string, any>;
  timestamp?: number;
}

// Начальное состояние
const initialMarkers: MarkerData[] = [
  {
    id: 'trader',
    name: 'Торговец',
    description: 'Странствующий торговец',
    coordinates: [7.84751, 47.99589],
    markerType: MarkerType.NPC,
    isVisible: false,
    faction: Faction.FRIENDLY,
    npcClass: NpcClass.TRADER,
    qrCode: QR_CODES.TRADER
  },
  {
    id: 'craftsman',
    name: 'Мастер Дитер',
    description: 'Опытный инженер и изобретатель',
    coordinates: [7.84953, 47.99349],
    markerType: MarkerType.NPC,
    isVisible: false,
    faction: Faction.FRIENDLY,
    npcClass: NpcClass.CRAFTSMAN,
    qrCode: QR_CODES.CRAFTSMAN
  },
  {
    id: 'artifact',
    name: 'Артефакт',
    description: 'Загадочный артефакт',
    coordinates: [7.84851, 47.99489],
    markerType: MarkerType.ITEM,
    isVisible: false,
    qrCode: QR_CODES.ARTIFACT
  },
  {
    id: 'anomaly_zone',
    name: 'Аномальная зона',
    description: 'Место с необычными свойствами',
    coordinates: [7.85053, 47.99249],
    markerType: MarkerType.LOCATION,
    isVisible: false,
    qrCode: QR_CODES.ANOMALY_ZONE
  },
  {
    id: 'encounter',
    name: 'Встреча в лесу',
    description: 'Необычные звуки из глубины леса',
    coordinates: [7.84651, 47.99389],
    markerType: MarkerType.QUEST_POINT,
    isVisible: false,
    qrCode: QR_CODES.ENCOUNTER
  }
];

// События для управления маркерами
export const showMarker = createEvent<string>();
export const hideMarker = createEvent<string>();
export const completeMarker = createEvent<string>();
export const addMarker = createEvent<MarkerData>();
export const removeMarker = createEvent<string>();
export const updateMarker = createEvent<{id: string, data: Partial<MarkerData>}>();
export const addInteraction = createEvent<MarkerInteraction>();

// Хранилище маркеров
export const $markers = createStore<MarkerData[]>(initialMarkers)
  .on(showMarker, (state, id) => 
    state.map(marker => marker.id === id ? {...marker, isVisible: true} : marker)
  )
  .on(hideMarker, (state, id) => 
    state.map(marker => marker.id === id ? {...marker, isVisible: false} : marker)
  )
  .on(completeMarker, (state, id) => 
    state.map(marker => marker.id === id ? {...marker, isCompleted: true} : marker)
  )
  .on(addMarker, (state, marker) => [...state, marker])
  .on(removeMarker, (state, id) => state.filter(marker => marker.id !== id))
  .on(updateMarker, (state, {id, data}) => 
    state.map(marker => marker.id === id ? {...marker, ...data} : marker)
  );

// Хранилище взаимодействий
export const $markerInteractions = createStore<MarkerInteraction[]>([])
  .on(addInteraction, (state, interaction) => [
    ...state, 
    { ...interaction, timestamp: interaction.timestamp || Date.now() }
  ]);

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
      showMarker('trader');
      showMarker('craftsman');
      break;
    case QuestStateEnum.PARTS_COLLECTED:
      showMarker('craftsman');
      showMarker('anomaly_zone');
      break;
    case QuestStateEnum.ARTIFACT_HUNT:
      showMarker('anomaly_zone');
      showMarker('encounter');
      break;
    case QuestStateEnum.ARTIFACT_FOUND:
      showMarker('artifact');
      showMarker('trader');
      break;
    case QuestStateEnum.QUEST_COMPLETION:
      // Все маркеры скрыты
      break;
    default:
      // Ничего не показываем
      break;
  }
} 