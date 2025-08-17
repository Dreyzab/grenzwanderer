import { action } from './_generated/server'
import { v } from 'convex/values'
import { api } from './_generated/api'

type ResolveResult =
  | { type: 'quest_started'; questId: string }
  | { type: 'open_board'; boardKey: string }
  | { type: 'open_npc'; npcId: string }
  | { type: 'noop' }

export const resolveEventKey = action({
  args: {
    eventKey: v.string(),
    deviceId: v.string(),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, { eventKey, deviceId }) => {
    try {
      if (eventKey.startsWith('board:')) {
        const boardKey = eventKey.split(':')[1]
        return { type: 'open_board', boardKey } as ResolveResult
      }
      if (eventKey.startsWith('npc:')) {
        const npcId = eventKey.split(':')[1]
        return { type: 'open_npc', npcId } as ResolveResult
      }
      if (eventKey.startsWith('quest:')) {
        // quest:<alias>:<action?> — по умолчанию запускаем квест со стартовым шагом из каталога (на клиенте)
        const questId = eventKey.split(':')[1]
        // Для идемпотентности: просто зовём публичную мутацию startQuest с известным стартовым шагом
        // Клиент может передать первый шаг отдельно в будущем; пока используем общий стартовый шаг 'start'
        // Здесь лучше бы прочитать каталог на сервере; для простоты ожидаем, что клиент уже управлял стартом шага.
        try {
          await ctx.runMutation(api.quests.startQuest, { deviceId, questId, step: 'start' })
        } catch {
          // игнорируем повторный старт/ошибки конкуренции
        }
        return { type: 'quest_started', questId } as ResolveResult
      }
    } catch {
      // ignore
    }
    return { type: 'noop' as const }
  },
})


