import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  Users,
  Clock,
  Target,
  BarChart3,
  Download,
  RefreshCw,
  Calendar
} from 'lucide-react'
import { useAnalyticsStore } from '../model/analyticsStore'
import { AnimatedCard } from '../../../shared/ui/components/AnimatedCard'
import { Button } from '../../../shared/ui/components/Button'
import { cn } from '../../../shared/lib/utils/cn'

interface AnalyticsDashboardProps {
  className?: string
}

export function AnalyticsDashboard({ className }: AnalyticsDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d')
  const [isLoading, setIsLoading] = useState(false)
  const {
    gameMetrics,
    events,
    getEventsByDateRange,
    getPlayerRetention,
    getFeatureUsage,
    getConversionFunnel,
    exportData,
    syncWithServer,
    clearOldData
  } = useAnalyticsStore()

  const periods = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
  }

  useEffect(() => {
    const days = periods[selectedPeriod]
    const endDate = new Date()
    const startDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000))

    // Получаем события за период
    const periodEvents = getEventsByDateRange(startDate, endDate)

    console.log(`Analytics for ${selectedPeriod}:`, {
      events: periodEvents.length,
      retention: getPlayerRetention(days),
    })
  }, [selectedPeriod, getEventsByDateRange, getPlayerRetention])

  const handleExport = (format: 'json' | 'csv') => {
    const data = exportData(format)
    const blob = new Blob([data], {
      type: format === 'json' ? 'application/json' : 'text/csv'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `grenzwanderer-analytics-${selectedPeriod}.${format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleSync = async () => {
    setIsLoading(true)
    try {
      await syncWithServer()
    } finally {
      setIsLoading(false)
    }
  }

  const handleCleanup = () => {
    clearOldData(30) // Очищаем данные старше 30 дней
  }

  const getRecentEvents = () => {
    const days = periods[selectedPeriod]
    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000)
    return events.filter(event => event.timestamp >= cutoffTime)
  }

  const recentEvents = getRecentEvents()

  // Вычисляем метрики для периода
  const periodMetrics = {
    totalEvents: recentEvents.length,
    uniquePlayers: new Set(recentEvents.map(e => e.userId)).size,
    avgSessionDuration: gameMetrics.averageSessionDuration,
    questCompletionRate: gameMetrics.questCompletionRate,
    retention: getPlayerRetention(periods[selectedPeriod]),
  }

  const conversionFunnel = getConversionFunnel([
    'app_open',
    'quest_start',
    'quest_complete',
    'level_up'
  ])

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100">Аналитика</h2>
          <p className="text-zinc-400">Метрики и статистика игры</p>
        </div>

        <div className="flex gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-3 py-2 bg-zinc-800 border border-zinc-600 rounded text-zinc-100"
          >
            <option value="7d">7 дней</option>
            <option value="30d">30 дней</option>
            <option value="90d">90 дней</option>
          </select>

          <Button
            onClick={handleSync}
            disabled={isLoading}
            variant="secondary"
            size="sm"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>

          <Button
            onClick={() => handleExport('json')}
            variant="secondary"
            size="sm"
          >
            <Download className="w-4 h-4 mr-2" />
            JSON
          </Button>

          <Button
            onClick={() => handleExport('csv')}
            variant="secondary"
            size="sm"
          >
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatedCard className="p-4 text-center">
          <TrendingUp className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
          <div className="text-2xl font-bold text-zinc-100 mb-1">
            {periodMetrics.totalEvents}
          </div>
          <div className="text-sm text-zinc-400">Событий</div>
        </AnimatedCard>

        <AnimatedCard className="p-4 text-center">
          <Users className="w-8 h-8 mx-auto mb-2 text-blue-400" />
          <div className="text-2xl font-bold text-zinc-100 mb-1">
            {periodMetrics.uniquePlayers}
          </div>
          <div className="text-sm text-zinc-400">Активных игроков</div>
        </AnimatedCard>

        <AnimatedCard className="p-4 text-center">
          <Target className="w-8 h-8 mx-auto mb-2 text-purple-400" />
          <div className="text-2xl font-bold text-zinc-100 mb-1">
            {periodMetrics.questCompletionRate.toFixed(1)}%
          </div>
          <div className="text-sm text-zinc-400">Выполнение квестов</div>
        </AnimatedCard>

        <AnimatedCard className="p-4 text-center">
          <Clock className="w-8 h-8 mx-auto mb-2 text-orange-400" />
          <div className="text-2xl font-bold text-zinc-100 mb-1">
            {Math.round(periodMetrics.retention)}%
          </div>
          <div className="text-sm text-zinc-400">Удержание</div>
        </AnimatedCard>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <AnimatedCard className="p-6">
          <h3 className="text-lg font-semibold text-zinc-100 mb-4">Конверсионная воронка</h3>
          <div className="space-y-3">
            {Object.entries(conversionFunnel).map(([step, value]) => {
              if (step.includes('_to_')) {
                const [, from, to] = step.split('_to_')
                return (
                  <div key={step} className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">{from} → {to}</span>
                    <span className="text-sm text-emerald-400">{value.toFixed(1)}%</span>
                  </div>
                )
              }
              return null
            })}
          </div>
        </AnimatedCard>

        {/* Feature Usage */}
        <AnimatedCard className="p-6">
          <h3 className="text-lg font-semibold text-zinc-100 mb-4">Использование функций</h3>
          <div className="space-y-3">
            {[
              { name: 'QR Scanner', usage: getFeatureUsage('qr_scanner') },
              { name: 'Map', usage: getFeatureUsage('map') },
              { name: 'Combat', usage: getFeatureUsage('combat') },
              { name: 'Inventory', usage: getFeatureUsage('inventory') },
              { name: 'Multiplayer', usage: getFeatureUsage('multiplayer') },
            ].map(({ name, usage }) => (
              <div key={name} className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">{name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-zinc-700 rounded">
                    <div
                      className="h-full bg-emerald-500 rounded"
                      style={{ width: `${Math.min((usage / Math.max(...Object.values(getFeatureUsage as any))) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm text-zinc-300">{usage}</span>
                </div>
              </div>
            ))}
          </div>
        </AnimatedCard>
      </div>

      {/* Event Timeline */}
      <AnimatedCard className="p-6">
        <h3 className="text-lg font-semibold text-zinc-100 mb-4">Таймлайн событий</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {recentEvents.slice(-20).reverse().map((event) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 p-2 bg-zinc-800/30 rounded"
            >
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              <div className="flex-1">
                <div className="text-sm text-zinc-100">{event.type}</div>
                <div className="text-xs text-zinc-400">
                  {new Date(event.timestamp).toLocaleString()}
                </div>
              </div>
              <div className="text-xs text-zinc-500">
                {event.userId.slice(0, 8)}...
              </div>
            </motion.div>
          ))}
        </div>
      </AnimatedCard>

      {/* Game Metrics */}
      <AnimatedCard className="p-6">
        <h3 className="text-lg font-semibold text-zinc-100 mb-4">Общие метрики</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400 mb-1">
              {gameMetrics.totalPlayers}
            </div>
            <div className="text-sm text-zinc-400">Всего игроков</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-400 mb-1">
              {gameMetrics.activePlayers}
            </div>
            <div className="text-sm text-zinc-400">Активных игроков</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400 mb-1">
              {Math.round(gameMetrics.combatWinRate)}%
            </div>
            <div className="text-sm text-zinc-400">Побед в бою</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-orange-400 mb-1">
              {Math.round(gameMetrics.averageSessionDuration / 60)}м
            </div>
            <div className="text-sm text-zinc-400">Средняя сессия</div>
          </div>
        </div>
      </AnimatedCard>

      {/* Data Management */}
      <AnimatedCard className="p-6">
        <h3 className="text-lg font-semibold text-zinc-100 mb-4">Управление данными</h3>
        <div className="flex gap-3">
          <Button
            onClick={handleCleanup}
            variant="secondary"
            size="sm"
          >
            Очистить старые данные
          </Button>

          <Button
            onClick={() => handleExport('json')}
            variant="secondary"
            size="sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Экспорт JSON
          </Button>

          <Button
            onClick={() => handleExport('csv')}
            variant="secondary"
            size="sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Экспорт CSV
          </Button>
        </div>

        <div className="mt-4 text-sm text-zinc-400">
          Последняя синхронизация: {new Date(Date.now()).toLocaleString()}
        </div>
      </AnimatedCard>
    </div>
  )
}
