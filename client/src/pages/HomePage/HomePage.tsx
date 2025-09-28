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
  Award
} from 'lucide-react'
import { useVNStore } from '@/entities/visual-novel/model/store'
import { scenarios } from '@/entities/visual-novel/api/scenarios'
import { useEffect, useState } from 'react'
import { questsApi } from '@/shared/api/quests'
import { useAuth } from '@clerk/clerk-react'
import { usePlayerStore } from '@/entities/player/model/store'
import { useQuestStore } from '@/entities/quest/model/questStore'
import { AnimatedCard } from '@/shared/ui/components/AnimatedCard/AnimatedCard'
import { MotionContainer } from '@/shared/ui/components/MotionContainer/MotionContainer'

interface DashboardStats {
  questsCompleted: number
  totalQuests: number
  currentPhase: number
  experienceGained: number
  daysSinceStart: number
}

interface QuickAction {
  icon: React.ComponentType<{ size?: number | string; className?: string }>
  label: string
  description: string
  path: string
  color: string
  bgColor: string
  borderColor: string
}

export function Component() {
  const [stats, setStats] = useState<DashboardStats>({
    questsCompleted: 0,
    totalQuests: 0,
    currentPhase: 1,
    experienceGained: 0,
    daysSinceStart: 1
  })
  
  // На первом заходе пробуем создать состояние игрока (bootstrap)
  useEffect(() => {
    ;(async () => {
      try {
        await questsApi.bootstrapNewPlayer()
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[HOME] bootstrapNewPlayer failed', error)
      }
    })()
  }, [])

  // Инициализируем демо-сценарии один раз для движка (только если не установлены)
  useEffect(() => {
    if (Object.keys(useVNStore.getState().scenes).length === 0) {
      useVNStore.getState().setScenes(scenarios)
    }
  }, [])

  const { isSignedIn } = useAuth()
  const phase = usePlayerStore((s) => s.phase)
  const playerName = usePlayerStore((s) => s.name)
  const fame = usePlayerStore((s) => s.fame)
  const allQuests = useQuestStore((s) => s.quests)
  const questsSafe = allQuests ?? {}

  // Update stats based on player data
  useEffect(() => {
    const completedQuests = Object.values(questsSafe).filter(q => q.step === 'completed').length
    const totalQuests = Object.keys(questsSafe).length
    
    setStats({
      questsCompleted: completedQuests,
      totalQuests,
      currentPhase: phase,
      experienceGained: fame,
      daysSinceStart: Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % 100 // Mock calculation
    })
  }, [phase, fame, allQuests])

  const quickActions: QuickAction[] = [
    {
      icon: QrCode,
      label: 'QR Сканер',
      description: 'Сканировать код локации',
      path: '/qr-scanner',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-900/30',
      borderColor: 'border-emerald-700/50'
    },
    {
      icon: Map,
      label: 'Карта',
      description: 'Открыть игровую карту',
      path: '/map',
      color: 'text-blue-400',
      bgColor: 'bg-blue-900/30',
      borderColor: 'border-blue-700/50'
    },
    {
      icon: BookOpen,
      label: 'Квесты',
      description: 'Управление заданиями',
      path: '/quests',
      color: 'text-purple-400',
      bgColor: 'bg-purple-900/30',
      borderColor: 'border-purple-700/50'
    },
    {
      icon: Sword,
      label: 'Бой',
      description: 'Карточная боевая система',
      path: '/combat',
      color: 'text-red-400',
      bgColor: 'bg-red-900/30',
      borderColor: 'border-red-700/50'
    },
    {
      icon: Package,
      label: 'Инвентарь',
      description: 'Управление предметами',
      path: '/inventory',
      color: 'text-amber-400',
      bgColor: 'bg-amber-900/30',
      borderColor: 'border-amber-700/50'
    },
    {
      icon: Settings,
      label: 'Настройки',
      description: 'Параметры игры',
      path: '/settings',
      color: 'text-zinc-400',
      bgColor: 'bg-zinc-900/30',
      borderColor: 'border-zinc-700/50'
    }
  ]

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Доброе утро'
    if (hour < 17) return 'Добрый день'
    return 'Добрый вечер'
  }

  const getPhaseDescription = (phase: number) => {
    switch(phase) {
      case 1: return 'Беженец'
      case 2: return 'Житель'
      case 3: return 'Активист'
      default: return `Фаза ${phase}`
    }
  }

  return (
    <div className="min-h-screen homepage-background p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-4 animate-float">
            <span className="bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent text-glow">
              QR-Boost
            </span>
          </h1>
          <p className="text-lg text-zinc-300 font-medium">
            {getGreeting()}, <span className="text-emerald-400 font-semibold">
              {isSignedIn && playerName ? playerName : 'странник'}
            </span>!
          </p>
          <p className="text-sm text-zinc-500 mt-2">Добро пожаловать в мир безграничных возможностей</p>
        </motion.div>

        {/* Player Status Card */}
        <AnimatedCard 
          variant="glow" 
          className="mb-10 homepage-stats-card homepage-card-glow relative overflow-hidden"
        >
          <div className="p-8 relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-zinc-100 mb-2">
                  <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                    Статус игрока
                  </span>
                </h2>
                <p className="text-emerald-300 text-lg font-semibold flex items-center gap-2">
                  <Award className="text-emerald-400" size={20} />
                  {getPhaseDescription(phase)}
                </p>
              </div>
              <motion.div
                className="text-right bg-emerald-900/30 rounded-xl p-4 border border-emerald-700/50"
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-3xl font-bold text-emerald-400 text-glow">{fame}</div>
                <div className="text-sm text-emerald-200 font-medium">репутации</div>
              </motion.div>
            </div>

            {/* Progress Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <motion.div 
                className="text-center bg-purple-900/30 rounded-xl p-4 border border-purple-700/50 group cursor-pointer"
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-center mb-3">
                  <Target className="text-purple-400 mr-2 group-hover:text-purple-300 transition-colors" size={24} />
                  <span className="text-xl font-bold text-zinc-100 group-hover:text-white transition-colors">
                    {stats.questsCompleted}/{stats.totalQuests}
                  </span>
                </div>
                <div className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors font-medium">
                  Квестов завершено
                </div>
              </motion.div>

              <motion.div 
                className="text-center bg-emerald-900/30 rounded-xl p-4 border border-emerald-700/50 group cursor-pointer"
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-center mb-3">
                  <TrendingUp className="text-emerald-400 mr-2 group-hover:text-emerald-300 transition-colors" size={24} />
                  <span className="text-xl font-bold text-zinc-100 group-hover:text-white transition-colors">{stats.experienceGained}</span>
                </div>
                <div className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors font-medium">Опыта получено</div>
              </motion.div>

              <motion.div 
                className="text-center bg-blue-900/30 rounded-xl p-4 border border-blue-700/50 group cursor-pointer"
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-center mb-3">
                  <Calendar className="text-blue-400 mr-2 group-hover:text-blue-300 transition-colors" size={24} />
                  <span className="text-xl font-bold text-zinc-100 group-hover:text-white transition-colors">{stats.daysSinceStart}</span>
                </div>
                <div className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors font-medium">Дней в игре</div>
              </motion.div>

              <motion.div 
                className="text-center bg-yellow-900/30 rounded-xl p-4 border border-yellow-700/50 group cursor-pointer"
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-center mb-3">
                  <Award className="text-yellow-400 mr-2 group-hover:text-yellow-300 transition-colors" size={24} />
                  <span className="text-xl font-bold text-zinc-100 group-hover:text-white transition-colors">{phase}</span>
                </div>
                <div className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors font-medium">Фаза развития</div>
              </motion.div>
            </div>
          </div>
        </AnimatedCard>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-zinc-100 mb-6 text-center">
            <span className="bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Быстрые действия
            </span>
          </h2>
          <MotionContainer stagger={0.1}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {quickActions.map((action, index) => (
                <Link key={action.path} to={action.path}>
                  <motion.div
                    className={`
                      game-card p-4 cursor-pointer group relative overflow-hidden
                      ${action.bgColor} ${action.borderColor}
                    `}
                    whileHover={{ 
                      y: -6,
                      scale: 1.02,
                      transition: { duration: 0.2 }
                    }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0,
                      transition: { delay: index * 0.1 }
                    }}
                  >
                    {/* Hover glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                    
                    <div className="text-center relative z-10">
                      <div className="mb-3 relative">
                        <action.icon 
                          size={32} 
                          className={`mx-auto ${action.color} group-hover:text-glow transition-all duration-300`} 
                        />
                      </div>
                      <div className="font-semibold text-zinc-100 text-sm mb-1 group-hover:text-white transition-colors">
                        {action.label}
                      </div>
                      <div className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors">
                        {action.description}
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </MotionContainer>
        </div>

        {/* Recent Activity & News */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent Quests */}
          <AnimatedCard className="game-card glass-effect styled-scrollbar">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-zinc-100 mb-4 flex items-center gap-2">
                <BookOpen className="text-emerald-400" size={20} />
                <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                  Активные квесты
                </span>
              </h3>
              
              <div className="space-y-3">
                <AnimatePresence>
                  {Object.entries(questsSafe)
                    .filter(([_, quest]: [string, any]) => quest.step !== 'completed' && quest.step !== 'unavailable')
                    .slice(0, 3)
                    .map(([questId, quest]: [string, any], index) => (
                      <motion.div
                        key={questId}
                        className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="status-dot bg-emerald-400" />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-zinc-100">
                            {questId.replace(/_/g, ' ')}
                          </div>
                          <div className="text-xs text-zinc-400">
                            Статус: {quest.step}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </AnimatePresence>
                
                {Object.keys(questsSafe).length === 0 && (
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

          {/* System Status & News */}
          <AnimatedCard className="game-card glass-effect">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-zinc-100 mb-4 flex items-center gap-2">
                <Zap className="text-blue-400" size={20} />
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Новости и статус
                </span>
              </h3>
              
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
                    Все игровые системы работают нормально
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
                    <span className="text-sm font-medium text-blue-100">Обновление UI</span>
                  </div>
                  <div className="text-xs text-blue-200">
                    Добавлены новые анимации и улучшен пользовательский интерфейс
                  </div>
                </motion.div>

                <div className="pt-2 border-t border-zinc-700">
                  <div className="text-xs text-zinc-400 space-y-1">
                    <div>• Система карточных боёв с drag&drop</div>
                    <div>• Анимированные диалоги Visual Novel</div>
                    <div>• Интерактивная карта с маркерами</div>
                    <div>• Улучшенная система инвентаря</div>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedCard>
        </div>

        {/* Legacy Links for backward compatibility */}
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

