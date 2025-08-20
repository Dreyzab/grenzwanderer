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
      { pointKey: 'settlement_center', questId: 'delivery_and_dilemma', order: 1, phaseFrom: 1, startKey: 'quest:delivery:start', dialogKey: 'quest_start_dialog', npcId: 'hans' },
      { pointKey: 'synthesis_medbay', questId: 'field_medicine', order: 1, phaseFrom: 1 },
      { pointKey: 'quiet_cove_bar', questId: 'quiet_cove_whisper', order: 1, phaseFrom: 1, npcId: 'quiet_cove_bartender' },
      { pointKey: 'old_believers_square', questId: 'bell_for_lost', order: 1, phaseFrom: 1, npcId: 'cathedral_priest' },
      { pointKey: 'fjr_board', questId: 'combat_baptism', order: 1, phaseFrom: 1, startKey: 'board:fjr:open' },
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
      { questId: 'delivery_and_dilemma', type: 'story', giverNpcId: 'hans', priority: 100, phaseGate: 1, requirements: { phaseMin: 1 } },
      { questId: 'field_medicine', type: 'faction', giverNpcId: 'synthesis_medbay_npc', priority: 60, phaseGate: 1, requirements: { phaseMin: 1 } },
      { questId: 'combat_baptism', type: 'faction', boardKey: 'fjr_board', priority: 50, phaseGate: 1, requirements: { phaseMin: 1 } },
      { questId: 'quiet_cove_whisper', type: 'faction', giverNpcId: 'quiet_cove_bartender', priority: 40, phaseGate: 1, requirements: { phaseMin: 1 } },
      { questId: 'bell_for_lost', type: 'faction', giverNpcId: 'cathedral_priest', priority: 30, phaseGate: 1, requirements: { phaseMin: 1 } },
      { questId: 'citizenship_invitation', type: 'story', giverNpcId: 'rathaus_mayor', priority: 100, phaseGate: 2, requirements: { fameMin: 50, phaseMin: 1 } },
      { questId: 'eyes_in_the_dark', type: 'story', giverNpcId: 'seepark_scientist', priority: 80, phaseGate: 2, requirements: { phaseMin: 2 } },
      { questId: 'void_shards', type: 'story', giverNpcId: 'wasserschlossle_curator', priority: 70, phaseGate: 2, requirements: { phaseMin: 2 } },
      { questId: 'water_crisis', type: 'story', giverNpcId: 'gunter', priority: 90, phaseGate: 2, requirements: { phaseMin: 2 } },
      { questId: 'loyalty_fjr', type: 'faction', giverNpcId: 'hans', priority: 65, phaseGate: 2, requirements: { phaseMin: 2 } },
      { questId: 'freedom_spark', type: 'faction', giverNpcId: 'odin', priority: 65, phaseGate: 2, requirements: { phaseMin: 2 } },
    ]
    const now = Date.now()
    for (const meta of metas) {
      const existing = await db.query('quest_registry').withIndex('by_quest', (q) => q.eq('questId', meta.questId)).unique()
      if (existing) await db.patch(existing._id, { ...meta, updatedAt: now })
      else await db.insert('quest_registry', { ...meta, updatedAt: now })
    }
    // Ensure global world_state exists
    const world = await db.query('world_state').withIndex('by_key', (q) => q.eq('key', 'global')).unique()
    if (!world) await db.insert('world_state', { key: 'global', phase: 1, flags: [], updatedAt: now })
    return { ok: true, count: metas.length }
  },
})


