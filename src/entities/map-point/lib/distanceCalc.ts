/**
 * Утилиты для расчета расстояний и геолокационных операций
 */

export interface Coordinates {
  lat: number
  lng: number
}

/**
 * Вычисляет расстояние между двумя точками по формуле Haversine
 * @param from - Начальная точка
 * @param to - Конечная точка
 * @returns Расстояние в метрах
 */
export function calculateDistance(from: Coordinates, to: Coordinates): number {
  const R = 6371000 // Радиус Земли в метрах
  const dLat = toRadians(to.lat - from.lat)
  const dLng = toRadians(to.lng - from.lng)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Конвертирует градусы в радианы
 */
function toRadians(degrees: number): number {
  return degrees * Math.PI / 180
}

/**
 * Форматирует расстояние для отображения
 * @param meters - Расстояние в метрах
 * @returns Отформатированная строка (например, "1.5 км" или "250 м")
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} м`
  }
  return `${(meters / 1000).toFixed(1)} км`
}

/**
 * Проверяет, находится ли точка в пределах заданного радиуса
 * @param from - Начальная точка
 * @param to - Конечная точка
 * @param radiusMeters - Радиус в метрах
 * @returns true если точка в пределах радиуса
 */
export function isWithinRadius(
  from: Coordinates,
  to: Coordinates,
  radiusMeters: number
): boolean {
  const distance = calculateDistance(from, to)
  return distance <= radiusMeters
}

/**
 * Вычисляет центр (центроид) для массива координат
 * @param coordinates - Массив координат
 * @returns Центральная точка
 */
export function calculateCenter(coordinates: Coordinates[]): Coordinates {
  if (coordinates.length === 0) {
    return { lat: 0, lng: 0 }
  }

  const sum = coordinates.reduce(
    (acc, coord) => ({
      lat: acc.lat + coord.lat,
      lng: acc.lng + coord.lng,
    }),
    { lat: 0, lng: 0 }
  )

  return {
    lat: sum.lat / coordinates.length,
    lng: sum.lng / coordinates.length,
  }
}

/**
 * Вычисляет bounding box для массива координат
 * @param coordinates - Массив координат
 * @returns Объект с границами
 */
export function calculateBounds(coordinates: Coordinates[]): {
  minLat: number
  maxLat: number
  minLng: number
  maxLng: number
} {
  if (coordinates.length === 0) {
    return { minLat: 0, maxLat: 0, minLng: 0, maxLng: 0 }
  }

  const lats = coordinates.map(c => c.lat)
  const lngs = coordinates.map(c => c.lng)

  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
  }
}

/**
 * Добавляет padding к bounding box
 * @param bounds - Исходные границы
 * @param paddingPercent - Padding в процентах (например, 0.1 для 10%)
 * @returns Расширенные границы
 */
export function addBoundsPadding(
  bounds: ReturnType<typeof calculateBounds>,
  paddingPercent: number = 0.1
): typeof bounds {
  const latPadding = (bounds.maxLat - bounds.minLat) * paddingPercent
  const lngPadding = (bounds.maxLng - bounds.minLng) * paddingPercent

  return {
    minLat: bounds.minLat - latPadding,
    maxLat: bounds.maxLat + latPadding,
    minLng: bounds.minLng - lngPadding,
    maxLng: bounds.maxLng + lngPadding,
  }
}

/**
 * Вычисляет bearing (направление) между двумя точками
 * @param from - Начальная точка
 * @param to - Конечная точка
 * @returns Bearing в градусах (0-360)
 */
export function calculateBearing(from: Coordinates, to: Coordinates): number {
  const dLng = toRadians(to.lng - from.lng)
  const lat1 = toRadians(from.lat)
  const lat2 = toRadians(to.lat)

  const y = Math.sin(dLng) * Math.cos(lat2)
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)

  const bearing = Math.atan2(y, x) * 180 / Math.PI
  return (bearing + 360) % 360
}

/**
 * Получает направление по сторонам света из bearing
 * @param bearing - Bearing в градусах (0-360)
 * @returns Направление (N, NE, E, SE, S, SW, W, NW)
 */
export function getCardinalDirection(bearing: number): string {
  const directions = ['С', 'СВ', 'В', 'ЮВ', 'Ю', 'ЮЗ', 'З', 'СЗ']
  const index = Math.round(bearing / 45) % 8
  return directions[index]
}



