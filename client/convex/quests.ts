import { query, mutation } from './_generated/server'
import { v, ConvexError } from 'convex/values'

// Вспомогательные функции
async function getIdentitySubject(ctx: any): Promise<string | null> {
  try {
    const id = await ctx.auth.getUserIdentity()
    return id?.subject ?? null
  } catch {
    return null
  }
}

async function getOrCreatePlayerState(ctx: any, args: { deviceId: string; defaultPhase?: number }) {
  const now = Date.now()
  const subject = await getIdentitySubject(ctx)
  if (subject) {
    const byUser = await ctx.db.query('player_state').withIndex('by_user', (q: any) => q.eq('userId', subject)).unique()
    if (byUser) return byUser
    const created = await ctx.db.insert('player_state', {
      userId: subject,
      deviceId: args.deviceId,
      phase: typeof args.defaultPhase === 'number' ? args.defaultPhase : 0,
      status: 'refugee',
      inventory: ['item_canned_food'],
      hasPda: false,
      fame: 0,
      updatedAt: now,
    })
    return await ctx.db.get(created)
  }
  // guest by device
  const byDev = await ctx.db.query('player_state').withIndex('by_device', (q: any) => q.eq('deviceId', args.deviceId)).unique()
  if (byDev) return byDev
  const created = await ctx.db.insert('player_state', {
    userId: undefined,
    deviceId: args.deviceId,
    phase: typeof args.defaultPhase === 'number' ? args.defaultPhase : 0,
    status: 'refugee',
    inventory: ['item_canned_food'],
    hasPda: false,
    fame: 0,
    updatedAt: now,
  })
  return await ctx.db.get(created)
}

async function getCompletedQuestIds(ctx: any, source: { userId?: string | null; deviceId: string }): Promise<Set<string>> {
  const result = new Set<string>()
  if (source.userId) {
    const userRows = await ctx.db.query('quest_progress').withIndex('by_user', (q: any) => q.eq('userId', source.userId)).collect()
    for (const r of userRows) if (typeof r.completedAt === 'number') result.add(r.questId)
  }
  const devRows = await ctx.db.query('quest_progress').withIndex('by_device', (q: any) => q.eq('deviceId', source.deviceId)).collect()
  for (const r of devRows) if (typeof r.completedAt === 'number') result.add(r.questId)
  return result
}

function requirementsSatisfied(req: any | undefined, player: any): boolean {
  if (!req) return true
  if (typeof req.phaseMin === 'number' && (player?.phase ?? 0) < req.phaseMin) return false
  if (typeof req.phaseMax === 'number' && (player?.phase ?? 0) > req.phaseMax) return false
  if (typeof req.fameMin === 'number' && (player?.fame ?? 0) < req.fameMin) return false
  if (Array.isArray(req.requiredFlags)) {
    const flags = new Set(player?.flags ?? [])
    for (const f of req.requiredFlags) if (!flags.has(f)) return false
  }
  if (Array.isArray(req.forbiddenFlags)) {
    const flags = new Set(player?.flags ?? [])
    for (const f of req.forbiddenFlags) if (flags.has(f)) return false
  }
  if (req.reputations) {
    const rep = player?.reputations ?? {}
    for (const k of Object.keys(req.reputations)) {
      if ((rep?.[k] ?? 0) < (req.reputations[k] ?? 0)) return false
    }
  }
  if (req.relationships) {
    const rel = player?.relationships ?? {}
    for (const k of Object.keys(req.relationships)) {
      if ((rel?.[k] ?? 0) < (req.relationships[k] ?? 0)) return false
    }
  }
  return true
}

async function dependenciesSatisfied(ctx: any, questId: string, completed: Set<string>): Promise<boolean> {
  const deps = await ctx.db.query('quest_dependencies').withIndex('by_quest', (q: any) => q.eq('questId', questId)).collect()
  for (const d of deps) {
    if (!completed.has(d.requiresQuestId)) return false
  }
  return true
}

export const bootstrapNewPlayer = mutation({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    await getOrCreatePlayerState(ctx, { deviceId })
    return { ok: true }
  },
})

