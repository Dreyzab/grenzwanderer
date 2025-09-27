/**
 * Offline QR validation - локальная проверка кодов без сети
 */

import { validateGrenzwandererQR } from './qrDecoder'

// Кеш валидных QR кодов для оффлайн использования
interface QROfflineCache {
  [qrCode: string]: {
    isValid: boolean
    validationResult?: ReturnType<typeof validateGrenzwandererQR>
    cachedAt: number
    expiresAt: number
  }
}

class OfflineQRValidator {
  private cache: QROfflineCache = {}
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 часа

  /**
   * Проверяет QR код оффлайн
   */
  async validateOffline(qrCode: string): Promise<{
    isValid: boolean
    cached?: boolean
    validationResult?: ReturnType<typeof validateGrenzwandererQR>
  }> {
    // Проверяем кеш
    const cached = this.cache[qrCode]
    if (cached && cached.expiresAt > Date.now()) {
      return {
        isValid: cached.isValid,
        cached: true,
        validationResult: cached.validationResult,
      }
    }

    // Проверяем локально
    const validationResult = validateGrenzwandererQR(qrCode)

    // Кешируем результат
    this.cache[qrCode] = {
      isValid: validationResult.isValid,
      validationResult,
      cachedAt: Date.now(),
      expiresAt: Date.now() + this.CACHE_DURATION,
    }

    return {
      isValid: validationResult.isValid,
      cached: false,
      validationResult,
    }
  }

  /**
   * Предварительная загрузка часто используемых QR кодов
   */
  async preloadCommonQRCodes(qrCodes: string[]): Promise<void> {
    const promises = qrCodes.map(code => this.validateOffline(code))
    await Promise.allSettled(promises)
  }

  /**
   * Очищает кеш
   */
  clearCache(): void {
    this.cache = {}
  }

  /**
   * Очищает просроченные записи
   */
  cleanupCache(): void {
    const now = Date.now()
    Object.keys(this.cache).forEach(key => {
      if (this.cache[key].expiresAt <= now) {
        delete this.cache[key]
      }
    })
  }

  /**
   * Получает статистику кеша
   */
  getCacheStats(): {
    totalEntries: number
    validEntries: number
    expiredEntries: number
  } {
    const now = Date.now()
    const entries = Object.values(this.cache)

    return {
      totalEntries: entries.length,
      validEntries: entries.filter(e => e.expiresAt > now).length,
      expiredEntries: entries.filter(e => e.expiresAt <= now).length,
    }
  }
}

// Экспортируем singleton
export const offlineQRValidator = new OfflineQRValidator()

/**
 * Хук для использования оффлайн валидации в React компонентах
 */
export function useOfflineQRValidation() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [cacheStats, setCacheStats] = useState(offlineQRValidator.getCacheStats())

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const validateQR = useCallback(async (qrCode: string) => {
    if (isOnline) {
      // При онлайн используем серверную валидацию
      try {
        const response = await fetch('/api/qr/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qrCode }),
        })

        if (response.ok) {
          const result = await response.json()
          return result
        }
      } catch (error) {
        console.warn('Server validation failed, falling back to offline:', error)
      }
    }

    // Оффлайн валидация
    const result = await offlineQRValidator.validateOffline(qrCode)
    setCacheStats(offlineQRValidator.getCacheStats())

    return {
      isValid: result.isValid,
      offline: true,
      cached: result.cached,
      validationResult: result.validationResult,
    }
  }, [isOnline])

  const preloadQRCodes = useCallback(async (qrCodes: string[]) => {
    await offlineQRValidator.preloadCommonQRCodes(qrCodes)
    setCacheStats(offlineQRValidator.getCacheStats())
  }, [])

  const clearCache = useCallback(() => {
    offlineQRValidator.clearCache()
    setCacheStats(offlineQRValidator.getCacheStats())
  }, [])

  return {
    isOnline,
    cacheStats,
    validateQR,
    preloadQRCodes,
    clearCache,
  }
}

import { useState, useEffect, useCallback } from 'react'
