import { mutation } from './_generated/server'
import { v } from 'convex/values'

const getDevToken = () => (globalThis as any)?.process?.env?.VITE_DEV_SEED_TOKEN ?? (globalThis as any)?.VITE_DEV_SEED_TOKEN

export const seedQuestDependenciesDev = mutation({
  args: { devToken: v.string() },
  handler: async ({ db }, { devToken }) => {
    const expected = getDevToken()
    if (!expected || devToken !== expected) throw new Error('Forbidden: invalid dev token')
    const now = Date.now()
    const items: Array<{ questId: string; requires: string[] }> = [
      { questId: 'loyalty_fjr', requires: ['delivery_and_dilemma'] },
      { questId: 'citizenship_invitation', requires: ['delivery_and_dilemma'] },
      { questId: 'eyes_in_the_dark', requires: ['citizenship_invitation'] },
      { questId: 'void_shards', requires: ['citizenship_invitation'] },
    ]
    for (const it of items) {
      for (const req of it.requires) {
        const existing = await db
          .query('quest_dependencies')
          .withIndex('by_quest', (q) => q.eq('questId', it.questId))
          .collect()
        const dup = existing.find((e: any) => e.requiresQuestId === req)
        if (dup) {
          await db.patch(dup._id, { updatedAt: now })
        } else {
          await db.insert('quest_dependencies', { questId: it.questId, requiresQuestId: req, updatedAt: now })
        }
      }
    }
    return { ok: true, count: items.reduce((n, i) => n + i.requires.length, 0) }
  },
})

export const seedMappointBindingsDev = mutation({
  args: { devToken: v.string() },
  handler: async ({ db }, { devToken }) => {
    const expected = getDevToken()
    if (!expected || devToken !== expected) throw new Error('Forbidden: invalid dev token')
    const now = Date.now()
    const binds: Array<{ pointKey: string; questId: string; order?: number; phaseFrom?: number; phaseTo?: number; startKey?: string; dialogKey?: string; npcId?: string }> = [
      // Пролог: запуск доставки на ЖД-станции
      { pointKey: 'settlement_center', questId: 'delivery_and_dilemma', order: 1, phaseFrom: 1, startKey: 'quest:delivery:start', dialogKey: 'quest_start_dialog', npcId: 'hans' },
      // Этапы квеста доставки
      { pointKey: 'trader_camp', questId: 'delivery_and_dilemma', order: 2, phaseFrom: 1, dialogKey: 'trader_meeting_dialog', npcId: 'trader' },
      { pointKey: 'workshop_center', questId: 'delivery_and_dilemma', order: 3, phaseFrom: 1, dialogKey: 'craftsman_meeting_dialog', npcId: 'craftsman' },
      { pointKey: 'northern_anomaly', questId: 'delivery_and_dilemma', order: 4, phaseFrom: 1, dialogKey: 'anomaly_exploration_dialog' },
      // Прочие стартовые точки фазы 1
      { pointKey: 'synthesis_medbay', questId: 'field_medicine', order: 1, phaseFrom: 1 },
      { pointKey: 'quiet_cove_bar', questId: 'quiet_cove_whisper', order: 1, phaseFrom: 1, npcId: 'quiet_cove_bartender' },
      { pointKey: 'old_believers_square', questId: 'bell_for_lost', order: 1, phaseFrom: 1, npcId: 'cathedral_priest' },
      { pointKey: 'fjr_board', questId: 'combat_baptism', order: 1, phaseFrom: 1, startKey: 'board:fjr:open' },
      // Фаза 2
      { pointKey: 'rathaus', questId: 'citizenship_invitation', order: 1, phaseFrom: 1, phaseTo: 2, startKey: 'quest:citizenship:start', dialogKey: 'mayor_briefing_dialog', npcId: 'rathaus_mayor' },
      { pointKey: 'seepark', questId: 'eyes_in_the_dark', order: 1, phaseFrom: 2, npcId: 'seepark_scientist' },
      { pointKey: 'wasserschlossle', questId: 'void_shards', order: 1, phaseFrom: 2, npcId: 'wasserschlossle_curator' },
    ]
    for (const b of binds) {
      const existing = await db
        .query('mappoint_bindings')
        .withIndex('by_point', (q) => q.eq('pointKey', b.pointKey))
        .collect()
      const dup = existing.find((e: any) => e.questId === b.questId)
      if (dup) {
        await db.patch(dup._id, { ...b, updatedAt: now })
      } else {
        await db.insert('mappoint_bindings', { ...b, updatedAt: now })
      }
    }
    return { ok: true, count: binds.length }
  },
})

export const seedQrCodesDev = mutation({
  args: { devToken: v.string() },
  handler: async ({ db }, { devToken }) => {
    const expected = getDevToken()
    if (!expected || devToken !== expected) throw new Error('Forbidden: invalid dev token')
    const now = Date.now()
    const points = await db.query('map_points').collect()
    let count = 0
    for (const p of points) {
      const code = `QR::${p.key}`
      const existing = await db.query('qr_codes').withIndex('by_code', (q) => q.eq('code', code)).unique()
      if (existing) {
        await db.patch(existing._id, { pointKey: p.key, createdAt: now })
      } else {
        await db.insert('qr_codes', { code, pointKey: p.key, createdAt: now })
      }
      count++
    }
    return { ok: true, count }
  },
})

