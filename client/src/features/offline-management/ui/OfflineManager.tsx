import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wifi, WifiOff, RefreshCw, Trash2, Database } from 'lucide-react'
import { Button } from '../../../shared/ui/components/Button'
import { useOfflineQRValidation } from '../../qr-scanning/lib/offlineQRValidator'
import { cn } from '../../../shared/lib/utils/cn'

interface CacheInfo {
  name: string
  size: number
  entries: number
}

export function OfflineManager() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [cacheInfo, setCacheInfo] = useState<CacheInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { cacheStats, clearCache } = useOfflineQRValidation()

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    loadCacheInfo()
  }, [])

  const loadCacheInfo = async () => {
    setIsLoading(true)
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        const cacheInfos: CacheInfo[] = []

        for (const cacheName of cacheNames) {
          const cache = await caches.open(cacheName)
          const requests = await cache.keys()
          const totalSize = await estimateCacheSize(cache)

          cacheInfos.push({
            name: cacheName,
            size: totalSize,
            entries: requests.length,
          })
        }

        setCacheInfo(cacheInfos)
      }
    } catch (error) {
      console.error('Failed to load cache info:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const estimateCacheSize = async (cache: Cache): Promise<number> => {
    // Приблизительная оценка размера кеша
    const requests = await cache.keys()
    return requests.length * 1024 // Предполагаем ~1KB на запись
  }

  const clearAllCaches = async () => {
    setIsLoading(true)
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map(name => caches.delete(name)))
        setCacheInfo([])
      }
      clearCache()
      await loadCacheInfo()
    } catch (error) {
      console.error('Failed to clear caches:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const syncOfflineData = async () => {
    setIsLoading(true)
    try {
      // Здесь будет логика синхронизации оффлайн данных
      console.log('Syncing offline data...')
      // Имитация синхронизации
      await new Promise(resolve => setTimeout(resolve, 2000))
      await loadCacheInfo()
    } catch (error) {
      console.error('Sync failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const totalCacheSize = cacheInfo.reduce((sum, cache) => sum + cache.size, 0)
  const totalEntries = cacheInfo.reduce((sum, cache) => sum + cache.entries, 0)

  return (
    <div className="space-y-6">
      {/* Online/Offline Status */}
      <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg border border-zinc-600">
        <div className="flex items-center gap-3">
          {isOnline ? (
            <Wifi className="w-5 h-5 text-emerald-400" />
          ) : (
            <WifiOff className="w-5 h-5 text-red-400" />
          )}
          <div>
            <div className="font-medium text-zinc-100">
              {isOnline ? 'Онлайн' : 'Оффлайн'}
            </div>
            <div className="text-sm text-zinc-400">
              {isOnline
                ? 'Все функции доступны'
                : 'Ограниченная функциональность'
              }
            </div>
          </div>
        </div>

        {!isOnline && (
          <Button
            onClick={syncOfflineData}
            disabled={isLoading}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        )}
      </div>

      {/* Cache Information */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <Database className="w-5 h-5" />
            Кеш и оффлайн данные
          </h3>
          <div className="text-sm text-zinc-400">
            QR: {cacheStats.totalEntries} записей
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cache Overview */}
          <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-600">
            <h4 className="font-medium text-zinc-100 mb-2">Обзор кеша</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">Кешей:</span>
                <span className="text-zinc-300">{cacheInfo.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Записей:</span>
                <span className="text-zinc-300">{totalEntries}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Размер:</span>
                <span className="text-zinc-300">
                  {(totalCacheSize / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            </div>
          </div>

          {/* QR Cache */}
          <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-600">
            <h4 className="font-medium text-zinc-100 mb-2">QR коды</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">Валидных:</span>
                <span className="text-emerald-400">{cacheStats.validEntries}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Просроченных:</span>
                <span className="text-zinc-500">{cacheStats.expiredEntries}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Всего:</span>
                <span className="text-zinc-300">{cacheStats.totalEntries}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cache List */}
        {cacheInfo.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-zinc-100">Кеши</h4>
            {cacheInfo.map((cache) => (
              <div
                key={cache.name}
                className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-lg border border-zinc-700"
              >
                <div>
                  <div className="font-medium text-zinc-100">{cache.name}</div>
                  <div className="text-sm text-zinc-400">
                    {cache.entries} записей • {(cache.size / 1024).toFixed(1)} KB
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-zinc-700">
          <Button
            onClick={clearAllCaches}
            disabled={isLoading}
            variant="danger"
            size="sm"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Очистить кеш
          </Button>

          <Button
            onClick={loadCacheInfo}
            disabled={isLoading}
            variant="secondary"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Обновить
          </Button>
        </div>
      </div>

      {/* Offline Features */}
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-amber-900/20 border border-amber-600/50 rounded-lg"
        >
          <h4 className="font-medium text-amber-100 mb-2">Оффлайн режим</h4>
          <div className="text-sm text-amber-200 space-y-1">
            <p>• QR сканирование работает с кешированными данными</p>
            <p>• Геолокация записывается для синхронизации</p>
            <p>• Данные синхронизируются при подключении</p>
          </div>
        </motion.div>
      )}
    </div>
  )
}