export const getProgress = query({
  args: { deviceId: v.string(), userId: v.optional(v.string()) },
  handler: async (ctx, { deviceId, userId }) => {
    const list: any[] = []
    if (userId) {
      const rows = await ctx.db.query('quest_progress').withIndex('by_user', (q: any) => q.eq('userId', userId)).collect()
      list.push(...rows)
    }
    const devRows = await ctx.db.query('quest_progress').withIndex('by_device', (q: any) => q.eq('deviceId', deviceId)).collect()
    // Если есть userId — фильтруем дубликаты по questId, отдаём user приоритет
    const seen = new Set((list as any[]).map((r) => r.questId))
    for (const r of devRows) if (!seen.has(r.questId)) list.push(r)
    return list
  },
})

export const getPlayerState = query({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    const subject = await getIdentitySubject(ctx)
    if (subject) {
      const byUser = await ctx.db.query('player_state').withIndex('by_user', (q: any) => q.eq('userId', subject)).unique()
      if (byUser) return byUser
    }
    return await ctx.db.query('player_state').withIndex('by_device', (q: any) => q.eq('deviceId', deviceId)).unique()
  },
})

export const setPlayerPhase = mutation({
  args: { deviceId: v.string(), phase: v.number() },
  handler: async (ctx, { deviceId, phase }) => {
    const now = Date.now()
    const subject = await getIdentitySubject(ctx)
    if (subject) {
      const byUser = await ctx.db.query('player_state').withIndex('by_user', (q: any) => q.eq('userId', subject)).unique()
      if (byUser) {
        await ctx.db.patch(byUser._id, { phase, updatedAt: now })
        return { ok: true, phase }
      }
      await ctx.db.insert('player_state', { userId: subject, deviceId, phase, status: 'refugee', inventory: [], updatedAt: now })
      return { ok: true, phase }
    }
    const byDev = await ctx.db.query('player_state').withIndex('by_device', (q: any) => q.eq('deviceId', deviceId)).unique()
    if (byDev) {
      await ctx.db.patch(byDev._id, { phase, updatedAt: now })
      return { ok: true, phase }
    }
    await ctx.db.insert('player_state', { userId: undefined, deviceId, phase, status: 'refugee', inventory: [], updatedAt: now })
    return { ok: true, phase }
  },
})

async function setPlayerPhaseImpl(ctx: any, deviceId: string, phase: number) {
  const now = Date.now()
  const subject = await getIdentitySubject(ctx)
  if (subject) {
    const byUser = await ctx.db.query('player_state').withIndex('by_user', (q: any) => q.eq('userId', subject)).unique()
    if (byUser) {
      await ctx.db.patch(byUser._id, { phase, updatedAt: now })
      return { ok: true, phase }
    }
    await ctx.db.insert('player_state', { userId: subject, deviceId, phase, status: 'refugee', inventory: [], updatedAt: now })
    return { ok: true, phase }
  }
  const byDev = await ctx.db.query('player_state').withIndex('by_device', (q: any) => q.eq('deviceId', deviceId)).unique()
  if (byDev) {
    await ctx.db.patch(byDev._id, { phase, updatedAt: now })
    return { ok: true, phase }
  }
  await ctx.db.insert('player_state', { userId: undefined, deviceId, phase, status: 'refugee', inventory: [], updatedAt: now })
  return { ok: true, phase }
}

export const getWorldState = query({
  args: {},
  handler: async (ctx) => {
    const row = await ctx.db.query('world_state').withIndex('by_key', (q: any) => q.eq('key', 'global')).unique()
    return row ?? { key: 'global', phase: 0, flags: [], updatedAt: 0 }
  },
})

export const setWorldPhase = mutation({
  args: { phase: v.number() },
  handler: async (ctx, { phase }) => {
    const now = Date.now()
    const row = await ctx.db.query('world_state').withIndex('by_key', (q: any) => q.eq('key', 'global')).unique()
    if (row) {
      await ctx.db.patch(row._id, { phase, updatedAt: now })
      return { ok: true, phase }
    }
    await ctx.db.insert('world_state', { key: 'global', phase, flags: [], updatedAt: now })
    return { ok: true, phase }
  },
})

