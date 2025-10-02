import { Search, X, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import type { MapPointType, MapPointStatus } from '@/entities/map-point/model/types'

interface LocationFiltersProps {
  selectedTypes: MapPointType[]
  selectedStatuses: MapPointStatus[]
  searchQuery: string
  onTypesChange: (types: MapPointType[]) => void
  onStatusesChange: (statuses: MapPointStatus[]) => void
  onSearchChange: (query: string) => void
  onClearAll: () => void
}

const POINT_TYPES: { value: MapPointType; label: string; color: string }[] = [
  { value: 'poi', label: 'Достопримечательность', color: 'bg-blue-600' },
  { value: 'quest', label: 'Квест', color: 'bg-purple-600' },
  { value: 'npc', label: 'Персонаж', color: 'bg-yellow-600' },
  { value: 'location', label: 'Локация', color: 'bg-green-600' },
]

const POINT_STATUSES: { value: MapPointStatus; label: string; color: string }[] = [
  { value: 'not_found', label: 'Не найдена', color: 'bg-zinc-600' },
  { value: 'discovered', label: 'Обнаружена', color: 'bg-blue-600' },
  { value: 'researched', label: 'Исследована', color: 'bg-emerald-600' },
]

export function LocationFilters({
  selectedTypes,
  selectedStatuses,
  searchQuery,
  onTypesChange,
  onStatusesChange,
  onSearchChange,
  onClearAll,
}: LocationFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const toggleType = (type: MapPointType) => {
    if (selectedTypes.includes(type)) {
      onTypesChange(selectedTypes.filter(t => t !== type))
    } else {
      onTypesChange([...selectedTypes, type])
    }
  }

  const toggleStatus = (status: MapPointStatus) => {
    if (selectedStatuses.includes(status)) {
      onStatusesChange(selectedStatuses.filter(s => s !== status))
    } else {
      onStatusesChange([...selectedStatuses, status])
    }
  }

  const hasActiveFilters = selectedTypes.length > 0 || selectedStatuses.length > 0 || searchQuery.length > 0

  return (
    <div className="w-full bg-zinc-900/80 backdrop-blur-sm border-b border-zinc-700">
      <div className="p-4 space-y-3">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Поиск точек на карте..."
            className="
              w-full pl-10 pr-10 py-2 rounded-lg
              bg-zinc-800 border border-zinc-700
              text-zinc-100 placeholder-zinc-500
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              transition-all
            "
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter toggle button */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-sm font-medium text-zinc-300 hover:text-zinc-100 transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Фильтры</span>
            {hasActiveFilters && (
              <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-xs">
                {selectedTypes.length + selectedStatuses.length}
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={onClearAll}
              className="text-sm text-zinc-400 hover:text-zinc-300 transition-colors"
            >
              Сбросить всё
            </button>
          )}
        </div>

        {/* Filters content */}
        {isExpanded && (
          <div className="space-y-3 pt-2 border-t border-zinc-700">
            {/* Type filters */}
            <div>
              <div className="text-xs font-semibold text-zinc-400 uppercase mb-2">
                Тип точки
              </div>
              <div className="flex flex-wrap gap-2">
                {POINT_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => toggleType(type.value)}
                    className={`
                      px-3 py-1.5 rounded-lg text-xs font-medium
                      transition-all
                      ${selectedTypes.includes(type.value)
                        ? `${type.color} text-white shadow-md`
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }
                    `}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status filters */}
            <div>
              <div className="text-xs font-semibold text-zinc-400 uppercase mb-2">
                Статус исследования
              </div>
              <div className="flex flex-wrap gap-2">
                {POINT_STATUSES.map((status) => (
                  <button
                    key={status.value}
                    onClick={() => toggleStatus(status.value)}
                    className={`
                      px-3 py-1.5 rounded-lg text-xs font-medium
                      transition-all
                      ${selectedStatuses.includes(status.value)
                        ? `${status.color} text-white shadow-md`
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }
                    `}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
