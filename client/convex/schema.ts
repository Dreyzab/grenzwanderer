import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

// Минимальная схема для стартовых квестов/QR-задач
export default defineSchema({
  // Пользователи (внешние провайдеры/анонимные гости)
  users: defineTable({
    // Внешний идентификатор провайдера (OIDC subject) или anon:<deviceId>
    externalId: v.string(),
    // Полезные данные профиля (опционально)
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_externalId', ['externalId']),
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
    // Наличие КПК (после интро/QR-входа)
    hasPda: v.optional(v.boolean()),
    // Глобальная известность героя
    fame: v.optional(v.number()),
    // Репутации по фракциям −100..+100
    // legacy: иногда встречается поле `reputation` (ед. число) — оставляем как совместимость
    reputation: v.optional(v.record(v.string(), v.number())),
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

  // Связи точек карты и квестов (M:N) с фазовыми окнами и порядком выдачи
  mappoint_bindings: defineTable({
    pointKey: v.string(), // map_points.key
    questId: v.string(),
    order: v.optional(v.number()), // порядок на точке (низкое число — раньше)
    phaseFrom: v.optional(v.number()),
    phaseTo: v.optional(v.number()),
    // Ключи: старт квеста и диалог (если требуется показать конкретный диалог на этой точке для квеста)
    startKey: v.optional(v.string()),
    dialogKey: v.optional(v.string()),
    npcId: v.optional(v.string()),
    isStart: v.optional(v.boolean()),
    updatedAt: v.number(),
  })
    .index('by_point', ['pointKey'])
    .index('by_quest', ['questId'])
    .index('by_quest_start', ['questId', 'isStart']),

  // Зависимости квестов (пререквизиты)
  quest_dependencies: defineTable({
    questId: v.string(),
    requiresQuestId: v.string(),
    updatedAt: v.number(),
  })
    .index('by_quest', ['questId'])
    .index('by_requires', ['requiresQuestId']),

  // QR-коды → привязка к точкам карты
  qr_codes: defineTable({
    code: v.string(), // строка из QR
    pointKey: v.string(), // map_points.key
    createdAt: v.number(),
  }).index('by_code', ['code']),

  // Исходы диалогов (редактируемые данные вместо хардкода)
  dialog_outcomes: defineTable({
    outcomeKey: v.string(),
    fameDelta: v.optional(v.number()),
    reputationsDelta: v.optional(v.record(v.string(), v.number())),
    relationshipsDelta: v.optional(v.record(v.string(), v.number())),
    addFlags: v.optional(v.array(v.string())),
    removeFlags: v.optional(v.array(v.string())),
    addWorldFlags: v.optional(v.array(v.string())),
    removeWorldFlags: v.optional(v.array(v.string())),
    setPhase: v.optional(v.number()),
    setStatus: v.optional(v.string()),
    quest: v.optional(
      v.object({ action: v.union(v.literal('start'), v.literal('advance'), v.literal('complete')), id: v.string(), step: v.optional(v.string()) }),
    ),
    updatedAt: v.number(),
  }).index('by_key', ['outcomeKey']),

  // Действия диалогов (замена локального dialogActionMap)
  dialog_actions: defineTable({
    actionKey: v.string(),
    kind: v.union(v.literal('phase'), v.literal('fsm'), v.literal('quest')),
    // phase
    phase: v.optional(v.number()),
    // fsm
    machine: v.optional(v.union(v.literal('delivery'), v.literal('combat'))),
    fsmEventType: v.optional(v.union(v.literal('START'), v.literal('ASSIGN'), v.literal('ADVANCE'), v.literal('COMPLETE'))),
    fsmStep: v.optional(v.string()),
    // quest
    questOp: v.optional(v.union(v.literal('start'), v.literal('advance'), v.literal('complete'))),
    questId: v.optional(v.string()),
    questStep: v.optional(v.string()),
    updatedAt: v.number(),
  }).index('by_key', ['actionKey']),
})