export const startQuest = mutation({
  args: { deviceId: v.string(), questId: v.string(), step: v.string() },
  handler: async (ctx, { deviceId, questId, step }) => {
    const now = Date.now()
    const subject = await getIdentitySubject(ctx)
    const existing = subject
      ? await ctx.db.query('quest_progress').withIndex('by_user_quest', (q: any) => q.eq('userId', subject).eq('questId', questId)).unique()
      : await ctx.db.query('quest_progress').withIndex('by_device_quest', (q: any) => q.eq('deviceId', deviceId).eq('questId', questId)).unique()
    if (existing) {
      // Не трогаем startedAt, только обновим текущий шаг, если это инициализация
      if (!existing.currentStep || existing.currentStep === 'not_started') {
        await ctx.db.patch(existing._id, { currentStep: step, updatedAt: now })
      }
      return { ok: true }
    }
    await ctx.db.insert('quest_progress', {
      userId: subject ?? undefined,
      deviceId,
      questId,
      currentStep: step,
      startedAt: now,
      updatedAt: now,
      completedAt: undefined,
    })
    return { ok: true }
  },
})

export const advanceQuest = mutation({
  args: { deviceId: v.string(), questId: v.string(), step: v.string() },
  handler: async (ctx, { deviceId, questId, step }) => {
    const now = Date.now()
    const subject = await getIdentitySubject(ctx)
    const existing = subject
      ? await ctx.db.query('quest_progress').withIndex('by_user_quest', (q: any) => q.eq('userId', subject).eq('questId', questId)).unique()
      : await ctx.db.query('quest_progress').withIndex('by_device_quest', (q: any) => q.eq('deviceId', deviceId).eq('questId', questId)).unique()
    if (!existing) throw new ConvexError({ message: 'Quest not started' })
    await ctx.db.patch(existing._id, { currentStep: step, updatedAt: now })
    return { ok: true }
  },
})

export const completeQuest = mutation({
  args: { deviceId: v.string(), questId: v.string() },
  handler: async (ctx, { deviceId, questId }) => {
    const now = Date.now()
    const subject = await getIdentitySubject(ctx)
    const existing = subject
      ? await ctx.db.query('quest_progress').withIndex('by_user_quest', (q: any) => q.eq('userId', subject).eq('questId', questId)).unique()
      : await ctx.db.query('quest_progress').withIndex('by_device_quest', (q: any) => q.eq('deviceId', deviceId).eq('questId', questId)).unique()
    if (!existing) throw new ConvexError({ message: 'Quest not started' })
    await ctx.db.patch(existing._id, { currentStep: 'completed', completedAt: now, updatedAt: now })
    return { ok: true }
  },
})

export const migrateDeviceProgressToUser = mutation({
  args: { deviceId: v.string(), userId: v.string() },
  handler: async (ctx, { deviceId, userId }) => {
    await (async function migrateDeviceProgressToUserImpl() {
      const now = Date.now()
      const rows = await ctx.db.query('quest_progress').withIndex('by_device', (q: any) => q.eq('deviceId', deviceId)).collect()
      for (const r of rows) {
        const dupe = await ctx.db
          .query('quest_progress')
          .withIndex('by_user_quest', (q: any) => q.eq('userId', userId).eq('questId', r.questId))
          .unique()
        if (dupe) {
          const winner = (dupe.completedAt ?? 0) >= (r.completedAt ?? 0) && (dupe.updatedAt ?? 0) >= (r.updatedAt ?? 0) ? dupe : r
          await ctx.db.patch(dupe._id, {
            currentStep: winner.currentStep,
            completedAt: winner.completedAt,
            updatedAt: now,
          })
          await ctx.db.delete(r._id)
        } else {
          await ctx.db.patch(r._id, { userId, updatedAt: now })
        }
      }
      const pDev = await ctx.db.query('player_state').withIndex('by_device', (q: any) => q.eq('deviceId', deviceId)).unique()
      if (pDev) {
        const pUser = await ctx.db.query('player_state').withIndex('by_user', (q: any) => q.eq('userId', userId)).unique()
        if (pUser) {
          await ctx.db.patch(pUser._id, {
            phase: Math.max(pUser.phase ?? 0, pDev.phase ?? 0),
            fame: Math.max(pUser.fame ?? 0, pDev.fame ?? 0),
            flags: Array.from(new Set([...(pUser.flags ?? []), ...(pDev.flags ?? [])])),
            inventory: Array.from(new Set([...(pUser.inventory ?? []), ...(pDev.inventory ?? [])])),
            updatedAt: now,
          })
        } else {
          await ctx.db.insert('player_state', {
            userId,
            deviceId,
            phase: pDev.phase ?? 0,
            status: pDev.status ?? 'refugee',
            inventory: pDev.inventory ?? [],
            hasPda: pDev.hasPda ?? false,
            fame: pDev.fame ?? 0,
            flags: pDev.flags ?? [],
            reputations: pDev.reputations ?? {},
            relationships: pDev.relationships ?? {},
            updatedAt: now,
          })
        }
      }
    })()
    return { ok: true }
  },
})

