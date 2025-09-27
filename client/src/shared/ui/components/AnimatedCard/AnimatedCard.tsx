import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '../../../lib/utils/cn'

interface AnimatedCardProps extends HTMLMotionProps<'div'> {
  variant?: 'default' | 'glow' | 'status' | 'interactive'
  children: React.ReactNode
}

const variants = {
  default: {
    rest: { scale: 1, y: 0 },
    hover: {
      scale: 1.05,
      y: -2,
      transition: { duration: 0.2 }
    }
  },
  glow: {
    rest: {
      scale: 1,
      y: 0,
      boxShadow: '0 0 20px rgba(52, 211, 153, 0.3)'
    },
    hover: {
      scale: 1.05,
      y: -2,
      boxShadow: '0 0 40px rgba(52, 211, 153, 0.6)',
      transition: { duration: 0.2 }
    }
  },
  status: {
    rest: { scale: 1, y: 0 },
    hover: {
      y: -2,
      transition: { duration: 0.2 }
    }
  },
  interactive: {
    rest: { scale: 1, y: 0 },
    hover: {
      scale: 1.08,
      y: -4,
      transition: { duration: 0.2 }
    },
    tap: { scale: 0.95 }
  }
}

export function AnimatedCard({
  variant = 'default',
  className,
  children,
  ...props
}: AnimatedCardProps) {
  const animationVariant = variants[variant]

  return (
    <motion.div
      className={cn(
        'bg-zinc-900/50 border border-zinc-700 rounded-lg p-4',
        'backdrop-blur-sm transition-all duration-200',
        className
      )}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      variants={animationVariant}
      {...props}
    >
      {children}
    </motion.div>
  )
}
