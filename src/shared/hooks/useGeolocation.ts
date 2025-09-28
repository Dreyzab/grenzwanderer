import { useEffect, useRef } from 'react'
import { useDashboardStore } from '@/shared/stores/useDashboardStore'

// Geolocation options for different accuracy levels
const GEOLOCATION_OPTIONS: Record<'high' | 'balanced' | 'low', PositionOptions> = {
  high: {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 10000,
  },
  balanced: {
    enableHighAccuracy: false,
    timeout: 10000,
    maximumAge: 30000,
  },
  low: {
    enableHighAccuracy: false,
    timeout: 5000,
    maximumAge: 60000,
  },
}

interface UseGeolocationOptions {
  accuracy?: 'high' | 'balanced' | 'low'
  watch?: boolean
  onSuccess?: (position: GeolocationPosition) => void
  onError?: (error: GeolocationPositionError) => void
}

export function useGeolocation({
  accuracy = 'balanced',
  watch = false,
  onSuccess,
  onError,
}: UseGeolocationOptions = {}) {
  const {
    geolocation,
    updateGeolocation,
    setGeolocationError,
    setGeolocationLoading,
  } = useDashboardStore()
  
  const watchIdRef = useRef<number | null>(null)
  const optionsRef = useRef(GEOLOCATION_OPTIONS[accuracy])
  
  // Update options when accuracy changes
  useEffect(() => {
    optionsRef.current = GEOLOCATION_OPTIONS[accuracy]
  }, [accuracy])
  
  // Handle successful position
  const handleSuccess = (position: GeolocationPosition) => {
    const { latitude, longitude, accuracy } = position.coords
    
    updateGeolocation({
      lat: latitude,
      lng: longitude,
      accuracy,
    })

    setGeolocationLoading(false)
    
    onSuccess?.(position)
  }
  
  // Handle geolocation error
  const handleError = (error: GeolocationPositionError) => {
    let errorMessage = 'Неизвестная ошибка геолокации'
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Доступ к геолокации запрещен'
        break
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Информация о местоположении недоступна'
        break
      case error.TIMEOUT:
        errorMessage = 'Превышено время ожидания геолокации'
        break
    }
    
    setGeolocationError(errorMessage)
    setGeolocationLoading(false)
    onError?.(error)
  }
  
  // Get current position (one-time)
  const getCurrentPosition = () => {
    if (!navigator.geolocation) {
      setGeolocationError('Геолокация не поддерживается браузером')
      return
    }
    
    setGeolocationLoading(true)
    setGeolocationError(null)
    
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      optionsRef.current
    )
  }
  
  // Start watching position
  const startWatching = () => {
    if (!navigator.geolocation) {
      setGeolocationError('Геолокация не поддерживается браузером')
      return
    }
    
    if (watchIdRef.current !== null) {
      return // Already watching
    }
    
    setGeolocationLoading(true)
    setGeolocationError(null)
    
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      optionsRef.current
    )
  }
  
  // Stop watching position
  const stopWatching = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
      setGeolocationLoading(false)
    }
  }
  
  // Auto-start watching if enabled
  useEffect(() => {
    if (watch) {
      startWatching()
    } else {
      stopWatching()
    }
    
    return () => {
      stopWatching()
    }
  }, [watch])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWatching()
    }
  }, [])
  
  return {
    // State
    position: geolocation.position,
    isLoading: geolocation.isLoading,
    error: geolocation.error,
    isEnabled: geolocation.isEnabled,
    lastUpdate: geolocation.lastUpdate,
    
    // Actions
    getCurrentPosition,
    startWatching,
    stopWatching,
    
    // Utilities
    isSupported: !!navigator.geolocation,
    hasPosition: !!geolocation.position,
    isAccurate: geolocation.position ? geolocation.position.accuracy < 100 : false,
  }
}
