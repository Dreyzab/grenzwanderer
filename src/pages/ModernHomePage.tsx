import React, { useEffect, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Map, BookOpen, Sword, Package, Settings, QrCode, TrendingUp, Calendar, Zap, Heart, Target, Award, Loader2 } from 'lucide-react'

// Modern imports using new architecture
import { usePlayerProfile, usePlayerStats, useBootstrapPlayer } from '@/shared/api/hooks/usePlayerData'
import { useActiveQuests, useQuestStats } from '@/shared/api/hooks/useQuestData'
import { useDashboardStore } from '@/shared/stores/useDashboardStore'
import { useAuth } from '@clerk/clerk-react'
import { AnimatedCard, MotionContainer } from '@/shared/ui'

// Types
import type { QuickAction, DashboardStats } from '@/shared/types/dashboard'

// Loading fallback component
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-10 text-[color:var(--color-text-muted)]">
      <Loader2 className="mr-3 h-5 w-5 animate-spin text-[color:var(--color-cyan)]" />
      <span className="font-mono text-xs uppercase tracking-[0.32em]">Загрузка данных</span>
    </div>
  )
}

function SystemStatusPanel({ className = '' }: { className?: string }) {
  return (
    <AnimatedCard className={`panel-secondary px-7 py-6 h-full ${className}`}>
      <div className="flex flex-col gap-5">
        <span className="panel-section-title">Новости & Статус</span>

        <div className="space-y-4">
          <motion.div
            className="glass-panel rounded-xl border border-[color:var(--color-border-strong)]/40 px-4 py-3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3">
              <Zap className="h-4 w-4 text-[color:var(--color-cyan)]" />
              <span className="text-sm font-medium text-[color:var(--color-text-primary)]">Система активна</span>
            </div>
            <div className="mt-2 text-xs text-[color:var(--color-text-muted)]">
              ТанStack Query + Convex синхронно поддерживают данные игрока.
            </div>
          </motion.div>

          <motion.div
            className="glass-panel rounded-xl border border-[color:var(--color-border-strong)]/40 px-4 py-3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-3">
              <Heart className="h-4 w-4 text-[color:var(--color-magenta)]" />
              <span className="text-sm font-medium text-[color:var(--color-text-primary)]">Модернизация UI</span>
            </div>
            <div className="mt-2 text-xs text-[color:var(--color-text-muted)]">
              Интерфейс построен на стеклянных панелях и неоновых акцентах.
            </div>
          </motion.div>

          <div className="neon-divider" />

          <div className="grid gap-2 text-xs text-[color:var(--color-text-muted)]">
            <div>• Server State: TanStack Query</div>
            <div>• Local State: Zustand stores</div>
            <div>• Типизация: Convex Doc types</div>
            <div>• Кэширование: Optimistic updates</div>
          </div>
        </div>
      </div>
    </AnimatedCard>
  )
}

// Error boundary component
function ErrorFallback({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div className="glass-panel relative overflow-hidden rounded-2xl border border-[color:var(--color-danger)]/40 px-8 py-10 text-center">
      <div className="badge-glow mx-auto mb-5 bg-[linear-gradient(135deg,rgba(249,115,22,0.85),rgba(239,68,68,0.85))] text-[color:var(--color-bg)]">
        Сбой синхронизации
      </div>
      <p className="mb-6 font-mono text-xs uppercase tracking-[0.28em] text-[color:var(--color-text-secondary)]">
        {error.message}
      </p>
      <button
        onClick={retry}
        className="inline-flex items-center justify-center rounded-full border border-[color:var(--color-border-strong)]/60 bg-[color:var(--color-surface-elevated)] px-6 py-2 text-xs uppercase tracking-[0.32em] text-[color:var(--color-text-primary)] transition hover:border-[color:var(--color-cyan)]/70 hover:text-[color:var(--color-cyan)]"
      >
        Повторить
      </button>
    </div>
  )
}