export const finalizeRegistration = mutation({
  args: { deviceId: v.string(), nickname: v.string(), avatarKey: v.optional(v.string()) },
  handler: async (ctx, { deviceId, nickname }) => {
    const now = Date.now()
    const subject = await getIdentitySubject(ctx)
    if (!subject) throw new ConvexError({ message: 'Not authenticated' })

    // Миграция device → user (локальный вызов реализационной функции)
    await (async () => {
      const userId = subject
      const now2 = Date.now()
      const rows = await ctx.db.query('quest_progress').withIndex('by_device', (q: any) => q.eq('deviceId', deviceId)).collect()
      for (const r of rows) {
        const dupe = await ctx.db
          .query('quest_progress')
          .withIndex('by_user_quest', (q: any) => q.eq('userId', userId).eq('questId', r.questId))
          .unique()
        if (dupe) {
          const winner = (dupe.completedAt ?? 0) >= (r.completedAt ?? 0) && (dupe.updatedAt ?? 0) >= (r.updatedAt ?? 0) ? dupe : r
          await ctx.db.patch(dupe._id, { currentStep: winner.currentStep, completedAt: winner.completedAt, updatedAt: now2 })
          await ctx.db.delete(r._id)
        } else {
          await ctx.db.patch(r._id, { userId, updatedAt: now2 })
        }
      }
      const pDev = await ctx.db.query('player_state').withIndex('by_device', (q: any) => q.eq('deviceId', deviceId)).unique()
      if (pDev) {
        const pUser = await ctx.db.query('player_state').withIndex('by_user', (q: any) => q.eq('userId', userId)).unique()
        if (pUser) {
          await ctx.db.patch(pUser._id, {
            phase: Math.max(pUser.phase ?? 0, pDev.phase ?? 0),
            fame: Math.max(pUser.fame ?? 0, pDev.fame ?? 0),
            flags: Array.from(new Set([...(pUser.flags ?? []), ...(pDev.flags ?? [])])),
            inventory: Array.from(new Set([...(pUser.inventory ?? []), ...(pDev.inventory ?? [])])),
            updatedAt: now2,
          })
        } else {
          await ctx.db.insert('player_state', {
            userId,
            deviceId,
            phase: pDev.phase ?? 0,
            status: pDev.status ?? 'refugee',
            inventory: pDev.inventory ?? [],
            hasPda: pDev.hasPda ?? false,
            fame: pDev.fame ?? 0,
            flags: pDev.flags ?? [],
            reputations: pDev.reputations ?? {},
            relationships: pDev.relationships ?? {},
            updatedAt: now2,
          })
        }
      }
    })()

    // Создадим/обновим профиль пользователя
    const u = await ctx.db.query('users').withIndex('by_externalId', (q: any) => q.eq('externalId', subject)).unique()
    if (u) await ctx.db.patch(u._id, { name: nickname, updatedAt: now })
    else await ctx.db.insert('users', { externalId: subject, name: nickname, createdAt: now, updatedAt: now })

    // Установим фазу 1 и статус после регистрации
    const p = await ctx.db.query('player_state').withIndex('by_user', (q: any) => q.eq('userId', subject)).unique()
    if (p) await ctx.db.patch(p._id, { phase: 1, status: 'refugee', hasPda: true, updatedAt: now })
    else await ctx.db.insert('player_state', { userId: subject, deviceId, phase: 1, status: 'refugee', hasPda: true, inventory: [], updatedAt: now })

    // Глобальная фаза мира → 1
    const w = await ctx.db.query('world_state').withIndex('by_key', (q: any) => q.eq('key', 'global')).unique()
    if (w) await ctx.db.patch(w._id, { phase: 1, updatedAt: now })
    else await ctx.db.insert('world_state', { key: 'global', phase: 1, flags: [], updatedAt: now })

    return { ok: true }
  },
})

