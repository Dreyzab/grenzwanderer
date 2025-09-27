import { motion } from 'framer-motion'
import { Users, MapPin, Clock, Star, Crown, UserPlus, MessageCircle } from 'lucide-react'
import { MultiplayerSession, MultiplayerType } from '../model/types'
import { cn } from '../../../shared/lib/utils/cn'

interface MultiplayerSessionCardProps {
  session: MultiplayerSession
  currentUserId?: string
  onJoin?: () => void
  onView?: () => void
  onMessage?: () => void
  className?: string
}

export function MultiplayerSessionCard({
  session,
  currentUserId,
  onJoin,
  onView,
  onMessage,
  className
}: MultiplayerSessionCardProps) {
  const getTypeIcon = () => {
    switch (session.type) {
      case 'quest_coop':
        return <Star className="w-5 h-5 text-purple-400" />
      case 'raid_group':
        return <Users className="w-5 h-5 text-red-400" />
      case 'trade_meetup':
        return <MessageCircle className="w-5 h-5 text-green-400" />
      case 'social_gathering':
        return <Users className="w-5 h-5 text-blue-400" />
      case 'exploration_party':
        return <MapPin className="w-5 h-5 text-emerald-400" />
      default:
        return <Users className="w-5 h-5 text-zinc-400" />
    }
  }

  const getTypeLabel = () => {
    switch (session.type) {
      case 'quest_coop':
        return 'Совместный квест'
      case 'raid_group':
        return 'Групповой рейд'
      case 'trade_meetup':
        return 'Торговая встреча'
      case 'social_gathering':
        return 'Социальное собрание'
      case 'exploration_party':
        return 'Экспедиция'
      default:
        return 'Сессия'
    }
  }

  const getStatusColor = () => {
    switch (session.status) {
      case 'waiting':
        return 'text-yellow-400 bg-yellow-900/20 border-yellow-600/30'
      case 'active':
        return 'text-emerald-400 bg-emerald-900/20 border-emerald-600/30'
      case 'completed':
        return 'text-blue-400 bg-blue-900/20 border-blue-600/30'
      case 'cancelled':
        return 'text-red-400 bg-red-900/20 border-red-600/30'
      default:
        return 'text-zinc-400 bg-zinc-900/20 border-zinc-600/30'
    }
  }

  const isUserParticipant = currentUserId && session.participants.some(p => p.playerId === currentUserId)
  const isHost = currentUserId && session.hostId === currentUserId
  const canJoin = session.status === 'waiting' && !isUserParticipant && session.participants.length < session.maxParticipants

  const getTimeRemaining = () => {
    if (!session.startTime) return null

    const elapsed = Date.now() - session.startTime
    const minutes = Math.floor(elapsed / 60000)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}ч ${minutes % 60}м`
    }
    return `${minutes}м`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'bg-zinc-800/50 backdrop-blur-sm border rounded-lg p-4',
        'hover:bg-zinc-800/70 transition-colors cursor-pointer',
        getStatusColor(),
        className
      )}
      onClick={onView}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          {getTypeIcon()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-zinc-100 truncate">
              {session.name}
            </h3>
            <div className="flex items-center gap-2">
              {isHost && <Crown className="w-4 h-4 text-yellow-400" />}
              <span className="text-xs px-2 py-1 rounded bg-zinc-700/50">
                {getTypeLabel()}
              </span>
            </div>
          </div>

          <p className="text-sm text-zinc-400 mb-3 line-clamp-2">
            {session.description}
          </p>

          {/* Participants */}
          <div className="mb-3">
            <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
              <Users className="w-3 h-3" />
              <span>Участники: {session.participants.length}/{session.maxParticipants}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {session.participants.slice(0, 3).map((participant) => (
                <div
                  key={participant.playerId}
                  className={cn(
                    'text-xs px-2 py-1 rounded flex items-center gap-1',
                    participant.role === 'host'
                      ? 'bg-yellow-900/30 text-yellow-400'
                      : 'bg-zinc-700/50 text-zinc-300'
                  )}
                >
                  {participant.role === 'host' && <Crown className="w-3 h-3" />}
                  {participant.username}
                </div>
              ))}
              {session.participants.length > 3 && (
                <div className="text-xs px-2 py-1 bg-zinc-700/50 text-zinc-300 rounded">
                  +{session.participants.length - 3}
                </div>
              )}
            </div>
          </div>

          {/* Location and Time */}
          <div className="flex items-center gap-4 text-xs text-zinc-500 mb-3">
            {session.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>{session.location.lat.toFixed(4)}, {session.location.lng.toFixed(4)}</span>
              </div>
            )}

            {session.status === 'active' && getTimeRemaining() && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{getTimeRemaining()}</span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            {canJoin && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onJoin?.()
                }}
                className="text-xs px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors"
              >
                <UserPlus className="w-3 h-3 mr-1 inline" />
                Присоединиться
              </button>
            )}

            {isUserParticipant && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onMessage?.()
                }}
                className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              >
                <MessageCircle className="w-3 h-3 mr-1 inline" />
                Чат
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
