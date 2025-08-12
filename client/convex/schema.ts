import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

// Минимальная схема для стартовых квестов/QR-задач
export default defineSchema({
  quests: defineTable({
    title: v.string(),
    status: v.string(), // new | active | done
    createdAt: v.number(),
  }),

  // Точки карты (сервер — источник истины)
  map_points: defineTable({
    key: v.string(), // стабильный бизнес-идентификатор (например, 'carl_private_workshop')
    title: v.string(),
    description: v.optional(v.string()),
    coordinates: v.object({ lat: v.number(), lng: v.number() }),
    type: v.optional(v.string()), // npc | settlement | anomaly | ...
    dialogKey: v.optional(v.string()),
    questId: v.optional(v.string()),
    active: v.boolean(),
    radius: v.optional(v.number()),
    icon: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index('by_key', ['key'])
    .index('by_quest', ['questId'])
    .index('by_active', ['active']),

  // Прогресс квестов (по пользователю/устройству)
  quest_progress: defineTable({
    userId: v.optional(v.string()),
    deviceId: v.string(),
    questId: v.string(),
    currentStep: v.string(),
    startedAt: v.number(),
    updatedAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index('by_user_quest', ['userId', 'questId'])
    .index('by_device_quest', ['deviceId', 'questId'])
    .index('by_user', ['userId'])
    .index('by_device', ['deviceId']),

  // Состояние игрока (фазы, статус, инвентарь и т.п.)
  player_state: defineTable({
    userId: v.optional(v.string()),
    deviceId: v.string(),
    phase: v.number(), // 0: пролог, 1: первые шаги, 2: гражданин
    status: v.optional(v.string()), // например, 'refugee' | 'citizen'
    inventory: v.optional(v.array(v.string())),
    // Глобальная известность героя
    fame: v.optional(v.number()),
    // Репутации по фракциям −100..+100
    reputations: v.optional(v.record(v.string(), v.number())),
    // Отношения с ключевыми NPC 0..100
    relationships: v.optional(v.record(v.string(), v.number())),
    // Индивидуальные флаги игрока
    flags: v.optional(v.array(v.string())),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_device', ['deviceId']),

  // Глобальное состояние мира (фаза/флаги)
  world_state: defineTable({
    key: v.string(), // 'global' — единственная запись
    phase: v.number(),
    flags: v.array(v.string()),
    updatedAt: v.number(),
  }).index('by_key', ['key']),

  // Реестр квестов (метаданные; один источник правды для условий/приоритетов)
  quest_registry: defineTable({
    questId: v.string(),
    type: v.string(), // 'story' | 'faction' | 'personal' | 'procedural'
    giverNpcId: v.optional(v.string()),
    boardKey: v.optional(v.string()),
    repeatable: v.optional(v.boolean()),
    priority: v.number(),
    phaseGate: v.optional(v.number()),
    requirements: v.optional(
      v.object({
        fameMin: v.optional(v.number()),
        phaseMin: v.optional(v.number()),
        phaseMax: v.optional(v.number()),
        requiredFlags: v.optional(v.array(v.string())),
        forbiddenFlags: v.optional(v.array(v.string())),
        reputations: v.optional(v.record(v.string(), v.number())),
        relationships: v.optional(v.record(v.string(), v.number())),
      }),
    ),
    updatedAt: v.number(),
  })
    .index('by_giver', ['giverNpcId'])
    .index('by_board', ['boardKey'])
    .index('by_type', ['type'])
    .index('by_quest', ['questId']),
})


