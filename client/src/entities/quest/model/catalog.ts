import type { QuestStep } from './types'
import type { QuestId } from './ids'

export type PhaseId = 0 | 1 | 2

export interface QuestMeta {
  id: QuestId
  phase: PhaseId
  prerequisites?: QuestId[]
  startPointKey: string
  startStep: QuestStep
}

export const questCatalog: QuestMeta[] = [
  {
    id: 'delivery_and_dilemma',
    phase: 1,
    startPointKey: 'train_station',
    startStep: 'station_briefing',
  },
  { id: 'field_medicine', phase: 1, startPointKey: 'gunter_brewery', startStep: 'medical_emergency' as QuestStep },
  { id: 'combat_baptism', phase: 1, startPointKey: 'fjr_office_start', startStep: 'combat_available_on_board' as QuestStep },
  { id: 'quiet_cove_whisper', phase: 1, startPointKey: 'anarchist_bar', startStep: 'courier_missing' as QuestStep },
  { id: 'bell_for_lost', phase: 1, startPointKey: 'old_believers_square', startStep: 'bell_mission_offered' as QuestStep },
  { id: 'citizenship_invitation', phase: 2, startPointKey: 'rathaus', startStep: 'official_summons_received' as QuestStep },
  { id: 'eyes_in_the_dark', phase: 2, startPointKey: 'seepark', startStep: 'special_assignment_available' as QuestStep },
  { id: 'void_shards', phase: 2, startPointKey: 'wasserschlossle', startStep: 'crystal_collection_offer' as QuestStep },
]

export function getQuestMeta(id: QuestId): QuestMeta | undefined {
  return questCatalog.find((q) => q.id === id)
}

export function listQuestsByPhase(phase: PhaseId): QuestMeta[] {
  return questCatalog.filter((q) => q.phase === phase)
}

export const ALL_QUEST_IDS = questCatalog.map((q) => q.id) as QuestId[]


