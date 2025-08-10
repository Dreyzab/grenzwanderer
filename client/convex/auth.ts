import { query } from './_generated/server'

export const me = query(async ({ auth }) => {
  const identity = await auth.getUserIdentity()
  if (!identity) return { isAuthenticated: false as const, userId: null as const }
  return { isAuthenticated: true as const, userId: identity.subject }
})


