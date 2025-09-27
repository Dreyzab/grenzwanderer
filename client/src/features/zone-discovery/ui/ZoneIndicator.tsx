import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useZoneDiscovery } from '../model/useZoneDiscovery'
import { MapPin, Navigation, Eye, EyeOff } from 'lucide-react'
import { cn } from '../../../shared/lib/utils/cn'

interface ZoneIndicatorProps {
  className?: string
}

export function ZoneIndicator({ className }: ZoneIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { currentZone, pendingPoints } = useZoneDiscovery({
    enabled: true,
    onZoneEnter: (zoneKey) => {
      console.log('Entered zone:', zoneKey)
    },
    onPointsDiscovered: (points) => {
      console.log('Discovered points:', points)
    },
  })

  return (
    <div className={cn('relative', className)}>
      {/* Основная кнопка индикатора */}
      <motion.button
        className={cn(
          'relative bg-zinc-800/90 backdrop-blur-sm border rounded-lg p-3',
          'hover:bg-zinc-700/90 transition-colors',
          currentZone ? 'border-emerald-500/50' : 'border-zinc-600/50'
        )}
        onClick={() => setIsExpanded(!isExpanded)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <MapPin className={cn(
              'w-5 h-5',
              currentZone ? 'text-emerald-400' : 'text-zinc-400'
            )} />
            {pendingPoints > 0 && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            )}
          </div>

          <div className="text-left">
            <div className="text-sm font-medium text-zinc-100">
              {currentZone ? `Зона ${currentZone.slice(-4)}` : 'Определение зоны...'}
            </div>
            <div className="text-xs text-zinc-400">
              {pendingPoints > 0 ? `${pendingPoints} точек` : 'Готов к исследованию'}
            </div>
          </div>
        </div>
      </motion.button>

      {/* Расширенная панель */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-zinc-800/95 backdrop-blur-sm border border-zinc-600 rounded-lg p-4 z-50"
          >
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-semibold text-zinc-100 mb-2">Текущая зона</h4>
                <div className="flex items-center gap-2 text-sm">
                  <Navigation className="w-4 h-4 text-blue-400" />
                  <span className="text-zinc-300">
                    {currentZone || 'Не определена'}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-zinc-100 mb-2">Статус исследования</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-emerald-400" />
                    <span className="text-zinc-300">Точек обнаружено</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <EyeOff className="w-4 h-4 text-zinc-500" />
                    <span className="text-zinc-300">Осталось исследовать</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-zinc-100 mb-2">Настройки</h4>
                <div className="space-y-2">
                  <button className="w-full text-left text-sm text-zinc-300 hover:text-zinc-100 transition-colors">
                    Включить высокую точность
                  </button>
                  <button className="w-full text-left text-sm text-zinc-300 hover:text-zinc-100 transition-colors">
                    Настроить радиус зоны
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
