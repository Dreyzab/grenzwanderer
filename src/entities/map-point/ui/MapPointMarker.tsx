import { 
  MapPin, 
  MapPinCheck, 
  MapPinX, 
  Users, 
  Package, 
  MapPinned,
  MessageSquare,
  Home,
  Zap
} from 'lucide-react'
import type { MapPointType, MapPointStatus } from '../model/types'

interface MapPointMarkerProps {
  type: MapPointType
  status: MapPointStatus
  isSelected?: boolean
  onClick?: () => void
  dangerLevel?: 'low' | 'medium' | 'high' | 'extreme'
}

export function MapPointMarker({ type, status, isSelected, onClick, dangerLevel }: MapPointMarkerProps) {
  // Получаем иконку по типу точки
  const getIconByType = () => {
    switch (type) {
      case 'poi':
        return MapPin
      case 'quest':
        return MapPinned
      case 'npc':
        return Users
      case 'location':
        return Package
      case 'board':
        return MessageSquare
      case 'settlement':
        return Home
      case 'anomaly':
        return Zap
      default:
        return MapPin
    }
  }

  // Получаем цвет по статусу с учетом опасности
  const getColorByStatus = () => {
    // Для аномалий и опасных зон - специальная цветовая схема
    if (dangerLevel) {
      switch (dangerLevel) {
        case 'low':
          return 'text-yellow-400 bg-yellow-900/80'
        case 'medium':
          return 'text-orange-400 bg-orange-900/80'
        case 'high':
          return 'text-red-400 bg-red-900/80'
        case 'extreme':
          return 'text-purple-400 bg-purple-900/80'
      }
    }

    // Стандартные цвета по статусу
    switch (status) {
      case 'not_found':
        return 'text-zinc-500 bg-zinc-900/80'
      case 'discovered':
        return 'text-blue-400 bg-blue-900/80'
      case 'researched':
        return 'text-emerald-400 bg-emerald-900/80'
      default:
        return 'text-zinc-400 bg-zinc-800/80'
    }
  }

  // Получаем иконку статуса
  const getStatusIcon = () => {
    switch (status) {
      case 'researched':
        return MapPinCheck
      case 'discovered':
        return MapPin
      case 'not_found':
        return MapPinX
    }
  }

  const Icon = getIconByType()
  const StatusIcon = getStatusIcon()
  const colorClass = getColorByStatus()

  return (
    <div
      onClick={onClick}
      className={`
        relative flex items-center justify-center
        w-10 h-10 rounded-full
        border-2 transition-all duration-200 cursor-pointer
        ${colorClass}
        ${isSelected 
          ? 'border-emerald-400 scale-125 shadow-lg shadow-emerald-500/50' 
          : 'border-zinc-700 hover:scale-110 hover:border-zinc-600'
        }
      `}
    >
      {/* Основная иконка типа */}
      <Icon className="w-5 h-5" />
      
      {/* Иконка статуса (badge) */}
      <div
        className={`
          absolute -top-1 -right-1
          w-4 h-4 rounded-full
          flex items-center justify-center
          ${status === 'researched' ? 'bg-emerald-500' : 
            status === 'discovered' ? 'bg-blue-500' : 'bg-zinc-600'}
        `}
      >
        <StatusIcon className="w-3 h-3 text-white" />
      </div>

      {/* Пульсирующий эффект для выбранной точки */}
      {isSelected && (
        <div className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-ping opacity-75" />
      )}

      {/* Пульсирующий эффект для опасных зон */}
      {dangerLevel && (dangerLevel === 'high' || dangerLevel === 'extreme') && (
        <div className={`absolute inset-0 rounded-full border-2 animate-pulse opacity-50 ${
          dangerLevel === 'extreme' ? 'border-purple-400' : 'border-red-400'
        }`} />
      )}
    </div>
  )
}

