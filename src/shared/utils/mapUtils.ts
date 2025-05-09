/**
 * Утилиты для работы с картой, генерации маркеров и расчета расстояний
 */
import { MarkerData, MarkerType } from '../types/marker.types';

// Константа для радиуса Земли в метрах
const EARTH_RADIUS = 6371000;

/**
 * Расчет расстояния между двумя точками на карте с использованием формулы гаверсинуса
 * @param lat1 Широта первой точки
 * @param lng1 Долгота первой точки
 * @param lat2 Широта второй точки
 * @param lng2 Долгота второй точки
 * @returns Расстояние в метрах
 */
export const calculateDistance = (
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number => {
  // Перевод градусов в радианы
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;
  const lng1Rad = (lng1 * Math.PI) / 180;
  const lng2Rad = (lng2 * Math.PI) / 180;

  // Разница координат
  const dLat = lat2Rad - lat1Rad;
  const dLng = lng2Rad - lng1Rad;

  // Формула гаверсинуса
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  // Расстояние в метрах
  return EARTH_RADIUS * c;
};

/**
 * Проверяет, находится ли точка (lat2, lng2) в радиусе от точки (lat1, lng1)
 * @param lat1 Широта центральной точки
 * @param lng1 Долгота центральной точки
 * @param lat2 Широта проверяемой точки
 * @param lng2 Долгота проверяемой точки
 * @param radius Радиус в метрах
 * @returns True, если точка находится в указанном радиусе
 */
export const isInRadius = (
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number, 
  radius: number
): boolean => {
  const distance = calculateDistance(lat1, lng1, lat2, lng2);
  return distance <= radius;
};

/**
 * Генерирует случайные маркеры вокруг указанной точки
 * @param centerLat Широта центральной точки
 * @param centerLng Долгота центральной точки
 * @param radius Радиус в метрах
 * @param count Количество маркеров
 * @param type Тип маркеров (по умолчанию - POINT_OF_INTEREST)
 * @returns Массив сгенерированных маркеров
 */
export const generateRandomMarkers = (
  centerLat: number,
  centerLng: number,
  radius: number,
  count: number,
  type: MarkerType = MarkerType.POINT_OF_INTEREST
): MarkerData[] => {
  const markers: MarkerData[] = [];
  
  for (let i = 0; i < count; i++) {
    // Случайный угол в радианах
    const angle = Math.random() * 2 * Math.PI;
    
    // Случайное расстояние в пределах радиуса
    const distance = Math.random() * radius;
    
    // Смещение в метрах
    const dx = distance * Math.cos(angle);
    const dy = distance * Math.sin(angle);
    
    // Примерное преобразование в координаты
    // (приближение для небольших расстояний)
    const metersToDegLat = 1 / (EARTH_RADIUS * (Math.PI / 180));
    const metersToDegLng = 
      1 / (EARTH_RADIUS * Math.cos(centerLat * (Math.PI / 180)) * (Math.PI / 180));
    
    const lat = centerLat + dy * metersToDegLat;
    const lng = centerLng + dx * metersToDegLng;
    
    markers.push({
      id: `marker-${i}-${Date.now()}`,
      type,
      position: { lat, lng },
      title: `Random Marker ${i + 1}`,
      description: `Случайно сгенерированный маркер #${i + 1}`,
      isVisible: true,
      isCompleted: false
    });
  }
  
  return markers;
};

/**
 * Получает URL иконки маркера в зависимости от его типа
 * @param type Тип маркера
 * @param isCompleted Флаг завершенности (для квестовых маркеров)
 * @returns URL иконки
 */
export const getMarkerIconUrl = (
  type: MarkerType, 
  isCompleted: boolean = false
): string => {
  const basePath = '/assets/icons/markers/';

  switch (type) {
    case MarkerType.QUEST:
      return `${basePath}${isCompleted ? 'quest-completed.svg' : 'quest.svg'}`;
    case MarkerType.NPC:
      return `${basePath}npc.svg`;
    case MarkerType.SHOP:
      return `${basePath}shop.svg`;
    case MarkerType.SHELTER:
      return `${basePath}shelter.svg`;
    case MarkerType.DANGER:
      return `${basePath}danger.svg`;
    case MarkerType.POINT_OF_INTEREST:
    default:
      return `${basePath}poi.svg`;
  }
}; 