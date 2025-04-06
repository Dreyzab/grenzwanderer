import { createStore, createEvent } from 'effector';
import type { QuestMarker } from '../../components/SignOutButton/Map/QuestMap';

// Определяем перечисления напрямую, вместо импорта из QuestMap
export enum MarkerType {
  NPC = 'npc',
  QUEST_POINT = 'quest_point',
  QUEST_AREA = 'quest_area'
}

export enum Faction {
  TRADERS = 'traders',
  CRAFTSMEN = 'craftsmen',
  GOVERNMENT = 'government',
  NEUTRAL = 'neutral'
}

export enum NpcClass {
  TRADER = 'trader',
  CRAFTSMAN = 'craftsman',
  GUILD_MASTER = 'guild_master',
  STORY = 'story'
}

// Константы для QR-кодов (позже могут быть вынесены в отдельный файл)
export const QR_CODES = {
  TRADER: 'grenz_npc_trader_01',
  CRAFTSMAN: 'grenz_npc_craftsman_01',
  ARTIFACT: 'ARTIFACT_ITEM_2023'
};

// Структура маркера (на случай, если QuestMarker не импортируется корректно)
export interface Marker {
  id: string;
  title: string;
  description?: string;
  markerType?: MarkerType;
  lat: number;
  lng: number;
  radius?: number; // For areas (in meters)
  isActive: boolean;
  isCompleted: boolean;
  qrCode?: string;
  // For NPCs
  npcClass?: NpcClass;
  faction?: Faction;
}

// Начальные маркеры НПС с состоянием isVisible: false
export const INITIAL_NPC_MARKERS: Marker[] = [
  {
    id: 'trader',
    title: 'Торговец',
    description: 'Здесь можно найти торговца с запчастями',
    markerType: MarkerType.NPC,
    npcClass: NpcClass.TRADER,
    faction: Faction.TRADERS,
    lat: 47.99444150033625, // Обновленные координаты
    lng: 7.846382279262514, // Обновленные координаты
    isActive: true,
    isCompleted: false,
    qrCode: QR_CODES.TRADER
  },
  {
    id: 'craftsman',
    title: 'Мастерская Дитера',
    description: 'Центральная мастерская города',
    markerType: MarkerType.NPC,
    npcClass: NpcClass.CRAFTSMAN,
    faction: Faction.CRAFTSMEN,
    lat: 47.99378656706719, // Обновленные координаты
    lng: 7.8488731887252925, // Обновленные координаты
    isActive: true,
    isCompleted: false,
    qrCode: QR_CODES.CRAFTSMAN
  },
  {
    id: 'anomaly',
    title: 'Аномальная зона',
    description: 'Место активности разлома с ценным артефактом',
    markerType: MarkerType.QUEST_AREA,
    lat: 47.99243,
    lng: 7.84838,
    radius: 50, // Радиус в метрах
    isActive: true,
    isCompleted: false
  }
];

// Интерфейс для расширенных данных маркера
export interface MarkerData extends Marker {
  isVisible: boolean;
  discoveredAt?: number | null;
}

// Начальное состояние всех маркеров (с дополнительным полем isVisible)
const initialMarkers: MarkerData[] = INITIAL_NPC_MARKERS.map(marker => ({
  ...marker,
  isVisible: false,
  discoveredAt: null
}));

// События для управления маркерами
export const showMarker = createEvent<string>(); // Показать маркер по ID
export const hideMarker = createEvent<string>(); // Скрыть маркер по ID
export const completeMarker = createEvent<string>(); // Отметить маркер как выполненный
export const resetMarkers = createEvent<void>(); // Сбросить все маркеры к начальному состоянию
export const updateMarkersByQuestState = createEvent<string>(); // Обновить видимость маркеров по состоянию квеста
export const loadSavedMarkers = createEvent<MarkerData[]>(); // Загрузить маркеры из сохранения
export const loadSavedInteractions = createEvent<Record<string, NpcInteraction[]>>(); // Загрузить взаимодействия из сохранения

