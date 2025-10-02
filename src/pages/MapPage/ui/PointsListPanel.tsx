import { useState } from 'react'
import { ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react'
import { MapPointCard } from '@/entities/map-point/ui/MapPointCard'
import type { MapPoint, MapPointSortBy } from '@/entities/map-point/model/types'
import { calculateDistance } from '@/entities/map-point/lib/distanceCalc'

interface PointsListPanelProps {
  points: MapPoint[]
  userLocation: { lat: number; lng: number } | null
  selectedPointId: string | null
  isOpen: boolean
  onToggle: () => void
  onSelectPoint: (pointId: string) => void
  onNavigateToPoint: (point: MapPoint) => void
}

const SORT_OPTIONS: { value: MapPointSortBy; label: string }[] = [
  { value: 'distance', label: 'По расстоянию' },
  { value: 'name', label: 'По названию' },
  { value: 'type', label: 'По типу' },
  { value: 'status', label: 'По статусу' },
]

export function PointsListPanel({
  points,
  userLocation,
  selectedPointId,
  isOpen,
  onToggle,
  onSelectPoint,
  onNavigateToPoint,
}: PointsListPanelProps) {
  const [sortBy, setSortBy] = useState<MapPointSortBy>('distance')

  // Calculate distances and sort points
  const enrichedPoints = points.map(point => {
    const distance = userLocation 
      ? calculateDistance(userLocation, point.coordinates)
      : undefined

    return { ...point, distance }
  })

  // Sort points
  const sortedPoints = [...enrichedPoints].sort((a, b) => {
    switch (sortBy) {
      case 'distance':
        if (a.distance === undefined) return 1
        if (b.distance === undefined) return -1
        return a.distance - b.distance
      
      case 'name':
        return a.title.localeCompare(b.title)
      
      case 'type':
        return a.type.localeCompare(b.type)
      
      case 'status':
        const statusOrder = { 'not_found': 0, 'discovered': 1, 'researched': 2 }
        return statusOrder[a.status || 'not_found'] - statusOrder[b.status || 'not_found']
      
      default:
        return 0
    }
  })

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className={`
          fixed top-1/2 -translate-y-1/2 z-20
          p-2 bg-zinc-900/80 backdrop-blur-sm border border-zinc-700
          hover:bg-zinc-800 rounded-r-lg
          transition-all duration-300
          ${isOpen ? 'left-96' : 'left-0'}
        `}
        aria-label={isOpen ? 'Скрыть панель' : 'Показать панель'}
      >
        {isOpen ? (
          <ChevronLeft className="w-5 h-5 text-zinc-300" />
        ) : (
          <ChevronRight className="w-5 h-5 text-zinc-300" />
        )}
      </button>

      {/* Panel */}
      <div
        className={`
          fixed left-0 top-0 bottom-0 w-96 z-10
          bg-zinc-900/95 backdrop-blur-md border-r border-zinc-700
          transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          flex flex-col
        `}
      >
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b border-zinc-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-zinc-100">
              Точки на карте
            </h2>
            <span className="px-2 py-1 rounded-full bg-blue-600 text-white text-xs font-medium">
              {points.length}
            </span>
          </div>

          {/* Sort dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as MapPointSortBy)}
              className="
                w-full px-3 py-2 pr-10 rounded-lg
                bg-zinc-800 border border-zinc-700
                text-zinc-100 text-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500
                appearance-none cursor-pointer
              "
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          </div>
        </div>

        {/* Points list */}
        <div className="flex-1 overflow-y-auto">
          {sortedPoints.length === 0 ? (
            <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
              Нет точек для отображения
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {sortedPoints.map((point) => (
                <MapPointCard
                  key={point.id}
                  point={point}
                  distance={point.distance}
                  isSelected={selectedPointId === point.id}
                  onClick={() => onSelectPoint(point.id)}
                  onNavigate={() => onNavigateToPoint(point)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
