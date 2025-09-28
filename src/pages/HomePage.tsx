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
import { AnimatedCard, MotionContainer } from '@/shared/ui'

interface DashboardStats {
  questsCompleted: number
  totalQuests: number
  currentPhase: number
  experienceGained: number
  daysSinceStart: number
}

interface QuickAction {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  description: string
  path: string
  color: string
  bgColor: string
  borderColor: string
}

export function Component() {
  // Инициализируем демо-сценарии один раз для движка
  useVNStore.setState((s) => ({ ...s, scenes: scenarios }))
  
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
      path: '/qr',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-900/30',
      borderColor: 'border-emerald-700/50'
    },
    {
      icon: Map,
      label: 'Карта',
      description: 'Открыть игровую карту',
      path: '/enhanced-map',
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
      path: '/enhanced-combat',
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
            {getGreeting()}, {isSignedIn && playerName ? playerName : 'странник'}!
          </p>
        </motion.div>

        {/* Player Status Card */}
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

            {/* Progress Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <motion.div 
                className="text-center"
                whileHover={{ y: -2 }}
              >
                <div className="flex items-center justify-center mb-2">
                  <Target className="text-purple-400 mr-2" size={20} />
                  <span className="text-lg font-semibold text-zinc-100">
                    {stats.questsCompleted}/{stats.totalQuests}
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
                  <span className="text-lg font-semibold text-zinc-100">{stats.experienceGained}</span>
                </div>
                <div className="text-xs text-zinc-400">Опыта получено</div>
              </motion.div>

              <motion.div 
                className="text-center"
                whileHover={{ y: -2 }}
              >
                <div className="flex items-center justify-center mb-2">
                  <Calendar className="text-blue-400 mr-2" size={20} />
                  <span className="text-lg font-semibold text-zinc-100">{stats.daysSinceStart}</span>
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

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-zinc-100 mb-4">Быстрые действия</h2>
          <MotionContainer stagger={0.1}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {quickActions.map((action, index) => (
                <Link key={action.path} to={action.path}>
                  <motion.div
                    className={`
                      p-4 rounded-lg border backdrop-blur-sm transition-all duration-200 cursor-pointer
                      ${action.bgColor} ${action.borderColor}
                      hover:scale-105 hover:shadow-lg
                    `}
                    whileHover={{ 
                      y: -4,
                      transition: { duration: 0.2 }
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="text-center">
                      <action.icon size={32} className={`mx-auto mb-2 ${action.color}`} />
                      <div className="font-medium text-zinc-100 text-sm mb-1">
                        {action.label}
                      </div>
                      <div className="text-xs text-zinc-400">
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
          <AnimatedCard className="bg-zinc-900/50 border-zinc-700">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-zinc-100 mb-4">Активные квесты</h3>
              
              <div className="space-y-3">
                <AnimatePresence>
                  {Object.entries(questsSafe)
                    .filter(([_, quest]) => quest.step !== 'completed' && quest.step !== 'unavailable')
                    .slice(0, 3)
                    .map(([questId, quest], index) => (
                      <motion.div
                        key={questId}
                        className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="w-3 h-3 rounded-full bg-emerald-400" />
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

