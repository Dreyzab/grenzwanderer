import type { Choice } from '@/entities/visual-novel/model/types'
import { useSceneEngine } from '@/entities/visual-novel/model/hooks'

interface Props {
  choices: Choice[]
}

export function ChoiceMenu({ choices }: Props) {
  const { choose } = useSceneEngine()
  if (!choices.length) return null
  return (
    <div className="absolute bottom-28 left-0 right-0 flex flex-col gap-2 items-center">
      <div className="w-full max-w-3xl">
        {choices.map((c) => (
          <button
            key={c.id}
            className="w-full text-left bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-100 border border-zinc-700 rounded-md px-4 py-2"
            onClick={(e) => { e.stopPropagation(); choose(c.id) }}
          >
            {c.text}
          </button>
        ))}
      </div>
    </div>
  )
}


