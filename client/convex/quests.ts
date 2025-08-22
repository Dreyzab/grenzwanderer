import { query, mutation } from './_generated/server'
import { v, ConvexError } from 'convex/values'
import { requirementsSatisfied } from './helpers/quest'
import { ensurePlayerState } from './helpers/player'
import { migrateDeviceProgressToUserImpl } from './helpers/migration'
import { PLAYER_STATUS, WORLD_KEYS, QUEST_SOURCE } from './constants'

// Вспомогательные функции
async function getIdentitySubject(ctx: any): Promise<string | null> {
  try {
    const id = await ctx.auth.getUserIdentity()
    return id?.subject ?? null
  } catch {
    return null
  }
}

// getOrCreatePlayerState заменён на ensurePlayerState

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

// Утилиты для борьбы с дубликатами player_state
async function dedupePlayerStateByUser(ctx: any, userId: string) {
  const rows = await ctx.db.query('player_state').withIndex('by_user', (q: any) => q.eq('userId', userId)).collect()
  if (rows.length <= 1) return rows[0] ?? null
  rows.sort((a: any, b: any) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
  const keep = rows[0]
  for (let i = 1; i < rows.length; i++) {
    try { await ctx.db.delete(rows[i]._id) } catch (e) {
      // swallow dedupe errors
    }
  }
  return keep
}

async function dedupePlayerStateByDevice(ctx: any, deviceId: string) {
  const rows = await ctx.db.query('player_state').withIndex('by_device', (q: any) => q.eq('deviceId', deviceId)).collect()
  if (rows.length <= 1) return rows[0] ?? null
  rows.sort((a: any, b: any) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
  const keep = rows[0]
  for (let i = 1; i < rows.length; i++) {
    try { await ctx.db.delete(rows[i]._id) } catch (e) {
      // swallow dedupe errors
    }
  }
  return keep
}

// requirementsSatisfied вынесен в helpers/quest

async function dependenciesSatisfied(ctx: any, questId: string, completed: Set<string>): Promise<boolean> {
  const deps = await ctx.db.query('quest_dependencies').withIndex('by_quest', (q: any) => q.eq('questId', questId)).collect()
  for (const d of deps) {
    if (!completed.has(d.requiresQuestId)) return false
  }
  return true
}

// Унифицированный отбор доступных квестов по индексу и ключу источника
async function selectAvailableQuestsByIndex(
  ctx: any,
  args: { index: 'by_giver' | 'by_board'; key: string; deviceId: string },
): Promise<Array<{ id: string; type: string; priority?: number; updatedAt: number }>> {
  const { index, key, deviceId } = args
  const subject = await getIdentitySubject(ctx)
  const player = await ensurePlayerState(ctx, { deviceId })
  const completed = await getCompletedQuestIds(ctx, { userId: subject, deviceId })
  const now = Date.now()

  const metas =
    index === 'by_giver'
      ? await ctx.db.query('quest_registry').withIndex('by_giver', (q: any) => q.eq('giverNpcId', key)).collect()
      : await ctx.db.query('quest_registry').withIndex('by_board', (q: any) => q.eq('boardKey', key)).collect()

  const filtered: Array<{ id: string; type: string; priority?: number; updatedAt: number }> = []
  for (const m of metas) {
    if (!requirementsSatisfied(m.requirements, player)) continue
    if (typeof m.phaseGate === 'number' && (player?.phase ?? 0) < m.phaseGate) continue
    if (!(await dependenciesSatisfied(ctx, m.questId, completed))) continue
    filtered.push({ id: m.questId, type: m.type, priority: m.priority, updatedAt: now })
  }
  filtered.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
  return filtered
}

export const bootstrapNewPlayer = mutation({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    await ensurePlayerState(ctx, { deviceId })
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
      const byUser = await dedupePlayerStateByUser(ctx, subject)
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
      await ctx.db.insert('player_state', { userId: subject, deviceId, phase, status: PLAYER_STATUS.REFUGEE, inventory: [], updatedAt: now })
      return { ok: true, phase }
    }
    const byDev = await dedupePlayerStateByDevice(ctx, deviceId)
    if (byDev) {
      await ctx.db.patch(byDev._id, { phase, updatedAt: now })
      return { ok: true, phase }
    }
    await ctx.db.insert('player_state', { userId: undefined, deviceId, phase, status: PLAYER_STATUS.REFUGEE, inventory: [], updatedAt: now })
    return { ok: true, phase }
  },
})

