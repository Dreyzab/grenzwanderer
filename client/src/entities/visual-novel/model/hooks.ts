import { useVNStore } from './store'
import type { GameState } from './types'
import { useNavigate } from 'react-router-dom'
import { questsApi, qrApi } from '@/shared/api/quests'
import { useQuest } from '@/entities/quest/model/useQuest'
import { getQuestMeta } from '@/entities/quest/model/catalog'
import { useProgressionStore } from '@/entities/quest/model/progressionStore'
import { usePlayerStore } from '@/entities/player/model/store'

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
  const player = usePlayerStore()

  const handleInlineActions = (): boolean => {
    const state = useVNStore.getState()
    const line = currentScene?.dialogue?.[state.game.lineIndex]
    if (!line) return false
    if ((line as any).action === 'go_to_map_with_dialog') {
      ;(async () => {
        try {
          await qrApi.grantPda()
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('[VN] grant PDA failed', e)
        }
        const dlgKey = (line as any).dialogKey as string | undefined
        try {
          if (dlgKey === 'phase_1_choice_dialog') {
            const res = await questsApi.commitScene({ questOps: [], outcome: { setPhase: 1 } } as any)
            if (!res || !res.playerState) { player.setPhase(1); setPhase(1) }
          } else {
            await questsApi.commitScene({ questOps: [] } as any)
          }
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('[VN] commitScene (map open) failed; applying local fallbacks', e)
        }
        const nextDialog = dlgKey || 'quest_start_dialog'
        navigate(`/map?dialog=${encodeURIComponent(nextDialog)}`)
      })()
      return true
    }
    return false
  }

  return { handleInlineActions, setScene: actions.setScene }
}

