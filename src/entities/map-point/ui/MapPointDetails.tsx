import { 
  MapPin, 
  Users, 
  MessageSquare, 
  ShieldAlert, 
  Star, 
  Package,
  Heart,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react'
import type { MapPoint } from '../model/types'
import { formatDistance } from '../lib/distanceCalc'

interface MapPointDetailsProps {
  point: MapPoint
  distance?: number
  onClose?: () => void
  onInteract?: (point: MapPoint) => void
}

export function MapPointDetails({ point, distance, onClose, onInteract }: MapPointDetailsProps) {
  const { metadata, status } = point

  // Цвет фона в зависимости от типа и опасности
  const getBgColor = () => {
    if (metadata?.danger_level) {
      switch (metadata.danger_level) {
        case 'high':
        case 'extreme':
          return 'from-red-900/40 to-zinc-900/40'
        case 'medium':
          return 'from-orange-900/40 to-zinc-900/40'
        default:
          return 'from-zinc-900/40 to-zinc-800/40'
      }
    }
    return 'from-zinc-900/40 to-zinc-800/40'
  }

  // Иконка статуса
  const getStatusIcon = () => {
    switch (status) {
      case 'researched':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />
      case 'discovered':
        return <Clock className="w-5 h-5 text-blue-400" />
      default:
        return <MapPin className="w-5 h-5 text-zinc-400" />
    }
  }

  return (
    <div className={`
      fixed bottom-0 left-0 right-0 md:relative md:bottom-auto
      bg-gradient-to-br ${getBgColor()}
      backdrop-blur-lg border border-zinc-700
      rounded-t-2xl md:rounded-2xl
      p-6 shadow-2xl
      max-w-2xl mx-auto
      z-50
    `}>
      {/* Заголовок */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {getStatusIcon()}
            <h2 className="text-2xl font-bold text-zinc-100">{point.title}</h2>
          </div>
          
          {distance !== undefined && (
            <p className="text-sm text-zinc-400 flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {formatDistance(distance)}
            </p>
          )}
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Описание */}
      <p className="text-zinc-300 mb-4">{point.description}</p>

      {/* Атмосфера */}
      {metadata?.atmosphere && (
        <div className="mb-4 p-3 bg-zinc-900/50 border border-zinc-700/50 rounded-lg">
          <p className="text-sm text-zinc-400 italic">
            💭 {metadata.atmosphere}
          </p>
        </div>
      )}

      {/* Фракция */}
      {metadata?.faction && (
        <div className="mb-4">
          <div className="flex items-center gap-2 text-sm">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span className="text-zinc-400">Фракция:</span>
            <span className="text-amber-400 font-semibold">
              {getFactionName(metadata.faction)}
            </span>
          </div>
        </div>
      )}

      {/* NPC персонажи */}
      {metadata?.characterName && (
        <div className="mb-4 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-sm text-zinc-400">NPC:</p>
              <p className="text-blue-400 font-semibold">{metadata.characterName}</p>
            </div>
          </div>
        </div>
      )}

      {/* Сервисы */}
      {metadata?.services && metadata.services.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-zinc-400 mb-2 flex items-center gap-2">
            <Package className="w-4 h-4" />
            Доступные услуги:
          </h3>
          <div className="flex flex-wrap gap-2">
            {metadata.services.map(service => (
              <span
                key={service}
                className="px-3 py-1 bg-emerald-900/30 border border-emerald-700/50 text-emerald-400 text-xs rounded-full"
              >
                {getServiceName(service)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Уровень опасности */}
      {metadata?.danger_level && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-700/50 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <div>
              <p className="text-sm text-zinc-400">Уровень опасности:</p>
              <p className={`font-semibold ${getDangerColor(metadata.danger_level)}`}>
                {getDangerLabel(metadata.danger_level)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Опасности (для аномалий) */}
      {metadata?.hazards && (
        <div className="mb-4 p-3 bg-purple-900/20 border border-purple-700/50 rounded-lg">
          <h3 className="text-sm font-semibold text-purple-400 mb-2">⚠️ Опасности:</h3>
          <ul className="text-sm text-zinc-300 space-y-1">
            {metadata.hazards.radiation && (
              <li>☢️ Радиация: <span className={getHazardColor(metadata.hazards.radiation)}>{metadata.hazards.radiation}</span></li>
            )}
            {metadata.hazards.temporal_distortion && (
              <li>🌀 Временные искажения: <span className={getHazardColor(metadata.hazards.temporal_distortion)}>{metadata.hazards.temporal_distortion}</span></li>
            )}
            {metadata.hazards.hostile_entities && (
              <li>👾 Враждебные существа: <span className={getHazardColor(metadata.hazards.hostile_entities)}>{metadata.hazards.hostile_entities}</span></li>
            )}
          </ul>
        </div>
      )}

      {/* Требования доступа */}
      {(metadata?.minReputation || metadata?.unlockRequirements) && (
        <div className="mb-4 p-3 bg-amber-900/20 border border-amber-700/50 rounded-lg">
          <h3 className="text-sm font-semibold text-amber-400 mb-2">🔒 Требования:</h3>
          {metadata.minReputation && (
            <p className="text-sm text-zinc-300">
              <Heart className="w-4 h-4 inline mr-1" />
              Репутация: {metadata.minReputation}
            </p>
          )}
          {metadata.unlockRequirements && (
            <ul className="text-sm text-zinc-300 mt-2 space-y-1">
              {metadata.unlockRequirements.map((req, idx) => (
                <li key={idx}>• {req}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Награды (для аномалий) */}
      {metadata?.rewards && (
        <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
          <h3 className="text-sm font-semibold text-yellow-400 mb-2">💎 Возможные награды:</h3>
          <ul className="text-sm text-zinc-300 space-y-1">
            {metadata.rewards.artifacts && <li>✨ Артефакты</li>}
            {metadata.rewards.rareResources && <li>💰 Редкие ресурсы</li>}
            {metadata.rewards.scientificData && <li>📊 Научные данные</li>}
          </ul>
        </div>
      )}

      {/* Кнопки действий */}
      <div className="flex gap-3 mt-6">
        {status === 'discovered' && onInteract && (
          <button
            onClick={() => onInteract(point)}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg"
          >
            🔍 Исследовать
          </button>
        )}

        {metadata?.dialogues && metadata.dialogues.length > 0 && (
          <button
            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-5 h-5" />
            Поговорить
          </button>
        )}

        {metadata?.services?.includes('trade' as any) && (
          <button
            className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg"
          >
            💰 Торговать
          </button>
        )}
      </div>
    </div>
  )
}

// Вспомогательные функции
function getFactionName(faction: string): string {
  const factionNames: Record<string, string> = {
    synthesis: 'Синтез',
    fjr: 'FJR (Вольные егеря)',
    old_believers: 'Старообрядцы',
    anarchists: 'Анархисты',
    neutral: 'Нейтральная'
  }
  return factionNames[faction] || faction
}

function getServiceName(service: string): string {
  const serviceNames: Record<string, string> = {
    trade: 'Торговля',
    storage: 'Хранилище',
    repair: 'Ремонт',
    crafting: 'Крафт',
    upgrade: 'Улучшение',
    healing: 'Лечение',
    medicine_trade: 'Торговля медикаментами',
    first_aid_training: 'Обучение первой помощи',
    quests: 'Квесты',
    recruitment: 'Вербовка',
    news: 'Новости',
    blessing: 'Благословение',
    confession: 'Исповедь',
    shelter: 'Убежище',
    black_market: 'Чёрный рынок',
    underground_intel: 'Подпольная информация',
    refuge: 'Укрытие',
    information: 'Информация',
    rumors: 'Слухи',
    rest: 'Отдых',
    drinks: 'Напитки',
    exploration: 'Исследование',
    artifact_hunting: 'Охота за артефактами'
  }
  return serviceNames[service] || service
}

function getDangerLabel(level: string): string {
  const labels: Record<string, string> = {
    low: 'Низкий',
    medium: 'Средний',
    high: 'Высокий',
    extreme: 'Экстремальный'
  }
  return labels[level] || level
}

function getDangerColor(level: string): string {
  const colors: Record<string, string> = {
    low: 'text-yellow-400',
    medium: 'text-orange-400',
    high: 'text-red-400',
    extreme: 'text-purple-400'
  }
  return colors[level] || 'text-zinc-400'
}

function getHazardColor(level: string): string {
  const colors: Record<string, string> = {
    low: 'text-yellow-400',
    medium: 'text-orange-400',
    high: 'text-red-400'
  }
  return colors[level] || 'text-zinc-400'
}


