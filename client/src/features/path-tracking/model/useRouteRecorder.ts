import { useEffect, useRef, useCallback } from 'react'
import { useRouteStore } from '../../../entities/route/model/store'
import { RoutePoint } from '../../../entities/route/model/types'

interface UseRouteRecorderOptions {
  enabled?: boolean
  onPoint?: (point: RoutePoint) => void
  onError?: (error: GeolocationPositionError) => void
}

export function useRouteRecorder(options: UseRouteRecorderOptions = {}) {
  const { enabled = true, onPoint, onError } = options
  const { currentSession, addPoint, settings } = useRouteStore()
  const watchIdRef = useRef<number | null>(null)
  const lastPointRef = useRef<RoutePoint | null>(null)

  const handlePositionUpdate = useCallback((position: GeolocationPosition) => {
    const { coords, timestamp } = position
    const { latitude, longitude, accuracy, speed, heading, altitude } = coords

    // Фильтруем по минимальному расстоянию
    if (lastPointRef.current) {
      const distance = calculateDistance(
        lastPointRef.current.lat,
        lastPointRef.current.lng,
        latitude,
        longitude
      )

      if (distance < settings.minDistance) {
        return // Пропускаем точку, если она слишком близко к предыдущей
      }
    }

    const point: RoutePoint = {
      lat: latitude,
      lng: longitude,
      timestamp,
      accuracy,
      speed: speed || undefined,
      bearing: heading || undefined,
      altitude: altitude || undefined,
    }

    // Добавляем точку в store
    addPoint(point)

    // Вызываем callback
    onPoint?.(point)

    // Обновляем последнюю точку
    lastPointRef.current = point
  }, [addPoint, onPoint, settings.minDistance])

  const handleError = useCallback((error: GeolocationPositionError) => {
    console.error('Geolocation error:', error)
    onError?.(error)
  }, [onError])

  const startRecording = useCallback(() => {
    if (!enabled || !navigator.geolocation) {
      console.warn('Geolocation not available')
      return
    }

    if (watchIdRef.current !== null) {
      console.warn('Already recording')
      return
    }

    const watchOptions: PositionOptions = {
      enableHighAccuracy: settings.enableHighAccuracy,
      maximumAge: settings.maxAge,
      timeout: settings.timeout,
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePositionUpdate,
      handleError,
      watchOptions
    )

    console.log('Started route recording')
  }, [enabled, settings, handlePositionUpdate, handleError])

  const stopRecording = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
      console.log('Stopped route recording')
    }
  }, [])

  // Автоматический старт/стоп записи
  useEffect(() => {
    if (enabled && currentSession?.isActive) {
      startRecording()
      return () => stopRecording()
    } else {
      stopRecording()
    }
  }, [enabled, currentSession?.isActive, startRecording, stopRecording])

  // Периодическое автосохранение
  useEffect(() => {
    if (!currentSession?.isActive) return

    const interval = setInterval(() => {
      const { getActiveRoute } = useRouteStore.getState()
      const activeRoute = getActiveRoute()

      if (activeRoute && activeRoute.points.length > 0) {
        console.log(`Auto-saving route with ${activeRoute.points.length} points`)
        // Здесь можно добавить автосохранение
      }
    }, settings.autoSaveInterval)

    return () => clearInterval(interval)
  }, [currentSession?.isActive, settings.autoSaveInterval])

  return {
    isRecording: watchIdRef.current !== null,
    startRecording,
    stopRecording,
    lastPoint: lastPointRef.current,
  }
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
