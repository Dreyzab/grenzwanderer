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
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  },
  'hover-lift': {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    whileHover: { y: -8, scale: 1.02 },
    whileTap: { scale: 0.98 }
  },
  'press-scale': {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    whileTap: { scale: 0.95 },
    whileHover: { scale: 1.05 }
  },
  glow: {
    initial: { opacity: 0, boxShadow: '0 0 0 rgba(34, 197, 94, 0)' },
    animate: { 
      opacity: 1, 
      boxShadow: '0 0 20px rgba(34, 197, 94, 0.3)' 
    },
    whileHover: { 
      boxShadow: '0 0 30px rgba(34, 197, 94, 0.5)' 
    }
  }
}

export function AnimatedCard({ 
  children, 
  variant = 'default', 
  className = '', 
  ...props 
}: AnimatedCardProps) {
  // Безопасная проверка существования варианта с fallback на default
  const variants = cardVariants[variant] || cardVariants.default
  
  return (
    <motion.div
      className={`rounded-lg p-4 ${className}`}
      {...variants}
      transition={{ duration: 0.3, ease: "easeOut" }}
      {...props}
    >
      {children}
    </motion.div>
  )
}
