import { createActor, createMachine } from 'xstate'
import { useQuestStore } from '../questStore'
import { questsApi } from '@/shared/api/quests'
import type { DeliveryQuestStep } from '../types'
import type { QuestId } from '../ids'

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
    advanceDelivery: (_ctx: unknown, ev: { type: string; step?: DeliveryQuestStep } | unknown) => {
      if (typeof ev !== 'object' || ev == null) return
      const e = ev as { type: string; step?: DeliveryQuestStep }
      if (e.type !== 'ADVANCE' || !e.step) return
      const store = useQuestStore.getState()
      store.advanceQuest('delivery_and_dilemma' as QuestId, e.step)
      void questsApi.advanceQuest('delivery_and_dilemma' as QuestId, e.step)
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
  actor.start()
  return actor
}


