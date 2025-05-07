import { MarkerType, NpcClass, Faction, QuestMarker } from '../../components/SignOutButton/Map/QuestMap';

// QR-коды для тестирования
export const QR_CODES = {
  TRADER: 'grenz_npc_trader_01',
  CRAFTSMAN: 'grenz_npc_craftsman_01',
  ARTIFACT: 'grenz_item_artifact_01'
};

/**
 * Генерирует маркеры квестов на основе состояния игрока
 * 
 * @param questState Текущее состояние квеста игрока
 * @returns Массив маркеров для отображения на карте
 */
export function generateQuestMarkers(questState: string): QuestMarker[] {
  // Базовый набор маркеров для игры
  const markers: QuestMarker[] = [
    {
      id: 'trader',
      title: 'Торговец',
      description: 'Здесь можно найти торговца с запчастями',
      markerType: MarkerType.NPC,
      npcClass: NpcClass.TRADER,
      faction: Faction.TRADERS,
      lat: 59.9391,
      lng: 30.3156,
      isActive: questState === 'DELIVERY_STARTED',
      isCompleted: questState === 'PARTS_COLLECTED' || questState === 'QUEST_COMPLETION' || questState === 'FREE_ROAM',
      qrCode: QR_CODES.TRADER
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
      isActive: questState === 'PARTS_COLLECTED',
      isCompleted: questState === 'QUEST_COMPLETION' || questState === 'FREE_ROAM',
      qrCode: QR_CODES.CRAFTSMAN
    },
    {
      id: 'artifact_area',
      title: 'Аномальная зона',
      description: 'В этом районе можно найти ценные артефакты',
      markerType: MarkerType.QUEST_AREA,
      lat: 59.9371, 
      lng: 30.3056,
      radius: 100, // радиус области в метрах
      isActive: questState === 'ARTIFACT_HUNT',
      isCompleted: questState === 'ARTIFACT_FOUND' || questState === 'QUEST_COMPLETION' || questState === 'FREE_ROAM',
      qrCode: QR_CODES.ARTIFACT
    }
  ];
  
  return markers;
}

/**
 * Обновляет статус активности и завершенности маркеров на основе прогресса квеста
 * 
 * @param markers Текущие маркеры квестов
 * @param questProgress Статус прогресса квеста
 * @returns Обновленные маркеры
 */
export function updateMarkersBasedOnProgress(
  markers: QuestMarker[], 
  questProgress: string
): QuestMarker[] {
  if (!questProgress) return markers;
  
  return markers.map(marker => {
    let isActive = marker.isActive;
    let isCompleted = marker.isCompleted;
    
    if (questProgress === 'TRADER_MET' && marker.qrCode === QR_CODES.TRADER) {
      isCompleted = true;
      
      // Если это точка торговца и мы с ним встретились, активируем следующую точку - мастерскую
      if (marker.qrCode === QR_CODES.TRADER) {
        isActive = false;
      }
    } else if (questProgress === 'CRAFTSMAN_MET' && marker.qrCode === QR_CODES.CRAFTSMAN) {
      isCompleted = true;
    }
    
    return {
      ...marker,
      isActive,
      isCompleted
    };
  });
}

/**
 * Рассчитывает расстояние между двумя географическими точками в метрах
 * 
 * @param lat1 Широта первой точки
 * @param lon1 Долгота первой точки
 * @param lat2 Широта второй точки
 * @param lon2 Долгота второй точки
 * @returns Расстояние в метрах
 */
export function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371e3; // Радиус Земли в метрах
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  
  const a = 
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}