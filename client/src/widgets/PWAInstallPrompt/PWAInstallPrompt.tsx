import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, Smartphone } from 'lucide-react'
import { Button } from '../../shared/ui/components/Button'
import { usePWA } from '../../shared/lib/pwa/serviceWorkerRegistration'
import { cn } from '../../shared/lib/utils/cn'

interface PWAInstallPromptProps {
  className?: string
  variant?: 'banner' | 'modal' | 'toast'
  position?: 'top' | 'bottom' | 'center'
}

export function PWAInstallPrompt({
  className,
  variant = 'banner',
  position = 'bottom'
}: PWAInstallPromptProps) {
  const { canInstall, installApp, isInstalled } = usePWA()
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    // Показываем промпт только если можно установить и не установлен
    if (canInstall && !isInstalled && !isDismissed) {
      // Задержка показа для лучшего UX
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [canInstall, isInstalled, isDismissed])

  const handleInstall = async () => {
    try {
      const installed = await installApp()
      if (installed) {
        setIsVisible(false)
        showSuccessMessage()
      }
    } catch (error) {
      console.error('Installation failed:', error)
      showErrorMessage()
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
    setIsDismissed(true)
    // Сохраняем в localStorage, чтобы не показывать снова в этой сессии
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  const showSuccessMessage = () => {
    // Показываем уведомление об успешной установке
    const notification = document.createElement('div')
    notification.className = 'fixed top-4 right-4 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg z-50'
    notification.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-2 h-2 bg-emerald-300 rounded-full"></div>
        <span class="text-sm font-medium">Приложение установлено!</span>
      </div>
    `
    document.body.appendChild(notification)

    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification)
      }
    }, 3000)
  }

  const showErrorMessage = () => {
    const notification = document.createElement('div')
    notification.className = 'fixed top-4 right-4 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg z-50'
    notification.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-2 h-2 bg-red-300 rounded-full"></div>
        <span class="text-sm font-medium">Не удалось установить приложение</span>
      </div>
    `
    document.body.appendChild(notification)

    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification)
      }
    }, 3000)
  }

  // Проверяем, был ли промпт уже отклонен в этой сессии
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      setIsDismissed(true)
    }
  }, [])

  if (!canInstall || isInstalled || isDismissed) {
    return null
  }

  const positionClasses = {
    top: 'top-4 left-4 right-4',
    bottom: 'bottom-4 left-4 right-4',
    center: 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2',
  }

  const variantClasses = {
    banner: 'bg-zinc-800/95 backdrop-blur-sm border border-zinc-600 rounded-lg p-4',
    modal: 'bg-zinc-900/95 backdrop-blur-sm border border-zinc-600 rounded-lg p-6 max-w-sm mx-auto',
    toast: 'bg-zinc-800/90 backdrop-blur-sm border border-zinc-600 rounded-lg p-3',
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: position === 'top' ? -50 : 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: position === 'top' ? -50 : 50, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className={cn(
            'fixed z-50',
            positionClasses[position],
            className
          )}
        >
          <div className={variantClasses[variant]}>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-emerald-600/20 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-emerald-400" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-zinc-100 mb-1">
                  Установите Grenzwanderer
                </h3>
                <p className="text-xs text-zinc-400 mb-3">
                  Получите полный опыт игры с доступом к камере и геолокации
                </p>

                <div className="flex gap-2">
                  <Button
                    onClick={handleInstall}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Установить
                  </Button>
                  <Button
                    onClick={handleDismiss}
                    variant="ghost"
                    size="sm"
                    className="text-zinc-400 hover:text-zinc-300"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
