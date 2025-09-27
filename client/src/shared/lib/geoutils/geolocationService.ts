/**
 * Высокоточный геолокационный сервис с background tracking
 */

export interface GeolocationOptions {
  enableHighAccuracy?: boolean
  maximumAge?: number
  timeout?: number
  minDistance?: number
  desiredAccuracy?: number
}

export interface GeolocationState {
  isTracking: boolean
  currentPosition: GeolocationPosition | null
  lastUpdate: number
  error: GeolocationPositionError | null
  watchId: number | null
}

export interface BackgroundLocationOptions {
  minDistance: number
  interval: number
  fastestInterval?: number
  locationTimeout?: number
}

class GeolocationService {
  private state: GeolocationState = {
    isTracking: false,
    currentPosition: null,
    lastUpdate: 0,
    error: null,
    watchId: null,
  }

  private listeners: ((position: GeolocationPosition) => void)[] = []
  private errorListeners: ((error: GeolocationPositionError) => void)[] = []

  // Фоновая геолокация (для мобильных устройств)
  private backgroundWatchId: number | null = null

  /**
   * Запускает отслеживание позиции
   */
  startTracking(options: GeolocationOptions = {}): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'))
        return
      }

      if (this.state.isTracking) {
        resolve(this.state.currentPosition!)
        return
      }

      const defaultOptions: PositionOptions = {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 15000,
      }

      const finalOptions = { ...defaultOptions, ...options }

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          this.state.currentPosition = position
          this.state.lastUpdate = Date.now()
          this.state.error = null

          // Вызываем всех слушателей
          this.listeners.forEach(listener => listener(position))

          resolve(position)
        },
        (error) => {
          this.state.error = error
          this.errorListeners.forEach(listener => listener(error))
          reject(error)
        },
        finalOptions
      )

      this.state.watchId = watchId
      this.state.isTracking = true
    })
  }

  /**
   * Останавливает отслеживание
   */
  stopTracking(): void {
    if (this.state.watchId !== null) {
      navigator.geolocation.clearWatch(this.state.watchId)
      this.state.watchId = null
      this.state.isTracking = false
    }

    if (this.backgroundWatchId !== null) {
      navigator.geolocation.clearWatch(this.backgroundWatchId)
      this.backgroundWatchId = null
    }
  }

  /**
   * Запускает фоновую геолокацию (для PWA)
   */
  startBackgroundTracking(options: BackgroundLocationOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'))
        return
      }

      // Проверяем поддержку Service Worker
      if (!('serviceWorker' in navigator)) {
        reject(new Error('Service Worker not supported'))
        return
      }

      const backgroundOptions: PositionOptions = {
        enableHighAccuracy: true,
        maximumAge: options.interval,
        timeout: options.locationTimeout || 30000,
      }

      this.backgroundWatchId = navigator.geolocation.watchPosition(
        (position) => {
          // Отправляем позицию в Service Worker для background обработки
          if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: 'LOCATION_UPDATE',
              payload: {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy,
                timestamp: position.timestamp,
              },
            })
          }

          // Вызываем слушателей
          this.listeners.forEach(listener => listener(position))
        },
        (error) => {
          this.errorListeners.forEach(listener => listener(error))
        },
        backgroundOptions
      )

      resolve()
    })
  }

  /**
   * Получает текущую позицию один раз
   */
  getCurrentPosition(options: GeolocationOptions = {}): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'))
        return
      }

      const defaultOptions: PositionOptions = {
        enableHighAccuracy: true,
        maximumAge: 30000,
        timeout: 15000,
      }

      const finalOptions = { ...defaultOptions, ...options }

      navigator.geolocation.getCurrentPosition(resolve, reject, finalOptions)
    })
  }

  /**
   * Добавляет слушатель обновлений позиции
   */
  addPositionListener(listener: (position: GeolocationPosition) => void): () => void {
    this.listeners.push(listener)

    // Возвращаем функцию для удаления слушателя
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * Добавляет слушатель ошибок
   */
  addErrorListener(listener: (error: GeolocationPositionError) => void): () => void {
    this.errorListeners.push(listener)

    return () => {
      const index = this.errorListeners.indexOf(listener)
      if (index > -1) {
        this.errorListeners.splice(index, 1)
      }
    }
  }

  /**
   * Получает текущее состояние
   */
  getState(): GeolocationState {
    return { ...this.state }
  }

  /**
   * Проверяет, включена ли геолокация в браузере
   */
  isGeolocationEnabled(): boolean {
    return 'geolocation' in navigator
  }

  /**
   * Проверяет, включен ли Service Worker
   */
  isServiceWorkerSupported(): boolean {
    return 'serviceWorker' in navigator
  }

  /**
   * Вычисляет расстояние между двумя позициями
   */
  calculateDistance(pos1: GeolocationPosition, pos2: GeolocationPosition): number {
    const R = 6371000 // Радиус Земли в метрах
    const lat1Rad = pos1.coords.latitude * Math.PI / 180
    const lat2Rad = pos2.coords.latitude * Math.PI / 180
    const deltaLatRad = (pos2.coords.latitude - pos1.coords.latitude) * Math.PI / 180
    const deltaLngRad = (pos2.coords.longitude - pos1.coords.longitude) * Math.PI / 180

    const a = Math.sin(deltaLatRad/2) * Math.sin(deltaLatRad/2) +
      Math.cos(lat1Rad) * Math.cos(lat2Rad) *
      Math.sin(deltaLngRad/2) * Math.sin(deltaLngRad/2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return R * c
  }

  /**
   * Проверяет, находится ли позиция в пределах заданного радиуса
   */
  isWithinRadius(center: GeolocationPosition, radiusMeters: number, position: GeolocationPosition): boolean {
    const distance = this.calculateDistance(center, position)
    return distance <= radiusMeters
  }
}

// Экспортируем singleton instance
export const geolocationService = new GeolocationService()

// Хук для использования в React компонентах
export function useGeolocation(options: GeolocationOptions = {}) {
  const [state, setState] = useState<GeolocationState>(geolocationService.getState())

  useEffect(() => {
    const updateState = () => setState(geolocationService.getState())

    const removePositionListener = geolocationService.addPositionListener(updateState)
    const removeErrorListener = geolocationService.addErrorListener(updateState)

    return () => {
      removePositionListener()
      removeErrorListener()
    }
  }, [])

  const startTracking = useCallback(() => {
    return geolocationService.startTracking(options)
  }, [options])

  const stopTracking = useCallback(() => {
    geolocationService.stopTracking()
  }, [])

  const getCurrentPosition = useCallback(() => {
    return geolocationService.getCurrentPosition(options)
  }, [options])

  return {
    ...state,
    startTracking,
    stopTracking,
    getCurrentPosition,
    isSupported: geolocationService.isGeolocationEnabled(),
  }
}

import { useState, useEffect, useCallback } from 'react'
