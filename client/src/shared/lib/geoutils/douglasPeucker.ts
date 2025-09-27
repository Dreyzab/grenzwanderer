/**
 * Douglas-Peucker алгоритм для упрощения полилиний (компрессия треков)
 */

export interface Point {
  lat: number
  lng: number
  timestamp?: number
  altitude?: number
}

/**
 * Упрощает полилинию используя алгоритм Douglas-Peucker
 * @param points Массив точек
 * @param tolerance Допустимое отклонение в метрах
 * @returns Упрощенный массив точек
 */
export function douglasPeucker(points: Point[], tolerance = 5): Point[] {
  if (points.length <= 2) {
    return points
  }

  const result = douglasPeuckerRecursive(points, 0, points.length - 1, tolerance)

  // Сортируем по timestamp если есть
  if (points[0].timestamp && points[points.length - 1].timestamp) {
    result.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
  }

  return result
}

/**
 * Рекурсивная функция Douglas-Peucker
 */
function douglasPeuckerRecursive(points: Point[], start: number, end: number, tolerance: number): Point[] {
  if (end - start <= 1) {
    return [points[start], points[end]]
  }

  // Находим точку с максимальным отклонением
  let maxDistance = 0
  let maxIndex = start + 1

  for (let i = start + 1; i < end; i++) {
    const distance = pointToLineDistance(points[i], points[start], points[end])
    if (distance > maxDistance) {
      maxDistance = distance
      maxIndex = i
    }
  }

  // Если максимальное отклонение меньше tolerance, возвращаем только концевые точки
  if (maxDistance <= tolerance) {
    return [points[start], points[end]]
  }

  // Рекурсивно упрощаем левую и правую части
  const left = douglasPeuckerRecursive(points, start, maxIndex, tolerance)
  const right = douglasPeuckerRecursive(points, maxIndex, end, tolerance)

  // Объединяем результаты (убираем дубликат в середине)
  return [...left.slice(0, -1), ...right]
}

/**
 * Вычисляет расстояние от точки до линии
 */
function pointToLineDistance(point: Point, lineStart: Point, lineEnd: Point): number {
  const A = point.lat - lineStart.lat
  const B = point.lng - lineStart.lng
  const C = lineEnd.lat - lineStart.lat
  const D = lineEnd.lng - lineStart.lng

  const dot = A * C + B * D
  const lenSq = C * C + D * D

  if (lenSq === 0) {
    // Линия имеет нулевую длину
    return Math.sqrt(A * A + B * B) * 111320 // Примерно 111320 метров в градусе
  }

  let param = dot / lenSq

  let xx: number
  let yy: number

  if (param < 0) {
    xx = lineStart.lat
    yy = lineStart.lng
  } else if (param > 1) {
    xx = lineEnd.lat
    yy = lineEnd.lng
  } else {
    xx = lineStart.lat + param * C
    yy = lineStart.lng + param * D
  }

  const dx = point.lat - xx
  const dy = point.lng - yy

  // Возвращаем расстояние в метрах
  return Math.sqrt(dx * dx + dy * dy) * 111320
}

/**
 * Компрессия трека с адаптивной толерантностью
 */
export function compressTrack(points: Point[], options: {
  maxPoints?: number
  minDistance?: number
  adaptive?: boolean
} = {}): Point[] {
  const { maxPoints = 100, minDistance = 3, adaptive = true } = options

  if (points.length <= maxPoints) {
    return points
  }

  // Начинаем с базовой толерантностью
  let tolerance = minDistance

  if (adaptive) {
    // Адаптивная толерантность: чем длиннее трек, тем выше толерантность
    const trackLength = calculateTrackLength(points)
    tolerance = Math.max(minDistance, Math.min(trackLength / 1000, 50)) // От 3м до 50м
  }

  let compressed = douglasPeucker(points, tolerance)

  // Если все еще слишком много точек, увеличиваем толерантность
  while (compressed.length > maxPoints && tolerance < 100) {
    tolerance *= 1.5
    compressed = douglasPeucker(points, tolerance)
  }

  return compressed
}

/**
 * Вычисляет общую длину трека в метрах
 */
export function calculateTrackLength(points: Point[]): number {
  let totalDistance = 0

  for (let i = 1; i < points.length; i++) {
    const distance = calculateDistance(
      points[i - 1].lat,
      points[i - 1].lng,
      points[i].lat,
      points[i].lng
    )
    totalDistance += distance
  }

  return totalDistance
}

/**
 * Вычисляет расстояние между двумя координатами в метрах
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000 // Радиус Земли в метрах
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

/**
 * Определяет, является ли точка значимой (поворот, остановка и т.д.)
 */
export function isSignificantPoint(points: Point[], index: number, threshold = 10): boolean {
  if (index === 0 || index === points.length - 1) {
    return true
  }

  const prev = points[index - 1]
  const current = points[index]
  const next = points[index + 1]

  // Проверяем угол поворота
  const angle = calculateBearing(prev.lat, prev.lng, current.lat, current.lng) -
                calculateBearing(current.lat, current.lng, next.lat, next.lng)

  const normalizedAngle = Math.abs(angle) % 360
  const turnAngle = Math.min(normalizedAngle, 360 - normalizedAngle)

  // Проверяем скорость изменения (остановка/резкое ускорение)
  const time1 = (current.timestamp || 0) - (prev.timestamp || 0)
  const time2 = (next.timestamp || 0) - (current.timestamp || 0)

  if (time1 === 0 || time2 === 0) return false

  const speed1 = calculateDistance(prev.lat, prev.lng, current.lat, current.lng) / (time1 / 1000)
  const speed2 = calculateDistance(current.lat, current.lng, next.lat, next.lng) / (time2 / 1000)

  const speedChange = Math.abs(speed1 - speed2)

  return turnAngle > threshold || speedChange > 5 // 5 м/с = 18 км/ч
}

/**
 * Вычисляет направление от точки к точке
 */
function calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLng = (lng2 - lng1) * Math.PI / 180
  const lat1Rad = lat1 * Math.PI / 180
  const lat2Rad = lat2 * Math.PI / 180

  const y = Math.sin(dLng) * Math.cos(lat2Rad)
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng)

  return Math.atan2(y, x) * 180 / Math.PI
}
