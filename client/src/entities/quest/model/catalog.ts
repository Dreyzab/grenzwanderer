import type { DeliveryQuestId, DeliveryQuestStep } from './types'

export type PhaseId = 0 | 1 | 2

export interface QuestMeta {
  id: DeliveryQuestId
  phase: PhaseId
  prerequisites?: DeliveryQuestId[]
  startPointKey: string
  startStep: DeliveryQuestStep
}

export const questCatalog: QuestMeta[] = [
  {
    id: 'delivery_and_dilemma',
    phase: 1,
    startPointKey: 'settlement_center',
    startStep: 'need_pickup_from_trader',
  },
  { id: 'field_medicine', phase: 1, startPointKey: 'synthesis_medbay', startStep: 'medical_emergency' as DeliveryQuestStep },
  { id: 'combat_baptism', phase: 1, startPointKey: 'fjr_office_start', startStep: 'combat_available_on_board' as DeliveryQuestStep },
  { id: 'quiet_cove_whisper', phase: 1, startPointKey: 'quiet_cove_bar', startStep: 'courier_missing' as DeliveryQuestStep },
  { id: 'bell_for_lost', phase: 1, startPointKey: 'cathedral', startStep: 'bell_mission_offered' as DeliveryQuestStep },
  { id: 'citizenship_invitation', phase: 2, startPointKey: 'rathaus', startStep: 'official_summons_received' as DeliveryQuestStep },
  { id: 'eyes_in_the_dark', phase: 2, startPointKey: 'seepark', startStep: 'special_assignment_available' as DeliveryQuestStep },
  { id: 'void_shards', phase: 2, startPointKey: 'wasserschlossle', startStep: 'crystal_collection_offer' as DeliveryQuestStep },
]

export function getQuestMeta(id: DeliveryQuestId): QuestMeta | undefined {
  return questCatalog.find((q) => q.id === id)
}

export function listQuestsByPhase(phase: PhaseId): QuestMeta[] {
  return questCatalog.filter((q) => q.phase === phase)
}


