import React, { useEffect, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Map, 
  BookOpen, 
  Sword, 
  Package, 
  Settings, 
  QrCode,
  TrendingUp,
  Calendar,
  Zap,
  Heart,
  Target,
  Award,
  Loader2
} from 'lucide-react'

// Modern imports using new architecture
import { usePlayerProfile, usePlayerStats, useBootstrapPlayer } from '@/shared/api/hooks/usePlayerData'
import { useActiveQuests, useQuestStats } from '@/shared/api/hooks/useQuestData'
import { useDashboardStore } from '@/shared/stores/useDashboardStore'
import { useAuth } from '@clerk/clerk-react'
import { AnimatedCard, MotionContainer } from '@/shared/ui'

// Legacy imports for backwards compatibility
import { useVNStore } from '@/entities/visual-novel/model/store'
import { scenarios } from '@/entities/visual-novel/api/scenarios'

// Types
import type { QuickAction, DashboardStats } from '@/shared/types/dashboard'

// Loading fallback component
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      <span className="ml-2 text-zinc-400">Загрузка...</span>
    </div>
  )
}

// Error boundary component
function ErrorFallback({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div className="text-center p-8 bg-red-900/30 border border-red-700/50 rounded-lg">
      <p className="text-red-400 mb-4">Ошибка загрузки: {error.message}</p>
      <button 
        onClick={retry}
        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
      >
        Повторить
      </button>
    </div>
  )
}

