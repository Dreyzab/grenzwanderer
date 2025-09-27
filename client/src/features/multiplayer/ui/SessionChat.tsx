import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, X, MessageCircle } from 'lucide-react'
import { useMultiplayerStore } from '../model/store'
import { cn } from '../../../shared/lib/utils/cn'

interface SessionChatProps {
  sessionId: string
  isOpen: boolean
  onClose: () => void
  className?: string
}

interface ChatMessage {
  id: string
  playerId: string
  username: string
  message: string
  timestamp: number
  type: 'message' | 'system' | 'join' | 'leave'
}

export function SessionChat({ sessionId, isOpen, onClose, className }: SessionChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { sendSessionMessage, getSessionById } = useMultiplayerStore()

  const session = getSessionById(sessionId)

  // Подписка на события сессии
  useEffect(() => {
    if (!isOpen) return

    const handleSessionEvent = (event: any) => {
      if (event.data?.sessionId === sessionId) {
        switch (event.data.event) {
          case 'player_joined':
            addSystemMessage(`${event.data.playerName} присоединился к сессии`)
            break
          case 'player_left':
            addSystemMessage(`${event.data.playerName} покинул сессию`)
            break
          case 'message':
            addMessage({
              id: `msg_${Date.now()}`,
              playerId: event.source,
              username: event.data.username || 'Unknown',
              message: event.data.message,
              timestamp: Date.now(),
              type: 'message',
            })
            break
        }
      }
    }

    // Подписываемся на события сессии
    const unsubscribe = useEventSubscription('social:message', handleSessionEvent)

    return unsubscribe
  }, [isOpen, sessionId])

  const addMessage = (message: ChatMessage) => {
    setMessages(prev => [...prev, message])
  }

  const addSystemMessage = (message: string) => {
    addMessage({
      id: `sys_${Date.now()}`,
      playerId: 'system',
      username: 'System',
      message,
      timestamp: Date.now(),
      type: 'system',
    })
  }

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    sendSessionMessage(sessionId, 'current_user', newMessage)

    // Добавляем сообщение локально для немедленного отображения
    addMessage({
      id: `msg_${Date.now()}`,
      playerId: 'current_user',
      username: 'You',
      message: newMessage,
      timestamp: Date.now(),
      type: 'message',
    })

    setNewMessage('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Автопрокрутка к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={cn(
          'fixed bottom-20 right-4 w-80 h-96 bg-zinc-800/95 backdrop-blur-sm',
          'border border-zinc-600 rounded-lg shadow-xl z-50 flex flex-col',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-zinc-600">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <h3 className="font-medium text-zinc-100">
              {session?.name || 'Чат сессии'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {messages.length === 0 ? (
            <div className="text-center text-zinc-400 text-sm py-8">
              Нет сообщений
            </div>
          ) : (
            messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'flex flex-col',
                  message.type === 'system' && 'items-center'
                )}
              >
                {message.type === 'system' ? (
                  <div className="text-xs text-zinc-500 bg-zinc-700/30 rounded px-2 py-1">
                    {message.message}
                  </div>
                ) : (
                  <div className={cn(
                    'max-w-[80%] rounded-lg p-2',
                    message.playerId === 'current_user'
                      ? 'bg-emerald-600 text-white ml-auto'
                      : 'bg-zinc-700 text-zinc-100'
                  )}>
                    <div className="text-xs opacity-75 mb-1">
                      {message.username}
                    </div>
                    <div className="text-sm">{message.message}</div>
                  </div>
                )}
              </motion.div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-zinc-600">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Введите сообщение..."
              className="flex-1 px-3 py-2 bg-zinc-700 border border-zinc-600 rounded text-zinc-100 text-sm focus:border-emerald-500 focus:outline-none"
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="p-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white rounded transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

import { useEventSubscription } from '../../../shared/lib/events/eventBus'
