import { useVNStore } from './store'
import type { GameState } from './types'
import { useNavigate } from 'react-router-dom'
import { qrApi } from '@/shared/api/quests'
import { getQuestMeta } from '@/entities/quest/model/catalog'
import { useProgressionStore } from '@/entities/quest/model/progressionStore'

export const useGameState = () => {
  const game = useVNStore((s) => s.game)
  const actions = useVNStore((s) => s.actions)
  const scenes = useVNStore((s) => s.scenes)
  const currentScene = scenes[game.currentSceneId]
  return { gameState: game, actions, currentScene }
}

export const useSaveSystem = () => {
  const { gameState, actions } = useGameState()
  const saveGame = (slotName = 'slot1') => {
    const data = { gameState, timestamp: Date.now() }
    localStorage.setItem(`vn_save_${slotName}`, JSON.stringify(data))
  }
  const loadGame = (slotName = 'slot1') => {
    const raw = localStorage.getItem(`vn_save_${slotName}`)
    if (!raw) return
    const parsed = JSON.parse(raw) as { gameState: GameState }
    actions.hydrate(parsed.gameState)
  }
  return { saveGame, loadGame }
}

export const useSceneEngine = () => {
  const navigate = useNavigate()
  const { currentScene } = useGameState()
  const actions = useVNStore((s) => s.actions)
  // const quest = useQuest()
  const { setPhase } = useProgressionStore()

  const handleInlineActions = (): boolean => {
    const state = useVNStore.getState()
    const line = currentScene?.dialogue?.[state.game.lineIndex]
    if (!line) return false
    if (line.action === 'go_to_map_with_dialog') {
      // После вводной сцены: выдаём КПК, запускаем стартовый квест, ставим фазу и переводим на карту
      ;(async () => {
        try {
          await qrApi.grantPda()
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('[VN] grant PDA failed', e)
        }
        const meta = getQuestMeta('delivery_and_dilemma' as any)
        actions.addPendingAction({ type: 'outcome', setPhase: 1 })
        if (meta) {
          actions.addPendingAction({
            type: 'quest',
            op: 'start',
            questId: 'delivery_and_dilemma',
            step: meta.startStep as any,
          })
        }
        // Синхронизируем локально для UI
        setPhase(1)
        const dlgKey = (line as any).dialogKey || 'quest_start_dialog'
        navigate(`/map?dialog=${encodeURIComponent(dlgKey)}`)
      })()
      return true
    }
    return false
  }

  const choose = (choiceId: string) => {
    const state = useVNStore.getState()
    const scene = state.scenes[state.game.currentSceneId]
    const choice = scene?.choices?.find((c) => c.id === choiceId)
    if (choice) {
      const quest = (choice as any).quest as {
        op: 'start' | 'advance' | 'complete'
        id: string
        step?: string
      } | undefined
      const outcome = (choice as any).outcome as Record<string, unknown> | undefined
      if (quest) {
        actions.addPendingAction({
          type: 'quest',
          op: quest.op,
          questId: quest.id,
          step: quest.step,
        })
      }
      if (outcome) {
        actions.addPendingAction({ type: 'outcome', ...outcome })
      }
    }
    actions.choose(choiceId)
  }

  return { handleInlineActions, setScene: actions.setScene, choose }
}


