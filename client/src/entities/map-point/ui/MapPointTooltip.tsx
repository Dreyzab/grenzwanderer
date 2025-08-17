import type { VisibleMapPoint } from '../model/types'
import { InteractionState } from '../model/types'
import FactionBadge from '@/shared/ui/FactionBadge'

interface MapPointTooltipProps {
  point: VisibleMapPoint
  interactionState?: (typeof InteractionState)[keyof typeof InteractionState]
  className?: string
}

export function MapPointTooltip({
  point,
  interactionState = InteractionState.AVAILABLE,
  className = '',
}: MapPointTooltipProps) {
  const getPointTypeText = (): string => {
    switch (point.type) {
      case 'quest_location':
        return 'Локация квеста'
      case 'npc_spawn':
        return 'Персонаж'
      case 'hidden_cache':
        return 'Тайник'
      case 'settlement':
        return 'Поселение'
      case 'anomaly':
        return 'Аномалия'
      case 'danger_zone':
        return 'Опасная зона'
      case 'shelter':
        return 'Убежище'
      case 'shop':
        return 'Магазин'
      default:
        return 'Точка интереса'
    }
  }

  const getInteractionMessage = (): string | null => {
    switch (interactionState) {
      case InteractionState.NOT_AVAILABLE:
        return 'Недоступно для взаимодействия'
      case InteractionState.TOO_FAR:
        if (point.distance) {
          const distanceText =
            point.distance < 1000
              ? `${Math.round(point.distance)} метров`
              : `${(point.distance / 1000).toFixed(1)} км`
          return `Слишком далеко (${distanceText})`
        }
        return 'Слишком далеко для взаимодействия'
      case InteractionState.INTERACTING:
        return 'Взаимодействие...'
      default:
        return null
    }
  }

  const interactionMessage = getInteractionMessage()

  return (
    <div className={`bg-zinc-900 border border-zinc-700 rounded-md p-3 shadow-lg max-w-xs ${className}`}>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium text-white">{point.title}</h3>
          {point.factionId && (
            // @ts-ignore
            <FactionBadge factionId={point.factionId as any} />
          )}
        </div>
        <div className="text-xs text-zinc-500">
          {getPointTypeText()} {point.isDiscovered ? '' : '(Не исследовано)'}
        </div>
        <p className="text-sm text-zinc-300">{point.description}</p>
        {point.distance && (
          <div className="text-xs text-zinc-400">
            Расстояние:{' '}
            {point.distance < 1000
              ? `${Math.round(point.distance)} м`
              : `${(point.distance / 1000).toFixed(1)} км`}
          </div>
        )}
        {interactionMessage && (
          <div
            className={`
              text-xs font-medium mt-2 p-1.5 rounded text-center
              ${
                interactionState === InteractionState.INTERACTING
                  ? 'bg-blue-900 text-blue-200'
                  : interactionState === InteractionState.NOT_AVAILABLE
                  ? 'bg-red-900 text-red-200'
                  : 'bg-amber-900 text-amber-200'
              }
            `}
          >
            {interactionMessage}
          </div>
        )}
      </div>
    </div>
  )
}

export default MapPointTooltip


