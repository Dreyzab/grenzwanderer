import { v } from 'convex/values'
import { api } from '../../../../convex/_generated/api'

/**
 * API для системы исследования и обнаружения зон
 */

export interface CommitTraceArgs {
  deviceId?: string
  userId?: string
  zoneKey?: string
  trace: Array<{ lat: number; lng: number; timestamp: number }> | { geohashSet: string[] }
  bbox?: {
    minLat: number
    maxLat: number
    minLng: number
    maxLng: number
  }
}

export interface CommitTraceResult {
  discoveredPoints: Array<{
    key: string
    title: string
    coordinates: { lat: number; lng: number }
    type: string
    phaseRequirement?: number
  }>
  zonePoints: Array<{
    key: string
    title: string
    coordinates: { lat: number; lng: number }
    type: string
    phaseRequirement?: number
  }>
  visiblePoints: Array<{
    key: string
    title: string
    coordinates: { lat: number; lng: number }
    type: string
    phaseRequirement?: number
  }>
  ttlMs: number
}

export interface MarkResearchedArgs {
  deviceId?: string
  userId?: string
  pointKey: string
}

export interface MarkResearchedResult {
  success: boolean
  rewards?: {
    experience?: number
    reputation?: Record<string, number>
    items?: string[]
  }
}

/**
 * Отправляет трек для анализа и получения точек в зоне
 */
export async function commitTrace(args: CommitTraceArgs): Promise<CommitTraceResult> {
  try {
    const result = await fetch('/api/exploration/commit-trace', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(args),
    })

    if (!result.ok) {
      throw new Error(`HTTP ${result.status}: ${result.statusText}`)
    }

    return await result.json()
  } catch (error) {
    console.error('Failed to commit trace:', error)
    throw error
  }
}

/**
 * Помечает точку как исследованную
 */
export async function markResearched(args: MarkResearchedArgs): Promise<MarkResearchedResult> {
  try {
    const result = await fetch('/api/exploration/mark-researched', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(args),
    })

    if (!result.ok) {
      throw new Error(`HTTP ${result.status}: ${result.statusText}`)
    }

    return await result.json()
  } catch (error) {
    console.error('Failed to mark point as researched:', error)
    throw error
  }
}

/**
 * Convex mutations для синхронизации
 */
export const convexExploration = {
  commitTrace: {
    args: {
      deviceId: v.optional(v.string()),
      userId: v.optional(v.id('users')),
      zoneKey: v.optional(v.string()),
      trace: v.union(
        v.array(v.object({
          lat: v.number(),
          lng: v.number(),
          timestamp: v.number(),
        })),
        v.object({
          geohashSet: v.array(v.string()),
        })
      ),
      bbox: v.optional(v.object({
        minLat: v.number(),
        maxLat: v.number(),
        minLng: v.number(),
        maxLng: v.number(),
      })),
    },
    handler: async (ctx, args) => {
      // Анализ трека и определение зон
      // Возврат точек для отображения
      return {
        discoveredPoints: [],
        zonePoints: [],
        visiblePoints: [],
        ttlMs: 300000, // 5 минут
      }
    },
  },

  markResearched: {
    args: {
      deviceId: v.optional(v.string()),
      userId: v.optional(v.id('users')),
      pointKey: v.string(),
    },
    handler: async (ctx, args) => {
      // Пометка точки как исследованной
      // Начисление наград
      return {
        success: true,
        rewards: {
          experience: 10,
          reputation: { exploration: 5 },
        },
      }
    },
  },
}
