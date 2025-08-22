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

// Временное API-обёртка: получение действия из БД по ключу
export async function resolveDialogAction(actionKey: string): Promise<ActionDescriptor | undefined> {
  try {
    const { convexClient } = await import('@/shared/lib/convexClient')
    const { api } = await import('../../../../convex/_generated/api')
    const row = await convexClient.query(api.dialogs.resolveAction as any, { actionKey })
    if (!row) return undefined
    if (row.kind === 'phase') return { kind: 'phase', phase: row.phase as 1 | 2 }
    if (row.kind === 'fsm') {
      const machine = row.machine as 'delivery' | 'combat'
      const type = row.fsmEventType as DeliveryFsmEvent['type'] | CombatFsmEvent['type']
      const step = row.fsmStep as QuestStep | undefined
      const event: any = step ? { type, step } : { type }
      return { kind: 'fsm', machine, event } as any
    }
    if (row.kind === 'quest') {
      return { kind: 'quest', op: row.questOp, questId: row.questId, step: row.questStep }
    }
  } catch (e) {
    // no-op
  }
  return undefined
}


