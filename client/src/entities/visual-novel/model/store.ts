import { create } from 'zustand'
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
  game: createInitialGameState('station_intro'),
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
        // Если есть выборы на конце — остаёмся на последней реплике, ждём выбора
        if (atEnd && (scene?.choices?.length ?? 0) > 0) {
          return { game: { ...game, lineIndex: lastIndex } }
        }
        // Если конец и нет выборов — переходим к nextScene, если указан
        if (atEnd && scene?.nextScene) {
          return { game: { ...game, currentSceneId: scene.nextScene, lineIndex: 0 } }
        }
        // Иначе просто двигаем строку
        return { game: { ...game, lineIndex: Math.min(game.lineIndex + 1, lastIndex) } }
      }),
    choose: (choiceId) => {
      const { game, scenes } = get()
      const scene = scenes[game.currentSceneId]
      const choice = scene?.choices?.find((c) => c.id === choiceId)
      if (!choice) return
      const next = choice.nextScene ?? scene?.nextScene ?? game.currentSceneId
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


