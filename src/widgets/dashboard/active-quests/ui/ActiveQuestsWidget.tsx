import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AnimatedCard, MotionContainer } from '@/shared/ui'
import { useActiveQuests, useQuestStats } from '@/shared/api/hooks/useQuestData'
import { WidgetLoader } from '../../ui/WidgetLoader'
import { WidgetErrorFallback } from '../../ui/WidgetErrorFallback'

interface ActiveQuestsWidgetProps {
  className?: string
}

export function ActiveQuestsWidget({ className = '' }: ActiveQuestsWidgetProps) {
  const {
    data: activeQuests,
    isLoading,
    error,
    refetch,
  } = useActiveQuests()
  const { data: questStats } = useQuestStats()

  if (isLoading) {
    return (
      <AnimatedCard motionContext="ui" className={`panel-secondary px-7 py-6 h-full ${className}`}>
        <WidgetLoader />
      </AnimatedCard>
    )
  }

  if (error) {
    return (
      <AnimatedCard motionContext="ui" className={`panel-secondary px-7 py-6 h-full ${className}`}>
        <WidgetErrorFallback error={error as Error} onRetry={() => refetch()} />
      </AnimatedCard>
    )
  }

  return (
    <AnimatedCard motionContext="ui" className={`panel-secondary px-7 py-6 h-full ${className}`}>
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

        <MotionContainer className="space-y-3" context="ui" stagger={0.12}>
          <AnimatePresence>
            {activeQuests?.slice(0, 3).map((quest, index) => (
              <motion.div
                key={quest.questId}
                className="glass-panel flex items-center gap-4 rounded-xl border border-[color:var(--color-border-strong)]/40 px-5 py-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.08, duration: 0.32, ease: 'easeOut' }}
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
            <motion.div
              className="flex flex-col items-center gap-2 py-8 text-[color:var(--color-text-muted)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <BookOpen size={32} className="opacity-60" />
              <div className="font-mono text-xs uppercase tracking-[0.28em]">Нет активных квестов</div>
            </motion.div>
          )}
        </MotionContainer>

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

