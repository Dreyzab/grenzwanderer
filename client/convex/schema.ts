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
})


