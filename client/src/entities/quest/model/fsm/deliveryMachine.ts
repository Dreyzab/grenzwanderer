import { createActor, createMachine } from 'xstate'
import { useQuestStore } from '../questStore'
import { questsApi } from '@/shared/api/quests'

// Минимальная XState-машина для квеста "delivery_and_dilemma"
// Источником истины остаётся zustand-стор; машина лишь оркестрирует события

const deliveryMachine = createMachine({
  id: 'delivery_and_dilemma_fsm',
  initial: 'idle',
  states: {
    idle: {
      on: {
        START: { target: 'in_progress', actions: ['startDelivery'] },
      },
    },
    in_progress: {
      on: {
        ADVANCE: { actions: ['advanceDelivery'] },
        COMPLETE: { target: 'done', actions: ['completeDelivery'] },
      },
    },
    done: {
      type: 'final',
    },
  },
}, {
  actions: {
    startDelivery: () => {
      const store = useQuestStore.getState()
      store.startQuest('delivery_and_dilemma', 'need_pickup_from_trader')
      void questsApi.startQuest('delivery_and_dilemma', 'need_pickup_from_trader')
    },
    advanceDelivery: (_ctx: unknown, ev: any) => {
      if (ev?.type !== 'ADVANCE') return
      const store = useQuestStore.getState()
      store.advanceQuest('delivery_and_dilemma', ev.step as any)
      void questsApi.advanceQuest('delivery_and_dilemma', ev.step as any)
    },
    completeDelivery: () => {
      const store = useQuestStore.getState()
      store.completeQuest('delivery_and_dilemma')
      void questsApi.completeQuest('delivery_and_dilemma')
    },
  },
})

export function createDeliveryQuestActor() {
  const actor = createActor(deliveryMachine)
  return actor
}


