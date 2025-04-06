import { createStore, createEvent } from 'effector';
import { MarkerType, NpcClass, Faction, QuestMarker } from '../../components/SignOutButton/Map/QuestMap';

// Константы для QR-кодов (позже могут быть вынесены в отдельный файл)
export const QR_CODES = {
  TRADER: 'grenz_npc_trader_01',
  CRAFTSMAN: 'grenz_npc_craftsman_01',
  ARTIFACT: 'ARTIFACT_ITEM_2023'
};

// Начальные маркеры НПС с состоянием isVisible: false
export const INITIAL_NPC_MARKERS: QuestMarker[] = [
  {
    id: 'trader',
    title: 'Торговец',
    description: 'Здесь можно найти торговца с запчастями',
    markerType: MarkerType.NPC,
    npcClass: NpcClass.TRADER,
    faction: Faction.TRADERS,
    lat: 47.99543, // Координаты необходимо заменить на реальные
    lng: 7.84538,
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
    lat: 47.99343,
    lng: 7.84738,
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
export interface MarkerData extends QuestMarker {
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
  });

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
  });

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
    const parsedMarkers = JSON.parse(savedMarkers);
    $markers.setState(parsedMarkers);
  }
  
  const savedInteractions = localStorage.getItem('npc_interactions');
  if (savedInteractions) {
    const parsedInteractions = JSON.parse(savedInteractions);
    $npcInteractions.setState(parsedInteractions);
  }
} catch (e) {
  console.error('Error loading saved game data:', e);
}

// Вспомогательные функции
export const getVisibleMarkers = (): QuestMarker[] => 
  $markers.getState().filter(marker => marker.isVisible);

export const getMarkerById = (id: string): MarkerData | undefined => 
  $markers.getState().find(marker => marker.id === id);

export const getMarkerInteractions = (markerId: string): NpcInteraction[] => 
  $npcInteractions.getState()[markerId] || []; 