import { useVNStore } from './store'
import type { GameState } from './types'
import { useNavigate } from 'react-router-dom'
import { questsApi, qrApi } from '@/shared/api/quests'
import { getQuestMeta } from '@/entities/quest/model/catalog'
import { useProgressionStore } from '@/entities/quest/model/progressionStore'
import { useQuest } from '@/entities/quest/model/useQuest'

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
  const quest = useQuest()
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
        // ВАЖНО: сначала поднимаем фазу на сервере (иначе старт квеста заблокирован на phase 0)
        try { await questsApi.setPlayerPhase(1) } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('[VN] setPlayerPhase failed', e)
        }
        const meta = getQuestMeta('delivery_and_dilemma' as any)
        if (meta) {
          try { await quest.startQuest('delivery_and_dilemma' as any, meta.startStep as any) } catch (e) {
            // eslint-disable-next-line no-console
            console.warn('[VN] startQuest failed', e)
          }
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

  return { handleInlineActions, setScene: actions.setScene }
}


