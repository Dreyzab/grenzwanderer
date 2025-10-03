import logger from '@/shared/lib/logger'

const DEVICE_ID_KEY = 'grenzwanderer_device_id'

/**
 * Ð“ÐµÐ½ÐµÑ€Ð¸Ñ€ÑƒÐµÑ‚ ÑƒÐ½Ð¸ÐºÐ°Ð»ÑŒÐ½Ñ‹Ð¹ Ð¸Ð´ÐµÐ½Ñ‚Ð¸Ñ„Ð¸ÐºÐ°Ñ‚Ð¾Ñ€ ÑƒÑÑ‚Ñ€Ð¾Ð¹ÑÑ‚Ð²Ð°
 * Ð˜ÑÐ¿Ð¾Ð»ÑŒÐ·ÑƒÐµÑ‚ÑÑ Ð´Ð»Ñ ÑÐ¸Ð½Ñ…Ñ€Ð¾Ð½Ð¸Ð·Ð°Ñ†Ð¸Ð¸ Ð´Ð°Ð½Ð½Ñ‹Ñ… Ð¼ÐµÐ¶Ð´Ñƒ ÐºÐ»Ð¸ÐµÐ½Ñ‚Ð¾Ð¼ Ð¸ ÑÐµÑ€Ð²ÐµÑ€Ð¾Ð¼
 */
function generateDeviceId(): string {
  // Prefer native crypto if available
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      // @ts-ignore
      return crypto.randomUUID()
    }
  } catch {}

  // RFC4122 v4 fallback
  const template = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
  return template.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * ÐŸÐ¾Ð»ÑƒÑ‡Ð°ÐµÑ‚ Ð¸Ð»Ð¸ ÑÐ¾Ð·Ð´Ð°ÐµÑ‚ ÑƒÐ½Ð¸ÐºÐ°Ð»ÑŒÐ½Ñ‹Ð¹ Ð¸Ð´ÐµÐ½Ñ‚Ð¸Ñ„Ð¸ÐºÐ°Ñ‚Ð¾Ñ€ ÑƒÑÑ‚Ñ€Ð¾Ð¹ÑÑ‚Ð²Ð°
 */
export function getDeviceId(): string {
  try {
    // ÐŸÑ€Ð¾Ð²ÐµÑ€ÑÐµÐ¼ localStorage Ð½Ð° ÐºÐ»Ð¸ÐµÐ½Ñ‚Ðµ
    if (typeof window !== 'undefined' && window.localStorage) {
      let deviceId = window.localStorage.getItem(DEVICE_ID_KEY)

      if (!deviceId) {
        deviceId = generateDeviceId()
        window.localStorage.setItem(DEVICE_ID_KEY, deviceId)
        logger.info(`[DeviceId] Ð¡Ð³ÐµÐ½ÐµÑ€Ð¸Ñ€Ð¾Ð²Ð°Ð½ Ð½Ð¾Ð²Ñ‹Ð¹ ID: ${deviceId}`)
      } else {
        logger.debug(`[DeviceId] Ð˜ÑÐ¿Ð¾Ð»ÑŒÐ·ÑƒÐµÑ‚ÑÑ ÑÑƒÑ‰ÐµÑÑ‚Ð²ÑƒÑŽÑ‰Ð¸Ð¹ ID: ${deviceId}`)
      }

      return deviceId
    }

    // Fallback Ð´Ð»Ñ ÑÐµÑ€Ð²ÐµÑ€Ð½Ð¾Ð¹ ÑÑ€ÐµÐ´Ñ‹ Ð¸Ð»Ð¸ ÐºÐ¾Ð³Ð´Ð° localStorage Ð½ÐµÐ´Ð¾ÑÑ‚ÑƒÐ¿ÐµÐ½
    logger.warn('[DeviceId] localStorage Ð½ÐµÐ´Ð¾ÑÑ‚ÑƒÐ¿ÐµÐ½, Ð³ÐµÐ½ÐµÑ€Ð¸Ñ€ÑƒÑŽ Ð²Ñ€ÐµÐ¼ÐµÐ½Ð½Ñ‹Ð¹ ID')
    return generateDeviceId()
  } catch (error) {
    logger.error('[DeviceId] ÐžÑˆÐ¸Ð±ÐºÐ° Ð¿Ñ€Ð¸ Ð¿Ð¾Ð»ÑƒÑ‡ÐµÐ½Ð¸Ð¸ deviceId:', error)
    return generateDeviceId()
  }
}

/**
 * ÐžÑ‡Ð¸Ñ‰Ð°ÐµÑ‚ deviceId (Ð¸ÑÐ¿Ð¾Ð»ÑŒÐ·ÑƒÐµÑ‚ÑÑ Ð´Ð»Ñ Ñ‚ÐµÑÑ‚Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð¸Ñ Ð¸Ð»Ð¸ ÑÐ±Ñ€Ð¾ÑÐ°)
 */
export function clearDeviceId(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(DEVICE_ID_KEY)
      logger.info('[DeviceId] ID Ð¾Ñ‡Ð¸Ñ‰ÐµÐ½')
    }
  } catch (error) {
    logger.error('[DeviceId] ÐžÑˆÐ¸Ð±ÐºÐ° Ð¿Ñ€Ð¸ Ð¾Ñ‡Ð¸ÑÑ‚ÐºÐµ deviceId:', error)
  }
}

/**
 * ÐŸÑ€Ð¾Ð²ÐµÑ€ÑÐµÑ‚, ÑÐ²Ð»ÑÐµÑ‚ÑÑ Ð»Ð¸ ÑÑ‚Ñ€Ð¾ÐºÐ° Ð²Ð°Ð»Ð¸Ð´Ð½Ñ‹Ð¼ deviceId
 */
export function isValidDeviceId(id: string): boolean {
  return /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(id)
}



