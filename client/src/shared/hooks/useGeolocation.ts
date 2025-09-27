import { useState, useEffect, useCallback, useRef } from 'react'
import { geolocationService, GeolocationOptions } from '../lib/geoutils/geolocationService'

export interface UseGeolocationOptions extends GeolocationOptions {
  enableBackgroundTracking?: boolean
  backgroundOptions?: {
    minDistance: number
    interval: number
  }
  onBackgroundLocation?: (location: {
    lat: number
    lng: number
    accuracy: number
    timestamp: number
  }) => void
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const {
    enableBackgroundTracking = false,
    backgroundOptions = { minDistance: 10, interval: 30000 },
    onBackgroundLocation,
    ...geolocationOptions
  } = options

  const [state, setState] = useState(geolocationService.getState())
  const [isBackgroundSupported, setIsBackgroundSupported] = useState(false)
  const backgroundLocationHandler = useRef<(location: any) => void>()

  // Обработчик background location обновлений
  useEffect(() => {
    backgroundLocationHandler.current = (location) => {
      onBackgroundLocation?.(location)
    }
  }, [onBackgroundLocation])

  // Слушатель сообщений от Service Worker
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'BACKGROUND_LOCATION_UPDATE') {
        backgroundLocationHandler.current?.(event.data.payload)
      }
    }

    navigator.serviceWorker?.addEventListener('message', handleMessage)

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage)
    }
  }, [])

  // Проверка поддержки background tracking
  useEffect(() => {
    setIsBackgroundSupported(
      'serviceWorker' in navigator &&
      'geolocation' in navigator
    )
  }, [])

  // Обновление состояния
  useEffect(() => {
    const updateState = () => setState(geolocationService.getState())

    const removePositionListener = geolocationService.addPositionListener(updateState)
    const removeErrorListener = geolocationService.addErrorListener(updateState)

    return () => {
      removePositionListener()
      removeErrorListener()
    }
  }, [])

  // Background tracking
  useEffect(() => {
    if (enableBackgroundTracking && isBackgroundSupported) {
      geolocationService.startBackgroundTracking(backgroundOptions)
        .catch(error => {
          console.warn('Background tracking failed:', error)
        })

      return () => {
        // Background tracking продолжается в Service Worker
      }
    }
  }, [enableBackgroundTracking, isBackgroundSupported, backgroundOptions])

  const startTracking = useCallback(() => {
    return geolocationService.startTracking(geolocationOptions)
  }, [geolocationOptions])

  const stopTracking = useCallback(() => {
    geolocationService.stopTracking()
  }, [])

  const getCurrentPosition = useCallback(() => {
    return geolocationService.getCurrentPosition(geolocationOptions)
  }, [geolocationOptions])

  const requestPermissions = useCallback(async () => {
    try {
      // Запрашиваем разрешения для геолокации
      const permissionStatus = await navigator.permissions.query({ name: 'geolocation' })

      if (permissionStatus.state === 'denied') {
        throw new Error('Geolocation permission denied')
      }

      // Запрашиваем разрешения для уведомлений (для background tracking)
      if ('permissions' in navigator) {
        await navigator.permissions.query({ name: 'notifications' })
      }

      return true
    } catch (error) {
      console.error('Permission request failed:', error)
      return false
    }
  }, [])

  return {
    // State
    ...state,
    isBackgroundSupported,

    // Actions
    startTracking,
    stopTracking,
    getCurrentPosition,
    requestPermissions,

    // Utils
    calculateDistance: geolocationService.calculateDistance.bind(geolocationService),
    isWithinRadius: geolocationService.isWithinRadius.bind(geolocationService),
    isGeolocationEnabled: geolocationService.isGeolocationEnabled(),
    isServiceWorkerSupported: geolocationService.isServiceWorkerSupported(),
  }
}
