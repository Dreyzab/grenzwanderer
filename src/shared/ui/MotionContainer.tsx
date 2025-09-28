import { motion } from 'framer-motion'
import type { HTMLMotionProps, Variants } from 'framer-motion'
import { ReactNode } from 'react'

interface MotionContainerProps extends Omit<HTMLMotionProps<"div">, 'children'> {
  children: ReactNode
  stagger?: number
  direction?: 'up' | 'down' | 'left' | 'right'
  className?: string
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

const getItemVariants = (direction: string): Variants => {
  const offset = 30
  const directions = {
    up: { y: offset },
    down: { y: -offset },
    left: { x: offset },
    right: { x: -offset }
  }
  
  return {
    hidden: {
      opacity: 0,
      ...directions[direction as keyof typeof directions]
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  }
}

export function MotionContainer({ 
  children, 
  stagger = 0.1, 
  direction = 'up',
  className = '',
  ...props 
}: MotionContainerProps) {
  const itemVariants = getItemVariants(direction)
  
  const containerVars = {
    ...containerVariants,
    visible: {
      ...containerVariants.visible,
      transition: {
        staggerChildren: stagger,
        delayChildren: 0.1
      }
    }
  }
  
  return (
    <motion.div
      className={className}
      variants={containerVars}
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
