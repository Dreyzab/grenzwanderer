import { motion } from 'framer-motion'
import type { HTMLMotionProps } from 'framer-motion'
import { ReactNode } from 'react'
import { useMotionContext } from '@/shared/ui/animations'

interface MotionContainerProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode
  stagger?: number
  direction?: 'up' | 'down' | 'left' | 'right'
  className?: string
  context?: Parameters<typeof useMotionContext>[0]
}

export function MotionContainer({
  children,
  stagger = 0.1,
  direction = 'up',
  className = '',
  context = 'ui',
  ...props
}: MotionContainerProps) {
  const { variants, transition } = useMotionContext(context)

  const offset = 30
  const directions = {
    up: { y: offset },
    down: { y: -offset },
    left: { x: offset },
    right: { x: -offset },
  } as const

  const itemVariants = {
    hidden: {
      opacity: 0,
      ...directions[direction],
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition,
    },
  }

  return (
    <motion.div
      className={className}
      variants={variants.container(stagger)}
      initial="hidden"
      animate="visible"
      {...props}
    >
      {Array.isArray(children)
        ? children.map((child, index) => (
            <motion.div key={index} variants={itemVariants}>
              {child}
            </motion.div>
          ))
        : <motion.div variants={itemVariants}>{children}</motion.div>
      }
    </motion.div>
  )
}
