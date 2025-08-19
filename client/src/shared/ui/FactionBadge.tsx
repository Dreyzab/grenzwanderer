import { FACTIONS, type FactionId } from '@/shared/config/factions'

export default function FactionBadge({ factionId }: { factionId: FactionId }) {
  const f = FACTIONS[factionId]
  if (!f) {
    // eslint-disable-next-line no-console
    console.warn('FactionBadge: unknown factionId', factionId)
    return null
  }
  const style = { backgroundColor: `var(${f.colorVar})`, color: factionId === 'SYNTHESIS' ? '#000' : '#fff' }
  return (
    <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium" style={style}>
      {f.name}
    </span>
  )
}


