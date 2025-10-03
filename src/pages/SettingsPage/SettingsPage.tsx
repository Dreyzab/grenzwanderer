import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Settings, 
  Database, 
  MapPin, 
  Trash2, 
  Eye, 
  BarChart3, 
  MapPinCheck, 
  Volume2, 
  Sun,
  Zap,
  RefreshCw,
  Globe,
  Shield,
  Loader2
} from 'lucide-react'
import { 
  initMapPointsFromSeed, 
  clearMapPoints, 
  getMapPointsStats,
  discoverPointsInRadius 
} from '@/shared/api/mapPoints'
import { useMapPointStore } from '@/entities/map-point/model/store'
import { AnimatedCard, MotionContainer } from '@/shared/ui'

type Tab = 'general' | 'audio' | 'display' | 'data'

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('data')
  const [stats, setStats] = useState<ReturnType<typeof getMapPointsStats> | null>(null)
  const [message, setMessage] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  
  // Подписываемся на Map напрямую, не создавая новый массив каждый раз
  const pointsMap = useMapPointStore(state => state.points)
  
  // Создаём массив только когда Map действительно изменился
  const points = useMemo(() => Array.from(pointsMap.values()), [pointsMap])

  // Функции управления данными
  const handleInitPoints = async () => {
    setIsLoading(true)
    try {
      const initialized = initMapPointsFromSeed()
      setMessage(`⚡ Система инициализирована: ${initialized.length} локаций загружено`)
      updateStats()
    } catch (error) {
      setMessage(`💀 Критический сбой: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearPoints = async () => {
    if (!confirm('⚠️ Удалить все данные карты? Это действие необратимо.')) return
    
    setIsLoading(true)
    try {
      clearMapPoints()
      setMessage(`🗑️ Данные стёрты из памяти`)
      setStats(null)
    } catch (error) {
      setMessage(`💀 Ошибка очистки: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const updateStats = () => {
    const newStats = getMapPointsStats()
    setStats(newStats)
  }

  const handleDiscoverNearby = async () => {
    setIsLoading(true)
    try {
      const freiburgCenter = { lat: 47.9990, lng: 7.8421 }
      const discovered = discoverPointsInRadius(
        freiburgCenter.lat,
        freiburgCenter.lng,
        5000
      )
      setMessage(`🔍 Сканирование завершено: ${discovered} локаций в радиусе 5км`)
      updateStats()
    } catch (error) {
      setMessage(`💀 Сбой сканера: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDiscoverAll = async () => {
    setIsLoading(true)
    try {
      const store = useMapPointStore.getState()
      const allPoints = Array.from(store.points.values())
      
      allPoints.forEach(point => {
        if (point.status === 'not_found') {
          store.updatePointStatus(point.id, 'discovered')
        }
      })
      
      setMessage(`🌍 Все локации раскрыты (${allPoints.length})`)
      updateStats()
    } catch (error) {
      setMessage(`💀 Ошибка: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const tabs = [
    { 
      id: 'general' as const, 
      label: 'Общие', 
      icon: Settings,
      color: 'text-[color:var(--color-text-muted)]'
    },
    { 
      id: 'audio' as const, 
      label: 'Аудио', 
      icon: Volume2,
      color: 'text-[color:var(--color-cyan)]'
    },
    { 
      id: 'display' as const, 
      label: 'Дисплей', 
      icon: Sun,
      color: 'text-[color:var(--color-amber)]'
    },
    { 
      id: 'data' as const, 
      label: 'Данные', 
      icon: Database,
      color: 'text-[color:var(--color-success)]'
    }
  ]

  return (
    <div className="relative min-h-screen overflow-hidden bg-[color:var(--color-bg)] px-4 pb-16 pt-8">
      {/* Background gradients (как в ModernHomePage) */}
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -left-24 top-32 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.22),transparent_60%)] blur-3xl" />
        <div className="absolute -right-10 top-20 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(244,114,182,0.18),transparent_65%)] blur-3xl" />
        <div className="absolute bottom-10 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(79,70,229,0.16),transparent_70%)] blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="badge-glow mx-auto mb-3 bg-[linear-gradient(135deg,rgba(79,70,229,0.85),rgba(14,165,233,0.85))] text-[color:var(--color-bg)]">
            Панель управления системой
          </div>
          <div className="mb-4 inline-flex items-center gap-3">
            <Shield className="h-10 w-10 text-[color:var(--color-cyan)]" />
            <h1 className="text-5xl font-bold text-[color:var(--color-text-primary)]">Настройки</h1>
          </div>
          <p className="mt-4 text-sm uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">
            Конфигурация игрового мира «Grenzwanderer»
          </p>
          <div className="neon-divider mx-auto mt-6 w-64" />
        </motion.div>

        {/* Tabs Navigation */}
        <MotionContainer 
          stagger={0.08} 
          className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4"
          context="ui"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  quick-action relative overflow-hidden rounded-xl border p-4 transition-all duration-200
                  ${isActive 
                    ? 'border-[color:var(--color-border-strong)] bg-[color:var(--color-surface-elevated)]' 
                    : 'border-[color:var(--color-border)] bg-[color:var(--color-surface)] hover:border-[color:var(--color-border-strong)]'
                  }
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-[linear-gradient(135deg,rgba(79,70,229,0.12),rgba(34,211,238,0.08))]"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                
                <div className="relative z-10 flex flex-col items-center gap-2">
                  <Icon className={`h-6 w-6 ${isActive ? tab.color : 'text-[color:var(--color-text-muted)]'}`} />
                  <span className={`text-xs font-semibold uppercase tracking-[0.28em] ${
                    isActive ? 'text-[color:var(--color-text-primary)]' : 'text-[color:var(--color-text-muted)]'
                  }`}>
                    {tab.label}
                  </span>
                </div>
              </motion.button>
            )
          })}
        </MotionContainer>

        {/* Status Message */}
        <AnimatePresence mode="wait">
          {message && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.3 }}
              className="mb-6"
            >
              <AnimatedCard variant="glow" motionContext="ui" className="panel-secondary px-6 py-4">
                <p className="font-mono text-sm text-[color:var(--color-text-primary)]">{message}</p>
              </AnimatedCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'data' && (
              <div className="space-y-6">
                {/* Control Panel */}
                <AnimatedCard variant="glow" motionContext="ui" className="panel-secondary px-8 py-6">
                  <h2 className="mb-6 flex items-center gap-3 text-2xl font-bold text-[color:var(--color-text-primary)]">
                    <Zap className="h-6 w-6 text-[color:var(--color-cyan)]" />
                    Управление картой мира
                  </h2>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* Init Button */}
                    <motion.button
                      onClick={handleInitPoints}
                      disabled={isLoading}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="quick-action group relative overflow-hidden rounded-xl border border-[color:var(--color-success)]/40 bg-[linear-gradient(135deg,rgba(34,197,94,0.18),rgba(14,165,233,0.08))] p-4 transition-all duration-200 hover:border-[color:var(--color-success)]/70 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <div className="flex flex-col items-center gap-2 text-center">
                        {isLoading ? (
                          <Loader2 className="h-8 w-8 animate-spin text-[color:var(--color-success)]" />
                        ) : (
                          <MapPin className="h-8 w-8 text-[color:var(--color-success)] transition-transform group-hover:scale-110" />
                        )}
                        <span className="text-sm font-bold text-[color:var(--color-success)]">Загрузить точки</span>
                        <span className="text-xs text-[color:var(--color-text-muted)]">12+ локаций Freiburg</span>
                      </div>
                    </motion.button>

                    {/* Clear Button */}
                    <motion.button
                      onClick={handleClearPoints}
                      disabled={isLoading}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="quick-action group relative overflow-hidden rounded-xl border border-[color:var(--color-danger)]/40 bg-[linear-gradient(135deg,rgba(249,115,22,0.22),rgba(239,68,68,0.1))] p-4 transition-all duration-200 hover:border-[color:var(--color-danger)]/70 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <div className="flex flex-col items-center gap-2 text-center">
                        <Trash2 className="h-8 w-8 text-[color:var(--color-danger)] transition-transform group-hover:scale-110" />
                        <span className="text-sm font-bold text-[color:var(--color-danger)]">Очистить всё</span>
                        <span className="text-xs text-[color:var(--color-text-muted)]">Удалить данные</span>
                      </div>
                    </motion.button>

                    {/* Discover Nearby */}
                    <motion.button
                      onClick={handleDiscoverNearby}
                      disabled={isLoading}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="quick-action group relative overflow-hidden rounded-xl border border-[color:var(--color-cyan)]/40 bg-[linear-gradient(135deg,rgba(14,165,233,0.2),rgba(79,70,229,0.08))] p-4 transition-all duration-200 hover:border-[color:var(--color-cyan)]/70 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <div className="flex flex-col items-center gap-2 text-center">
                        <Eye className="h-8 w-8 text-[color:var(--color-cyan)] transition-transform group-hover:scale-110" />
                        <span className="text-sm font-bold text-[color:var(--color-cyan)]">Сканер 5км</span>
                        <span className="text-xs text-[color:var(--color-text-muted)]">Радиус от центра</span>
                      </div>
                    </motion.button>

                    {/* Discover All */}
                    <motion.button
                      onClick={handleDiscoverAll}
                      disabled={isLoading}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="quick-action group relative overflow-hidden rounded-xl border border-[color:var(--color-magenta)]/40 bg-[linear-gradient(135deg,rgba(236,72,153,0.2),rgba(79,70,229,0.08))] p-4 transition-all duration-200 hover:border-[color:var(--color-magenta)]/70 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <div className="flex flex-col items-center gap-2 text-center">
                        <Globe className="h-8 w-8 text-[color:var(--color-magenta)] transition-transform group-hover:scale-110" />
                        <span className="text-sm font-bold text-[color:var(--color-magenta)]">Раскрыть всё</span>
                        <span className="text-xs text-[color:var(--color-text-muted)]">Все локации</span>
                      </div>
                    </motion.button>
                  </div>
                </AnimatedCard>

                {/* Statistics */}
                {stats && (
                  <AnimatedCard variant="glow" motionContext="ui" className="panel-secondary px-8 py-6">
                    <div className="mb-6 flex items-center justify-between">
                      <h3 className="flex items-center gap-2 text-xl font-bold text-[color:var(--color-text-primary)]">
                        <BarChart3 className="h-5 w-5 text-[color:var(--color-cyan)]" />
                        Статистика карты
                      </h3>
                      <motion.button
                        onClick={updateStats}
                        whileHover={{ rotate: 180, scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-2 transition-colors hover:border-[color:var(--color-cyan)]/50"
                      >
                        <RefreshCw className="h-4 w-4 text-[color:var(--color-cyan)]" />
                      </motion.button>
                    </div>

                    <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                      <div className="panel-compact bg-[color:var(--color-surface)] border border-[color:var(--color-border)]">
                        <div className="stat-value text-[color:var(--color-cyan)]">{stats.total}</div>
                        <div className="stat-label">Всего точек</div>
                      </div>
                      <div className="panel-compact bg-[linear-gradient(135deg,rgba(14,165,233,0.12),rgba(79,70,229,0.06))] border border-[color:var(--color-cyan)]/30">
                        <div className="stat-value text-[color:var(--color-cyan)]">{stats.byStatus['discovered'] || 0}</div>
                        <div className="stat-label">Обнаружено</div>
                      </div>
                      <div className="panel-compact bg-[linear-gradient(135deg,rgba(236,72,153,0.12),rgba(79,70,229,0.06))] border border-[color:var(--color-magenta)]/30">
                        <div className="stat-value text-[color:var(--color-magenta)]">{stats.byStatus['researched'] || 0}</div>
                        <div className="stat-label">Исследовано</div>
                      </div>
                      <div className="panel-compact bg-[linear-gradient(135deg,rgba(250,204,21,0.12),rgba(59,130,246,0.06))] border border-[color:var(--color-amber)]/30">
                        <div className="stat-value text-[color:var(--color-amber)]">{stats.byStatus['not_found'] || 0}</div>
                        <div className="stat-label">Неизвестно</div>
                      </div>
                    </div>

                    {/* Map Points List */}
                    {points.length > 0 && (
                      <div>
                        <h4 className="panel-section-title mb-4">Локации ({points.length})</h4>
                        <MotionContainer 
                          stagger={0.05} 
                          className="max-h-96 space-y-2 overflow-y-auto pr-2"
                          context="ui"
                        >
                          {points.map((point) => (
                            <motion.div
                              key={point.id}
                              whileHover={{ x: 4 }}
                              className="glass-panel panel-compact border-[color:var(--color-border)]"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <div className="mb-1 flex items-center gap-2">
                                    <MapPinCheck className={`h-4 w-4 ${
                                      point.status === 'researched' ? 'text-[color:var(--color-magenta)]' :
                                      point.status === 'discovered' ? 'text-[color:var(--color-cyan)]' :
                                      'text-[color:var(--color-text-muted)]'
                                    }`} />
                                    <h5 className="font-semibold text-[color:var(--color-text-primary)]">{point.title}</h5>
                                  </div>
                                  <p className="line-clamp-2 text-xs text-[color:var(--color-text-secondary)]">{point.description}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <span className={`rounded border px-2 py-1 font-mono text-xs ${
                                    point.status === 'researched' ? 'border-[color:var(--color-magenta)]/50 bg-[color:var(--color-magenta)]/10 text-[color:var(--color-magenta)]' :
                                    point.status === 'discovered' ? 'border-[color:var(--color-cyan)]/50 bg-[color:var(--color-cyan)]/10 text-[color:var(--color-cyan)]' :
                                    'border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-text-muted)]'
                                  }`}>
                                    {point.status === 'researched' ? 'ИССЛЕДОВАНО' :
                                     point.status === 'discovered' ? 'ОБНАРУЖЕНО' :
                                     'НЕИЗВЕСТНО'}
                                  </span>
                                  <span className="font-mono text-xs text-[color:var(--color-text-muted)]">{point.type}</span>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </MotionContainer>
                      </div>
                    )}
                  </AnimatedCard>
                )}
              </div>
            )}

            {activeTab === 'general' && (
              <AnimatedCard variant="glow" motionContext="ui" className="panel-secondary px-8 py-6">
                <h2 className="mb-4 text-2xl font-bold text-[color:var(--color-text-primary)]">Общие настройки</h2>
                <p className="text-[color:var(--color-text-secondary)]">Скоро здесь появятся настройки игры...</p>
              </AnimatedCard>
            )}

            {activeTab === 'audio' && (
              <AnimatedCard variant="glow" motionContext="ui" className="panel-secondary px-8 py-6">
                <h2 className="mb-4 text-2xl font-bold text-[color:var(--color-text-primary)]">Настройки аудио</h2>
                <p className="text-[color:var(--color-text-secondary)]">Скоро здесь появятся аудио настройки...</p>
              </AnimatedCard>
            )}

            {activeTab === 'display' && (
              <AnimatedCard variant="glow" motionContext="ui" className="panel-secondary px-8 py-6">
                <h2 className="mb-4 text-2xl font-bold text-[color:var(--color-text-primary)]">Настройки дисплея</h2>
                <p className="text-[color:var(--color-text-secondary)]">Скоро здесь появятся настройки дисплея...</p>
              </AnimatedCard>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
