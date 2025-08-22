import { memo } from 'react'
import type { DialogueItem } from '@/entities/visual-novel/model/types'

interface Props {
  items: DialogueItem[]
  lineIndex: number
}

export const DialogueBox = memo(({ items, lineIndex }: Props) => {
  const item = items[lineIndex]
  if (!item) return null
  return (
    <div className="absolute bottom-0 left-0 right-0 p-4" onClick={(e) => e.stopPropagation()}>
      <div className="bg-zinc-900/80 border border-zinc-700 rounded-lg p-4 max-w-4xl mx-auto">
        {item.speaker && <div className="text-sm text-emerald-300 mb-1">{item.speaker}</div>}
        <div className="text-zinc-100 text-lg leading-relaxed">{item.text}</div>
      </div>
    </div>
  )
})


