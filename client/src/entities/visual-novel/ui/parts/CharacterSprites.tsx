import type { CharacterInstance } from '@/entities/visual-novel/model/types'

interface Props {
  characters: CharacterInstance[]
}

export function CharacterSprites({ characters }: Props) {
  if (!characters?.length) return null
  const getPos = (pos?: string) =>
    pos === 'left' ? 'left-8' : pos === 'right' ? 'right-8' : 'left-1/2 -translate-x-1/2'
  return (
    <div className="absolute inset-0 pointer-events-none select-none">
      {characters.map((c) => (
        <div
          key={c.id}
          className={`absolute bottom-24 ${getPos(c.position)} transition-transform`}
          style={{ filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.6))' }}
        >
          <img src={c.sprite} alt={c.name ?? c.id} className="max-h-[65vh]" />
        </div>
      ))}
    </div>
  )
}


