import { useQuest } from '@/entities/quest/model/useQuest'
import { useProgressionStore } from '@/entities/quest/model/progressionStore'
import { useQuestStore } from '@/entities/quest/model/questStore'
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

  // Немедленная асинхронная отправка снапшота прогресса в Convex
  const syncSnapshot = () => {
    try {
      const qs = useQuestStore.getState()
      const activeQuests = Object.fromEntries(
        Object.entries(qs.activeQuests ?? {}).map(([qid, q]: any) => [qid, { currentStep: q.currentStep, startedAt: q.startedAt }]),
      ) as Record<string, { currentStep: string; startedAt?: number }>
      void questsApi.syncProgress({ activeQuests, completedQuests: qs.completedQuests ?? [] } as any)
    } catch (err) {
      logger.warn('QUEST', 'syncSnapshot failed', err as any)
    }
  }

  async function handle(actionKey: string, eventOutcomeKey?: string) {
    logger.debug('DIALOG', '[COORDINATOR] action:', actionKey, 'outcome:', eventOutcomeKey)
    if (eventOutcomeKey) {
      void questsApi.applyDialogOutcome(eventOutcomeKey).catch((e: unknown) => {
        logger.error('DIALOG', '[COORDINATOR] applyDialogOutcome failed', e)
      })
    }

    // Специальные системные действия
    if (actionKey === 'start_combat_tutorial_scarabs') {
      // После «боя» снижаем здоровье и продвигаем шаг к завершению
      try {
        await questsApi.setPlayerHealth(0.4)
        player.hydrateFromServer({ health: 0.4 })
      } catch (e) {
        logger.warn('DIALOG', 'setPlayerHealth failed', e as any)
      }
      // Продвигаем боевой квест к сцене завершения боя
      quest.advanceQuest('combat_baptism' as QuestId, 'combat_completed' as QuestStep)
      return
    }
    if (actionKey === 'set_health_full') {
      try {
        await questsApi.setPlayerHealth(1)
        player.hydrateFromServer({ health: 1 })
      } catch (e) {
        logger.warn('DIALOG', 'restore health failed', e as any)
      }
      return
    }

    const mapped = await resolveDialogAction(actionKey)
    logger.debug('DIALOG', '[COORDINATOR] mapped:', mapped)
    if (!mapped) return
    if (mapped.kind === 'phase') {
      return
    }
    if (mapped.kind === 'fsm') {
      if (mapped.machine === 'delivery') {
        if (mapped.event?.type === 'START')
          quest.startQuest('delivery_and_dilemma' as QuestId, 'station_briefing' as QuestStep)
        if (mapped.event?.type === 'START') syncSnapshot()
        if (mapped.event?.type === 'ADVANCE' && mapped.event.step) {
          quest.advanceQuest('delivery_and_dilemma' as QuestId, mapped.event.step as QuestStep)
          if (mapped.event.step === ('return_to_craftsman' as QuestStep)) {
            player.addItem('artifact_crystal')
          }
          syncSnapshot()
        }
        if (mapped.event?.type === 'COMPLETE') {
          quest.completeQuest('delivery_and_dilemma' as QuestId)
          player.setPhase(1)
          setPhase(1)
          void questsApi.setPlayerPhase(1)
          checkPhaseAdvance()
          syncSnapshot()
        }
      }
      if (mapped.machine === 'combat') {
        if (mapped.event?.type === 'START')
          quest.startQuest('combat_baptism' as QuestId, 'combat_available_on_board' as QuestStep)
        if (mapped.event?.type === 'START') syncSnapshot()
        if (mapped.event?.type === 'ASSIGN')
          quest.startQuest('combat_baptism' as QuestId, 'assigned_to_patrol' as QuestStep)
        if (mapped.event?.type === 'ASSIGN') syncSnapshot()
        if (mapped.event?.type === 'ADVANCE' && mapped.event.step) {
          quest.advanceQuest('combat_baptism' as QuestId, mapped.event.step as QuestStep)
          syncSnapshot()
        }
        if (mapped.event?.type === 'COMPLETE') {
          quest.completeQuest('combat_baptism' as QuestId)
          // Награда: 25 энергокредитов и 25 известности
          try {
            const rewardCredits = 25
            player.addCredits(rewardCredits)
            const currFame = (usePlayerStore.getState().fame ?? 0) as number
            player.hydrateFromServer({ fame: currFame + 25 })
            try {
              const raw = localStorage.getItem('player-state')
              const prev = raw ? JSON.parse(raw) : {}
              prev.fame = (prev.fame ?? currFame) + 25
              prev.updatedAt = Date.now()
              localStorage.setItem('player-state', JSON.stringify(prev))
              const currCredits = (() => { try { return Number(localStorage.getItem('player-credits') ?? '0') } catch { return 0 } })()
              localStorage.setItem('player-credits', String(Math.max(0, currCredits + rewardCredits)))
            } catch {}
          } catch (e) {
            logger.warn('DIALOG', 'reward grant failed', e as any)
          }
          // Немедленный снапшот прогресса на сервер
          syncSnapshot()
          checkPhaseAdvance()
        }
      }
      if (mapped.machine === 'field_medicine') {
        if (mapped.event?.type === 'START') {
          quest.startQuest('field_medicine' as QuestId, 'quest_accepted' as QuestStep)
          // Восстановить здоровье игрока при старте лечения
          try {
            await questsApi.setPlayerHealth(1)
            player.hydrateFromServer({ health: 1 })
          } catch (e) {
            logger.warn('DIALOG', 'restore health failed', e as any)
          }
        }
        if (mapped.event?.type === 'START') syncSnapshot()

        if (mapped.event?.type === 'ADVANCE' && mapped.event.step) {
          quest.advanceQuest('field_medicine' as QuestId, mapped.event.step as QuestStep)
          // Разные эффекты в зависимости от результата сбора мха
          if (mapped.event.step === 'moss_collected_injured') {
            try {
              await questsApi.setPlayerHealth(0.6) // Раненый
              player.hydrateFromServer({ health: 0.6 })
            } catch (e) {
              logger.warn('DIALOG', 'setPlayerHealth injured failed', e as any)
            }
          } else if (mapped.event.step === 'moss_collected_cautious') {
            player.addItem('quality_antidote') // Осторожный подход - бонусный предмет
          }
          syncSnapshot()
        }

        if (mapped.event?.type === 'COMPLETE') {
          quest.completeQuest('field_medicine' as QuestId)
          // Награда: 40 кредитов, медицинские предметы, доступ к Synthesis vendor
          // Базовая награда, детали уже обработаны в ADVANCE
          try {
            const rewardCredits = 40
            player.addCredits(rewardCredits)
            player.addItem('medical_kit')
            const currFame = (usePlayerStore.getState().fame ?? 0) as number
            player.hydrateFromServer({ fame: currFame + 15 })

            // Сохранить в localStorage
            try {
              const raw = localStorage.getItem('player-state')
              const prev = raw ? JSON.parse(raw) : {}
              prev.fame = (prev.fame ?? currFame) + 15
              prev.updatedAt = Date.now()
              localStorage.setItem('player-state', JSON.stringify(prev))
              const currCredits = (() => { try { return Number(localStorage.getItem('player-credits') ?? '0') } catch { return 0 } })()
              localStorage.setItem('player-credits', String(Math.max(0, currCredits + rewardCredits)))
            } catch {}
          } catch (e) {
            logger.warn('DIALOG', 'field medicine reward failed', e as any)
          }
          syncSnapshot()
          checkPhaseAdvance()
        }
      }
      if (mapped.machine === 'quiet_cove') {
        if (mapped.event?.type === 'START') {
          quest.startQuest('quiet_cove_whisper' as QuestId, 'courier_missing' as QuestStep)
          // Добавить предмет "processors_recovered" для отслеживания прогресса
          player.addItem('processors_recovered')
        }
        if (mapped.event?.type === 'START') syncSnapshot()

        if (mapped.event?.type === 'ADVANCE' && mapped.event.step) {
          quest.advanceQuest('quiet_cove_whisper' as QuestId, mapped.event.step as QuestStep)
          syncSnapshot()
        }

        if (mapped.event?.type === 'COMPLETE') {
          quest.completeQuest('quiet_cove_whisper' as QuestId)
          // Награда: кредиты, слава, репутация фракции
          try {
            const rewardCredits = 50
            player.addCredits(rewardCredits)
            const currFame = (usePlayerStore.getState().fame ?? 0) as number
            player.hydrateFromServer({ fame: currFame + 20 })

            // Сохранить в localStorage
            try {
              const raw = localStorage.getItem('player-state')
              const prev = raw ? JSON.parse(raw) : {}
              prev.fame = (prev.fame ?? currFame) + 20
              prev.updatedAt = Date.now()
              localStorage.setItem('player-state', JSON.stringify(prev))
              const currCredits = (() => { try { return Number(localStorage.getItem('player-credits') ?? '0') } catch { return 0 } })()
              localStorage.setItem('player-credits', String(Math.max(0, currCredits + rewardCredits)))
            } catch {}
          } catch (e) {
            logger.warn('DIALOG', 'quiet cove reward failed', e as any)
          }
          syncSnapshot()
          checkPhaseAdvance()
        }
      }
      return
    }
    if (mapped.kind === 'quest') {
      const { op, questId, step } = mapped
      if (op === 'start' && step) {
        quest.startQuest(questId as QuestId, step as QuestStep)
        syncSnapshot()
      }
      if (op === 'advance' && step) {
        quest.advanceQuest(questId as QuestId, step as QuestStep)
        syncSnapshot()
      }
      if (op === 'complete') {
        quest.completeQuest(questId as QuestId)
        const phase1Ids = new Set(['delivery_and_dilemma', 'field_medicine', 'combat_baptism', 'quiet_cove_whisper', 'bell_for_lost'])
        if (phase1Ids.has(questId as unknown as string)) checkPhaseAdvance()
        syncSnapshot()
      }
    }
  }

  function checkPhaseAdvance() {
    const completed = new Set(quest.completedQuests ?? [])
    const phase1 = ['delivery_and_dilemma', 'field_medicine', 'combat_baptism', 'quiet_cove_whisper', 'bell_for_lost']
    const doneCount = phase1.filter((id) => completed.has(id as any)).length
    if (doneCount >= 3) {
      player.setPhase(2)
      setPhase(2)
    }
  }

  return { handle }
}


