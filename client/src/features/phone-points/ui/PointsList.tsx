import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter, MapPin, Eye, EyeOff, Star, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '../../../shared/lib/utils/cn'

interface Point {
  key: string
  title: string
  description?: string
  coordinates: { lat: number; lng: number }
  type: 'quest' | 'npc' | 'location' | 'anomaly'
  status: 'not_found' | 'discovered' | 'researched'
  distance?: number
  discoveredAt?: number
  researchedAt?: number
  phaseRequirement?: number
  tags?: string[]
}

interface PointsListProps {
  points: Point[]
  className?: string
}

type SortOption = 'distance' | 'name' | 'status' | 'type'
type FilterOption = 'all' | 'discovered' | 'not_found' | 'researched'

export function PointsList({ points, className }: PointsListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('distance')
  const [filterBy, setFilterBy] = useState<FilterOption>('all')
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  // Фильтрация и сортировка точек
  const filteredAndSortedPoints = useMemo(() => {
    let filtered = points

    // Фильтр по поисковому запросу
    if (searchQuery) {
      filtered = filtered.filter(point =>
        point.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        point.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        point.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Фильтр по статусу
    if (filterBy !== 'all') {
      filtered = filtered.filter(point => {
        switch (filterBy) {
          case 'discovered':
            return point.status === 'discovered'
          case 'not_found':
            return point.status === 'not_found'
          case 'researched':
            return point.status === 'researched'
          default:
            return true
        }
      })
    }

    // Сортировка
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'distance':
          return (a.distance || 999999) - (b.distance || 999999)
        case 'name':
          return a.title.localeCompare(b.title)
        case 'status':
          const statusOrder = { 'not_found': 0, 'discovered': 1, 'researched': 2 }
          return statusOrder[a.status] - statusOrder[b.status]
        case 'type':
          return a.type.localeCompare(b.type)
        default:
          return 0
      }
    })

    return filtered
  }, [points, searchQuery, sortBy, filterBy])

  const toggleExpanded = (pointKey: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(pointKey)) {
      newExpanded.delete(pointKey)
    } else {
      newExpanded.add(pointKey)
    }
    setExpandedItems(newExpanded)
  }

  const getStatusIcon = (status: Point['status']) => {
    switch (status) {
      case 'not_found':
        return <EyeOff className="w-4 h-4 text-zinc-500" />
      case 'discovered':
        return <Eye className="w-4 h-4 text-blue-400" />
      case 'researched':
        return <Star className="w-4 h-4 text-emerald-400" />
    }
  }

  const getStatusColor = (status: Point['status']) => {
    switch (status) {
      case 'not_found':
        return 'bg-zinc-800 border-zinc-600'
      case 'discovered':
        return 'bg-blue-900/30 border-blue-600'
      case 'researched':
        return 'bg-emerald-900/30 border-emerald-600'
    }
  }

  const getTypeColor = (type: Point['type']) => {
    switch (type) {
      case 'quest':
        return 'text-purple-400'
      case 'npc':
        return 'text-blue-400'
      case 'location':
        return 'text-green-400'
      case 'anomaly':
        return 'text-red-400'
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Поиск и фильтры */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Поиск точек..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-zinc-100 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as FilterOption)}
            className="px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-zinc-100 text-sm focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">Все</option>
            <option value="not_found">Не найдены</option>
            <option value="discovered">Обнаружены</option>
            <option value="researched">Исследованы</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-zinc-100 text-sm focus:border-emerald-500 focus:outline-none"
          >
            <option value="distance">По расстоянию</option>
            <option value="name">По имени</option>
            <option value="status">По статусу</option>
            <option value="type">По типу</option>
          </select>
        </div>
      </div>

      {/* Список точек */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {filteredAndSortedPoints.map((point, index) => {
            const isExpanded = expandedItems.has(point.key)

            return (
              <motion.div
                key={point.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'border rounded-lg p-3 cursor-pointer transition-colors',
                  getStatusColor(point.status),
                  'hover:bg-zinc-700/50'
                )}
                onClick={() => toggleExpanded(point.key)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon(point.status)}
                      <h4 className="font-medium text-zinc-100">{point.title}</h4>
                      <span className={cn('text-xs px-2 py-1 rounded', getTypeColor(point.type))}>
                        {point.type}
                      </span>
                    </div>

                    {point.description && (
                      <p className="text-sm text-zinc-400 mb-2 line-clamp-2">
                        {point.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                      {point.distance && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {point.distance < 1000
                            ? `${Math.round(point.distance)}м`
                            : `${(point.distance / 1000).toFixed(1)}км`
                          }
                        </div>
                      )}
                      {point.discoveredAt && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(point.discoveredAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="ml-2">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-zinc-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-zinc-400" />
                    )}
                  </div>
                </div>

                {/* Расширенная информация */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-3 pt-3 border-t border-zinc-600"
                    >
                      <div className="space-y-2">
                        <div>
                          <span className="text-xs text-zinc-400">Координаты:</span>
                          <div className="text-sm text-zinc-300 font-mono">
                            {point.coordinates.lat.toFixed(6)}, {point.coordinates.lng.toFixed(6)}
                          </div>
                        </div>

                        {point.phaseRequirement && (
                          <div>
                            <span className="text-xs text-zinc-400">Требуемая фаза:</span>
                            <div className="text-sm text-zinc-300">Фаза {point.phaseRequirement}</div>
                          </div>
                        )}

                        {point.tags && point.tags.length > 0 && (
                          <div>
                            <span className="text-xs text-zinc-400">Теги:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {point.tags.map(tag => (
                                <span
                                  key={tag}
                                  className="text-xs px-2 py-1 bg-zinc-700 text-zinc-300 rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2 pt-2">
                          <button className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors">
                            Показать на карте
                          </button>
                          {point.status === 'discovered' && (
                            <button className="text-xs px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors">
                              Исследовать
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {filteredAndSortedPoints.length === 0 && (
        <div className="text-center text-zinc-400 py-8">
          {points.length === 0 ? 'Точек не найдено' : 'Поиск не дал результатов'}
        </div>
      )}
    </div>
  )
}
