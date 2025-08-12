import { query } from './_generated/server'

export const me = query(async ({ auth }) => {
  const identity = await auth.getUserIdentity()
  return {
    isAuthenticated: !!identity,
    userId: identity?.subject ?? null,
  }
})


