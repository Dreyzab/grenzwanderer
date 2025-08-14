import type { QuestId } from '@/entities/quest/model/ids'
import { isQuestId } from '@/entities/quest/model/ids'

export interface SanitizedQuestItem {
  id: QuestId
  type?: string
  priority?: number
}

export function sanitizeQuestItems(input: unknown): SanitizedQuestItem[] {
  if (!Array.isArray(input)) return []

  const result: SanitizedQuestItem[] = []
  for (const raw of input) {
    if (!raw || typeof raw !== 'object') continue
    const q = raw as Record<string, unknown>

    const questId = q.questId
    const t = q.type
    const p = q.priority

    if (typeof questId !== 'string' || !isQuestId(questId)) continue
    if (!(t == null || typeof t === 'string')) continue
    if (!(p == null || (typeof p === 'number' && Number.isFinite(p)))) continue

    const item: SanitizedQuestItem = { id: questId as QuestId }
    if (typeof t === 'string') item.type = t
    if (typeof p === 'number') item.priority = p
    result.push(item)
  }
  return result
}