export const applyOutcome = mutation({
  args: {
    deviceId: v.string(),
    fameDelta: v.optional(v.number()),
    reputationsDelta: v.optional(v.record(v.string(), v.number())),
    relationshipsDelta: v.optional(v.record(v.string(), v.number())),
    addFlags: v.optional(v.array(v.string())),
    removeFlags: v.optional(v.array(v.string())),
    addWorldFlags: v.optional(v.array(v.string())),
    removeWorldFlags: v.optional(v.array(v.string())),
    setPhase: v.optional(v.number()),
    setStatus: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    const subject = await getIdentitySubject(ctx)
    const target = subject
      ? await ctx.db.query('player_state').withIndex('by_user', (q: any) => q.eq('userId', subject)).unique()
      : await ctx.db.query('player_state').withIndex('by_device', (q: any) => q.eq('deviceId', args.deviceId)).unique()
    if (target) {
      const nextFlags = new Set<string>(target.flags ?? [])
      for (const f of args.addFlags ?? []) nextFlags.add(f)
      for (const f of args.removeFlags ?? []) nextFlags.delete(f)
      const nextRep: Record<string, number> = { ...(target.reputations ?? {}) }
      for (const k of Object.keys(args.reputationsDelta ?? {})) nextRep[k] = (nextRep[k] ?? 0) + (args.reputationsDelta as any)[k]
      const nextRel: Record<string, number> = { ...(target.relationships ?? {}) }
      for (const k of Object.keys(args.relationshipsDelta ?? {})) nextRel[k] = (nextRel[k] ?? 0) + (args.relationshipsDelta as any)[k]
      await ctx.db.patch(target._id, {
        fame: (target.fame ?? 0) + (args.fameDelta ?? 0),
        reputations: nextRep,
        relationships: nextRel,
        flags: Array.from(nextFlags),
        status: args.setStatus ?? target.status,
        phase: typeof args.setPhase === 'number' ? args.setPhase : target.phase,
        updatedAt: now,
      })
    }
    if ((args.addWorldFlags && args.addWorldFlags.length) || (args.removeWorldFlags && args.removeWorldFlags.length)) {
      const w = await ctx.db.query('world_state').withIndex('by_key', (q: any) => q.eq('key', 'global')).unique()
      if (w) {
        const wf = new Set<string>(w.flags ?? [])
        for (const f of args.addWorldFlags ?? []) wf.add(f)
        for (const f of args.removeWorldFlags ?? []) wf.delete(f)
        await ctx.db.patch(w._id, { flags: Array.from(wf), updatedAt: now })
      }
    }
    if (typeof args.setPhase === 'number') {
      await setPlayerPhaseImpl(ctx, args.deviceId, args.setPhase)
    }
    return { ok: true }
  },
})

