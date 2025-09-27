import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, MapPin, Users, Zap } from 'lucide-react'
import { WorldEvent, AnomalyZone, RaidEvent } from '../../entities/world/model/types'
import { useWorldStore } from '../../entities/world/model/store'
import { eventBus } from '../../shared/lib/events/eventBus'
import { cn } from '../../shared/lib/utils/cn'

interface Notification {
  id: string
  type: 'event' | 'anomaly' | 'raid' | 'system'
  title: string
  message: string
  icon: React.ReactNode
  color: string
  timestamp: number
  read: boolean
  action?: {
    label: string
    onClick: () => void
  }
}

export function NotificationWidget() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const { activeEvents, anomalyZones, raidEvents } = useWorldStore()

  // Подписка на мировые события
  useEffect(() => {
    const unsubscribe = eventBus.subscribe('world:*', (event) => {
      const notification = createNotificationFromEvent(event)
      if (notification) {
        addNotification(notification)
      }
    })

    return unsubscribe
  }, [])

  // Подписка на события игроков
  useEffect(() => {
    const unsubscribe = eventBus.subscribe('player:*', (event) => {
      const notification = createNotificationFromPlayerEvent(event)
      if (notification) {
        addNotification(notification)
      }
    })

    return unsubscribe
  }, [])

  const createNotificationFromEvent = (event: any): Notification | null => {
    switch (event.type) {
      case 'world:anomaly_spawn':
        return {
          id: `anomaly_${Date.now()}`,
          type: 'anomaly',
          title: 'Новая аномалия',
          message: 'Обнаружена аномалия в вашем районе',
          icon: <Zap className="w-4 h-4" />,
          color: 'text-yellow-400',
          timestamp: Date.now(),
          read: false,
          action: {
            label: 'Посмотреть',
            onClick: () => console.log('View anomaly:', event.data),
          },
        }

      case 'world:raid_start':
        return {
          id: `raid_${Date.now()}`,
          type: 'raid',
          title: 'Рейд начался',
          message: 'Новый рейд доступен для участия',
          icon: <Users className="w-4 h-4" />,
          color: 'text-red-400',
          timestamp: Date.now(),
          read: false,
          action: {
            label: 'Присоединиться',
            onClick: () => console.log('Join raid:', event.data),
          },
        }

      default:
        return null
    }
  }

  const createNotificationFromPlayerEvent = (event: any): Notification | null => {
    switch (event.type) {
      case 'player:quest_complete':
        return {
          id: `quest_${Date.now()}`,
          type: 'event',
          title: 'Квест выполнен',
          message: 'Поздравляем! Вы завершили квест',
          icon: <MapPin className="w-4 h-4" />,
          color: 'text-emerald-400',
          timestamp: Date.now(),
          read: false,
        }

      default:
        return null
    }
  }

  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev.slice(0, 9)]) // Храним последние 10
  }

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  useEffect(() => {
    const unread = notifications.filter(n => !n.read).length
    setUnreadCount(unread)
  }, [notifications])

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 bg-zinc-800/50 hover:bg-zinc-700/50 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5 text-zinc-300" />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full right-0 mt-2 w-80 bg-zinc-800/95 backdrop-blur-sm border border-zinc-600 rounded-lg shadow-xl z-50"
          >
            <div className="p-4 border-b border-zinc-600">
              <h3 className="font-semibold text-zinc-100">Уведомления</h3>
              <p className="text-sm text-zinc-400">{notifications.length} уведомлений</p>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-zinc-400">
                  Нет уведомлений
                </div>
              ) : (
                notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      'p-4 border-b border-zinc-700 cursor-pointer hover:bg-zinc-700/50',
                      !notification.read && 'bg-zinc-700/30'
                    )}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn('flex-shrink-0 mt-1', notification.color)}>
                        {notification.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-zinc-100 truncate">
                            {notification.title}
                          </h4>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              removeNotification(notification.id)
                            }}
                            className="text-zinc-400 hover:text-zinc-300"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <p className="text-sm text-zinc-400 mt-1">
                          {notification.message}
                        </p>

                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-zinc-500">
                            {new Date(notification.timestamp).toLocaleTimeString()}
                          </span>

                          {notification.action && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                notification.action!.onClick()
                                removeNotification(notification.id)
                              }}
                              className="text-xs px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded"
                            >
                              {notification.action.label}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
