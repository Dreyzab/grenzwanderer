import { createActor, createMachine } from 'xstate'
import { useQuestStore } from '../questStore'
import { questsApi } from '@/shared/api/quests'

type CombatEvent =
  | { type: 'START' } // доступно на доске
  | { type: 'ASSIGN' } // принял поручение у офицера
  | { type: 'ADVANCE'; step: 'patrol_in_progress' }
  | { type: 'COMPLETE' }

const combatMachine = createMachine({
  id: 'combat_baptism_fsm',
  initial: 'idle',
  states: {
    idle: {
      on: { START: { target: 'in_progress', actions: ['startAvailable'] } },
    },
    in_progress: {
      on: {
        ASSIGN: { actions: ['assignPatrol'] },
        ADVANCE: { actions: ['advanceCombat'] },
        COMPLETE: { target: 'done', actions: ['completeCombat'] },
      },
    },
    done: { type: 'final' },
  },
})

export function createCombatQuestActor() {
  const actor = createActor(combatMachine, {
    actions: {
      startAvailable: () => {
        const s = useQuestStore.getState()
        s.startQuest('combat_baptism', 'combat_available_on_board' as any)
        void questsApi.startQuest('combat_baptism', 'combat_available_on_board' as any)
      },
      assignPatrol: () => {
        const s = useQuestStore.getState()
        s.startQuest('combat_baptism', 'assigned_to_patrol' as any)
        void questsApi.startQuest('combat_baptism', 'assigned_to_patrol' as any)
      },
      advanceCombat: (_ctx, ev) => {
        if (ev.type !== 'ADVANCE') return
        const s = useQuestStore.getState()
        s.advanceQuest('combat_baptism', ev.step as any)
        void questsApi.advanceQuest('combat_baptism', ev.step as any)
      },
      completeCombat: () => {
        const s = useQuestStore.getState()
        s.completeQuest('combat_baptism')
        void questsApi.completeQuest('combat_baptism')
      },
    },
  })
  return actor
}