// Сиды точек карты (map_points)
export const seedMapPointsDev = mutation({
  args: { devToken: v.string() },
  handler: async ({ db }, { devToken }) => {
    const expected = getDevToken()
    if (!expected || devToken !== expected) throw new Error('Forbidden: invalid dev token')
    const now = Date.now()
    const points: Array<{
      key: string
      title: string
      description?: string
      coordinates: { lat: number; lng: number }
      type?: string
      dialogKey?: string
      questId?: string
      active: boolean
      radius?: number
      icon?: string
    }> = [
      {
        key: 'northern_anomaly',
        title: 'Аномальная зона',
        description: 'Искажения воздуха, странные звуки и синее свечение.',
        coordinates: { lat: 48.0205, lng: 7.87 },
        type: 'anomaly',
        dialogKey: 'anomaly_exploration_dialog',
        questId: 'delivery_and_dilemma',
        active: true,
        radius: 0,
        icon: '',
      },
      {
        key: 'workshop_center',
        title: 'Мастерская Дитера',
        description: 'Центральная мастерская. Запах машинного масла.',
        coordinates: { lat: 48.0015, lng: 7.855 },
        type: 'npc',
        dialogKey: 'craftsman_meeting_dialog',
        questId: 'delivery_and_dilemma',
        active: true,
        radius: 0,
        icon: '/images/npcs/craftsman.jpg',
      },
      {
        key: 'trader_camp',
        title: 'Лагерь торговца',
        description: 'Временный лагерь с товаром и ящиками.',
        coordinates: { lat: 47.985, lng: 7.805 },
        type: 'npc',
        dialogKey: 'trader_meeting_dialog',
        questId: 'delivery_and_dilemma',
        active: true,
        radius: 0,
        icon: '/images/npcs/trader.jpg',
      },
      {
        key: 'anarchist_hole',
        title: '«Дыра» (Анархисты)',
        description: 'Свободная зона под управлением анархистов.',
        coordinates: { lat: 47.99385334623585, lng: 7.852047469737187 },
        type: 'settlement',
        dialogKey: 'infiltration_squat_dialog',
        questId: 'loyalty_fjr',
        active: true,
        radius: 0,
        icon: '',
      },
      {
        key: 'fjr_board',
        title: 'Доска FJR',
        description: 'Официальные объявления и набор добровольцев.',
        coordinates: { lat: 47.9969, lng: 7.8513 },
        type: 'board',
        dialogKey: 'fjr_bulletin_board_dialog',
        questId: 'combat_baptism',
        active: true,
        radius: 0,
        icon: '/images/backgrounds/trader_camp.png',
      },
      {
        key: 'fjr_office_start',
        title: 'Пункт FJR',
        description: 'Капрал Ганс может выдать особое поручение.',
        coordinates: { lat: 47.99679276901679, lng: 7.8509922034320425 },
        type: 'npc',
        dialogKey: 'loyalty_quest_start',
        questId: 'loyalty_fjr',
        active: true,
        radius: 0,
        icon: '',
      },
      {
        key: 'city_gate_travers',
        title: 'Городские ворота (Траверс)',
        description: 'Контрольно-пропускной пункт, лавка Траверса.',
        coordinates: { lat: 47.99286477134066, lng: 7.854099265544107 },
        type: 'npc',
        active: true,
        radius: 0,
        icon: '',
      },
      {
        key: 'gunter_brewery',
        title: 'Пивоварня «Гюнтер»',
        description: 'Один из глав фермеров, отвечает за городскую воду.',
        coordinates: { lat: 47.9903824558821, lng: 7.857654372334707 },
        type: 'npc',
        active: true,
        radius: 0,
        icon: '',
      },
      {
        key: 'old_believers_square',
        title: 'Центральная площадь (Отец Иоанн)',
        description: 'Пожилой настоятель Катедраля — Отец Иоанн просит о помощи.',
        coordinates: { lat: 47.99554815122133, lng: 7.851961457760126 },
        type: 'npc',
        active: true,
        radius: 0,
        icon: '',
      },
      {
        key: 'anarchist_arena_basement',
        title: 'Подвал Арены',
        description: 'Место, где скрывается Заклёпка и его люди.',
        coordinates: { lat: 47.9936, lng: 7.8526 },
        type: 'npc',
        active: true,
        radius: 0,
        icon: '',
      },
      {
        key: 'anarchist_bar',
        title: 'Бар Одина',
        description: 'Захудалый бар в квартале анархистов.',
        coordinates: { lat: 47.99385334623585, lng: 7.852047469737187 },
        type: 'npc',
        active: true,
        radius: 0,
        icon: '',
      },
      {
        key: 'carl_private_workshop',
        title: 'Мастерская Карла',
        description: 'Личная мастерская Карла "Шестерёнки".',
        coordinates: { lat: 47.994097368864146, lng: 7.850222931413185 },
        type: 'npc',
        active: true,
        radius: 0,
        icon: '',
      },
      {
        key: 'settlement_center',
        title: 'ЖД станция',
        description: 'Сердце выжившего города. Здесь можно встретить нужных людей.',
        coordinates: { lat: 47.9962, lng: 7.8425 },
        type: 'settlement',
        dialogKey: 'quest_start_dialog',
        questId: 'delivery_and_dilemma',
        active: true,
        radius: 0,
        icon: '',
      },
    ]
    let count = 0
    for (const p of points) {
      const existing = await db.query('map_points').withIndex('by_key', (q) => q.eq('key', p.key)).unique()
      if (existing) {
        await db.patch(existing._id, { ...p, updatedAt: now })
      } else {
        await db.insert('map_points', { ...p, updatedAt: now })
      }
      count++
    }
    return { ok: true, count }
  },
})

