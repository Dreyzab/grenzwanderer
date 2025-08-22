import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  users: defineTable({
    externalId: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_externalId', ['externalId']),

  map_points: defineTable({
    key: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    coordinates: v.object({ lat: v.number(), lng: v.number() }),
    type: v.optional(v.string()),
    dialogKey: v.optional(v.string()),
    active: v.boolean(),
    radius: v.optional(v.number()),
    icon: v.optional(v.string()),
    updatedAt: v.number(),
  }).index('by_key', ['key']),

  quest_registry: defineTable({
    questId: v.string(),
    type: v.union(v.literal('story'), v.literal('faction'), v.literal('personal'), v.literal('procedural')),
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

  mappoint_bindings: defineTable({
    pointKey: v.string(),
    questId: v.string(),
    order: v.optional(v.number()),
    phaseFrom: v.optional(v.number()),
    phaseTo: v.optional(v.number()),
    startKey: v.optional(v.string()),
    dialogKey: v.optional(v.string()),
    npcId: v.optional(v.string()),
    stepKey: v.optional(v.string()),
    isStart: v.optional(v.boolean()),
    updatedAt: v.number(),
  })
    .index('by_point', ['pointKey'])
    .index('by_quest', ['questId'])
    .index('by_quest_start', ['questId', 'isStart']),

  // Ниже — дополнительные таблицы, которые могут использоваться другими модулями
  player_state: defineTable({
    userId: v.optional(v.string()),
    deviceId: v.string(),
    phase: v.number(),
    status: v.optional(v.string()),
    inventory: v.optional(v.array(v.string())),
    hasPda: v.optional(v.boolean()),
    fame: v.optional(v.number()),
    reputation: v.optional(v.record(v.string(), v.number())),
    reputations: v.optional(v.record(v.string(), v.number())),
    relationships: v.optional(v.record(v.string(), v.number())),
    flags: v.optional(v.array(v.string())),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_device', ['deviceId']),

  world_state: defineTable({
    key: v.string(),
    phase: v.number(),
    flags: v.array(v.string()),
    updatedAt: v.number(),
  }).index('by_key', ['key']),

  quest_dependencies: defineTable({
    questId: v.string(),
    requiresQuestId: v.string(),
    updatedAt: v.number(),
  })
    .index('by_quest', ['questId'])
    .index('by_requires', ['requiresQuestId']),

  // Прогресс квестов (для снапшота и syncProgress)
  quest_progress: defineTable({
    userId: v.optional(v.string()),
    deviceId: v.string(),
    questId: v.string(),
    currentStep: v.string(),
    startedAt: v.number(),
    updatedAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index('by_user', ['userId'])
    .index('by_device', ['deviceId'])
    .index('by_user_quest', ['userId', 'questId'])
    .index('by_device_quest', ['deviceId', 'questId']),
})


