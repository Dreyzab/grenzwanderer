import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

interface WidgetLoaderProps {
  message?: string
  className?: string
}

export function WidgetLoader({ message = 'Загрузка данных', className = '' }: WidgetLoaderProps) {
  return (
    <div className={`flex items-center justify-center py-8 text-[color:var(--color-text-muted)] ${className}`}>
      <motion.span
        className="mr-3"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
      >
        <Loader2 className="h-5 w-5 text-[color:var(--color-cyan)]" />
      </motion.span>
      <span className="font-mono text-xs uppercase tracking-[0.32em]">{message}</span>
    </div>
  )
}

