import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Users, MessageCircle, MapPin, Filter } from 'lucide-react'
import { MultiplayerSessionCard } from '../../features/multiplayer/ui/MultiplayerSessionCard'
import { useMultiplayerStore } from '../../features/multiplayer/model/store'
import { AnimatedCard } from '../../shared/ui/components/AnimatedCard'
import { Button } from '../../shared/ui/components/Button'
import { cn } from '../../shared/lib/utils/cn'

type SessionFilter = 'all' | 'nearby' | 'quest_coop' | 'raid_group' | 'trade_meetup' | 'social_gathering'

export function MultiplayerPage() {
  const [filter, setFilter] = useState<SessionFilter>('all')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null)
  const {
    activeSessions,
    nearbyPlayers,
    getAvailableSessions,
    getSessionsByType,
    createSession,
    joinSession,
    getNearbyPlayers
  } = useMultiplayerStore()

  useEffect(() => {
    // Получаем текущую позицию для фильтра "nearby"
    if (filter === 'nearby' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.error('Geolocation error:', error)
          setFilter('all')
        }
      )
    }
  }, [filter])

  const getFilteredSessions = () => {
    let sessions = activeSessions

    switch (filter) {
      case 'nearby':
        if (!currentLocation) return []
        return sessions.filter(session => {
          if (!session.location) return false
          const distance = calculateDistance(
            currentLocation.lat, currentLocation.lng,
            session.location.lat, session.location.lng
          )
          return distance <= 1000 // В пределах 1км
        })
      case 'quest_coop':
      case 'raid_group':
      case 'trade_meetup':
      case 'social_gathering':
        return getSessionsByType(filter)
      default:
        return getAvailableSessions()
    }
  }

  const filteredSessions = getFilteredSessions()

  const handleCreateSession = () => {
    // Здесь будет открытие формы создания сессии
    const newSessionId = createSession({
      type: 'quest_coop',
      name: 'Новая сессия',
      description: 'Совместное приключение',
      hostId: 'current_user', // TODO: get actual user ID
      maxParticipants: 4,
      status: 'waiting',
      settings: {
        isPublic: true,
        allowSpectators: false,
        requireApproval: false,
        autoStart: false,
        autoStartDelay: 5,
        maxInactiveTime: 30,
      },
    })

    console.log('Created session:', newSessionId)
    setShowCreateForm(false)
  }

  const handleJoinSession = (sessionId: string) => {
    const joined = joinSession(sessionId, 'current_user', 'CurrentUser')
    if (joined) {
      console.log('Joined session:', sessionId)
    } else {
      console.log('Failed to join session')
    }
  }

  const handleViewSession = (sessionId: string) => {
    console.log('Viewing session:', sessionId)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-100 mb-2">Мультиплеер</h1>
            <p className="text-zinc-400">
              Совместные квесты, рейды и социальные взаимодействия
            </p>
          </div>

          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Создать сессию
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          {[
            { key: 'all', label: 'Все', icon: Filter },
            { key: 'nearby', label: 'Рядом', icon: MapPin },
            { key: 'quest_coop', label: 'Квесты', icon: Users },
            { key: 'raid_group', label: 'Рейды', icon: Users },
            { key: 'trade_meetup', label: 'Торговля', icon: MessageCircle },
          ].map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              variant={filter === key ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter(key as SessionFilter)}
              className="flex items-center gap-2"
            >
              <Icon className="w-4 h-4" />
              {label}
            </Button>
          ))}
        </div>

        {/* Create Session Form */}
        {showCreateForm && (
          <AnimatedCard className="p-6 mb-6">
            <h3 className="text-lg font-semibold text-zinc-100 mb-4">Создать сессию</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Название</label>
                <input
                  type="text"
                  placeholder="Название сессии"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded text-zinc-100"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Тип</label>
                <select className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded text-zinc-100">
                  <option value="quest_coop">Совместный квест</option>
                  <option value="raid_group">Групповой рейд</option>
                  <option value="trade_meetup">Торговля</option>
                  <option value="social_gathering">Социальное</option>
                </select>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm text-zinc-400 mb-2">Описание</label>
              <textarea
                placeholder="Описание сессии"
                rows={3}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded text-zinc-100"
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={handleCreateSession} className="bg-emerald-600 hover:bg-emerald-700">
                Создать
              </Button>
              <Button
                onClick={() => setShowCreateForm(false)}
                variant="secondary"
              >
                Отмена
              </Button>
            </div>
          </AnimatedCard>
        )}

        {/* Sessions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSessions.map((session, index) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <MultiplayerSessionCard
                session={session}
                currentUserId="current_user" // TODO: get actual user ID
                onJoin={() => handleJoinSession(session.id)}
                onView={() => handleViewSession(session.id)}
              />
            </motion.div>
          ))}
        </div>

        {filteredSessions.length === 0 && (
          <AnimatedCard className="p-8 text-center">
            <div className="text-zinc-400">
              {filter === 'nearby' && !currentLocation
                ? 'Определение местоположения...'
                : 'Нет доступных сессий'
              }
            </div>
          </AnimatedCard>
        )}

        {/* Nearby Players */}
        {nearbyPlayers.length > 0 && (
          <AnimatedCard className="mt-8 p-6">
            <h3 className="text-lg font-semibold text-zinc-100 mb-4">
              Игроки рядом ({nearbyPlayers.length})
            </h3>
            <div className="space-y-2">
              {nearbyPlayers.slice(0, 5).map((player) => (
                <div
                  key={player.playerId}
                  className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-lg border border-zinc-700"
                >
                  <div>
                    <div className="font-medium text-zinc-100">{player.username}</div>
                    <div className="text-sm text-zinc-400">
                      {player.distance < 1000
                        ? `${Math.round(player.distance)}м`
                        : `${(player.distance / 1000).toFixed(1)}км`
                      } • Последняя активность: {new Date(player.lastSeen).toLocaleTimeString()}
                    </div>
                  </div>
                  <Button size="sm" variant="secondary">
                    Пригласить
                  </Button>
                </div>
              ))}
            </div>
          </AnimatedCard>
        )}

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <AnimatedCard className="p-4 text-center">
            <div className="text-2xl font-bold text-emerald-400 mb-1">
              {activeSessions.length}
            </div>
            <div className="text-sm text-zinc-400">Активных сессий</div>
          </AnimatedCard>

          <AnimatedCard className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-400 mb-1">
              {activeSessions.reduce((sum, s) => sum + s.participants.length, 0)}
            </div>
            <div className="text-sm text-zinc-400">Участников</div>
          </AnimatedCard>

          <AnimatedCard className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-400 mb-1">
              {nearbyPlayers.length}
            </div>
            <div className="text-sm text-zinc-400">Рядом</div>
          </AnimatedCard>

          <AnimatedCard className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400 mb-1">
              {activeSessions.filter(s => s.type === 'quest_coop').length}
            </div>
            <div className="text-sm text-zinc-400">Квестов</div>
          </AnimatedCard>
        </div>
      </div>
    </div>
  )
}

/**
 * Вычисляет расстояние между двумя координатами в метрах
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000 // Радиус Земли в метрах
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}