// Хранилище маркеров
export const $markers = createStore<MarkerData[]>(initialMarkers)
  .on(showMarker, (markers, id) => 
    markers.map(marker => 
      marker.id === id ? { ...marker, isVisible: true, discoveredAt: Date.now() } : marker
    )
  )
  .on(hideMarker, (markers, id) => 
    markers.map(marker => 
      marker.id === id ? { ...marker, isVisible: false } : marker
    )
  )
  .on(completeMarker, (markers, id) => 
    markers.map(marker => 
      marker.id === id ? { ...marker, isCompleted: true } : marker
    )
  )
  .on(resetMarkers, () => initialMarkers)
  .on(updateMarkersByQuestState, (markers, questState) => {
    // Обновляем видимость маркеров в зависимости от состояния квеста
    return markers.map(marker => {
      let isVisible = marker.isVisible;
      
      switch (questState) {
        case 'DELIVERY_STARTED':
          if (marker.id === 'trader') isVisible = true;
          break;
        case 'PARTS_COLLECTED':
          if (marker.id === 'craftsman') isVisible = true;
          break;
        case 'ARTIFACT_HUNT':
          if (marker.id === 'anomaly') isVisible = true;
          break;
        case 'ARTIFACT_FOUND':
        case 'QUEST_COMPLETION':
        case 'FREE_ROAM':
          // В этих состояниях все маркеры видимы
          isVisible = true;
          break;
      }
      
      return { ...marker, isVisible };
    });
  })
  .on(loadSavedMarkers, (_, markers) => markers);

// Интерфейс для отслеживания взаимодействий с НПС
export interface NpcInteraction {
  action: string;
  timestamp: number;
  data?: any;
}

// Событие для добавления взаимодействия
export const addInteraction = createEvent<{markerId: string, action: string, data?: any}>();

// Хранилище взаимодействий с НПС
export const $npcInteractions = createStore<Record<string, NpcInteraction[]>>({})
  .on(addInteraction, (state, {markerId, action, data}) => {
    const interactions = state[markerId] || [];
    return {
      ...state,
      [markerId]: [...interactions, {
        action,
        timestamp: Date.now(),
        data
      }]
    };
  })
  .on(loadSavedInteractions, (_, interactions) => interactions);

// Сохранение состояния маркеров в localStorage
$markers.watch(markers => {
  try {
    localStorage.setItem('game_markers', JSON.stringify(markers));
  } catch (e) {
    console.error('Error saving markers to localStorage:', e);
  }
});

// Сохранение взаимодействий с НПС в localStorage
$npcInteractions.watch(interactions => {
  try {
    localStorage.setItem('npc_interactions', JSON.stringify(interactions));
  } catch (e) {
    console.error('Error saving NPC interactions to localStorage:', e);
  }
});

// Инициализация состояния из localStorage при загрузке
try {
  const savedMarkers = localStorage.getItem('game_markers');
  if (savedMarkers) {
    try {
      const parsedMarkers = JSON.parse(savedMarkers);
      if (Array.isArray(parsedMarkers)) {
        loadSavedMarkers(parsedMarkers);
      }
    } catch (e) {
      console.error('Error parsing saved markers:', e);
    }
  }
  
  const savedInteractions = localStorage.getItem('npc_interactions');
  if (savedInteractions) {
    try {
      const parsedInteractions = JSON.parse(savedInteractions);
      if (typeof parsedInteractions === 'object') {
        loadSavedInteractions(parsedInteractions);
      }
    } catch (e) {
      console.error('Error parsing saved interactions:', e);
    }
  }
} catch (e) {
  console.error('Error loading saved game data:', e);
}

// Вспомогательные функции
export const getVisibleMarkers = (): MarkerData[] => 
  $markers.getState().filter(marker => marker.isVisible);

export const getMarkerById = (id: string): MarkerData | undefined => 
  $markers.getState().find(marker => marker.id === id);

export const getMarkerInteractions = (markerId: string): NpcInteraction[] => 
  $npcInteractions.getState()[markerId] || []; 