import { v } from 'convex/values'
import { api } from '../../../../convex/_generated/api'

/**
 * API для работы с QR кодами и сканированием
 */

export interface QRScanData {
  qrCode: string
  deviceId?: string
  userId?: string
  location?: {
    lat: number
    lng: number
    accuracy?: number
  }
  timestamp: number
}

export interface QRScanResult {
  success: boolean
  pointKey?: string
  action?: 'discover' | 'research' | 'unlock' | 'reward'
  rewards?: {
    experience?: number
    reputation?: Record<string, number>
    items?: string[]
    flags?: Record<string, any>
  }
  message?: string
  error?: string
}

/**
 * Сканирует QR код и обрабатывает результат
 */
export async function scanQRCode(qrData: QRScanData): Promise<QRScanResult> {
  try {
    const response = await fetch('/api/qr/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(qrData),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('QR scan failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Проверяет валидность QR кода
 */
export async function validateQRCode(qrCode: string): Promise<{
  isValid: boolean
  pointKey?: string
  type?: 'poi' | 'quest' | 'reward' | 'unlock'
}> {
  try {
    const response = await fetch('/api/qr/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ qrCode }),
    })

    if (!response.ok) {
      return { isValid: false }
    }

    return await response.json()
  } catch (error) {
    console.error('QR validation failed:', error)
    return { isValid: false }
  }
}

/**
 * Получает статистику сканирования для точки
 */
export async function getQRStats(pointKey: string): Promise<{
  totalScans: number
  uniqueScanners: number
  lastScan?: number
  successRate: number
}> {
  try {
    const response = await fetch(`/api/qr/stats/${pointKey}`)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Failed to get QR stats:', error)
    return {
      totalScans: 0,
      uniqueScanners: 0,
      successRate: 0,
    }
  }
}

/**
 * Convex mutations для QR сканирования
 */
export const convexQR = {
  scanQR: {
    args: {
      qrCode: v.string(),
      deviceId: v.optional(v.string()),
      userId: v.optional(v.id('users')),
      location: v.optional(v.object({
        lat: v.number(),
        lng: v.number(),
        accuracy: v.optional(v.number()),
      })),
      timestamp: v.number(),
    },
    handler: async (ctx, args) => {
      // Парсинг QR кода и определение действия
      const qrData = parseQRCode(args.qrCode)

      if (!qrData) {
        return {
          success: false,
          error: 'Invalid QR code format',
        }
      }

      // Проверка существования точки
      const point = await ctx.db
        .query('map_points')
        .filter((q) => q.eq(q.field('key'), qrData.pointKey))
        .first()

      if (!point) {
        return {
          success: false,
          error: 'Point not found',
        }
      }

      // Обработка сканирования в зависимости от типа
      switch (qrData.type) {
        case 'discover':
          return await handleDiscovery(ctx, args, qrData.pointKey)
        case 'research':
          return await handleResearch(ctx, args, qrData.pointKey)
        case 'unlock':
          return await handleUnlock(ctx, args, qrData.pointKey)
        default:
          return {
            success: false,
            error: 'Unknown QR code type',
          }
      }
    },
  },

  validateQR: {
    args: {
      qrCode: v.string(),
    },
    handler: async (ctx, args) => {
      const qrData = parseQRCode(args.qrCode)

      if (!qrData) {
        return { isValid: false }
      }

      // Проверяем существование точки
      const point = await ctx.db
        .query('map_points')
        .filter((q) => q.eq(q.field('key'), qrData.pointKey))
        .first()

      return {
        isValid: !!point,
        pointKey: qrData.pointKey,
        type: qrData.type,
      }
    },
  },
}

/**
 * Парсит QR код и извлекает данные
 */
function parseQRCode(qrCode: string): {
  pointKey: string
  type: 'discover' | 'research' | 'unlock' | 'reward'
  data?: any
} | null {
  try {
    // Ожидаемый формат: grenzwanderer:pointKey:type:data
    const parts = qrCode.split(':')

    if (parts.length < 3 || parts[0] !== 'grenzwanderer') {
      return null
    }

    return {
      pointKey: parts[1],
      type: parts[2] as any,
      data: parts[3] ? JSON.parse(parts[3]) : undefined,
    }
  } catch {
    return null
  }
}

/**
 * Обрабатывает обнаружение точки
 */
async function handleDiscovery(ctx: any, args: any, pointKey: string) {
  // Логика обнаружения точки
  return {
    success: true,
    pointKey,
    action: 'discover' as const,
    rewards: {
      experience: 10,
      reputation: { exploration: 5 },
    },
  }
}

/**
 * Обрабатывает исследование точки
 */
async function handleResearch(ctx: any, args: any, pointKey: string) {
  // Логика исследования точки
  return {
    success: true,
    pointKey,
    action: 'research' as const,
    rewards: {
      experience: 25,
      reputation: { exploration: 10 },
      items: ['research_notes'],
    },
  }
}

/**
 * Обрабатывает разблокировку контента
 */
async function handleUnlock(ctx: any, args: any, pointKey: string) {
  // Логика разблокировки
  return {
    success: true,
    pointKey,
    action: 'unlock' as const,
    rewards: {
      flags: { [pointKey]: 'unlocked' },
    },
  }
}
