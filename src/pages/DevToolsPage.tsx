import { useState } from 'react'
import { 
  initMapPointsFromSeed, 
  clearMapPoints, 
  getMapPointsStats,
  discoverPointsInRadius 
} from '@/shared/api/mapPoints'
import { useMapPointStore } from '@/entities/map-point/model/store'
import { MapPin, Trash2, Eye, BarChart3, MapPinCheck } from 'lucide-react'

/**
 * Страница инструментов разработчика
 * Для тестирования и инициализации данных
 */
export function DevToolsPage() {
  const [stats, setStats] = useState<ReturnType<typeof getMapPointsStats> | null>(null)
  const [message, setMessage] = useState<string>('')
  const points = useMapPointStore(state => Array.from(state.points.values()))

  const handleInitPoints = () => {
    try {
      const initialized = initMapPointsFromSeed()
      setMessage(`✅ Инициализировано ${initialized.length} точек карты`)
      updateStats()
    } catch (error) {
      setMessage(`❌ Ошибка: ${error}`)
    }
  }

  const handleClearPoints = () => {
    clearMapPoints()
    setMessage('🗑️ Все точки удалены')
    setStats(null)
  }

  const updateStats = () => {
    const newStats = getMapPointsStats()
    setStats(newStats)
    setMessage('📊 Статистика обновлена')
  }

  const handleDiscoverNearby = () => {
    // Freiburg центр для теста
    const freiburgCenter = { lat: 47.9990, lng: 7.8421 }
    const discovered = discoverPointsInRadius(
      freiburgCenter.lat,
      freiburgCenter.lng,
      5000 // 5км радиус
    )
    setMessage(`🔍 Обнаружено ${discovered} точек`)
    updateStats()
  }

  const handleDiscoverAll = () => {
    const store = useMapPointStore.getState()
    const allPoints = Array.from(store.points.values())
    
    allPoints.forEach(point => {
      if (point.status === 'not_found') {
        store.updatePointStatus(point.id, 'discovered')
      }
    })
    
    setMessage(`✅ Все точки обнаружены (${allPoints.length})`)
    updateStats()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-zinc-100 mb-2">
            🛠️ Dev Tools
          </h1>
          <p className="text-zinc-400">
            Инструменты для тестирования и отладки Map Points
          </p>
        </div>

        {/* Сообщения */}
        {message && (
          <div className="mb-6 p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg">
            <p className="text-zinc-100">{message}</p>
          </div>
        )}

        {/* Действия */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Инициализация */}
          <button
            onClick={handleInitPoints}
            className="p-6 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-lg transition-all duration-200 shadow-lg flex items-center gap-3"
          >
            <MapPin className="w-6 h-6" />
            <div className="text-left">
              <div className="font-semibold">Инициализировать точки</div>
              <div className="text-sm text-emerald-100">Загрузить 12 точек из seed данных</div>
            </div>
          </button>

          {/* Очистка */}
          <button
            onClick={handleClearPoints}
            className="p-6 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-lg transition-all duration-200 shadow-lg flex items-center gap-3"
          >
            <Trash2 className="w-6 h-6" />
            <div className="text-left">
              <div className="font-semibold">Очистить все точки</div>
              <div className="text-sm text-red-100">Удалить все данные</div>
            </div>
          </button>

          {/* Обнаружить ближайшие */}
          <button
            onClick={handleDiscoverNearby}
            className="p-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-lg transition-all duration-200 shadow-lg flex items-center gap-3"
          >
            <Eye className="w-6 h-6" />
            <div className="text-left">
              <div className="font-semibold">Обнаружить ближайшие</div>
              <div className="text-sm text-blue-100">В радиусе 5км от центра Freiburg</div>
            </div>
          </button>

          {/* Обнаружить все */}
          <button
            onClick={handleDiscoverAll}
            className="p-6 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-lg transition-all duration-200 shadow-lg flex items-center gap-3"
          >
            <MapPinCheck className="w-6 h-6" />
            <div className="text-left">
              <div className="font-semibold">Обнаружить все</div>
              <div className="text-sm text-purple-100">Сделать все точки видимыми</div>
            </div>
          </button>

          {/* Статистика */}
          <button
            onClick={updateStats}
            className="p-6 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-lg transition-all duration-200 shadow-lg flex items-center gap-3 md:col-span-2"
          >
            <BarChart3 className="w-6 h-6" />
            <div className="text-left">
              <div className="font-semibold">Обновить статистику</div>
              <div className="text-sm text-amber-100">Пересчитать данные</div>
            </div>
          </button>
        </div>

        {/* Статистика */}
        {stats && (
          <div className="bg-zinc-900/50 border border-zinc-700 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-zinc-100 mb-4">📊 Статистика</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Всего */}
              <div className="p-4 bg-zinc-800/50 border border-zinc-700/50 rounded-lg">
                <div className="text-sm text-zinc-400 mb-1">Всего точек</div>
                <div className="text-3xl font-bold text-emerald-400">{stats.total}</div>
              </div>

              {/* По типам */}
              <div className="p-4 bg-zinc-800/50 border border-zinc-700/50 rounded-lg">
                <div className="text-sm text-zinc-400 mb-2">По типам</div>
                {Object.entries(stats.byType).map(([type, count]) => (
                  <div key={type} className="flex justify-between text-sm mb-1">
                    <span className="text-zinc-300">{type}:</span>
                    <span className="text-blue-400 font-semibold">{count}</span>
                  </div>
                ))}
              </div>

              {/* По статусам */}
              <div className="p-4 bg-zinc-800/50 border border-zinc-700/50 rounded-lg">
                <div className="text-sm text-zinc-400 mb-2">По статусам</div>
                {Object.entries(stats.byStatus).map(([status, count]) => (
                  <div key={status} className="flex justify-between text-sm mb-1">
                    <span className="text-zinc-300">{status}:</span>
                    <span className={`font-semibold ${
                      status === 'researched' ? 'text-emerald-400' :
                      status === 'discovered' ? 'text-blue-400' : 'text-zinc-400'
                    }`}>{count}</span>
                  </div>
                ))}
              </div>

              {/* По фракциям */}
              <div className="p-4 bg-zinc-800/50 border border-zinc-700/50 rounded-lg">
                <div className="text-sm text-zinc-400 mb-2">По фракциям</div>
                {Object.entries(stats.byFaction).map(([faction, count]) => (
                  <div key={faction} className="flex justify-between text-sm mb-1">
                    <span className="text-zinc-300">{faction}:</span>
                    <span className="text-amber-400 font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Список точек */}
        {points.length > 0 && (
          <div className="bg-zinc-900/50 border border-zinc-700 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-zinc-100 mb-4">🗺️ Точки карты ({points.length})</h2>
            
            <div className="space-y-3">
              {points.map(point => (
                <div
                  key={point.id}
                  className="p-4 bg-zinc-800/50 border border-zinc-700/50 rounded-lg hover:border-zinc-600/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          point.status === 'researched' ? 'bg-emerald-900/50 text-emerald-400' :
                          point.status === 'discovered' ? 'bg-blue-900/50 text-blue-400' :
                          'bg-zinc-700/50 text-zinc-400'
                        }`}>
                          {point.status || 'not_found'}
                        </span>
                        <span className="px-2 py-1 text-xs font-semibold rounded bg-purple-900/50 text-purple-400">
                          {point.type}
                        </span>
                        {point.metadata?.faction && (
                          <span className="px-2 py-1 text-xs font-semibold rounded bg-amber-900/50 text-amber-400">
                            {point.metadata.faction}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-zinc-100 mb-1">{point.title}</h3>
                      <p className="text-sm text-zinc-400 mb-2">{point.description}</p>
                      {point.metadata?.characterName && (
                        <p className="text-sm text-blue-400">👤 {point.metadata.characterName}</p>
                      )}
                    </div>
                    <div className="text-right text-sm text-zinc-500">
                      <div>Фаза {point.phase || 1}</div>
                      <div className="text-xs">
                        {point.coordinates.lat.toFixed(4)}, {point.coordinates.lng.toFixed(4)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}



