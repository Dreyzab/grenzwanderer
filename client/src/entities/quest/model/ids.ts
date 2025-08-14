export const QUEST_IDS = [
  'delivery_and_dilemma',
  'loyalty_fjr',
  'water_crisis',
  'freedom_spark',
  'combat_baptism',
  'field_medicine',
  'quiet_cove_whisper',
  'bell_for_lost',
  'citizenship_invitation',
  'eyes_in_the_dark',
  'void_shards',
] as const

export type QuestId = typeof QUEST_IDS[number]

export function isQuestId(id: unknown): id is QuestId {
  return typeof id === 'string' && (QUEST_IDS as readonly string[]).includes(id)
}

