import { useVNStore } from './store'
import type { GameState } from './types'
import { useNavigate } from 'react-router-dom'
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

  const handleInlineActions = () => {
    const line = currentScene?.dialogue?.[useVNStore.getState().game.lineIndex]
    if (!line) return
    if (line.action === 'go_to_map_with_dialog') {
      const step = quest.getStep('delivery_and_dilemma')
      let dialogKey: string | null = null
      if (step === 'not_started') dialogKey = 'quest_start_dialog'
      else if (step === 'completed') dialogKey = 'loyalty_quest_start'
      navigate(dialogKey ? `/map?dialog=${encodeURIComponent(dialogKey)}` : '/map')
    }
  }

  return { handleInlineActions, setScene: actions.setScene }
}


