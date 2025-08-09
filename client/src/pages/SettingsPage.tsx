import { useCallback, useState } from 'react'
import { useVNStore } from '@/entities/visual-novel/model/store'

export function Component() {
  const [status, setStatus] = useState<string>('')

  const clearMapPoints = useCallback(() => {
    localStorage.removeItem('game-map-points')
    setStatus('Точки карты сброшены')
  }, [])

  const clearQuestProgress = useCallback(() => {
    // зарезервировано под ключи прогресса квестов, когда появятся
    localStorage.removeItem('quest-progress')
    // сброс VN сохранений и состояния
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith('vn_save_')) keys.push(k)
    }
    keys.forEach((k) => localStorage.removeItem(k))
    // сброс состояния VN к стартовой сцене
    useVNStore.getState().actions.reset('intro')
    setStatus('Прогресс квестов и визуальной новеллы сброшен')
  }, [])

  const clearAll = useCallback(() => {
    clearMapPoints()
    clearQuestProgress()
    setStatus('Все данные сброшены')
  }, [clearMapPoints, clearQuestProgress])

  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      <h2 className="text-2xl font-semibold">Настройки (Dev)</h2>
      <div className="text-sm text-neutral-400">Команды для разработки/сброса прогресса.</div>

      <div className="grid gap-2">
        <button className="bg-neutral-800 hover:bg-neutral-700 rounded px-4 py-2" onClick={clearMapPoints}>
          Сбросить точки карты
        </button>
        <button className="bg-neutral-800 hover:bg-neutral-700 rounded px-4 py-2" onClick={clearQuestProgress}>
          Сбросить прогресс квестов
        </button>
        <button className="bg-red-800 hover:bg-red-700 rounded px-4 py-2" onClick={clearAll}>
          Сбросить всё
        </button>
      </div>

      {status && <div className="text-sm text-emerald-400">{status}</div>}
    </div>
  )
}

export default Component


