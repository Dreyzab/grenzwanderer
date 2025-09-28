import { create, StateCreator } from 'zustand'
import { usePlayerStore } from '@/entities/player/model/store'
import type { GameActions, GameState, Scene, VNState } from './types'

export const createInitialGameState = (startScene: string): GameState => ({
  currentSceneId: startScene,
  lineIndex: 0,
  characterStates: {},
  inventory: [],
  flags: {},
  history: [],
})

export const useVNStore = create<VNState>((set: any, get: any) => {
  const store = {
    game: createInitialGameState('prologue_start'),
    scenes: {},
    actions: {
    setScene: (sceneId: string) =>
      set((s: VNState) => ({ game: { ...s.game, currentSceneId: sceneId, lineIndex: 0 } })),
    nextLine: () =>
      set((s: VNState) => {
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
          const nextId = scene.nextScene
          const resume = !!game.flags?.resume_to_last
          const nextSceneDef = scenes[nextId]
          const nextLastIndex = Math.max(0, (nextSceneDef?.dialogue?.length ?? 1) - 1)
          const newFlags = { ...game.flags }
          if (resume) delete newFlags.resume_to_last
          return { game: { ...game, currentSceneId: nextId, lineIndex: resume ? nextLastIndex : 0, flags: newFlags } }
        }
        // Иначе просто двигаем строку
        return { game: { ...game, lineIndex: Math.min(game.lineIndex + 1, lastIndex) } }
      }),
    choose: (choiceId: string) => {
      const { game, scenes } = get()
      const scene = scenes[game.currentSceneId]
      const choice = scene?.choices?.find((c: any) => c.id === choiceId)
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
      setFlag: (key: string, value: any) => set((s: VNState) => ({ game: { ...s.game, flags: { ...s.game.flags, [key]: value } } })),
      reset: (sceneId: string) => set({ game: createInitialGameState(sceneId) }),
      hydrate: (state: GameState) => set({ game: state }),
    },
  }
  return store
})



