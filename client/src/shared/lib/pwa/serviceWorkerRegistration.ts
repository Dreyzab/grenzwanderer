/**
 * PWA Service Worker регистрация и управление
 */

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export interface PWAInstallPrompt {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

class PWAManager {
  private registration: ServiceWorkerRegistration | null = null
  private installPrompt: BeforeInstallPromptEvent | null = null
  private updateAvailable = false

  /**
   * Регистрирует Service Worker
   */
  async register(): Promise<ServiceWorkerRegistration | null> {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        })

        // Слушаем обновления
        this.registration.addEventListener('updatefound', () => {
          const newWorker = this.registration?.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.updateAvailable = true
                this.notifyUpdateAvailable()
              }
            })
          }
        })

        // Слушаем сообщения от SW
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data.type === 'SKIP_WAITING') {
            this.skipWaiting()
          }
        })

        console.log('PWA Service Worker registered successfully')
        return this.registration
      } catch (error) {
        console.error('PWA Service Worker registration failed:', error)
        return null
      }
    }

    console.warn('Service Workers are not supported')
    return null
  }

  /**
   * Слушает событие beforeinstallprompt
   */
  listenForInstallPrompt(): Promise<PWAInstallPrompt | null> {
    return new Promise((resolve) => {
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault()
        this.installPrompt = e as BeforeInstallPromptEvent

        resolve({
          prompt: () => this.installPrompt!.prompt(),
          userChoice: this.installPrompt!.userChoice,
        })

        // Удаляем слушатель после первого срабатывания
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      }

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

      // Если событие уже произошло (например, при перезагрузке страницы)
      if (this.installPrompt) {
        resolve({
          prompt: () => this.installPrompt!.prompt(),
          userChoice: this.installPrompt!.userChoice,
        })
      }
    })
  }

  /**
   * Показывает уведомление об обновлении
   */
  private notifyUpdateAvailable() {
    // Создаем уведомление об обновлении
    const notification = document.createElement('div')
    notification.className = 'fixed top-4 right-4 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg z-50'
    notification.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-2 h-2 bg-emerald-300 rounded-full animate-pulse"></div>
        <span class="text-sm font-medium">Обновление доступно</span>
        <button id="pwa-update-btn" class="bg-emerald-700 hover:bg-emerald-800 px-3 py-1 rounded text-xs transition-colors">
          Обновить
        </button>
        <button id="pwa-dismiss-btn" class="text-emerald-300 hover:text-emerald-100 text-xs">
          Отмена
        </button>
      </div>
    `

    document.body.appendChild(notification)

    // Обработчики кнопок
    const updateBtn = document.getElementById('pwa-update-btn')
    const dismissBtn = document.getElementById('pwa-dismiss-btn')

    updateBtn?.addEventListener('click', () => {
      this.updateApp()
      document.body.removeChild(notification)
    })

    dismissBtn?.addEventListener('click', () => {
      document.body.removeChild(notification)
    })

    // Автоскрытие через 10 секунд
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification)
      }
    }, 10000)
  }

  /**
   * Обновляет приложение
   */
  private updateApp() {
    if (this.registration?.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      window.location.reload()
    }
  }

  /**
   * Пропускает ожидание нового SW
   */
  private skipWaiting() {
    if (this.registration?.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
  }

  /**
   * Проверяет, установлено ли PWA
   */
  isInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true
  }

  /**
   * Получает информацию об установке
   */
  getInstallInfo() {
    return {
      isInstalled: this.isInstalled(),
      isInstallPromptAvailable: this.installPrompt !== null,
      hasUpdate: this.updateAvailable,
    }
  }

  /**
   * Отправляет сообщение Service Worker'у
   */
  postMessage(message: any) {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(message)
    }
  }
}

// Экспортируем singleton
export const pwaManager = new PWAManager()

/**
 * React хук для использования PWA функциональности
 */
export function usePWA() {
  const [isInstalled, setIsInstalled] = useState(pwaManager.isInstalled())
  const [hasUpdate, setHasUpdate] = useState(false)
  const [canInstall, setCanInstall] = useState(false)

  useEffect(() => {
    // Проверяем статус установки
    const checkInstallStatus = () => {
      setIsInstalled(pwaManager.isInstalled())
    }

    // Слушаем изменения в display-mode
    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    mediaQuery.addEventListener('change', checkInstallStatus)

    // Слушаем событие appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true)
    }
    window.addEventListener('appinstalled', handleAppInstalled)

    // Регистрируем SW и слушаем install prompt
    pwaManager.register().then(() => {
      pwaManager.listenForInstallPrompt().then((prompt) => {
        setCanInstall(prompt !== null)
      })
    })

    return () => {
      mediaQuery.removeEventListener('change', checkInstallStatus)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const installApp = useCallback(async () => {
    const prompt = await pwaManager.listenForInstallPrompt()
    if (prompt) {
      await prompt.prompt()
      const choice = await prompt.userChoice

      if (choice.outcome === 'accepted') {
        setCanInstall(false)
        setIsInstalled(true)
      }

      return choice.outcome === 'accepted'
    }
    return false
  }, [])

  const updateApp = useCallback(() => {
    pwaManager.postMessage({ type: 'SKIP_WAITING' })
    window.location.reload()
  }, [])

  return {
    isInstalled,
    canInstall,
    hasUpdate: pwaManager.getInstallInfo().hasUpdate,
    installApp,
    updateApp,
    isSupported: 'serviceWorker' in navigator,
  }
}

import { useState, useEffect, useCallback } from 'react'
