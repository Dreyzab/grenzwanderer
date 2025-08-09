import { useVNStore } from './store'
import type { GameState } from './types'

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