async function setPlayerPhaseImpl(ctx: any, deviceId: string, phase: number) {
  const now = Date.now()
  const subject = await getIdentitySubject(ctx)
  if (subject) {
    const byUser = await dedupePlayerStateByUser(ctx, subject)
    if (byUser) {
      await ctx.db.patch(byUser._id, { phase, updatedAt: now })
      return { ok: true, phase }
    }
    await ctx.db.insert('player_state', { userId: subject, deviceId, phase, status: PLAYER_STATUS.REFUGEE, inventory: [], updatedAt: now })
    return { ok: true, phase }
  }
  const byDev = await dedupePlayerStateByDevice(ctx, deviceId)
  if (byDev) {
    await ctx.db.patch(byDev._id, { phase, updatedAt: now })
    return { ok: true, phase }
  }
  await ctx.db.insert('player_state', { userId: undefined, deviceId, phase, status: PLAYER_STATUS.REFUGEE, inventory: [], updatedAt: now })
  return { ok: true, phase }
}

export const getWorldState = query({
  args: {},
  handler: async (ctx) => {
    const row = await ctx.db.query('world_state').withIndex('by_key', (q: any) => q.eq('key', WORLD_KEYS.GLOBAL)).unique()
    return row ?? { key: WORLD_KEYS.GLOBAL, phase: 0, flags: [], updatedAt: 0 }
  },
})

export const setWorldPhase = mutation({
  args: { phase: v.number() },
  handler: async (ctx, { phase }) => {
    const now = Date.now()
    const row = await ctx.db.query('world_state').withIndex('by_key', (q: any) => q.eq('key', WORLD_KEYS.GLOBAL)).unique()
    if (row) {
      await ctx.db.patch(row._id, { phase, updatedAt: now })
      return { ok: true, phase }
    }
    await ctx.db.insert('world_state', { key: WORLD_KEYS.GLOBAL, phase, flags: [], updatedAt: now })
    return { ok: true, phase }
  },
})

export const startQuest = mutation({
  args: { deviceId: v.string(), questId: v.string(), step: v.string() },
  handler: async (ctx, { deviceId, questId, step }) => {
    const now = Date.now()
    const subject = await getIdentitySubject(ctx)
    let existing = subject
      ? await ctx.db.query('quest_progress').withIndex('by_user_quest', (q: any) => q.eq('userId', subject).eq('questId', questId)).unique()
      : await ctx.db.query('quest_progress').withIndex('by_device_quest', (q: any) => q.eq('deviceId', deviceId).eq('questId', questId)).unique()
    // Если вошли, но запись только на девайсе — привяжем её к пользователю и продолжим
    if (!existing && subject) {
      const devOnly = await ctx.db.query('quest_progress').withIndex('by_device_quest', (q: any) => q.eq('deviceId', deviceId).eq('questId', questId)).unique()
      if (devOnly) {
        await ctx.db.patch(devOnly._id, { userId: subject, updatedAt: now })
        existing = devOnly
      }
    }
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
    let existing = subject
      ? await ctx.db.query('quest_progress').withIndex('by_user_quest', (q: any) => q.eq('userId', subject).eq('questId', questId)).unique()
      : await ctx.db.query('quest_progress').withIndex('by_device_quest', (q: any) => q.eq('deviceId', deviceId).eq('questId', questId)).unique()
    if (!existing && subject) {
      const devOnly = await ctx.db.query('quest_progress').withIndex('by_device_quest', (q: any) => q.eq('deviceId', deviceId).eq('questId', questId)).unique()
      if (devOnly) {
        await ctx.db.patch(devOnly._id, { userId: subject, updatedAt: now })
        existing = devOnly
      }
    }
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
    let existing = subject
      ? await ctx.db.query('quest_progress').withIndex('by_user_quest', (q: any) => q.eq('userId', subject).eq('questId', questId)).unique()
      : await ctx.db.query('quest_progress').withIndex('by_device_quest', (q: any) => q.eq('deviceId', deviceId).eq('questId', questId)).unique()
    if (!existing && subject) {
      const devOnly = await ctx.db.query('quest_progress').withIndex('by_device_quest', (q: any) => q.eq('deviceId', deviceId).eq('questId', questId)).unique()
      if (devOnly) {
        await ctx.db.patch(devOnly._id, { userId: subject, updatedAt: now })
        existing = devOnly
      }
    }
    if (!existing) throw new ConvexError({ message: 'Quest not started' })
    await ctx.db.patch(existing._id, { currentStep: 'completed', completedAt: now, updatedAt: now })
    return { ok: true }
  },
})

