import { useQuest } from '@/entities/quest/model/useQuest'
import { useProgressionStore } from '@/entities/quest/model/progressionStore'
import logger from '@/shared/lib/logger'
import { questsApi } from '@/shared/api/quests'
import { usePlayerStore } from '@/entities/player/model/store'
import { resolveDialogAction } from './actionMap'
import type { QuestStep } from '@/entities/quest/model/types'
import type { QuestId } from '@/entities/quest/model/ids'
import { useAuth } from '@clerk/clerk-react'

export function useDialogActionCoordinator() {
  const quest = useQuest()
  const { setPhase } = useProgressionStore()
  const player = usePlayerStore()
  useAuth() // keep clerk context initialized; not used here

  async function handle(actionKey: string, eventOutcomeKey?: string) {
    logger.debug('DIALOG', '[COORDINATOR] action:', actionKey, 'outcome:', eventOutcomeKey)
    if (eventOutcomeKey) {
      void questsApi.applyDialogOutcome(eventOutcomeKey).catch((e: unknown) => {
        logger.error('DIALOG', '[COORDINATOR] applyDialogOutcome failed', e)
      })
    }
    const mapped = await resolveDialogAction(actionKey)
    logger.debug('DIALOG', '[COORDINATOR] mapped:', mapped)
    if (!mapped) return
    if (mapped.kind === 'phase') {
      // Игнорируем прямые phase-ивенты из диалогов.
      // Повышаем фазу только после завершения квестов (см. COMPLETE и checkPhaseAdvance).
      return
    }
    if (mapped.kind === 'fsm') {
      if (mapped.machine === 'delivery') {
        if (mapped.event?.type === 'START')
          quest.startQuest('delivery_and_dilemma' as QuestId, 'station_briefing' as QuestStep)
        if (mapped.event?.type === 'ADVANCE' && mapped.event.step) {
          quest.advanceQuest('delivery_and_dilemma' as QuestId, mapped.event.step as QuestStep)
          if (mapped.event.step === ('return_to_craftsman' as QuestStep)) {
            player.addItem('artifact_crystal')
          }
        }
        if (mapped.event?.type === 'COMPLETE') {
          quest.completeQuest('delivery_and_dilemma' as QuestId)
          // Поднимаем фазу до 1 локально (и в прогресс-сторе)
          player.setPhase(1)
          setPhase(1)
          // Триггерим проверку фазы после завершения
          checkPhaseAdvance()
        }
      }
      if (mapped.machine === 'combat') {
        if (mapped.event?.type === 'START')
          quest.startQuest('combat_baptism' as QuestId, 'combat_available_on_board' as QuestStep)
        if (mapped.event?.type === 'ASSIGN')
          quest.startQuest('combat_baptism' as QuestId, 'assigned_to_patrol' as QuestStep)
        if (mapped.event?.type === 'ADVANCE' && mapped.event.step)
          quest.advanceQuest('combat_baptism' as QuestId, mapped.event.step as QuestStep)
        if (mapped.event?.type === 'COMPLETE')
          quest.completeQuest('combat_baptism' as QuestId)
      }
      return
    }
    if (mapped.kind === 'quest') {
      const { op, questId, step } = mapped
      if (op === 'start' && step) quest.startQuest(questId as QuestId, step as QuestStep)
      if (op === 'advance' && step) quest.advanceQuest(questId as QuestId, step as QuestStep)
      if (op === 'complete') {
        quest.completeQuest(questId as QuestId)
        const phase1Ids = new Set(['delivery_and_dilemma', 'field_medicine', 'combat_baptism', 'quiet_cove_whisper', 'bell_for_lost'])
        if (phase1Ids.has(questId as unknown as string)) checkPhaseAdvance()
      }
    }
  }

  function checkPhaseAdvance() {
    const completed = new Set(quest.completedQuests ?? [])
    const phase1 = ['delivery_and_dilemma', 'field_medicine', 'combat_baptism', 'quiet_cove_whisper', 'bell_for_lost']
    const doneCount = phase1.filter((id) => completed.has(id as any)).length
    if (doneCount >= 3) {
      // Обновляем и локальный стор игрока, и прогресс-стор (плюс фоновой persist)
      player.setPhase(2)
      setPhase(2)
    }
  }

  return { handle }
}


