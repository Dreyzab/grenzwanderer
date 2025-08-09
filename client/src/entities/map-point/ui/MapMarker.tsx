import type { VisibleMapPoint } from '../model/types'
import { InteractionState } from '../model/types'

type Size = 'sm' | 'md' | 'lg'

interface MapMarkerProps {
  point: VisibleMapPoint
  onClick?: () => void
  isSelected?: boolean
  interactionState?: (typeof InteractionState)[keyof typeof InteractionState]
  size?: Size
  className?: string
}

export function MapMarker({
  point,
  onClick,
  isSelected = false,
  interactionState = InteractionState.AVAILABLE,
  size = 'md',
  className = '',
}: MapMarkerProps) {
  const sizeClasses: Record<Size, string> = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  }

  const getMarkerStylesByType = (type: string): { bgColor: string; icon: string } => {
    switch (type) {
      case 'quest_location':
        return { bgColor: 'bg-amber-600', icon: '!' }
      case 'npc_spawn':
        return { bgColor: 'bg-blue-600', icon: 'N' }
      case 'hidden_cache':
        return { bgColor: 'bg-green-600', icon: '$' }
      case 'settlement':
        return { bgColor: 'bg-purple-600', icon: '⌂' }
      case 'anomaly':
        return { bgColor: 'bg-red-600', icon: '⚠' }
      case 'danger_zone':
        return { bgColor: 'bg-rose-600', icon: '☠' }
      case 'shelter':
        return { bgColor: 'bg-cyan-600', icon: '★' }
      case 'shop':
        return { bgColor: 'bg-emerald-600', icon: '₽' }
      default:
        return { bgColor: 'bg-zinc-600', icon: '?' }
    }
  }

  const getInteractionStyles = (): string => {
    switch (interactionState) {
      case InteractionState.NOT_AVAILABLE:
        return 'opacity-50 cursor-not-allowed'
      case InteractionState.TOO_FAR:
        return 'opacity-70 cursor-pointer'
      case InteractionState.INTERACTING:
        return 'ring-4 ring-white ring-opacity-70 animate-pulse'
      default:
        return 'cursor-pointer hover:scale-110 transition-all'
    }
  }

  const markerStyles = getMarkerStylesByType(point.type)
  const interactionStyles = getInteractionStyles()
  const showRadius = isSelected && point.radius !== undefined
  const activeStyles = point.isActive ? '' : 'grayscale opacity-60'
  const selectedStyles = isSelected ? 'ring-2 ring-white scale-110 z-20' : ''
  const discoveredStyles = point.isDiscovered ? '' : 'opacity-70'

  return (
    <>
      <div
        className={`
          ${sizeClasses[size]} 
          ${markerStyles.bgColor} 
          ${interactionStyles}
          ${activeStyles}
          ${selectedStyles}
          ${discoveredStyles}
          rounded-full 
          shadow-md 
          flex 
          items-center 
          justify-center 
          text-white 
          font-bold
          select-none
          ${className}
        `}
        onClick={onClick}
        title={point.title}
      >
        {point.icon ? (
          <img src={point.icon} alt={point.title} className="w-[60%] h-[60%]" />
        ) : (
          <span className="text-sm">{markerStyles.icon}</span>
        )}
      </div>

      {showRadius && (
        <div
          className={`
            absolute 
            rounded-full 
            border-2 
            border-dashed 
            pointer-events-none 
            ${markerStyles.bgColor} 
            opacity-20
            z-10
          `}
          style={{
            width: `${point.radius! * 2}px`,
            height: `${point.radius! * 2}px`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      )}
    </>
  )
}

export default MapMarker


