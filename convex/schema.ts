import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  // Таблица игроков с поддержкой deviceId
  players: defineTable({
    userId: v.optional(v.string()), // Clerk user ID (может быть пустым для анонимных игроков)
    deviceId: v.string(), // Уникальный идентификатор устройства
    name: v.string(),
    fame: v.number(),
    phase: v.number(),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index('by_userId', ['userId'])
    .index('by_deviceId', ['deviceId'])
    .index('by_userId_deviceId', ['userId', 'deviceId']),

  // Каталог квестов (шаблоны)
  quests: defineTable({
    id: v.string(), // Внутренний ID квеста
    title: v.string(),
    description: v.string(),
    phase: v.number(), // Фаза, на которой доступен квест
    prerequisites: v.array(v.string()), // ID квестов, которые должны быть выполнены
    rewards: v.object({
      fame: v.number(),
      items: v.optional(v.array(v.string())),
      flags: v.optional(v.array(v.string()))
    }),
    steps: v.array(v.object({
      id: v.string(),
      description: v.string(),
      type: v.union(
        v.literal('location'),
        v.literal('dialogue'),
        v.literal('combat'),
        v.literal('item')
      ),
      requirements: v.optional(v.any()) // Гибкие требования для каждого типа
    })),
    isActive: v.boolean(),
    createdAt: v.number()
  })
    .index('by_phase', ['phase'])
    .index('by_active', ['isActive']),

  // Прогресс игроков по квестам
  quest_progress: defineTable({
    playerId: v.id('players'),
    questId: v.string(),
    currentStep: v.string(),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    progress: v.optional(v.any()), // Дополнительные данные прогресса
    updatedAt: v.number()
  })
    .index('by_player', ['playerId'])
    .index('by_quest', ['questId'])
    .index('by_player_quest', ['playerId', 'questId'])
    .index('by_completed', ['completedAt']),

  // Пространственные точки карты
  map_points: defineTable({
    id: v.string(),
    title: v.string(),
    description: v.string(),
    coordinates: v.object({
      lat: v.number(),
      lng: v.number()
    }),
    type: v.union(
      v.literal('poi'),
      v.literal('quest'),
      v.literal('npc'),
      v.literal('location'),
      v.literal('board'),      // Доски объявлений
      v.literal('settlement'), // Поселения
      v.literal('anomaly')     // Аномальные зоны
    ),
    phase: v.optional(v.number()),
    isActive: v.boolean(),
    metadata: v.optional(v.any()),
    createdAt: v.number()
  })
    .index('by_id', ['id'])
    .index('by_coordinates', ['coordinates.lat', 'coordinates.lng'])
    .index('by_type', ['type'])
    .index('by_phase', ['phase'])
    .index('by_active', ['isActive']),

  // Привязки точек к квестам
  mappoint_bindings: defineTable({
    mapPointId: v.id('map_points'),
    questId: v.string(),
    stepId: v.optional(v.string()), // Конкретный шаг квеста
    bindingType: v.union(
      v.literal('start'), // Точка начинает квест
      v.literal('progress'), // Точка продвигает квест
      v.literal('complete') // Точка завершает квест
    ),
    requirements: v.optional(v.any()),
    createdAt: v.number()
  })
    .index('by_mapPoint', ['mapPointId'])
    .index('by_quest', ['questId'])
    .index('by_quest_step', ['questId', 'stepId']),

  // Состояние мира (глобальные флаги и события)
  world_state: defineTable({
    key: v.string(),
    value: v.any(),
    phase: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    updatedAt: v.number()
  })
    .index('by_key', ['key'])
    .index('by_phase', ['phase'])
    .index('by_expires', ['expiresAt']),

  // Отслеживание исследований точек карты игроками
  point_discoveries: defineTable({
    deviceId: v.optional(v.string()), // Устройство игрока (для оффлайн)
    userId: v.optional(v.string()),   // Пользователь (если авторизован)
    pointKey: v.string(),             // ID точки карты (map_points.id)
    discoveredAt: v.number(),         // Когда обнаружена
    researchedAt: v.optional(v.number()), // Когда исследована (через QR/клик)
    updatedAt: v.number()
  })
    .index('by_deviceId_pointKey', ['deviceId', 'pointKey'])
    .index('by_userId_pointKey', ['userId', 'pointKey'])
    .index('by_pointKey', ['pointKey'])
    .index('by_discoveredAt', ['discoveredAt']),
})


