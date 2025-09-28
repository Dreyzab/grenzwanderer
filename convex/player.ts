import { mutation } from './_generated/server'

export const bootstrap = mutation({
  handler: async (ctx) => {
    // TODO: create or fetch player record once auth is wired
    return 'ok'
  }
})

