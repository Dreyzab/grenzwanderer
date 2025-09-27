import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Filter, MapPin, Users, Clock, Zap } from 'lucide-react'
import { WorldEventCard } from '../../entities/world/ui/WorldEventCard'
import { useWorldStore } from '../../entities/world/model/store'
import { AnimatedCard } from '../../shared/ui/components/AnimatedCard'
import { Button } from '../../shared/ui/components/Button'
import { cn } from '../../shared/lib/utils/cn'

type EventFilter = 'all' | 'anomalies' | 'raids' | 'zone_changes' | 'nearby'

export function WorldEventsPage() {
  const [filter, setFilter] = useState<EventFilter>('all')
  const [showNearby, setShowNearby] = useState(false)
  const { activeEvents, anomalyZones, raidEvents, loadWorldState } = useWorldStore()

  useEffect(() => {
    loadWorldState()
  }, [loadWorldState])

  // Получаем текущую позицию для фильтра "nearby"
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null)

  useEffect(() => {
    if (showNearby && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.error('Geolocation error:', error)
          setShowNearby(false)
        }
      )
    }
  }, [showNearby])

  const getFilteredEvents = () => {
    let events = [...activeEvents]

    // Фильтр по типу
    switch (filter) {
      case 'anomalies':
        return anomalyZones.filter(a => a.isActive)
      case 'raids':
        return raidEvents.filter(r => r.isActive)
      case 'zone_changes':
        return events.filter(e => e.type === 'zone_change')
      case 'nearby':
        if (!currentLocation) return []
        return events.filter(event => {
          if (!event.location) return false
          const distance = calculateDistance(
            currentLocation.lat, currentLocation.lng,
            event.location!.lat, event.location!.lng
          )
          return distance <= 1000 // В пределах 1км
        })
      default:
        return events
    }
  }

  const filteredEvents = getFilteredEvents()

  const handleJoinEvent = (eventId: string) => {
    // Здесь будет логика присоединения к событию
    console.log('Joining event:', eventId)
  }

  const handleViewEvent = (eventId: string) => {
    // Здесь будет логика просмотра деталей события
    console.log('Viewing event:', eventId)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-100 mb-2">Мировые события</h1>
          <p className="text-zinc-400">
            Активные события, аномалии и рейды в игровом мире
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex gap-2">
            {[
              { key: 'all', label: 'Все', icon: Filter },
              { key: 'nearby', label: 'Рядом', icon: MapPin },
              { key: 'anomalies', label: 'Аномалии', icon: Zap },
              { key: 'raids', label: 'Рейды', icon: Users },
            ].map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                variant={filter === key ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setFilter(key as EventFilter)}
                className="flex items-center gap-2"
              >
                <Icon className="w-4 h-4" />
                {label}
              </Button>
            ))}
          </div>

          <Button
            variant={showNearby ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setShowNearby(!showNearby)}
          >
            <MapPin className="w-4 h-4 mr-2" />
            {showNearby ? 'Скрыть геолокацию' : 'Показать рядом'}
          </Button>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvents.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <WorldEventCard
                event={event}
                onJoin={() => handleJoinEvent(event.id)}
                onView={() => handleViewEvent(event.id)}
              />
            </motion.div>
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <AnimatedCard className="p-8 text-center">
            <div className="text-zinc-400">
              {filter === 'nearby' && !currentLocation
                ? 'Определение местоположения...'
                : 'Нет активных событий'
              }
            </div>
          </AnimatedCard>
        )}

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <AnimatedCard className="p-4 text-center">
            <div className="text-2xl font-bold text-emerald-400 mb-1">
              {activeEvents.length}
            </div>
            <div className="text-sm text-zinc-400">Активных событий</div>
          </AnimatedCard>

          <AnimatedCard className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400 mb-1">
              {anomalyZones.filter(a => a.isActive).length}
            </div>
            <div className="text-sm text-zinc-400">Аномалий</div>
          </AnimatedCard>

          <AnimatedCard className="p-4 text-center">
            <div className="text-2xl font-bold text-red-400 mb-1">
              {raidEvents.filter(r => r.isActive).length}
            </div>
            <div className="text-sm text-zinc-400">Активных рейдов</div>
          </AnimatedCard>

          <AnimatedCard className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-400 mb-1">
              {raidEvents.filter(r => r.isActive).reduce((sum, r) => sum + r.currentParticipants, 0)}
            </div>
            <div className="text-sm text-zinc-400">Участников рейдов</div>
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