export const migrateDeviceProgressToUser = mutation({
  args: { deviceId: v.string(), userId: v.string() },
  handler: async (ctx, { deviceId, userId }) => {
    await migrateDeviceProgressToUserImpl(ctx as any, deviceId, userId)
    return { ok: true }
  },
})

export const finalizeRegistration = mutation({
  args: { deviceId: v.string(), nickname: v.string(), avatarKey: v.optional(v.string()) },
  handler: async (ctx, { deviceId, nickname, avatarKey }) => {
    const now = Date.now()
    const subject = await getIdentitySubject(ctx)
    if (!subject) throw new ConvexError({ message: 'Not authenticated' })

    // Миграция device → user (единая реализация)
    await migrateDeviceProgressToUserImpl(ctx as any, deviceId, subject)

    // Создадим/обновим профиль пользователя
    const identity = await ctx.auth.getUserIdentity()
    const u = await ctx.db.query('users').withIndex('by_externalId', (q: any) => q.eq('externalId', subject)).unique()
    const email = (identity?.email as string | undefined) ?? undefined
    const imageUrl = (identity?.pictureUrl as string | undefined) ?? undefined
    if (u) {
      // Не перезаписываем имя, если уже было задано ранее (защита от повторного модала)
      const nextName = u.name && u.name.length > 0 ? u.name : nickname
      // Если передан avatarKey — сохраняем его как imageUrl (иконка профиля в игре)
      const nextImage = avatarKey ? avatarKey : (u.imageUrl ?? imageUrl)
      await ctx.db.patch(u._id, { name: nextName, email: u.email ?? email, imageUrl: nextImage, updatedAt: now })
    } else {
      await ctx.db.insert('users', { externalId: subject, name: nickname, email, imageUrl: avatarKey || imageUrl, createdAt: now, updatedAt: now })
    }

    // Установим фазу 1 и статус после регистрации
    const p = await dedupePlayerStateByUser(ctx, subject)
    if (p) await ctx.db.patch(p._id, { phase: 1, status: PLAYER_STATUS.REFUGEE, hasPda: true, updatedAt: now })
    else await ctx.db.insert('player_state', { userId: subject, deviceId, phase: 1, status: PLAYER_STATUS.REFUGEE, hasPda: true, inventory: [], updatedAt: now })

    // Глобальная фаза мира → 1
    const w = await ctx.db.query('world_state').withIndex('by_key', (q: any) => q.eq('key', 'global')).unique()
    if (w) await ctx.db.patch(w._id, { phase: 1, updatedAt: now })
    else await ctx.db.insert('world_state', { key: WORLD_KEYS.GLOBAL, phase: 1, flags: [], updatedAt: now })

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
    await applyOutcomeImpl(ctx, args)
    return { ok: true }
  },
})

