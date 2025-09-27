import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '../../../lib/utils/cn'

interface MotionContainerProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode
  staggerDelay?: number
  className?: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 }
  }
}

export function MotionContainer({
  children,
  staggerDelay = 0.1,
  className,
  ...props
}: MotionContainerProps) {
  return (
    <motion.div
      className={cn('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4', className)}
      variants={{
        ...containerVariants,
        visible: {
          ...containerVariants.visible,
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: staggerDelay
          }
        }
      }}
      initial="hidden"
      animate="visible"
      {...props}
    >
      {children}
    </motion.div>
  )
}

export { itemVariants }
