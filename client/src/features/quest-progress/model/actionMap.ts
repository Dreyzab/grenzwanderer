import type { QuestStep, CombatQuestStep } from '@/entities/quest/model/types'
import type { QuestId } from '@/entities/quest/model/ids'

export type DeliveryFsmEvent =
  | { type: 'START' }
  | { type: 'ADVANCE'; step: QuestStep }
  | { type: 'COMPLETE' }

export type CombatFsmEvent =
  | { type: 'START' }
  | { type: 'ASSIGN' }
  | { type: 'ADVANCE'; step: CombatQuestStep }
  | { type: 'COMPLETE' }

export type ActionDescriptor =
  | { kind: 'phase'; phase: 1 | 2 }
  | { kind: 'fsm'; machine: 'delivery'; event: DeliveryFsmEvent }
  | { kind: 'fsm'; machine: 'combat'; event: CombatFsmEvent }
  | { kind: 'quest'; op: 'start' | 'advance' | 'complete'; questId: QuestId; step?: QuestStep }

// Временное API-обёртка: получение действия по ключу — локальный fallback
export async function resolveDialogAction(actionKey: string): Promise<ActionDescriptor | undefined> {
  const fallback: Record<string, ActionDescriptor> = {
    set_phase_1: { kind: 'phase', phase: 1 },
    set_phase_2: { kind: 'phase', phase: 2 },
    start_delivery_quest: { kind: 'fsm', machine: 'delivery', event: { type: 'START' } },
    advance_delivery_pickup: { kind: 'fsm', machine: 'delivery', event: { type: 'ADVANCE', step: 'need_pickup_from_trader' as any } },
    take_parts: { kind: 'fsm', machine: 'delivery', event: { type: 'ADVANCE', step: 'deliver_parts_to_craftsman' as any } },
    deliver_parts: { kind: 'fsm', machine: 'delivery', event: { type: 'ADVANCE', step: 'artifact_offer' as any } },
    accept_artifact_quest: { kind: 'fsm', machine: 'delivery', event: { type: 'ADVANCE', step: 'go_to_anomaly' as any } },
    return_to_craftsman: { kind: 'fsm', machine: 'delivery', event: { type: 'ADVANCE', step: 'return_to_craftsman' as any } },
    complete_delivery_quest: { kind: 'fsm', machine: 'delivery', event: { type: 'COMPLETE' } },
    complete_delivery_quest_with_artifact: { kind: 'fsm', machine: 'delivery', event: { type: 'COMPLETE' } },
  }
  return fallback[actionKey]
}


