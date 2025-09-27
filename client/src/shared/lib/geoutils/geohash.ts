/**
 * Геохешинг утилиты для определения зон и позиций
 */

// Базовые символы для геохеша
const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz'

/**
 * Кодирует координаты в геохеш
 */
export function encodeGeohash(lat: number, lng: number, precision = 12): string {
  let geohash = ''

  // Нормализуем координаты
  lat = clamp(lat, -90, 90)
  lng = clamp(lng, -180, 180)

  let latRange = [-90, 90]
  let lngRange = [-180, 180]

  for (let i = 0; i < precision; i++) {
    let char = 0

    // Определяем биты для широты (четные)
    if (i % 2 === 0) {
      const mid = (latRange[0] + latRange[1]) / 2
      if (lat > mid) {
        char |= 0b10000
        latRange[0] = mid
      } else {
        latRange[1] = mid
      }
    }
    // Определяем биты для долготы (нечетные)
    else {
      const mid = (lngRange[0] + lngRange[1]) / 2
      if (lng > mid) {
        char |= 0b10000
        lngRange[0] = mid
      } else {
        lngRange[1] = mid
      }
    }

    // Добавляем биты для каждого из 5 битных пар
    for (let j = 0; j < 5; j++) {
      const bit = i * 5 + j
      const isLng = bit % 2 === 1

      if (isLng) {
        const mid = (lngRange[0] + lngRange[1]) / 2
        if (lng > mid) {
          char |= 1 << (4 - j)
          lngRange[0] = mid
        } else {
          lngRange[1] = mid
        }
      } else {
        const mid = (latRange[0] + latRange[1]) / 2
        if (lat > mid) {
          char |= 1 << (4 - j)
          latRange[0] = mid
        } else {
          latRange[1] = mid
        }
      }
    }

    geohash += BASE32[char]
  }

  return geohash
}

/**
 * Декодирует геохеш в координаты
 */
export function decodeGeohash(geohash: string): { lat: number; lng: number; error: number } {
  let latRange = [-90, 90]
  let lngRange = [-180, 180]

  for (let i = 0; i < geohash.length; i++) {
    const char = geohash[i]
    const charIndex = BASE32.indexOf(char)

    if (charIndex === -1) {
      throw new Error(`Invalid geohash character: ${char}`)
    }

    // Обрабатываем 5 битных пар
    for (let j = 0; j < 5; j++) {
      const bit = charIndex >> (4 - j) & 1
      const isLng = (i * 5 + j) % 2 === 1

      if (isLng) {
        const mid = (lngRange[0] + lngRange[1]) / 2
        if (bit) {
          lngRange[0] = mid
        } else {
          lngRange[1] = mid
        }
      } else {
        const mid = (latRange[0] + latRange[1]) / 2
        if (bit) {
          latRange[0] = mid
        } else {
          latRange[1] = mid
        }
      }
    }
  }

  const lat = (latRange[0] + latRange[1]) / 2
  const lng = (lngRange[0] + lngRange[1]) / 2
  const error = Math.max(latRange[1] - latRange[0], lngRange[1] - lngRange[0]) / 2

  return { lat, lng, error }
}

/**
 * Получает соседние геохеши для заданного
 */
export function getNeighbors(geohash: string): string[] {
  const { lat, lng } = decodeGeohash(geohash)
  const precision = geohash.length

  // Получаем 8 соседних координат
  const neighbors = [
    { lat: lat + 0.0001, lng: lng },
    { lat: lat - 0.0001, lng: lng },
    { lat: lat, lng: lng + 0.0001 },
    { lat: lat, lng: lng - 0.0001 },
    { lat: lat + 0.0001, lng: lng + 0.0001 },
    { lat: lat + 0.0001, lng: lng - 0.0001 },
    { lat: lat - 0.0001, lng: lng + 0.0001 },
    { lat: lat - 0.0001, lng: lng - 0.0001 },
  ]

  // Кодируем соседей в геохеши
  return neighbors.map(coord => encodeGeohash(coord.lat, coord.lng, precision))
}

/**
 * Получает все геохеши в радиусе от заданного
 */
export function getGeohashesInRadius(geohash: string, radiusKm: number): string[] {
  const { lat, lng, error } = decodeGeohash(geohash)
  const precision = geohash.length

  // Вычисляем количество геохешей по широте и долготе
  const latDelta = (radiusKm / 111) * 2 // Примерно 111км на градус
  const lngDelta = (radiusKm / (111 * Math.cos(lat * Math.PI / 180))) * 2

  const latSteps = Math.ceil(latDelta / (error * 2))
  const lngSteps = Math.ceil(lngDelta / (error * 2))

  const result = new Set<string>()

  for (let i = -latSteps; i <= latSteps; i++) {
    for (let j = -lngSteps; j <= lngSteps; j++) {
      const neighborLat = lat + i * error * 2
      const neighborLng = lng + j * error * 2
      const neighborGeohash = encodeGeohash(neighborLat, neighborLng, precision)
      result.add(neighborGeohash)
    }
  }

  return Array.from(result)
}

/**
 * Вычисляет расстояние между двумя геохешами
 */
export function geohashDistance(geohash1: string, geohash2: string): number {
  const { lat: lat1, lng: lng1 } = decodeGeohash(geohash1)
  const { lat: lat2, lng: lng2 } = decodeGeohash(geohash2)

  return calculateDistance(lat1, lng1, lat2, lng2)
}

/**
 * Вспомогательная функция для ограничения значения
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Вычисляет расстояние между двумя координатами в километрах
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Радиус Земли в км
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}
