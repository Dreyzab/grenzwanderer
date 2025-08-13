export interface SanitizedQuestItem {
  id: string
  type?: string
  priority?: number
}

export function sanitizeQuestItems(input: unknown): SanitizedQuestItem[] {
  if (!Array.isArray(input)) return []
  return input
    .filter((q) => q && typeof q === 'object')
    .map((q) => q as any)
    .filter((q) => typeof q.questId === 'string' || typeof q.questId === 'number')
    .filter((q) => (q.type == null ? true : typeof q.type === 'string'))
    .filter((q) => (q.priority == null ? true : Number.isFinite(q.priority)))
    .map((q) => ({ id: String(q.questId), type: q.type as any, priority: q.priority as any }))
}