// Player Status Card with server state
function PlayerStatusCard({ className = '' }: { className?: string }) {
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
      className={`panel-hero px-8 py-6 h-full ${className}`}
    >
      <div className="relative z-10 flex flex-col gap-6">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
          <div>
            <div className="badge-glow mb-4 bg-[linear-gradient(135deg,rgba(79,70,229,0.85),rgba(14,165,233,0.85))] text-[color:var(--color-bg)]">
              Активный профиль
            </div>
            <h2 className="text-2xl font-semibold text-[color:var(--color-text-primary)]">Статус игрока</h2>
            <p className="mt-1 font-mono text-xs uppercase tracking-[0.38em] text-[color:var(--color-text-muted)]">
              {getPhaseDescription(phase)}
            </p>
          </div>
          <motion.div
            className="glass-panel relative flex min-w-[180px] flex-col items-end rounded-xl border border-[color:var(--color-border-strong)]/70 px-6 py-4 text-right"
            whileHover={{ scale: 1.05 }}
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-text-muted)]">
              Репутация
            </span>
            <div className="mt-2 flex items-baseline gap-2 font-heading">
              <span className="text-3xl font-semibold text-[color:var(--color-cyan)]">{fame}</span>
              <Zap className="h-4 w-4 text-[color:var(--color-cyan)]" />
            </div>
          </motion.div>
        </div>

        {/* Progress Stats with real data */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <motion.div 
            className="glass-panel rounded-xl border border-white/10 px-5 py-4 text-left"
            whileHover={{ y: -4 }}
          >
            <div className="flex items-center gap-2 text-[color:var(--color-text-muted)]">
              <Target className="h-4 w-4 text-[color:var(--color-magenta)]" />
              <span className="text-[11px] uppercase tracking-[0.28em]">Квестов завершено</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-[color:var(--color-text-primary)]">
                {playerStats?.completedQuests || 0}/{playerStats?.totalQuests || 0}
              </span>
              <span className="text-[11px] text-[color:var(--color-text-muted)]">за всё время</span>
            </div>
          </motion.div>

          <motion.div 
            className="glass-panel rounded-xl border border-white/10 px-5 py-4 text-left"
            whileHover={{ y: -4 }}
          >
            <div className="flex items-center gap-2 text-[color:var(--color-text-muted)]">
              <TrendingUp className="h-4 w-4 text-[color:var(--color-cyan)]" />
              <span className="text-[11px] uppercase tracking-[0.28em]">Опыта получено</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-[color:var(--color-text-primary)]">{fame}</span>
              <span className="text-[11px] text-[color:var(--color-text-muted)]">единиц</span>
            </div>
          </motion.div>

          <motion.div 
            className="glass-panel rounded-xl border border-white/10 px-5 py-4 text-left"
            whileHover={{ y: -4 }}
          >
            <div className="flex items-center gap-2 text-[color:var(--color-text-muted)]">
              <Calendar className="h-4 w-4 text-[color:var(--color-amber)]" />
              <span className="text-[11px] uppercase tracking-[0.28em]">Дней в игре</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-[color:var(--color-text-primary)]">
                {playerStats?.daysSinceStart || 1}
              </span>
              <span className="text-[11px] text-[color:var(--color-text-muted)]">со старта</span>
            </div>
          </motion.div>

          <motion.div 
            className="glass-panel rounded-xl border border-white/10 px-5 py-4 text-left"
            whileHover={{ y: -4 }}
          >
            <div className="flex items-center gap-2 text-[color:var(--color-text-muted)]">
              <Award className="h-4 w-4 text-[color:var(--color-magenta)]" />
              <span className="text-[11px] uppercase tracking-[0.28em]">Фаза развития</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-[color:var(--color-text-primary)]">{phase}</span>
              <span className="text-[11px] text-[color:var(--color-text-muted)]">уровень</span>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatedCard>
  )
}