// Перенос сидов реестра квестов из quests.ts
export const seedQuestRegistryDev = mutation({
  args: { devToken: v.string() },
  handler: async ({ db }, { devToken }) => {
    const expected = getDevToken()
    if (!expected || devToken !== expected) throw new Error('Forbidden: invalid dev token')
    const metas: Array<{
      questId: string
      type: 'story' | 'faction' | 'personal' | 'procedural'
      giverNpcId?: string
      boardKey?: string
      repeatable?: boolean
      priority: number
      phaseGate?: number
      requirements?: {
        fameMin?: number
        phaseMin?: number
        phaseMax?: number
        requiredFlags?: string[]
        forbiddenFlags?: string[]
        reputations?: Record<string, number>
        relationships?: Record<string, number>
      }
    }> = [
      { questId: 'delivery_and_dilemma',
         type: 'story', giverNpcId: 'hans', 
         priority: 100, phaseGate: 1, requirements: { phaseMin: 1 } },
      { questId: 'field_medicine', 
        type: 'faction', giverNpcId: 'synthesis_medbay_npc',
         priority: 60, phaseGate: 1, requirements: { phaseMin: 1 } },     
      { questId: 'combat_baptism',
         type: 'faction', boardKey: 'fjr_board',
          priority: 50, phaseGate: 1, requirements: { phaseMin: 1 } },
      { questId: 'quiet_cove_whisper',
         type: 'faction', giverNpcId: 'quiet_cove_bartender',
          priority: 40, phaseGate: 1, requirements: { phaseMin: 1 } },
      { questId: 'bell_for_lost',
         type: 'faction', giverNpcId: 'cathedral_priest',
          priority: 30, phaseGate: 1, requirements: { phaseMin: 1 } },
      { questId: 'citizenship_invitation', 
        type: 'story', giverNpcId: 'rathaus_mayor',
         priority: 100, phaseGate: 2, requirements: { fameMin: 50, phaseMin: 1 } },
      { questId: 'eyes_in_the_dark',
         type: 'story', giverNpcId: 'seepark_scientist',
          priority: 80, phaseGate: 2, requirements: { phaseMin: 2 } },
      { questId: 'void_shards',
         type: 'story', giverNpcId: 'wasserschlossle_curator',
          priority: 70, phaseGate: 2, requirements: { phaseMin: 2 } },
      { questId: 'water_crisis',
         type: 'story', giverNpcId: 'gunter',
          priority: 90, phaseGate: 2, requirements: { phaseMin: 2 } },
      { questId: 'loyalty_fjr',
         type: 'faction', giverNpcId: 'hans',
          priority: 65, phaseGate: 2, requirements: { phaseMin: 2 } },
      { questId: 'freedom_spark',
         type: 'faction', giverNpcId: 'odin',
          priority: 65, phaseGate: 2, requirements: { phaseMin: 2 } },
    ]
    const now = Date.now()
    for (const meta of metas) {
      const existing = await db.query('quest_registry').withIndex('by_quest', (q) => q.eq('questId', meta.questId)).unique()
      if (existing) await db.patch(existing._id, { ...meta, updatedAt: now })
      else await db.insert('quest_registry', { ...meta, updatedAt: now })
    }
  },
})

// Явная инициализация/обновление world_state (глобальная фаза)
export const seedWorldPhaseDev = mutation({
  args: { devToken: v.string(), phase: v.optional(v.number()) },
  handler: async ({ db }, { devToken, phase }) => {
    const expected = getDevToken()
    if (!expected || devToken !== expected) throw new Error('Forbidden: invalid dev token')
    const now = Date.now()
    const existing = await db.query('world_state').withIndex('by_key', (q) => q.eq('key', 'global')).unique()
    const next = typeof phase === 'number' ? phase : (existing?.phase ?? 0)
    if (existing) {
      await db.patch(existing._id, { phase: next, updatedAt: now })
      return { ok: true, phase: next }
    }
    await db.insert('world_state', { key: 'global', phase: next, flags: [], updatedAt: now })
    return { ok: true, phase: next }
  },
})


