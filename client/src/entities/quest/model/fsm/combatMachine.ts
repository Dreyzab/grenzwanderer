import { createActor, createMachine } from 'xstate'
import { useQuestStore } from '../questStore'
// server-side commit is done via dialogs.applyDialogOutcome

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
}, {
  actions: {
    startAvailable: () => {
      const s = useQuestStore.getState()
      s.startQuest('combat_baptism', 'combat_available_on_board' as any)
    },
    assignPatrol: () => {
      const s = useQuestStore.getState()
      s.startQuest('combat_baptism', 'assigned_to_patrol' as any)
    },
    advanceCombat: (_ctx: unknown, ev: any) => {
      if (ev?.type !== 'ADVANCE') return
      const s = useQuestStore.getState()
      s.advanceQuest('combat_baptism', ev.step as any)
    },
    completeCombat: () => {
      const s = useQuestStore.getState()
      s.completeQuest('combat_baptism')
    },
  },
})

export function createCombatQuestActor() {
  const actor = createActor(combatMachine)
  return actor
}


