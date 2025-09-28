import { create } from 'zustand'
import { usePlayerStore } from '@/entities/player/model/store'
import type { GameActions, GameState, Scene } from './types'

interface VNState {
  game: GameState
  scenes: Record<string, Scene>
  actions: GameActions
}

export const createInitialGameState = (startScene: string): GameState => ({
  currentSceneId: startScene,
  lineIndex: 0,
  characterStates: {},
  inventory: [],
  flags: {},
  history: [],
})

export const useVNStore = create<VNState>((set, get) => ({
  game: createInitialGameState('prologue_start'),
  scenes: {},
  actions: {
    setScene: (sceneId) =>
      set((s) => ({ game: { ...s.game, currentSceneId: sceneId, lineIndex: 0 } })),
    nextLine: () =>
      set((s) => {
        const { game, scenes } = s
        const scene = scenes[game.currentSceneId]
        const lastIndex = Math.max(0, (scene?.dialogue?.length ?? 1) - 1)
        const atEnd = game.lineIndex >= lastIndex
        // Ð•ÑÐ»Ð¸ ÐµÑÑ‚ÑŒ Ð²Ñ‹Ð±Ð¾Ñ€Ñ‹ Ð½Ð° ÐºÐ¾Ð½Ñ†Ðµ â€” Ð¾ÑÑ‚Ð°Ñ‘Ð¼ÑÑ Ð½Ð° Ð¿Ð¾ÑÐ»ÐµÐ´Ð½ÐµÐ¹ Ñ€ÐµÐ¿Ð»Ð¸ÐºÐµ, Ð¶Ð´Ñ‘Ð¼ Ð²Ñ‹Ð±Ð¾Ñ€Ð°
        if (atEnd && (scene?.choices?.length ?? 0) > 0) {
          return { game: { ...game, lineIndex: lastIndex } }
        }
        // Ð•ÑÐ»Ð¸ ÐºÐ¾Ð½ÐµÑ† Ð¸ Ð½ÐµÑ‚ Ð²Ñ‹Ð±Ð¾Ñ€Ð¾Ð² â€” Ð¿ÐµÑ€ÐµÑ…Ð¾Ð´Ð¸Ð¼ Ðº nextScene, ÐµÑÐ»Ð¸ ÑƒÐºÐ°Ð·Ð°Ð½
        if (atEnd && scene?.nextScene) {
          const nextId = scene.nextScene
          const resume = !!game.flags?.resume_to_last
          const nextSceneDef = scenes[nextId]
          const nextLastIndex = Math.max(0, (nextSceneDef?.dialogue?.length ?? 1) - 1)
          const newFlags = { ...game.flags }
          if (resume) delete newFlags.resume_to_last
          return { game: { ...game, currentSceneId: nextId, lineIndex: resume ? nextLastIndex : 0, flags: newFlags } }
        }
        // Ð˜Ð½Ð°Ñ‡Ðµ Ð¿Ñ€Ð¾ÑÑ‚Ð¾ Ð´Ð²Ð¸Ð³Ð°ÐµÐ¼ ÑÑ‚Ñ€Ð¾ÐºÑƒ
        return { game: { ...game, lineIndex: Math.min(game.lineIndex + 1, lastIndex) } }
      }),
    choose: (choiceId) => {
      const { game, scenes } = get()
      const scene = scenes[game.currentSceneId]
      const choice = scene?.choices?.find((c) => c.id === choiceId)
      if (!choice) return
      const next = choice.nextScene ?? scene?.nextScene ?? game.currentSceneId
      // Apply side effects from setFlags to player skills/relations
      const applyFlagEffects = (flags: Record<string, boolean> | undefined) => {
        if (!flags) return
        try {
          const player = usePlayerStore.getState()
          if (flags.insight_logic_plus1) player.incrementSkill('logic', 1)
          if (flags.insight_empathy_plus1) player.incrementSkill('empathy', 1)
          if (flags.insight_cynicism_plus1) player.incrementSkill('cynicism', 1)
          if (flags.map_hints_upgraded) {
            // Could set a player flag for upgraded hints
            player.hydrateFromServer({ flags: Array.from(new Set([...(player as any).flags ?? [], 'map_hints_upgraded'])) })
          }
          if (flags.registrar_friendly) {
            player.hydrateFromServer({ flags: Array.from(new Set([...(player as any).flags ?? [], 'registrar_friendly'])) })
          }
        } catch {}
      }
      applyFlagEffects(choice.setFlags)
      set({
        game: {
          ...game,
          currentSceneId: next,
          lineIndex: 0,
          flags: { ...game.flags, ...(choice.setFlags ?? {}) },
          history: [...game.history, { sceneId: game.currentSceneId, lineIndex: game.lineIndex, text: '', speaker: '' }],
        },
      })
    },
    setFlag: (key, value) => set((s) => ({ game: { ...s.game, flags: { ...s.game.flags, [key]: value } } })),
    reset: (sceneId) => set({ game: createInitialGameState(sceneId) }),
    hydrate: (state) => set({ game: state }),
  },
}))