// Active Quests List with TanStack Query
function ActiveQuestsList({ className = '' }: { className?: string }) {
  const { data: activeQuests, isLoading, error } = useActiveQuests()
  const { data: questStats } = useQuestStats()
  
  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorFallback error={error as Error} retry={() => window.location.reload()} />
  
  return (
    <AnimatedCard className={`panel-secondary px-7 py-6 h-full ${className}`}>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[color:var(--color-text-primary)]">
            Активные квесты
            {questStats && (
              <span className="ml-3 rounded-full border border-[color:var(--color-border-strong)]/60 px-3 py-1 text-xs uppercase tracking-[0.26em] text-[color:var(--color-text-muted)]">
                {questStats.completedQuests}/{questStats.totalQuests}
              </span>
            )}
          </h3>
          <span className="badge-glow hidden bg-[linear-gradient(135deg,rgba(34,211,238,0.85),rgba(249,115,22,0.85))] text-[color:var(--color-bg)] lg:inline-flex">
            Журнал
          </span>
        </div>

        <div className="space-y-3">
          <AnimatePresence>
            {activeQuests?.slice(0, 3).map((quest, index) => (
              <motion.div
                key={quest.questId}
                className="glass-panel flex items-center gap-4 rounded-xl border border-[color:var(--color-border-strong)]/40 px-5 py-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
              >
                <span className="h-2 w-2 rounded-full bg-[color:var(--color-cyan)] shadow-[0_0_12px_rgba(34,211,238,0.65)]" />
                <div className="flex-1">
                  <div className="font-heading text-sm tracking-wide text-[color:var(--color-text-primary)]">
                    {quest.questId.replace(/_/g, ' ')}
                  </div>
                  <div className="flex items-center gap-3 pt-1 text-xs text-[color:var(--color-text-muted)]">
                    <span className="uppercase tracking-[0.28em]">{quest.currentStep || 'unknown'}</span>
                    <span className="h-1 w-12 rounded-full bg-[linear-gradient(90deg,rgba(79,70,229,0.6),rgba(14,165,233,0.3))]" />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {(!activeQuests || activeQuests.length === 0) && (
            <div className="flex flex-col items-center gap-2 py-8 text-[color:var(--color-text-muted)]">
              <BookOpen size={32} className="opacity-60" />
              <div className="font-mono text-xs uppercase tracking-[0.28em]">Нет активных квестов</div>
            </div>
          )}
        </div>

        <Link 
          to="/quests"
          className="mt-2 block text-center text-xs uppercase tracking-[0.32em] text-[color:var(--color-text-muted)] transition hover:text-[color:var(--color-cyan)]"
        >
          Посмотреть все квесты →
        </Link>
      </div>
    </AnimatedCard>
  )
}

// Quick Actions with enhanced state
function QuickActionsPanel({ className = '' }: { className?: string }) {
  const { recordInteraction } = useDashboardStore()
  
  const quickActions: QuickAction[] = [
    {
      id: 'qr',
      icon: QrCode,
      label: 'QR Сканер',
      description: 'Сканировать код локации',
      path: '/qr',
      color: 'text-[color:var(--color-cyan)]',
      bgColor: 'bg-[linear-gradient(135deg,rgba(14,165,233,0.2),rgba(79,70,229,0.08))]',
      borderColor: 'border-white/10',
      isEnabled: true,
    },
    {
      id: 'map',
      icon: Map,
      label: 'Карта',
      description: 'Открыть игровую карту',
      path: '/enhanced-map',
      color: 'text-[color:var(--color-amber)]',
      bgColor: 'bg-[linear-gradient(135deg,rgba(250,204,21,0.16),rgba(59,130,246,0.06))]',
      borderColor: 'border-white/10',
      isEnabled: true,
    },
    {
      id: 'quests',
      icon: BookOpen,
      label: 'Квесты',
      description: 'Управление заданиями',
      path: '/quests',
      color: 'text-[color:var(--color-magenta)]',
      bgColor: 'bg-[linear-gradient(135deg,rgba(236,72,153,0.2),rgba(79,70,229,0.08))]',
      borderColor: 'border-white/10',
      isEnabled: true,
    },
    {
      id: 'combat',
      icon: Sword,
      label: 'Бой',
      description: 'Карточная боевая система',
      path: '/enhanced-combat',
      color: 'text-[color:var(--color-danger)]',
      bgColor: 'bg-[linear-gradient(135deg,rgba(249,115,22,0.22),rgba(239,68,68,0.1))]',
      borderColor: 'border-white/10',
      isEnabled: true,
    },
    {
      id: 'inventory',
      icon: Package,
      label: 'Инвентарь',
      description: 'Управление предметами',
      path: '/inventory',
      color: 'text-[color:var(--color-success)]',
      bgColor: 'bg-[linear-gradient(135deg,rgba(34,197,94,0.18),rgba(14,165,233,0.08))]',
      borderColor: 'border-white/10',
      isEnabled: true,
    },
    {
      id: 'settings',
      icon: Settings,
      label: 'Настройки',
      description: 'Параметры игры',
      path: '/settings',
      color: 'text-[color:var(--color-text-muted)]',
      bgColor: 'bg-[linear-gradient(135deg,rgba(148,163,184,0.18),rgba(30,41,59,0.12))]',
      borderColor: 'border-white/10',
      isEnabled: true,
    }
  ]
  
  return (
    <AnimatedCard className={`panel-secondary px-6 py-6 h-full ${className}`}>
      <div className="mb-5 flex items-center justify-between">
        <span className="panel-section-title">Быстрые действия</span>
        <span className="hidden text-xs uppercase tracking-[0.28em] text-[color:var(--color-text-muted)] sm:block">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <MotionContainer stagger={0.08} className="grid grid-cols-2 gap-3">
        {quickActions.map((action) => (
          <QuickActionCard key={action.id} action={action} onAction={recordInteraction} />
        ))}
      </MotionContainer>
    </AnimatedCard>
  )
}

function QuickActionCard({ action, onAction }: { action: QuickAction; onAction: () => void }) {
  const content = (
    <motion.div
      className={`quick-action ${action.bgColor}`}
      whileHover={action.isEnabled ? { y: -6, scale: 1.02 } : {}}
      whileTap={action.isEnabled ? { scale: 0.97 } : {}}
    >
      <div className="relative z-10 text-center">
        <span className="pointer-events-none absolute inset-x-6 top-2 mx-auto h-[1px] bg-[linear-gradient(90deg,transparent,rgba(99,102,241,0.6),transparent)]" />
        <action.icon size={30} className={`mx-auto mb-3 ${action.color}`} />
        <div className="font-heading text-sm uppercase tracking-[0.18em] text-[color:var(--color-text-primary)]">
          {action.label}
        </div>
        <div className="mt-1 text-xs text-[color:var(--color-text-muted)]">
          {action.description}
        </div>
      </div>
    </motion.div>
  )

  if (!action.isEnabled) {
    return (
      <div className="opacity-50 cursor-not-allowed">{content}</div>
    )
  }

  return (
    <Link
      to={action.path}
      onClick={() => onAction()}
      className="block"
    >
      {content}
    </Link>
  )
}

// Main HomePage component
export function ModernHomePage() {
  const { isSignedIn } = useAuth()
  const { mutate: bootstrapPlayer } = useBootstrapPlayer()
  const { recordPageView, preferences } = useDashboardStore()
  
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
    <div className="relative min-h-screen overflow-hidden bg-[color:var(--color-bg)] px-4 pb-16 pt-8">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -left-24 top-32 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(79,70,229,0.28),transparent_60%)] blur-3xl" />
        <div className="absolute -right-10 top-20 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(14,165,233,0.22),transparent_65%)] blur-3xl" />
        <div className="absolute bottom-10 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(244,114,182,0.18),transparent_70%)] blur-3xl" />
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
            Город Фрайбург — режим онлайн
          </div>
          <h1 className="text-5xl font-bold text-[color:var(--color-text-primary)]">QR-Boost</h1>
          <p className="mt-4 text-sm uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">
            {getGreeting()}, странник!
          </p>
        </motion.div>

        {/* Suspense wrapper for all server state components */}
        <Suspense fallback={<LoadingSpinner />}>
          <div className="panel-grid mb-10">
            <div className="panel-span-7">
              <PlayerStatusCard />
            </div>
            <div className="panel-span-5">
              <QuickActionsPanel />
            </div>
          </div>

          <div className="panel-grid">
            <div className="panel-span-7">
              <ActiveQuestsList />
            </div>
            <div className="panel-span-5">
              <SystemStatusPanel />
            </div>
          </div>
        </Suspense>

        {/* Legacy fallback */}
        {!isSignedIn && (
          <motion.div 
            className="mt-10 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Link 
              to="/novel" 
              className="inline-flex items-center gap-3 rounded-full border border-[color:var(--color-border-strong)]/60 bg-[color:var(--color-surface-elevated)] px-6 py-3 text-xs uppercase tracking-[0.32em] text-[color:var(--color-text-primary)] transition hover:border-[color:var(--color-cyan)]/70 hover:text-[color:var(--color-cyan)]"
            >
              <span className="h-2 w-2 rounded-full bg-[color:var(--color-cyan)]" />
              Начать новую игру
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default ModernHomePage