// Player Status Card with server state
function PlayerStatusCard() {
  const { data: playerProfile, isLoading, error } = usePlayerProfile()
  const { data: playerStats } = usePlayerStats()
  
  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorFallback error={error as Error} retry={() => window.location.reload()} />
  
  const phase = playerProfile?.phase || 1
  const fame = playerProfile?.fame || 0
  
  const getPhaseDescription = (phase: number) => {
    switch(phase) {
      case 1: return 'Беженец'
      case 2: return 'Житель'
      case 3: return 'Активист'
      default: return `Фаза ${phase}`
    }
  }
  
  return (
    <AnimatedCard 
      variant="glow" 
      className="mb-8 bg-gradient-to-r from-emerald-900/40 to-blue-900/40 border-emerald-700/50"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-zinc-100">Статус игрока</h2>
            <p className="text-emerald-300">{getPhaseDescription(phase)}</p>
          </div>
          <motion.div
            className="text-right"
            whileHover={{ scale: 1.05 }}
          >
            <div className="text-2xl font-bold text-emerald-400">{fame}</div>
            <div className="text-sm text-zinc-400">репутации</div>
          </motion.div>
        </div>

        {/* Progress Stats with real data */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div 
            className="text-center"
            whileHover={{ y: -2 }}
          >
            <div className="flex items-center justify-center mb-2">
              <Target className="text-purple-400 mr-2" size={20} />
              <span className="text-lg font-semibold text-zinc-100">
                {playerStats?.completedQuests || 0}/{playerStats?.totalQuests || 0}
              </span>
            </div>
            <div className="text-xs text-zinc-400">Квестов завершено</div>
          </motion.div>

          <motion.div 
            className="text-center"
            whileHover={{ y: -2 }}
          >
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="text-emerald-400 mr-2" size={20} />
              <span className="text-lg font-semibold text-zinc-100">{fame}</span>
            </div>
            <div className="text-xs text-zinc-400">Опыта получено</div>
          </motion.div>

          <motion.div 
            className="text-center"
            whileHover={{ y: -2 }}
          >
            <div className="flex items-center justify-center mb-2">
              <Calendar className="text-blue-400 mr-2" size={20} />
              <span className="text-lg font-semibold text-zinc-100">
                {playerStats?.daysSinceStart || 1}
              </span>
            </div>
            <div className="text-xs text-zinc-400">Дней в игре</div>
          </motion.div>

          <motion.div 
            className="text-center"
            whileHover={{ y: -2 }}
          >
            <div className="flex items-center justify-center mb-2">
              <Award className="text-yellow-400 mr-2" size={20} />
              <span className="text-lg font-semibold text-zinc-100">{phase}</span>
            </div>
            <div className="text-xs text-zinc-400">Фаза развития</div>
          </motion.div>
        </div>
      </div>
    </AnimatedCard>
  )
}

// Active Quests List with TanStack Query
function ActiveQuestsList() {
  const { data: activeQuests, isLoading, error } = useActiveQuests()
  const { data: questStats } = useQuestStats()
  
  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorFallback error={error as Error} retry={() => window.location.reload()} />
  
  return (
    <AnimatedCard className="bg-zinc-900/50 border-zinc-700">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-zinc-100 mb-4">
          Активные квесты
          {questStats && (
            <span className="text-sm text-zinc-400 ml-2">
              ({questStats.completedQuests}/{questStats.totalQuests})
            </span>
          )}
        </h3>
        
        <div className="space-y-3">
          <AnimatePresence>
            {activeQuests?.slice(0, 3).map((quest, index) => (
              <motion.div
                key={quest.questId}
                className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-zinc-100">
                    {quest.questId.replace(/_/g, ' ')}
                  </div>
                  <div className="text-xs text-zinc-400">
                    Статус: {quest.currentStep || 'unknown'}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {(!activeQuests || activeQuests.length === 0) && (
            <div className="text-center py-6 text-zinc-400">
              <BookOpen size={32} className="mx-auto mb-2 opacity-50" />
              <div>Нет активных квестов</div>
            </div>
          )}
        </div>
        
        <Link 
          to="/quests"
          className="block mt-4 text-center text-emerald-400 hover:text-emerald-300 transition-colors text-sm"
        >
          Посмотреть все квесты →
        </Link>
      </div>
    </AnimatedCard>
  )
}

// Quick Actions with enhanced state
function QuickActionsGrid() {
  const { recordInteraction } = useDashboardStore()
  
  const quickActions: QuickAction[] = [
    {
      id: 'qr',
      icon: QrCode,
      label: 'QR Сканер',
      description: 'Сканировать код локации',
      path: '/qr',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-900/30',
      borderColor: 'border-emerald-700/50',
      isEnabled: true,
    },
    {
      id: 'map',
      icon: Map,
      label: 'Карта',
      description: 'Открыть игровую карту',
      path: '/enhanced-map',
      color: 'text-blue-400',
      bgColor: 'bg-blue-900/30',
      borderColor: 'border-blue-700/50',
      isEnabled: true,
    },
    {
      id: 'quests',
      icon: BookOpen,
      label: 'Квесты',
      description: 'Управление заданиями',
      path: '/quests',
      color: 'text-purple-400',
      bgColor: 'bg-purple-900/30',
      borderColor: 'border-purple-700/50',
      isEnabled: true,
    },
    {
      id: 'combat',
      icon: Sword,
      label: 'Бой',
      description: 'Карточная боевая система',
      path: '/enhanced-combat',
      color: 'text-red-400',
      bgColor: 'bg-red-900/30',
      borderColor: 'border-red-700/50',
      isEnabled: true,
    },
    {
      id: 'inventory',
      icon: Package,
      label: 'Инвентарь',
      description: 'Управление предметами',
      path: '/inventory',
      color: 'text-amber-400',
      bgColor: 'bg-amber-900/30',
      borderColor: 'border-amber-700/50',
      isEnabled: true,
    },
    {
      id: 'settings',
      icon: Settings,
      label: 'Настройки',
      description: 'Параметры игры',
      path: '/settings',
      color: 'text-zinc-400',
      bgColor: 'bg-zinc-900/30',
      borderColor: 'border-zinc-700/50',
      isEnabled: true,
    }
  ]
  
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-zinc-100 mb-4">Быстрые действия</h2>
      <MotionContainer stagger={0.1}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickActions.map((action) => (
            <Link 
              key={action.id} 
              to={action.path}
              onClick={() => recordInteraction()}
            >
              <motion.div
                className={`
                  p-4 rounded-lg border backdrop-blur-sm transition-all duration-200 cursor-pointer
                  ${action.bgColor} ${action.borderColor}
                  ${action.isEnabled 
                    ? 'hover:scale-105 hover:shadow-lg' 
                    : 'opacity-50 cursor-not-allowed'
                  }
                `}
                whileHover={action.isEnabled ? { 
                  y: -4,
                  transition: { duration: 0.2 }
                } : {}}
                whileTap={action.isEnabled ? { scale: 0.95 } : {}}
              >
                <div className="text-center">
                  <action.icon size={32} className={`mx-auto mb-2 ${action.color}`} />
                  <div className="font-medium text-zinc-100 text-sm mb-1">
                    {action.label}
                  </div>
                  <div className="text-xs text-zinc-400">
                    {action.description}
                  </div>
                  {action.badge && (
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {action.badge}
                    </div>
                  )}
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </MotionContainer>
    </div>
  )
}

export function Component() {
  // Инициализируем демо-сценарии один раз для движка (backwards compatibility)
  useEffect(() => {
    const currentScenes = useVNStore.getState().scenes

    const scenesEqual = Object.keys(currentScenes).length === Object.keys(scenarios).length &&
      Object.entries(scenarios).every(([key, value]) => currentScenes[key] === value)

    if (!scenesEqual) {
      useVNStore.setState((state) => ({
        ...state,
        scenes: scenarios,
      }))
    }
  }, [])
  
  const { isSignedIn } = useAuth()
  const { mutate: bootstrapPlayer } = useBootstrapPlayer()
  const { recordPageView } = useDashboardStore()
  
  // Record page view on mount
  useEffect(() => {
    recordPageView()
  }, [recordPageView])
  
  // Bootstrap player on first load
  useEffect(() => {
    if (isSignedIn) {
      bootstrapPlayer()
    }
  }, [isSignedIn, bootstrapPlayer])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Доброе утро'
    if (hour < 17) return 'Добрый день'
    return 'Добрый вечер'
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-zinc-100 mb-2">QR-Boost</h1>
          <p className="text-zinc-400">
            {getGreeting()}, странник!
          </p>
        </motion.div>

        {/* Suspense wrapper for all server state components */}
        <Suspense fallback={<LoadingSpinner />}>
          {/* Player Status Card */}
          <PlayerStatusCard />

          {/* Quick Actions */}
          <QuickActionsGrid />

          {/* Content Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Active Quests */}
            <ActiveQuestsList />

            {/* System Status & News */}
            <AnimatedCard className="bg-zinc-900/50 border-zinc-700">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-zinc-100 mb-4">Новости и статус</h3>
                
                <div className="space-y-4">
                  <motion.div
                    className="p-3 bg-emerald-900/30 border border-emerald-700/50 rounded-lg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="text-emerald-400" size={16} />
                      <span className="text-sm font-medium text-emerald-100">Система активна</span>
                    </div>
                    <div className="text-xs text-emerald-200">
                      TanStack Query + Convex успешно интегрированы
                    </div>
                  </motion.div>

                  <motion.div
                    className="p-3 bg-blue-900/30 border border-blue-700/50 rounded-lg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="text-blue-400" size={16} />
                      <span className="text-sm font-medium text-blue-100">Модернизация UI</span>
                    </div>
                    <div className="text-xs text-blue-200">
                      Современная архитектура с разделением состояний
                    </div>
                  </motion.div>

                  <div className="pt-2 border-t border-zinc-700">
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div>• Server State: TanStack Query</div>
                      <div>• Local State: Zustand stores</div>
                      <div>• Типизация: Convex Doc types</div>
                      <div>• Кэширование: Optimistic updates</div>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedCard>
          </div>
        </Suspense>

        {/* Legacy fallback */}
        {!isSignedIn && (
          <motion.div 
            className="mt-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Link 
              to="/novel" 
              className="inline-block px-6 py-3 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg transition-colors"
            >
              Начать новую игру
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default Component

