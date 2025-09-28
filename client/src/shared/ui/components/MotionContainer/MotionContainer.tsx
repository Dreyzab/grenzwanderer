import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '../../../lib/utils/cn'

interface MotionContainerProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode
  staggerDelay?: number
  stagger?: number // backward compatibility
  className?: string
  layoutClassName?: string
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
  stagger,
  className,
  layoutClassName = "grid grid-cols-1 gap-4",
  ...props
}: MotionContainerProps) {
  // Use stagger if provided, otherwise use staggerDelay for backward compatibility
  const delay = stagger ?? staggerDelay
  return (
    <motion.div
      className={cn(layoutClassName, className)}
      variants={{
        ...containerVariants,
        visible: {
          ...containerVariants.visible,
          transition: {
            staggerChildren: delay,
            delayChildren: delay
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
