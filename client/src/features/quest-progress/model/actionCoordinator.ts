import { useQuest } from '@/entities/quest/model/useQuest'
import { useProgressionStore } from '@/entities/quest/model/progressionStore'
//import logger from '@/shared/lib/logger'
import { questsApi } from '@/shared/api/quests'
import { useRef } from 'react'
import { createDeliveryQuestActor } from '@/entities/quest/model/fsm/deliveryMachine'
import { createCombatQuestActor } from '@/entities/quest/model/fsm/combatMachine'
import { resolveOutcome } from './outcomes'
import { dialogActionMap } from './actionMap'
import type { DeliveryQuestId, DeliveryQuestStep } from '@/entities/quest/model/types'

export function useDialogActionCoordinator() {
  const quest = useQuest()
  const { setPhase } = useProgressionStore()
  const deliveryActorRef = useRef<ReturnType<typeof createDeliveryQuestActor> | null>(null)
  const combatActorRef = useRef<ReturnType<typeof createCombatQuestActor> | null>(null)

  function ensureDeliveryActor() {
    if (!deliveryActorRef.current) {
      deliveryActorRef.current = createDeliveryQuestActor()
      deliveryActorRef.current.start()
    }
    return deliveryActorRef.current
  }

  function ensureCombatActor() {
    if (!combatActorRef.current) {
      combatActorRef.current = createCombatQuestActor()
      combatActorRef.current.start()
    }
    return combatActorRef.current
  }

  function handle(actionKey: string, eventOutcomeKey?: string) {
    // Debug-трейс действий диалога
    // eslint-disable-next-line no-console
    console.log('[COORDINATOR] action:', actionKey, 'outcome:', eventOutcomeKey)
    // Если есть outcome — применяем его на сервере
    if (eventOutcomeKey) {
      const args = resolveOutcome(eventOutcomeKey)
      if (args) void questsApi.applyOutcome(args)
    }
    const mapped = dialogActionMap[actionKey]
    // eslint-disable-next-line no-console
    console.log('[COORDINATOR] mapped:', mapped)
    if (!mapped) return
    if (mapped.kind === 'phase') {
      setPhase(mapped.phase)
      return
    }
    if (mapped.kind === 'fsm') {
      if (mapped.machine === 'delivery') {
        const actor = ensureDeliveryActor()
        actor.send(mapped.event)
        // Мгновенная синхронизация стора для UI (на случай отложенных акторов)
        if (mapped.event?.type === 'START')
          quest.startQuest('delivery_and_dilemma' as DeliveryQuestId, 'need_pickup_from_trader' as DeliveryQuestStep)
        if (mapped.event?.type === 'ADVANCE' && mapped.event.step) {
          quest.advanceQuest('delivery_and_dilemma' as DeliveryQuestId, mapped.event.step as DeliveryQuestStep)
        }
        if (mapped.event?.type === 'COMPLETE')
          quest.completeQuest('delivery_and_dilemma' as DeliveryQuestId)
      }
      if (mapped.machine === 'combat') {
        const actor = ensureCombatActor()
        actor.send(mapped.event)
        if (mapped.event?.type === 'START')
          quest.startQuest('combat_baptism' as DeliveryQuestId, 'combat_available_on_board' as DeliveryQuestStep)
        if (mapped.event?.type === 'ASSIGN')
          quest.startQuest('combat_baptism' as DeliveryQuestId, 'assigned_to_patrol' as DeliveryQuestStep)
        if (mapped.event?.type === 'ADVANCE' && mapped.event.step)
          quest.advanceQuest('combat_baptism' as DeliveryQuestId, mapped.event.step as DeliveryQuestStep)
        if (mapped.event?.type === 'COMPLETE')
          quest.completeQuest('combat_baptism' as DeliveryQuestId)
      }
      return
    }
    if (mapped.kind === 'quest') {
      const { op, questId, step } = mapped
      if (op === 'start' && step) quest.startQuest(questId as DeliveryQuestId, step as DeliveryQuestStep)
      if (op === 'advance' && step) quest.advanceQuest(questId as DeliveryQuestId, step as DeliveryQuestStep)
      if (op === 'complete') {
        quest.completeQuest(questId as DeliveryQuestId)
        const phase1Ids = new Set(['delivery_and_dilemma', 'field_medicine', 'combat_baptism', 'quiet_cove_whisper', 'bell_for_lost'])
        if (phase1Ids.has(questId as unknown as string)) checkPhaseAdvance()
      }
    }
  }

  function checkPhaseAdvance() {
    // Простая логика: если завершено ≥3 квеста фазы 1 — перейти к фазе 2
    const completed = new Set(quest.completedQuests ?? [])
    const phase1 = ['delivery_and_dilemma', 'field_medicine', 'combat_baptism', 'quiet_cove_whisper', 'bell_for_lost']
    const doneCount = phase1.filter((id) => completed.has(id as any)).length
    if (doneCount >= 3) {
      void questsApi.setPlayerPhase(2)
    }
  }

  return { handle }
}


