import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  // Пример: базовая таблица для игрока (минимум полей для старта)
  players: defineTable({
    userId: v.string(),
    name: v.string(),
    fame: v.number(),
    phase: v.number()
  })
})


