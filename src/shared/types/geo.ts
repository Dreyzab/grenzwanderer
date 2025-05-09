/**
 * Типы для работы с геолокацией
 */

// Географические координаты (широта и долгота)
export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

// Масштаб карты
export interface MapZoom {
  value: number;
  min: number;
  max: number;
}

// Границы карты
export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

// Полный регион карты
export interface MapRegion {
  center: GeoCoordinates;
  zoom: MapZoom;
  bounds?: MapBounds;
}

// Преобразование координат для совместимости
export function convertToGeoCoordinates(coords: { lat: number; lng: number }): GeoCoordinates {
  return {
    latitude: coords.lat,
    longitude: coords.lng
  };
}

// Преобразование координат в формат для карты
export function convertToMapCoordinates(coords: GeoCoordinates): { lat: number; lng: number } {
  return {
    lat: coords.latitude,
    lng: coords.longitude
  };
}

/**
 * Координаты на карте (может отличаться от GPS в некоторых проекциях)
 */
export interface MapCoordinates {
  x: number;
  y: number;
  zoom?: number;
}

/**
 * Преобразует геокоординаты в координаты на карте
 */
export function geoToMapCoordinates(geo: GeoCoordinates, zoom: number): MapCoordinates {
  // В реальной реализации здесь был бы перевод GPS координат в пиксели карты
  // Для примера просто возвращаем x и y, пропорциональные долготе и широте
  return {
    x: geo.longitude * 100000,
    y: geo.latitude * 100000,
    zoom
  };
}

/**
 * Рассчитывает расстояние между двумя точками по формуле гаверсинуса
 * @returns Расстояние в метрах
 */
export function calculateDistance(point1: GeoCoordinates, point2: GeoCoordinates): number {
  const R = 6371e3; // радиус Земли в метрах
  const φ1 = point1.latitude * Math.PI / 180;
  const φ2 = point2.latitude * Math.PI / 180;
  const Δφ = (point2.latitude - point1.latitude) * Math.PI / 180;
  const Δλ = (point2.longitude - point1.longitude) * Math.PI / 180;
  
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c;
} 