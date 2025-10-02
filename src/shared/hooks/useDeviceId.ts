import { useState, useEffect } from 'react'
import { getDeviceId, isValidDeviceId } from '@/shared/lib/deviceId/deviceId'
import logger from '@/shared/lib/logger'

/**
 * Хук для получения уникального идентификатора устройства
 * Автоматически обновляется при изменении deviceId
 */
export function useDeviceId() {
  const [deviceId, setDeviceId] = useState<string>(() => getDeviceId())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      const id = getDeviceId()

      if (!isValidDeviceId(id)) {
        logger.warn('[useDeviceId] Получен невалидный deviceId, генерирую новый')
        // В реальном приложении здесь может быть логика для повторной генерации
      }

      setDeviceId(id)
      setIsLoading(false)
      logger.debug(`[useDeviceId] DeviceId получен: ${id}`)
    } catch (error) {
      logger.error('[useDeviceId] Ошибка при получении deviceId:', error)
      setIsLoading(false)
    }
  }, [])

  return {
    deviceId,
    isLoading,
    isValid: isValidDeviceId(deviceId)
  }
}

