import { useMapPointStore } from '@/entities/map-point/model/store'
import { SEED_MAP_POINTS } from './seedData'
import type { MapPoint } from '@/entities/map-point/model/types'

/**
 * Инициализация точек карты из локальных данных
 * Используется как fallback если Convex недоступен
 */
export function initMapPointsFromSeed() {
  const store = useMapPointStore.getState()
  
  // Преобразуем seed данные в полные MapPoint объекты
  const points: MapPoint[] = SEED_MAP_POINTS.map(seedPoint => ({
    ...seedPoint,
    status: 'not_found' as const, // По умолчанию все точки не обнаружены
  }))

  // Загружаем в стор
  store.setPoints(points)
  
  console.log(`✅ Initialized ${points.length} map points from seed data`)
  
  return points
}

/**
 * Очистить все точки
 */
export function clearMapPoints() {
  const store = useMapPointStore.getState()
  store.reset()
  console.log('🗑️ Cleared all map points')
}

/**
 * Получить статистику точек
 */
export function getMapPointsStats() {
  const store = useMapPointStore.getState()
  const points = Array.from(store.points.values())
  
  const stats = {
    total: points.length,
    byType: {} as Record<string, number>,
    byPhase: {} as Record<number, number>,
    byStatus: {} as Record<string, number>,
    byFaction: {} as Record<string, number>
  }

  points.forEach(point => {
    // По типу
    stats.byType[point.type] = (stats.byType[point.type] || 0) + 1
    
    // По фазе
    if (point.phase) {
      stats.byPhase[point.phase] = (stats.byPhase[point.phase] || 0) + 1
    }
    
    // По статусу
    const status = point.status || 'not_found'
    stats.byStatus[status] = (stats.byStatus[status] || 0) + 1
    
    // По фракции
    if (point.metadata?.faction) {
      stats.byFaction[point.metadata.faction] = (stats.byFaction[point.metadata.faction] || 0) + 1
    }
  })

  return stats
}

/**
 * Обнаружить точки в радиусе (для тестирования)
 */
export function discoverPointsInRadius(
  userLat: number,
  userLng: number,
  radiusMeters: number = 100
) {
  const store = useMapPointStore.getState()
  const points = Array.from(store.points.values())
  
  let discoveredCount = 0

  points.forEach(point => {
    const distance = calculateDistance(
      userLat,
      userLng,
      point.coordinates.lat,
      point.coordinates.lng
    )

    if (distance <= radiusMeters && point.status === 'not_found') {
      store.updatePointStatus(point.id, 'discovered')
      discoveredCount++
    }
  })

  console.log(`🔍 Discovered ${discoveredCount} new points within ${radiusMeters}m radius`)
  
  return discoveredCount
}

// Вспомогательная функция расчета расстояния (Haversine)
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000 // Радиус Земли в метрах
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}



