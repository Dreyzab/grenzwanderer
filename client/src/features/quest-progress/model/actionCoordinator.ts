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
  useAuth() // ensure Clerk context; not used further here

  async function handle(actionKey: string, eventOutcomeKey?: string) {
    logger.debug('DIALOG', '[COORDINATOR] action:', actionKey, 'outcome:', eventOutcomeKey)

    // Inline/intra-scene outcomes: only affect dialogue flow; skip server
    if (eventOutcomeKey) logger.info('DIALOG', '[COORDINATOR] inlineOutcome', { key: eventOutcomeKey })

    // Tutorial trigger: immediate side-effect (health) and local quest step
    if (actionKey === 'start_combat_tutorial_scarabs') {
      try { await questsApi.setPlayerHealth(0.4); player.hydrateFromServer({ health: 0.4 }) } catch (e) { logger.warn('DIALOG', 'setPlayerHealth failed', e as any) }
      quest.advanceQuest('combat_baptism' as QuestId, 'combat_completed' as QuestStep)
      return
    }
    if (actionKey === 'set_health_full') {
      try { await questsApi.setPlayerHealth(1); player.hydrateFromServer({ health: 1 }) } catch (e) { logger.warn('DIALOG', 'restore health failed', e as any) }
      return
    }

    const mapped = await resolveDialogAction(actionKey)
    logger.debug('DIALOG', '[COORDINATOR] mapped:', mapped)
    if (!mapped) return
    if (mapped.kind === 'phase') return

    if (mapped.kind === 'fsm') {
      // Delivery quest
      if (mapped.machine === 'delivery') {
        if (mapped.event?.type === 'START') {
          await questsApi.commitScene({ questOps: [{ op: 'start', questId: 'delivery_and_dilemma', step: 'station_briefing' }] } as any)
        }
        if (mapped.event?.type === 'ADVANCE' && mapped.event.step) {
          if (mapped.event.step === ('return_to_craftsman' as QuestStep)) player.addItem('artifact_crystal')
          await questsApi.commitScene({ questOps: [{ op: 'advance', questId: 'delivery_and_dilemma', step: mapped.event.step as string }] } as any)
        }
        if (mapped.event?.type === 'COMPLETE') {
          await questsApi.commitScene({ questOps: [{ op: 'complete', questId: 'delivery_and_dilemma' }], outcome: { setPhase: 1 }, rewardHint: 'delivery_and_dilemma_complete' } as any)
          player.setPhase(1)
          setPhase(1)
          checkPhaseAdvance()
        }
      }

      // Combat quest
      if (mapped.machine === 'combat') {
        if (mapped.event?.type === 'START') {
          await questsApi.commitScene({ questOps: [{ op: 'start', questId: 'combat_baptism', step: 'combat_available_on_board' }] } as any)
        }
        if (mapped.event?.type === 'ASSIGN') {
          await questsApi.commitScene({ questOps: [{ op: 'start', questId: 'combat_baptism', step: 'assigned_to_patrol' }] } as any)
        }
        if (mapped.event?.type === 'ADVANCE' && mapped.event.step) {
          await questsApi.commitScene({ questOps: [{ op: 'advance', questId: 'combat_baptism', step: mapped.event.step as string }] } as any)
        }
        if (mapped.event?.type === 'COMPLETE') {
          await questsApi.commitScene({ questOps: [{ op: 'complete', questId: 'combat_baptism' }], rewardHint: 'combat_baptism_complete' } as any)
          // Rewards (client cache)
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
          checkPhaseAdvance()
        }
      }

      // Field Medicine quest
      if (mapped.machine === 'field_medicine') {
        if (mapped.event?.type === 'START') {
          await questsApi.commitScene({ questOps: [{ op: 'start', questId: 'field_medicine', step: 'quest_accepted' }] } as any)
          try { await questsApi.setPlayerHealth(1); player.hydrateFromServer({ health: 1 }) } catch (e) { logger.warn('DIALOG', 'restore health failed', e as any) }
        }
        if (mapped.event?.type === 'ADVANCE' && mapped.event.step) {
          await questsApi.commitScene({ questOps: [{ op: 'advance', questId: 'field_medicine', step: mapped.event.step as string }] } as any)
          if (mapped.event.step === 'moss_collected_injured') {
            try { await questsApi.setPlayerHealth(0.6); player.hydrateFromServer({ health: 0.6 }) } catch (e) { logger.warn('DIALOG', 'setPlayerHealth injured failed', e as any) }
          } else if (mapped.event.step === 'moss_collected_cautious') {
            player.addItem('quality_antidote')
          }
        }
        if (mapped.event?.type === 'COMPLETE') {
          await questsApi.commitScene({ questOps: [{ op: 'complete', questId: 'field_medicine' }], rewardHint: 'field_medicine_complete' } as any)
          try {
            const rewardCredits = 40
            player.addCredits(rewardCredits)
            player.addItem('medical_kit')
            const currFame = (usePlayerStore.getState().fame ?? 0) as number
            player.hydrateFromServer({ fame: currFame + 15 })
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
          checkPhaseAdvance()
        }
      }

      // Quiet Cove quest
      if (mapped.machine === 'quiet_cove') {
        if (mapped.event?.type === 'START') {
          await questsApi.commitScene({ questOps: [{ op: 'start', questId: 'quiet_cove_whisper', step: 'courier_missing' }] } as any)
          player.addItem('processors_recovered')
        }
        if (mapped.event?.type === 'ADVANCE' && mapped.event.step) {
          await questsApi.commitScene({ questOps: [{ op: 'advance', questId: 'quiet_cove_whisper', step: mapped.event.step as string }] } as any)
        }
        if (mapped.event?.type === 'COMPLETE') {
          await questsApi.commitScene({ questOps: [{ op: 'complete', questId: 'quiet_cove_whisper' }], rewardHint: 'quiet_cove_complete' } as any)
          try {
            const rewardCredits = 50
            player.addCredits(rewardCredits)
            const currFame = (usePlayerStore.getState().fame ?? 0) as number
            player.hydrateFromServer({ fame: currFame + 20 })
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
          checkPhaseAdvance()
        }
      }
      return
    }

    if (mapped.kind === 'quest') {
      const { op, questId, step } = mapped
      if (op === 'start' && step) {
        await questsApi.commitScene({ questOps: [{ op: 'start', questId: questId as string, step: step as string }] } as any)
      }
      if (op === 'advance' && step) {
        await questsApi.commitScene({ questOps: [{ op: 'advance', questId: questId as string, step: step as string }] } as any)
      }
      if (op === 'complete') {
        await questsApi.commitScene({ questOps: [{ op: 'complete', questId: questId as string }] } as any)
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
      player.setPhase(2)
      setPhase(2)
    }
  }

  return { handle }
}
