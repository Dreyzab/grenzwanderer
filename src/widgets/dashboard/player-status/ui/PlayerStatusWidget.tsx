import { motion } from 'framer-motion'
import { Award, Calendar, Target, TrendingUp, Zap } from 'lucide-react'
import { AnimatedCard, MotionContainer } from '@/shared/ui'
import { usePlayerProfile, usePlayerStats } from '@/shared/api/hooks/usePlayerData'
import { WidgetErrorFallback } from '../../ui/WidgetErrorFallback'
import { WidgetLoader } from '../../ui/WidgetLoader'

interface PlayerStatusWidgetProps {
  className?: string
}

export function PlayerStatusWidget({ className = '' }: PlayerStatusWidgetProps) {
  const { data: playerProfile, isLoading, error, refetch } = usePlayerProfile()
  const { data: playerStats, isLoading: statsLoading } = usePlayerStats()

  if (isLoading || statsLoading) {
    return (
      <AnimatedCard variant="glow" motionContext="ui" className={`panel-hero px-8 py-6 ${className}`}>
        <WidgetLoader />
      </AnimatedCard>
    )
  }

  if (error) {
    return (
      <AnimatedCard variant="glow" motionContext="ui" className={`panel-hero px-8 py-6 ${className}`}>
        <WidgetErrorFallback error={error as Error} onRetry={() => refetch()} />
      </AnimatedCard>
    )
  }

  const phase = playerProfile?.phase ?? 1
  const fame = playerProfile?.fame ?? 0
  const completedQuests = playerStats?.completedQuests ?? 0
  const totalQuests = playerStats?.totalQuests ?? 0
  const daysSinceStart = playerStats?.daysSinceStart ?? 1

  const getPhaseDescription = (value: number) => {
    switch (value) {
      case 1:
        return 'Беженец'
      case 2:
        return 'Житель'
      case 3:
        return 'Активист'
      default:
        return `Фаза ${value}`
    }
  }

  return (
    <AnimatedCard variant="glow" motionContext="ui" className={`panel-hero px-8 py-6 h-full ${className}`}>
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
            variants={{
              initial: { opacity: 0, y: 16, scale: 0.96 },
              animate: { opacity: 1, y: 0, scale: 1 },
              hover: { scale: 1.05 },
            }}
            initial="initial"
            animate="animate"
            whileHover="hover"
            transition={{ duration: 0.24, ease: 'easeOut' }}
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

        <MotionContainer className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" context="ui" stagger={0.08}>
          <motion.div className="glass-panel rounded-xl border border-white/10 px-5 py-4 text-left">
            <div className="flex items-center gap-2 text-[color:var(--color-text-muted)]">
              <Target className="h-4 w-4 text-[color:var(--color-magenta)]" />
              <span className="text-[11px] uppercase tracking-[0.28em]">Квестов завершено</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-[color:var(--color-text-primary)]">
                {completedQuests}/{totalQuests}
              </span>
              <span className="text-[11px] text-[color:var(--color-text-muted)]">за всё время</span>
            </div>
          </motion.div>

          <motion.div className="glass-panel rounded-xl border border-white/10 px-5 py-4 text-left">
            <div className="flex items-center gap-2 text-[color:var(--color-text-muted)]">
              <TrendingUp className="h-4 w-4 text-[color:var(--color-cyan)]" />
              <span className="text-[11px] uppercase tracking-[0.28em]">Опыта получено</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-[color:var(--color-text-primary)]">{fame}</span>
              <span className="text-[11px] text-[color:var(--color-text-muted)]">единиц</span>
            </div>
          </motion.div>

          <motion.div className="glass-panel rounded-xl border border-white/10 px-5 py-4 text-left">
            <div className="flex items-center gap-2 text-[color:var(--color-text-muted)]">
              <Calendar className="h-4 w-4 text-[color:var(--color-amber)]" />
              <span className="text-[11px] uppercase tracking-[0.28em]">Дней в игре</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-[color:var(--color-text-primary)]">{daysSinceStart}</span>
              <span className="text-[11px] text-[color:var(--color-text-muted)]">со старта</span>
            </div>
          </motion.div>

          <motion.div className="glass-panel rounded-xl border border-white/10 px-5 py-4 text-left">
            <div className="flex items-center gap-2 text-[color:var(--color-text-muted)]">
              <Award className="h-4 w-4 text-[color:var(--color-magenta)]" />
              <span className="text-[11px] uppercase tracking-[0.28em]">Фаза развития</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-[color:var(--color-text-primary)]">{phase}</span>
              <span className="text-[11px] text-[color:var(--color-text-muted)]">уровень</span>
            </div>
          </motion.div>
        </MotionContainer>
      </div>
    </AnimatedCard>
  )
}

