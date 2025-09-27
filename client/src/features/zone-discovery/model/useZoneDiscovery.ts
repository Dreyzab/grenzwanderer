import { useEffect, useRef, useCallback } from 'react'
import { useRouteStore } from '../../../entities/route/model/store'
import { commitTrace, markResearched } from '../../../shared/api/exploration/convex'
import { encodeGeohash, getGeohashesInRadius } from '../../../shared/lib/geoutils/geohash'
import { useGameDataStore } from '../../../app/ConvexProvider'

interface UseZoneDiscoveryOptions {
  enabled?: boolean
  zoneRadius?: number // км
  onZoneEnter?: (zoneKey: string) => void
  onZoneExit?: (zoneKey: string) => void
  onPointsDiscovered?: (points: any[]) => void
}

export function useZoneDiscovery(options: UseZoneDiscoveryOptions = {}) {
  const {
    enabled = true,
    zoneRadius = 0.1, // 100 метров
    onZoneEnter,
    onZoneExit,
    onPointsDiscovered,
  } = options

  const { currentSession, getActiveRoute } = useRouteStore()
  const { setServerVisiblePoints } = useGameDataStore()
  const lastZoneRef = useRef<string | null>(null)
  const pendingTraceRef = useRef<any[]>([])

  // Отправка накопленного трека
  const flushTrace = useCallback(async () => {
    const { currentSession } = useRouteStore.getState()
    if (!currentSession || pendingTraceRef.current.length === 0) return

    try {
      const traceData = {
        deviceId: currentSession.deviceId,
        userId: currentSession.userId,
        trace: pendingTraceRef.current,
      }

      const result = await commitTrace(traceData)

      // Обновляем видимые точки
      setServerVisiblePoints(result.visiblePoints, result.ttlMs)

      // Обрабатываем обнаруженные точки
      if (result.discoveredPoints.length > 0) {
        onPointsDiscovered?.(result.discoveredPoints)
      }

      // Очищаем накопленный трек
      pendingTraceRef.current = []

    } catch (error) {
      console.error('Failed to flush trace:', error)
      // В случае ошибки можно добавить retry logic
    }
  }, [setServerVisiblePoints, onPointsDiscovered])

  // Обработка смены зоны
  const handleZoneChange = useCallback((newZone: string | null) => {
    const oldZone = lastZoneRef.current

    if (oldZone && oldZone !== newZone) {
      onZoneExit?.(oldZone)
    }

    if (newZone && newZone !== oldZone) {
      onZoneEnter?.(newZone)
      lastZoneRef.current = newZone

      // Отправляем накопленный трек при смене зоны
      flushTrace()
    }
  }, [onZoneEnter, onZoneExit, flushTrace])

  // Основная функция обработки позиций
  const handlePositionUpdate = useCallback((point: any) => {
    if (!enabled || !currentSession) return

    // Добавляем точку в накопленный трек
    pendingTraceRef.current.push({
      lat: point.lat,
      lng: point.lng,
      timestamp: point.timestamp || Date.now(),
    })

    // Определяем текущую зону
    const currentGeohash = encodeGeohash(point.lat, point.lng, 8) // ~38 метров точность
    const currentZone = currentGeohash.substring(0, 6) // ~1.2 км зона

    handleZoneChange(currentZone)

    // Периодическая отправка (каждые 30 секунд или при накоплении 50 точек)
    if (pendingTraceRef.current.length >= 50) {
      flushTrace()
    }
  }, [enabled, currentSession, handleZoneChange, flushTrace])

  // Подписка на обновления маршрута
  useEffect(() => {
    if (!enabled || !currentSession) return

    const activeRoute = getActiveRoute()
    if (!activeRoute) return

    // Подписываемся на обновления точек маршрута
    const unsubscribe = useRouteStore.subscribe(
      (state) => state.routes.find(r => r.isActive)?.points,
      (points) => {
        if (points && points.length > 0) {
          const lastPoint = points[points.length - 1]
          handlePositionUpdate(lastPoint)
        }
      }
    )

    return unsubscribe
  }, [enabled, currentSession, getActiveRoute, handlePositionUpdate])

  // Периодическая отправка
  useEffect(() => {
    if (!enabled || !currentSession) return

    const interval = setInterval(() => {
      if (pendingTraceRef.current.length > 0) {
        flushTrace()
      }
    }, 30000) // Каждые 30 секунд

    return () => clearInterval(interval)
  }, [enabled, currentSession, flushTrace])

  // Отправка при завершении сессии
  useEffect(() => {
    return () => {
      if (pendingTraceRef.current.length > 0) {
        flushTrace()
      }
    }
  }, [flushTrace])

  return {
    currentZone: lastZoneRef.current,
    pendingPoints: pendingTraceRef.current.length,
    flushTrace,
  }
}
