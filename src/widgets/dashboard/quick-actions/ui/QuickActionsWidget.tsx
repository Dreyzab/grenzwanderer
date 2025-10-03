import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Map, BookOpen, Sword, Package, Settings, QrCode, FileText } from 'lucide-react'
import { AnimatedCard, MotionContainer } from '@/shared/ui'
import { useDashboardStore } from '@/shared/stores/useDashboardStore'
import type { QuickAction } from '@/shared/types/dashboard'

interface QuickActionsWidgetProps {
  className?: string
}

const quickActions: QuickAction[] = [
  {
    id: 'prologue',
    icon: FileText,
    label: 'Пролог',
    description: 'Начать историю',
    path: '/prologue',
    color: 'text-[color:var(--color-magenta)]',
    bgColor: 'bg-[linear-gradient(135deg,rgba(168,85,247,0.22),rgba(236,72,153,0.12))]',
    borderColor: 'border-purple-500/20',
    isEnabled: true,
  },
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
  },
]

export function QuickActionsWidget({ className = '' }: QuickActionsWidgetProps) {
  const { recordInteraction } = useDashboardStore()

  return (
    <AnimatedCard motionContext="ui" className={`panel-secondary px-6 py-6 h-full ${className}`}>
      <div className="mb-5 flex items-center justify-between">
        <span className="panel-section-title">Быстрые действия</span>
        <span className="hidden text-xs uppercase tracking-[0.28em] text-[color:var(--color-text-muted)] sm:block">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <MotionContainer stagger={0.08} className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-2" context="ui">
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
      variants={{
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0 },
        hover: { y: -6, scale: 1.02 },
        tap: { scale: 0.97 },
        disabled: { opacity: 0.5 },
      }}
      initial="hidden"
      animate="visible"
      whileHover={action.isEnabled ? 'hover' : 'disabled'}
      whileTap={action.isEnabled ? 'tap' : undefined}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="relative z-10 text-center">
        <span className="pointer-events-none absolute inset-x-6 top-2 mx-auto h-[1px] bg-[linear-gradient(90deg,transparent,rgba(99,102,241,0.6),transparent)]" />
        <action.icon size={30} className={`mx-auto mb-3 ${action.color}`} />
        <div className="font-heading text-sm uppercase tracking-[0.18em] text-[color:var(--color-text-primary)]">{action.label}</div>
        <div className="mt-1 text-xs text-[color:var(--color-text-muted)]">{action.description}</div>
      </div>
    </motion.div>
  )

  if (!action.isEnabled) {
    return <div className="cursor-not-allowed opacity-50">{content}</div>
  }

  return (
    <Link to={action.path} onClick={onAction} className="block">
      {content}
    </Link>
  )
}

