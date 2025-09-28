import React, { Suspense, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@clerk/clerk-react'

import { useBootstrapPlayer } from '@/shared/api/hooks/usePlayerData'
import { useDashboardStore } from '@/shared/stores/useDashboardStore'
import { PlayerStatusWidget, QuickActionsWidget, ActiveQuestsWidget, SystemStatusWidget } from '@/widgets'

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-10 text-[color:var(--color-text-muted)]">
      <Loader2 className="mr-3 h-5 w-5 animate-spin text-[color:var(--color-cyan)]" />
      <span className="font-mono text-xs uppercase tracking-[0.32em]">Загрузка данных</span>
    </div>
  )
}

export function ModernHomePage() {
  const { isSignedIn } = useAuth()
  const { mutate: bootstrapPlayer } = useBootstrapPlayer()
  const { recordPageView } = useDashboardStore()

  useEffect(() => {
    recordPageView()
  }, [recordPageView])

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
          <p className="mt-4 text-sm uppercase tracking-[0.35em] text-[color:var(--color-text-muted)]">{getGreeting()}, странник!</p>
        </motion.div>

        <Suspense fallback={<LoadingSpinner />}>
          <div className="panel-grid mb-10">
            <div className="panel-span-7">
              <PlayerStatusWidget />
            </div>
            <div className="panel-span-5">
              <QuickActionsWidget />
            </div>
          </div>

          <div className="panel-grid">
            <div className="panel-span-7">
              <ActiveQuestsWidget />
            </div>
            <div className="panel-span-5">
              <SystemStatusWidget />
            </div>
          </div>
        </Suspense>

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

