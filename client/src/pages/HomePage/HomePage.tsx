import { useAuth } from '@clerk/clerk-react'
import { motion } from 'framer-motion'
import { AnimatedCard } from '../../shared/ui/components/AnimatedCard'
import { MotionContainer } from '../../shared/ui/components/MotionContainer'
import { Button } from '../../shared/ui/components/Button'
import {
  QrCode,
  Map,
  ScrollText,
  Sword,
  Package,
  Settings,
  User,
  TrendingUp,
  Calendar,
  Award
} from 'lucide-react'

export function HomePage() {
  const { user, signOut } = useAuth()

  const quickActions = [
    {
      id: 'qr',
      title: 'QR Scanner',
      description: 'Сканировать QR-коды',
      icon: QrCode,
      color: 'text-emerald-400 bg-emerald-900/30 border-emerald-700/50',
      href: '/qr-scanner'
    },
    {
      id: 'map',
      title: 'Карта',
      description: 'Исследовать мир',
      icon: Map,
      color: 'text-blue-400 bg-blue-900/30 border-blue-700/50',
      href: '/map'
    },
    {
      id: 'quests',
      title: 'Квесты',
      description: 'Активные задания',
      icon: ScrollText,
      color: 'text-purple-400 bg-purple-900/30 border-purple-700/50',
      href: '/quests'
    },
    {
      id: 'combat',
      title: 'Бой',
      description: 'Карточные сражения',
      icon: Sword,
      color: 'text-red-400 bg-red-900/30 border-red-700/50',
      href: '/combat'
    },
    {
      id: 'inventory',
      title: 'Инвентарь',
      description: 'Управление предметами',
      icon: Package,
      color: 'text-amber-400 bg-amber-900/30 border-amber-700/50',
      href: '/inventory'
    },
    {
      id: 'settings',
      title: 'Настройки',
      description: 'Параметры игры',
      icon: Settings,
      color: 'text-zinc-400 bg-zinc-900/30 border-zinc-700/50',
      href: '/settings'
    }
  ]

  const playerStats = [
    { label: 'Фаза', value: '1', icon: TrendingUp, color: 'text-purple-400' },
    { label: 'Репутация', value: 'Нейтральная', icon: User, color: 'text-emerald-400' },
    { label: 'Квесты', value: '2/5', icon: Calendar, color: 'text-blue-400' },
    { label: 'Достижения', value: '3', icon: Award, color: 'text-yellow-400' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
      {/* Header */}
      <header className="border-b border-zinc-700 bg-zinc-900/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-zinc-100">Grenzwanderer</h1>
              <p className="text-zinc-400 text-sm">Постапокалиптическая RPG</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-zinc-300">
                Привет, {user?.firstName || 'Игрок'}!
              </span>
              <Button variant="ghost" onClick={() => signOut()}>
                Выйти
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 space-y-8">
        {/* Player Status */}
        <AnimatedCard variant="glow" className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-zinc-100">Статус игрока</h2>
            <div className="text-emerald-400 text-sm">Фаза: Альфа</div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {playerStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
                <div className="text-2xl font-bold text-zinc-100 mb-1">
                  {stat.value}
                </div>
                <div className="text-xs text-zinc-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </AnimatedCard>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold text-zinc-100 mb-4">Быстрые действия</h2>
          <MotionContainer>
            {quickActions.map((action) => (
              <motion.div
                key={action.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
              >
                <AnimatedCard
                  variant="interactive"
                  className={`cursor-pointer ${action.color}`}
                  onClick={() => window.location.href = action.href}
                >
                  <action.icon className="w-8 h-8 mx-auto mb-3" />
                  <h3 className="font-semibold text-zinc-100 mb-2">
                    {action.title}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {action.description}
                  </p>
                </AnimatedCard>
              </motion.div>
            ))}
          </MotionContainer>
        </div>

        {/* Active Quests */}
        <AnimatedCard className="p-6">
          <h2 className="text-xl font-semibold text-zinc-100 mb-4">
            Активные квесты
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded">
              <div>
                <h4 className="font-medium text-zinc-100">Знакомство с Фрайбургом</h4>
                <p className="text-sm text-zinc-400">Исследуйте первые локации</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-blue-400">2/3</div>
                <div className="text-xs text-zinc-500">Цели</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded">
              <div>
                <h4 className="font-medium text-zinc-100">Первая битва</h4>
                <p className="text-sm text-zinc-400">Проведите карточный бой</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-yellow-400">1/1</div>
                <div className="text-xs text-zinc-500">Цели</div>
              </div>
            </div>
          </div>
        </AnimatedCard>

        {/* System Status */}
        <AnimatedCard variant="status" className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-zinc-300">Система работает нормально</span>
            </div>
            <div className="text-xs text-zinc-500">
              Последняя синхронизация: только что
            </div>
          </div>
        </AnimatedCard>
      </div>
    </div>
  )
}