export const getAvailableQuestsForNpc = query({
  args: { npcId: v.string(), deviceId: v.string() },
  handler: async (ctx, { npcId, deviceId }) => {
    const subject = await getIdentitySubject(ctx)
    const player = await getOrCreatePlayerState(ctx, { deviceId })
    const completed = await getCompletedQuestIds(ctx, { userId: subject, deviceId })
    const now = Date.now()
    const metas = await ctx.db
      .query('quest_registry')
      .withIndex('by_giver', (q: any) => q.eq('giverNpcId', npcId))
      .collect()
    const filtered: any[] = []
    for (const m of metas) {
      if (!requirementsSatisfied(m.requirements, player)) continue
      if (typeof m.phaseGate === 'number' && (player?.phase ?? 0) < m.phaseGate) continue
      if (!(await dependenciesSatisfied(ctx, m.questId, completed))) continue
      filtered.push({ id: m.questId, type: m.type, priority: m.priority, updatedAt: now })
    }
    filtered.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
    return filtered
  },
})

export const getAvailableBoardQuests = query({
  args: { boardKey: v.string(), deviceId: v.string() },
  handler: async (ctx, { boardKey, deviceId }) => {
    const subject = await getIdentitySubject(ctx)
    const player = await getOrCreatePlayerState(ctx, { deviceId })
    const completed = await getCompletedQuestIds(ctx, { userId: subject, deviceId })
    const metas = await ctx.db.query('quest_registry').withIndex('by_board', (q: any) => q.eq('boardKey', boardKey)).collect()
    const filtered: any[] = []
    for (const m of metas) {
      if (!requirementsSatisfied(m.requirements, player)) continue
      if (typeof m.phaseGate === 'number' && (player?.phase ?? 0) < m.phaseGate) continue
      if (!(await dependenciesSatisfied(ctx, m.questId, completed))) continue
      filtered.push({ id: m.questId, type: m.type, priority: m.priority })
    }
    filtered.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
    return filtered
  },
})

export const getAvailableQuests = query({
  args: { sourceType: v.union(v.literal('npc'), v.literal('board')), sourceKey: v.string(), deviceId: v.string() },
  handler: async (ctx, { sourceType, sourceKey, deviceId }) => {
    if (sourceType === 'npc') {
      const subject = await getIdentitySubject(ctx)
      const player = await getOrCreatePlayerState(ctx, { deviceId })
      const completed = await getCompletedQuestIds(ctx, { userId: subject, deviceId })
      const now = Date.now()
      const metas = await ctx.db
        .query('quest_registry')
        .withIndex('by_giver', (q: any) => q.eq('giverNpcId', sourceKey))
        .collect()
      const filtered: any[] = []
      for (const m of metas) {
        if (!requirementsSatisfied(m.requirements, player)) continue
        if (typeof m.phaseGate === 'number' && (player?.phase ?? 0) < m.phaseGate) continue
        if (!(await dependenciesSatisfied(ctx, m.questId, completed))) continue
        filtered.push({ id: m.questId, type: m.type, priority: m.priority, updatedAt: now })
      }
      filtered.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
      return filtered
    }
    const subject = await getIdentitySubject(ctx)
    const player = await getOrCreatePlayerState(ctx, { deviceId })
    const completed = await getCompletedQuestIds(ctx, { userId: subject, deviceId })
    const metas = await ctx.db.query('quest_registry').withIndex('by_board', (q: any) => q.eq('boardKey', sourceKey)).collect()
    const filtered: any[] = []
    for (const m of metas) {
      if (!requirementsSatisfied(m.requirements, player)) continue
      if (typeof m.phaseGate === 'number' && (player?.phase ?? 0) < m.phaseGate) continue
      if (!(await dependenciesSatisfied(ctx, m.questId, completed))) continue
      filtered.push({ id: m.questId, type: m.type, priority: m.priority })
    }
    filtered.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
    return filtered
  },
})

// Опционально: массовое обновление реестра квестов (dev use)
export const upsertQuestRegistry = mutation({
  args: {
    metas: v.array(
      v.object({
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
      }),
    ),
  },
  handler: async (ctx, { metas }) => {
    const now = Date.now()
    for (const meta of metas) {
      const existing = await ctx.db.query('quest_registry').withIndex('by_quest', (q: any) => q.eq('questId', meta.questId)).unique()
      if (existing) await ctx.db.patch(existing._id, { ...meta, updatedAt: now })
      else await ctx.db.insert('quest_registry', { ...meta, updatedAt: now })
    }
    return { ok: true, count: metas.length }
  },
})


