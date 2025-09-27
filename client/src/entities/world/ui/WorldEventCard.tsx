import { motion } from 'framer-motion'
import { MapPin, Clock, Users, Star, Zap, Shield, Sword } from 'lucide-react'
import { WorldEvent, AnomalyZone, RaidEvent } from '../model/types'
import { cn } from '../../../shared/lib/utils/cn'

interface WorldEventCardProps {
  event: WorldEvent | AnomalyZone | RaidEvent
  onJoin?: () => void
  onView?: () => void
  className?: string
}

export function WorldEventCard({ event, onJoin, onView, className }: WorldEventCardProps) {
  const getEventIcon = () => {
    if ('type' in event && event.type === 'anomaly_spawn') {
      return <Zap className="w-5 h-5 text-yellow-400" />
    }
    if ('type' in event && event.type === 'raid') {
      return <Sword className="w-5 h-5 text-red-400" />
    }
    if ('type' in event && event.type === 'zone_change') {
      return <Shield className="w-5 h-5 text-blue-400" />
    }
    return <MapPin className="w-5 h-5 text-emerald-400" />
  }

  const getEventTypeLabel = () => {
    if ('type' in event) {
      if (event.type === 'anomaly_spawn') return 'Аномалия'
      if (event.type === 'raid') return 'Рейд'
      if (event.type === 'zone_change') return 'Изменение зоны'
    }
    if ('anomalyType' in event) return 'Аномалия'
    if ('raidType' in event) return 'Рейд'
    return 'Событие'
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400'
      case 'medium': return 'text-yellow-400'
      case 'hard': return 'text-orange-400'
      case 'legendary': return 'text-red-400'
      default: return 'text-zinc-400'
    }
  }

  const getTimeRemaining = () => {
    if (!event.endTime) return null

    const remaining = event.endTime - Date.now()
    if (remaining <= 0) return 'Завершено'

    const minutes = Math.floor(remaining / 60000)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}ч ${minutes % 60}м`
    }
    return `${minutes}м`
  }

  const getParticipantCount = () => {
    if ('participants' in event) {
      return event.participants.length
    }
    if ('currentParticipants' in event) {
      return event.currentParticipants
    }
    return 0
  }

  const getMaxParticipants = () => {
    if ('maxParticipants' in event) {
      return event.maxParticipants
    }
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'bg-zinc-800/50 backdrop-blur-sm border border-zinc-600 rounded-lg p-4',
        'hover:bg-zinc-800/70 transition-colors cursor-pointer',
        className
      )}
      onClick={onView}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          {getEventIcon()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-zinc-100 truncate">
              {event.title || event.description || 'Неизвестное событие'}
            </h3>
            <span className={cn('text-xs px-2 py-1 rounded', getDifficultyColor('medium'))}>
              {getEventTypeLabel()}
            </span>
          </div>

          <p className="text-sm text-zinc-400 mb-3 line-clamp-2">
            {event.description || 'Описание события'}
          </p>

          <div className="flex items-center gap-4 text-xs text-zinc-500">
            {event.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>{event.location.lat.toFixed(4)}, {event.location.lng.toFixed(4)}</span>
              </div>
            )}

            {getTimeRemaining() && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{getTimeRemaining()}</span>
              </div>
            )}

            {getMaxParticipants() && (
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{getParticipantCount()}/{getMaxParticipants()}</span>
              </div>
            )}
          </div>

          {/* Effects preview */}
          {'effects' in event && event.effects.length > 0 && (
            <div className="mt-3 pt-3 border-t border-zinc-700">
              <div className="text-xs text-zinc-400 mb-2">Эффекты:</div>
              <div className="flex flex-wrap gap-1">
                {event.effects.slice(0, 3).map((effect, index) => (
                  <span
                    key={index}
                    className="text-xs px-2 py-1 bg-zinc-700 text-zinc-300 rounded"
                  >
                    {effect.type}
                  </span>
                ))}
                {event.effects.length > 3 && (
                  <span className="text-xs px-2 py-1 bg-zinc-700 text-zinc-300 rounded">
                    +{event.effects.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 mt-3">
            {onJoin && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onJoin()
                }}
                className="text-xs px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors"
              >
                Присоединиться
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation()
                onView?.()
              }}
              className="text-xs px-3 py-1 bg-zinc-600 hover:bg-zinc-700 text-zinc-300 rounded transition-colors"
            >
              Подробнее
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
