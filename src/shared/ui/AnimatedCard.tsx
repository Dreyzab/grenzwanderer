import { motion } from 'framer-motion'
import type { HTMLMotionProps } from 'framer-motion'
import { ReactNode } from 'react'
import { useMotionContext } from '@/shared/ui/animations'

interface AnimatedCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode
  variant?: 'default' | 'hover-lift' | 'press-scale' | 'glow'
  className?: string
  motionContext?: Parameters<typeof useMotionContext>[0]
  intensity?: 'low' | 'medium' | 'high'
}

const intensityMap = {
  low: 'var(--shadow-card)',
  medium: 'var(--shadow-card-hover)',
  high: '0 0 64px rgba(99, 102, 241, 0.6)',
} as const

export function AnimatedCard({
  children,
  variant = 'default',
  className = '',
  motionContext = 'ui',
  intensity = 'medium',
  ...props
}: AnimatedCardProps) {
  const { variants, transition } = useMotionContext(motionContext, variant)
  const glowShadow = intensityMap[intensity]

  return (
    <motion.div
      className={`group glass-panel relative overflow-hidden rounded-2xl border border-white/5 ${className}`}
      variants={variants.card(glowShadow)}
      initial="initial"
      animate="animate"
      whileHover="hover"
      whileTap="tap"
      transition={transition}
      {...props}
    >
      <span className="pointer-events-none absolute inset-[1px] rounded-[1.05rem] border border-white/30" />
      <div className="pointer-events-none absolute inset-0 opacity-60 transition-opacity duration-500 mix-blend-screen group-hover:opacity-90">
        <div className="absolute -inset-20 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.22),transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(79,70,229,0.12),rgba(14,165,233,0.08)_40%,rgba(244,114,182,0.05))]" />
      </div>

      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  )
}
