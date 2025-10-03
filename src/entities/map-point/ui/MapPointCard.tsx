import { MapPin, Navigation, Eye, CheckCircle } from 'lucide-react'
import type { MapPoint } from '../model/types'
import { formatDistance } from '../lib/distanceCalc'

interface MapPointCardProps {
  point: MapPoint
  distance?: number
  isSelected?: boolean
  onClick?: () => void
  onNavigate?: () => void
}

export function MapPointCard({ 
  point, 
  distance, 
  isSelected, 
  onClick, 
  onNavigate 
}: MapPointCardProps) {
  // Получаем цвет по статусу
  const getStatusColor = () => {
    switch (point.status) {
      case 'researched':
        return 'border-emerald-700/50 bg-emerald-900/20'
      case 'discovered':
        return 'border-blue-700/50 bg-blue-900/20'
      default:
        return 'border-zinc-700/50 bg-zinc-900/20'
    }
  }

  // Получаем текст статуса
  const getStatusText = () => {
    switch (point.status) {
      case 'researched':
        return 'Исследована'
      case 'discovered':
        return 'Обнаружена'
      default:
        return 'Не найдена'
    }
  }

  // Получаем иконку статуса
  const getStatusIcon = () => {
    switch (point.status) {
      case 'researched':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />
      case 'discovered':
        return <Eye className="w-4 h-4 text-blue-400" />
      default:
        return <MapPin className="w-4 h-4 text-zinc-500" />
    }
  }

  // Получаем метку типа
  const getTypeLabel = () => {
    switch (point.type) {
      case 'poi':
        return 'Достопримечательность'
      case 'quest':
        return 'Квест'
      case 'npc':
        return 'Персонаж'
      case 'location':
        return 'Локация'
      default:
        return point.type
    }
  }

  const statusColor = getStatusColor()

  return (
    <div
      onClick={onClick}
      className={`
        relative p-4 rounded-lg border backdrop-blur-sm
        transition-all duration-200 cursor-pointer
        ${statusColor}
        ${isSelected 
          ? 'ring-2 ring-emerald-400 shadow-lg shadow-emerald-500/20' 
          : 'hover:border-zinc-600/70 hover:shadow-md'
        }
      `}
    >
      {/* Заголовок и статус */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="text-base font-semibold text-zinc-100 mb-1">
            {point.title}
          </h3>
          <div className="flex items-center gap-2 text-xs">
            {getStatusIcon()}
            <span className="text-zinc-400">{getStatusText()}</span>
            {distance !== undefined && (
              <>
                <span className="text-zinc-600">•</span>
                <span className="text-zinc-400">{formatDistance(distance)}</span>
              </>
            )}
          </div>
        </div>

        {/* Тип точки badge */}
        <div className="px-2 py-1 rounded text-xs font-medium bg-zinc-800/50 text-zinc-300 whitespace-nowrap ml-2">
          {getTypeLabel()}
        </div>
      </div>

      {/* Описание */}
      {point.description && (
        <p className="text-sm text-zinc-400 mb-3 line-clamp-2">
          {point.description}
        </p>
      )}

      {/* Действия */}
      <div className="flex items-center gap-2">
        {onNavigate && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onNavigate()
            }}
            className="
              flex items-center gap-1 px-3 py-1.5 rounded
              text-xs font-medium
              bg-blue-600 hover:bg-blue-500
              text-white
              transition-colors
            "
          >
            <Navigation className="w-3 h-3" />
            <span>Показать на карте</span>
          </button>
        )}

        {point.status === 'discovered' && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              // TODO: Реализовать исследование точки
            }}
            className="
              flex items-center gap-1 px-3 py-1.5 rounded
              text-xs font-medium
              bg-emerald-600 hover:bg-emerald-500
              text-white
              transition-colors
            "
          >
            <CheckCircle className="w-3 h-3" />
            <span>Исследовать</span>
          </button>
        )}
      </div>

      {/* Индикатор выбора */}
      {isSelected && (
        <div className="absolute inset-0 rounded-lg border-2 border-emerald-400 pointer-events-none" />
      )}
    </div>
  )
}


