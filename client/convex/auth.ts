import { internalMutation, mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const me = query(async ({ auth }) => {
  const identity = await auth.getUserIdentity()
  return {
    isAuthenticated: !!identity,
    userId: identity?.subject ?? null,
  }
})

// Хелпер-мутация: на логине переносим гостевой прогресс device -> user
export const linkGuestOnLogin = mutation({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity?.subject) return { ok: false }
    // Делегируем существующей миграции: клиенту нужно вызвать API миграции
    return { ok: true, userId: identity.subject, deviceId }
  },
})

// Вебхук для Clerk (опционально): upsert/delete пользователя по событиям
export const upsertFromClerk = internalMutation({
  args: { data: v.any() },
  handler: async ({ db }, { data }) => {
    const now = Date.now()
    const externalId = data?.id as string | undefined
    if (!externalId) return
    const existing = await db.query('users').withIndex('by_externalId', (q) => q.eq('externalId', externalId)).unique()
    const payload: any = {
      externalId,
      name: [data?.first_name, data?.last_name].filter(Boolean).join(' ') || undefined,
      email: (data?.email_addresses?.[0]?.email_address as string) || undefined,
      imageUrl: (data?.image_url as string) || undefined,
      updatedAt: now,
    }
    if (existing) await db.patch(existing._id, payload)
    else await db.insert('users', { ...payload, createdAt: now })
  },
})

// Публичный запрос: вернуть текущего пользователя из таблицы users (для отладки/проверки)
export const meProfile = query(async ({ db, auth }) => {
  const identity = await auth.getUserIdentity()
  if (!identity?.subject) return null
  const user = await db.query('users').withIndex('by_externalId', (q) => q.eq('externalId', identity.subject)).unique()
  return user ?? null
})