// Переиспользуемая реализация applyOutcome для других модулей
export type ApplyOutcomeArgs = {
  deviceId: string
  fameDelta?: number
  reputationsDelta?: Record<string, number>
  relationshipsDelta?: Record<string, number>
  addFlags?: string[]
  removeFlags?: string[]
  addWorldFlags?: string[]
  removeWorldFlags?: string[]
  setPhase?: number
  setStatus?: string
}

export async function applyOutcomeImpl(ctx: any, args: ApplyOutcomeArgs): Promise<void> {
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
}

// Центральная инициализация сессии: ensure → миграция (если нужно) → снимок состояния
export const initializeSession = mutation({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    const now = Date.now()
    const subject = await getIdentitySubject(ctx)

    // Ensure базовое состояние игрока
    await ensurePlayerState(ctx, { deviceId })

    // Если пользователь аутентифицирован — обеспечим профиль и миграцию прогресса
    if (subject) {
      try {
        // Лёгкий upsert users по identity (без имени)
        const identity = await ctx.auth.getUserIdentity()
        const u = await ctx.db.query('users').withIndex('by_externalId', (q: any) => q.eq('externalId', subject)).unique()
        const email = (identity?.email as string | undefined) ?? undefined
        const imageUrl = (identity?.pictureUrl as string | undefined) ?? undefined
        if (u) {
          await ctx.db.patch(u._id, { email: u.email ?? email, imageUrl: u.imageUrl ?? imageUrl, updatedAt: now })
        } else {
          await ctx.db.insert('users', { externalId: subject, name: undefined, email, imageUrl, createdAt: now, updatedAt: now })
        }
      } catch {}

      // Миграция прогресса device → user
      await migrateDeviceProgressToUserImpl(ctx as any, deviceId, subject)
    }

    // Собираем снимок состояния
    const playerState = subject
      ? await dedupePlayerStateByUser(ctx, subject)
      : await dedupePlayerStateByDevice(ctx, deviceId)

    // Прогресс с приоритетом user над device
    const progress: any[] = []
    if (subject) {
      const rows = await ctx.db.query('quest_progress').withIndex('by_user', (q: any) => q.eq('userId', subject)).collect()
      progress.push(...rows)
    }
    const devRows = await ctx.db.query('quest_progress').withIndex('by_device', (q: any) => q.eq('deviceId', deviceId)).collect()
    const seen = new Set((progress as any[]).map((r) => r.questId))
    for (const r of devRows) if (!seen.has(r.questId)) progress.push(r)

    const world = await ctx.db.query('world_state').withIndex('by_key', (q: any) => q.eq('key', WORLD_KEYS.GLOBAL)).unique()

    return {
      ok: true as const,
      playerState,
      progress,
      worldState: world ?? { key: WORLD_KEYS.GLOBAL, phase: 0, flags: [], updatedAt: 0 },
      userId: subject ?? null,
      migrated: Boolean(subject),
    }
  },
})

export const getAvailableQuestsForNpc = query({
  args: { npcId: v.string(), deviceId: v.string() },
  handler: async (ctx, { npcId, deviceId }) => {
    // Устаревший прокси: используйте getAvailableQuests
    return await selectAvailableQuestsByIndex(ctx, { index: 'by_giver', key: npcId, deviceId })
  },
})

export const getAvailableBoardQuests = query({
  args: { boardKey: v.string(), deviceId: v.string() },
  handler: async (ctx, { boardKey, deviceId }) => {
    // Устаревший прокси: используйте getAvailableQuests
    return await selectAvailableQuestsByIndex(ctx, { index: 'by_board', key: boardKey, deviceId })
  },
})

export const getAvailableQuests = query({
  args: { sourceType: v.union(v.literal(QUEST_SOURCE.NPC), v.literal(QUEST_SOURCE.BOARD)), sourceKey: v.string(), deviceId: v.string() },
  handler: async (ctx, { sourceType, sourceKey, deviceId }) => {
    return await selectAvailableQuestsByIndex(ctx, {
      index: sourceType === QUEST_SOURCE.NPC ? 'by_giver' : 'by_board',
      key: sourceKey,
      deviceId,
    })
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


