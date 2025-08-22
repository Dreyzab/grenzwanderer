import { v } from 'convex/values'
import type { Doc } from './_generated/dataModel'
import { internalMutation, mutation, query } from './_generated/server'

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
  args: {
    data: v.object({
      id: v.string(),
      deleted: v.optional(v.boolean()),
      first_name: v.optional(v.string()),
      last_name: v.optional(v.string()),
      image_url: v.optional(v.string()),
      primary_email_address_id: v.optional(v.string()),
      email_addresses: v.optional(v.array(v.object({ id: v.string(), email_address: v.string(), primary: v.optional(v.boolean()) }))),
    }),
  },
  handler: async ({ db }, { data }) => {
    const now = Date.now()
    const externalId = data.id as string | undefined
    if (!externalId) {
      // eslint-disable-next-line no-console
      console.warn('upsertFromClerk: missing user id in payload', { data })
      return
    }
    const existing = await db.query('users').withIndex('by_externalId', (q) => q.eq('externalId', externalId)).unique()

    // Soft delete
    if (data?.deleted === true) {
      if (existing) await db.patch(existing._id, { deletedAt: now, updatedAt: now } as Partial<Doc<'users'>>)
      return
    }

    const primaryEmailId = data?.primary_email_address_id as string | undefined
    const emails = (data?.email_addresses ?? []) as Array<{ id: string; email_address: string; primary?: boolean }>
    const primaryEmail =
      (primaryEmailId ? emails.find((e) => e?.id === primaryEmailId)?.email_address : undefined) ??
      emails.find((e) => e?.primary)?.email_address ??
      emails[0]?.email_address

    const payload: Partial<Doc<'users'>> = {
      externalId,
      name: [ data?.first_name, data?.last_name ].filter(Boolean).join(' ') || undefined,
      email: (primaryEmail as string) || undefined,
      imageUrl: (data?.image_url as string) || undefined,
      updatedAt: now,
    }
    if (existing) await db.patch(existing._id, payload)
    else await db.insert('users', { ...payload, createdAt: now } as Doc<'users'>)
  },
})

// Публичный запрос: вернуть текущего пользователя из таблицы users (для отладки/проверки)
export const meProfile = query(async ({ db, auth }) => {
  const identity = await auth.getUserIdentity()
  if (!identity?.subject) return null
  const user = await db.query('users').withIndex('by_externalId', (q) => q.eq('externalId', identity.subject)).unique()
  return user ?? null
})

// Публичная мутация: гарантировать наличие пользователя и полей email/imageUrl, если вебхук не настроен
export const ensureUserFromIdentity = mutation({
  args: {},
  handler: async ({ db, auth }) => {
    const now = Date.now()
    const identity = await auth.getUserIdentity()
    if (!identity?.subject) return { ok: false }
    const externalId = identity.subject
    const existing = await db.query('users').withIndex('by_externalId', (q) => q.eq('externalId', externalId)).unique()
    const payload: { externalId: string; name?: string; email?: string; imageUrl?: string; updatedAt: number } = {
      externalId,
      name: (identity?.name as string | undefined) ?? undefined,
      email: (identity?.email as string | undefined) ?? undefined,
      imageUrl: (identity?.pictureUrl as string | undefined) ?? undefined,
      updatedAt: now,
    }
    if (existing) {
      await db.patch(existing._id, payload)
      return { ok: true, userId: existing._id }
    }
    const id = await db.insert('users', { ...payload, createdAt: now })
    return { ok: true, userId: id }
  },
})


