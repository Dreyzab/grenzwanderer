import { useQuest } from '@/entities/quest/model/useQuest'
import { useProgressionStore } from '@/entities/quest/model/progressionStore'
import logger from '@/shared/lib/logger'
import { questsApi } from '@/shared/api/quests'
import { useRef } from 'react'
import { createDeliveryQuestActor } from '@/entities/quest/model/fsm/deliveryMachine'
import { createCombatQuestActor } from '@/entities/quest/model/fsm/combatMachine'
import { resolveOutcome } from './outcomes'
import { dialogActionMap } from './actionMap'

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
    // Если есть outcome — применяем его на сервере
    if (eventOutcomeKey) {
      const args = resolveOutcome(eventOutcomeKey)
      if (args) void questsApi.applyOutcome(args)
    }
    const mapped = dialogActionMap[actionKey]
    if (!mapped) return
    if (mapped.kind === 'phase') {
      setPhase(mapped.phase)
      return
    }
    if (mapped.kind === 'fsm') {
      if (mapped.machine === 'delivery') ensureDeliveryActor().send(mapped.event)
      if (mapped.machine === 'combat') ensureCombatActor().send(mapped.event)
      return
    }
    if (mapped.kind === 'quest') {
      const { op, questId, step } = mapped
      if (op === 'start' && step) quest.startQuest(questId as any, step as any)
      if (op === 'advance' && step) quest.advanceQuest(questId as any, step as any)
      if (op === 'complete') {
        quest.completeQuest(questId as any)
        const phase1Ids = new Set(['delivery_and_dilemma', 'field_medicine', 'combat_baptism', 'quiet_cove_whisper', 'bell_for_lost'])
        if (phase1Ids.has(questId as any)) checkPhaseAdvance()
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


