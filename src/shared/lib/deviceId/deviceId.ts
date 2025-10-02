import logger from '@/shared/lib/logger'

const DEVICE_ID_KEY = 'grenzwanderer_device_id'

/**
 * Генерирует уникальный идентификатор устройства
 * Используется для синхронизации данных между клиентом и сервером
 */
function generateDeviceId(): string {
  // Генерируем случайный ID в формате UUID v4 без дефисов
  return 'xxxx-xxxx-4xxx-yxxx-xxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * Получает или создает уникальный идентификатор устройства
 */
export function getDeviceId(): string {
  try {
    // Проверяем localStorage на клиенте
    if (typeof window !== 'undefined' && window.localStorage) {
      let deviceId = window.localStorage.getItem(DEVICE_ID_KEY)

      if (!deviceId) {
        deviceId = generateDeviceId()
        window.localStorage.setItem(DEVICE_ID_KEY, deviceId)
        logger.info(`[DeviceId] Сгенерирован новый ID: ${deviceId}`)
      } else {
        logger.debug(`[DeviceId] Используется существующий ID: ${deviceId}`)
      }

      return deviceId
    }

    // Fallback для серверной среды или когда localStorage недоступен
    logger.warn('[DeviceId] localStorage недоступен, генерирую временный ID')
    return generateDeviceId()
  } catch (error) {
    logger.error('[DeviceId] Ошибка при получении deviceId:', error)
    return generateDeviceId()
  }
}

/**
 * Очищает deviceId (используется для тестирования или сброса)
 */
export function clearDeviceId(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(DEVICE_ID_KEY)
      logger.info('[DeviceId] ID очищен')
    }
  } catch (error) {
    logger.error('[DeviceId] Ошибка при очистке deviceId:', error)
  }
}

/**
 * Проверяет, является ли строка валидным deviceId
 */
export function isValidDeviceId(id: string): boolean {
  return /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(id)
}

