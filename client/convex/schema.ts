import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

// Минимальная схема для стартовых квестов/QR-задач
export default defineSchema({
  quests: defineTable({
    title: v.string(),
    status: v.string(), // new | active | done
    createdAt: v.number(),
  }),
})


