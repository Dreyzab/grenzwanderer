import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  // Пользователи и аутентификация
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    username: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_clerk_id', ['clerkId'])
    .index('by_email', ['email']),

  // Состояние игрока
  player_state: defineTable({
    userId: v.id('users'),
    deviceId: v.optional(v.string()),
    currentPhase: v.number(),
    reputation: v.object({
      combat: v.number(),
      exploration: v.number(),
      social: v.number(),
      reliability: v.number(),
    }),
    inventory: v.any(), // JSON объект инвентаря
    currentLocation: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
      accuracy: v.optional(v.number()),
    })),
    lastSyncAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_device', ['deviceId']),

  // Прогресс квестов
  quest_progress: defineTable({
    userId: v.id('users'),
    questId: v.string(),
    status: v.union(
      v.literal('not_started'),
      v.literal('in_progress'),
      v.literal('completed'),
      v.literal('failed')
    ),
    progress: v.any(), // JSON объект прогресса
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_quest', ['questId'])
    .index('by_user_quest', ['userId', 'questId']),

  // Точки на карте
  map_points: defineTable({
    key: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    coordinates: v.object({
      lat: v.number(),
      lng: v.number(),
    }),
    type: v.union(
      v.literal('quest'),
      v.literal('npc'),
      v.literal('location'),
      v.literal('anomaly')
    ),
    phaseRequirement: v.optional(v.number()),
    isVisible: v.boolean(),
    questBinding: v.optional(v.string()), // ID квеста, к которому привязана точка
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_coordinates', ['coordinates'])
    .index('by_phase', ['phaseRequirement'])
    .index('by_quest', ['questBinding']),

  // Привязки точек к квестам
  mappoint_bindings: defineTable({
    pointKey: v.string(),
    questId: v.string(),
    bindingType: v.union(
      v.literal('start'),      // Квест начинается здесь
      v.literal('objective'),  // Цель квеста
      v.literal('reward'),     // Награда квеста
      v.literal('unlock')      // Разблокирует доступ
    ),
    createdAt: v.number(),
  })
    .index('by_point', ['pointKey'])
    .index('by_quest', ['questId']),

  // Реестр доступных квестов
  quest_registry: defineTable({
    id: v.string(),
    title: v.string(),
    description: v.string(),
    type: v.union(
      v.literal('main'),
      v.literal('side'),
      v.literal('daily'),
      v.literal('event')
    ),
    requirements: v.optional(v.any()), // JSON объект требований
    rewards: v.optional(v.any()), // JSON объект наград
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_type', ['type'])
    .index('by_active', ['isActive']),

  // Глобальное состояние мира
  world_state: defineTable({
    key: v.string(),
    value: v.any(), // JSON объект значения
    description: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_key', ['key']),

  // Открытия точек игроками (для геолокации)
  point_discoveries: defineTable({
    userId: v.optional(v.id('users')),
    deviceId: v.optional(v.string()),
    pointKey: v.string(),
    discoveredAt: v.optional(v.number()),
    researchedAt: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index('by_user_point', ['userId', 'pointKey'])
    .index('by_device_point', ['deviceId', 'pointKey']),
})
