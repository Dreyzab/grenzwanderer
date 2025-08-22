import { useSaveSystem, useSceneEngine } from '@/entities/visual-novel/model/hooks'
import { useVNStore } from '@/entities/visual-novel/model/store'

export function GameUI() {
  const { saveGame, loadGame } = useSaveSystem()
  const { handleInlineActions } = useSceneEngine()
  const skipToChoiceOrEnd = async () => {
    let guard = 0
    while (guard++ < 1000) {
      const state = useVNStore.getState()
      const { game, scenes } = state
      const scene = scenes[game.currentSceneId]
      const lastIndex = Math.max(0, (scene?.dialogue?.length ?? 1) - 1)
      const atLastLine = game.lineIndex >= lastIndex
      if (atLastLine) break
      const navigated = handleInlineActions()
      if (navigated) break
      state.actions.nextLine()
    }
  }
  return (
    <div className="absolute top-4 right-4 flex gap-2">
      <button className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded px-3 py-1" onClick={(e) => { e.stopPropagation(); saveGame('slot1') }}>
        Сохранить
      </button>
      <button className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded px-3 py-1" onClick={(e) => { e.stopPropagation(); loadGame('slot1') }}>
        Загрузить
      </button>
      <button
        className="bg-emerald-700 hover:bg-emerald-600 text-white rounded px-3 py-1"
        onClick={(e) => { e.stopPropagation(); void skipToChoiceOrEnd() }}
      >
        Пропустить
      </button>
    </div>
  )
}


