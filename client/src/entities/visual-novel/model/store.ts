import { create } from 'zustand'
import { questsApi } from '@/shared/api/quests'
import type { GameActions, GameState, Scene, PendingAction } from './types'

interface VNState {
  game: GameState
  scenes: Record<string, Scene>
  pendingActions: PendingAction[]
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
  pendingActions: [],
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
    addPendingAction: (action) =>
      set((s) => ({ pendingActions: [...s.pendingActions, action] })),
    flushPendingActions: async () => {
      const { pendingActions } = get()
      if (pendingActions.length === 0) return
      try {
        for (const act of pendingActions) {
          if (act.type === 'quest') {
            if (act.op === 'start' && act.step)
              await questsApi.startQuest(act.questId, act.step)
            if (act.op === 'advance' && act.step)
              await questsApi.advanceQuest(act.questId, act.step)
            if (act.op === 'complete') await questsApi.completeQuest(act.questId)
          } else if (act.type === 'outcome') {
            const { type: _t, ...payload } = act
            await questsApi.applyOutcome(payload)
          }
        }
        set({ pendingActions: [] })
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[VN] flushPendingActions failed', e)
      }
    },
  },
}))


