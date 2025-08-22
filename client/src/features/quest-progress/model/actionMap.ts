import type { QuestStep, CombatQuestStep } from '@/entities/quest/model/types'
import { loadActionMap } from './actionMapConfig.ts'
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
  const map = await loadActionMap()
  return map[actionKey]
}


