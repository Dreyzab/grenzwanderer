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


