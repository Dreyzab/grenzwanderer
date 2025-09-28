import { motion } from 'framer-motion'
import { AnimatedCard } from '@/shared/ui'
import { Heart, Zap } from 'lucide-react'

interface SystemStatusWidgetProps {
  className?: string
}

export function SystemStatusWidget({ className = '' }: SystemStatusWidgetProps) {
  return (
    <AnimatedCard motionContext="ui" className={`panel-secondary px-7 py-6 h-full ${className}`}>
      <div className="flex flex-col gap-5">
        <span className="panel-section-title">Новости & Статус</span>

        <div className="space-y-4">
          <motion.div
            className="glass-panel rounded-xl border border-[color:var(--color-border-strong)]/40 px-4 py-3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: 'easeOut' }}
          >
            <div className="flex items-center gap-3">
              <Zap className="h-4 w-4 text-[color:var(--color-cyan)]" />
              <span className="text-sm font-medium text-[color:var(--color-text-primary)]">Система активна</span>
            </div>
            <div className="mt-2 text-xs text-[color:var(--color-text-muted)]">TanStack Query + Convex синхронно поддерживают данные игрока.</div>
          </motion.div>

          <motion.div
            className="glass-panel rounded-xl border border-[color:var(--color-border-strong)]/40 px-4 py-3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.32, ease: 'easeOut' }}
          >
            <div className="flex items-center gap-3">
              <Heart className="h-4 w-4 text-[color:var(--color-magenta)]" />
              <span className="text-sm font-medium text-[color:var(--color-text-primary)]">Модернизация UI</span>
            </div>
            <div className="mt-2 text-xs text-[color:var(--color-text-muted)]">Интерфейс построен на стеклянных панелях и неоновых акцентах.</div>
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

