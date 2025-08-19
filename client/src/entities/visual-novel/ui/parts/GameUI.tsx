import { useSaveSystem, useSceneEngine } from '@/entities/visual-novel/model/hooks'
import { useVNStore } from '@/entities/visual-novel/model/store'

export function GameUI() {
  const { saveGame, loadGame } = useSaveSystem()
  const next = useVNStore((s) => s.actions.nextLine)
  const { handleInlineActions } = useSceneEngine()
  return (
    <div className="absolute top-4 right-4 flex gap-2">
      <button className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded px-3 py-1" onClick={() => saveGame('slot1')}>
        Сохранить
      </button>
      <button className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded px-3 py-1" onClick={() => loadGame('slot1')}>
        Загрузить
      </button>
      <button
        className="bg-emerald-700 hover:bg-emerald-600 text-white rounded px-3 py-1"
        onClick={() => {
          const navigated = handleInlineActions()
          if (!navigated) next()
        }}
      >
        Дальше
      </button>
    </div>
  )
}


