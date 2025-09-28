import { motion } from 'framer-motion'
import type { HTMLMotionProps } from 'framer-motion'
import { ReactNode } from 'react'

interface AnimatedCardProps extends Omit<HTMLMotionProps<"div">, 'children'> {
  children: ReactNode
  variant?: 'default' | 'hover-lift' | 'press-scale' | 'glow'
  className?: string
}

const cardVariants = {
  default: {
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -18 }
  },
  'hover-lift': {
    initial: { opacity: 0, y: 20, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    whileHover: { y: -10, scale: 1.03, boxShadow: 'var(--shadow-card-hover)' },
    whileTap: { scale: 0.97 }
  },
  'press-scale': {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    whileTap: { scale: 0.94 },
    whileHover: { scale: 1.05 }
  },
  glow: {
    initial: { opacity: 0, boxShadow: '0 0 0 rgba(99, 102, 241, 0)' },
    animate: { 
      opacity: 1, 
      boxShadow: '0 0 28px rgba(99, 102, 241, 0.35)' 
    },
    whileHover: { 
      boxShadow: '0 0 42px rgba(99, 102, 241, 0.5)' 
    }
  }
} satisfies Record<NonNullable<AnimatedCardProps['variant']>, Partial<HTMLMotionProps<'div'>>>

export function AnimatedCard({ 
  children, 
  variant = 'default', 
  className = '', 
  ...props 
}: AnimatedCardProps) {
  const variants = cardVariants[variant]
  
  return (
    <motion.div
      className={`group glass-panel relative overflow-hidden rounded-2xl border border-white/5 ${className}`}
      {...variants}
      transition={{ duration: 0.32, ease: 'easeOut' }}
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
