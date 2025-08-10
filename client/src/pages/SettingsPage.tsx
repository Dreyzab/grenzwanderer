import { useCallback, useState } from 'react'
import { useVNStore } from '@/entities/visual-novel/model/store'
import { mapPointsApi } from '@/shared/api/mapPoints'
import { getDemoMapPoints } from '@/entities/map-point/api/seed'
import { useQuest } from '@/entities/quest/model/useQuest'
import { questsApi } from '@/shared/api/quests'
import { usePlayerStore } from '@/entities/player/model/store'
import { useAuthStore } from '@/entities/auth/model/store'

export function Component() {
  const [status, setStatus] = useState<string>('')
  const quest = useQuest()
  const player = usePlayerStore()
  const auth = useAuthStore()

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

  const pushDemoPointsToServer = useCallback(async () => {
    try {
      const points = getDemoMapPoints().map((p) => ({
        key: p.id,
        title: p.title,
        description: p.description,
        coordinates: p.coordinates,
        type: p.type,
        dialogKey: p.dialogKey,
        questId: p.questId,
        active: p.isActive,
        radius: p.radius,
        icon: p.icon,
      }))
      if ((mapPointsApi as any).upsertManyDev) {
        await (mapPointsApi as any).upsertManyDev(points)
      }
      setStatus('Демо-точки отправлены на сервер (Convex).')
    } catch (e) {
      setStatus('Ошибка отправки демо-точек на сервер.')
    }
  }, [])

  const syncQuestProgressToServer = useCallback(async () => {
    try {
      const acts = quest.activeQuests ?? {}
      const comps = quest.completedQuests ?? []
      const starts = Object.values(acts)
      for (const a of starts) {
        await questsApi.startQuest(a.id, a.currentStep)
      }
      for (const id of comps) {
        await questsApi.completeQuest(id)
      }
      setStatus('Прогресс квестов синхронизирован с Convex.')
    } catch (e) {
      setStatus('Ошибка синхронизации прогресса квестов.')
    }
  }, [quest.activeQuests, quest.completedQuests])

  const migrateDeviceToUser = useCallback(async () => {
    try {
      const userId = prompt('Введите userId для миграции device → user:') || ''
      if (!userId) return
      await questsApi.migrateDeviceToUser(userId)
      auth.setUserId(userId)
      setStatus('Миграция device → user выполнена.')
    } catch (e) {
      setStatus('Ошибка миграции device → user.')
    }
  }, [auth])

  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      <h2 className="text-2xl font-semibold">Настройки (Dev)</h2>
      <div className="text-sm text-neutral-400">Команды для разработки/сброса прогресса.</div>

      <div className="grid gap-2">
        <div className="text-sm text-neutral-400">Auth (dev): userId: {auth.userId ?? 'аноним'}</div>
        <button className="bg-neutral-800 hover:bg-neutral-700 rounded px-4 py-2" onClick={clearMapPoints}>
          Сбросить точки карты
        </button>
        <button className="bg-neutral-800 hover:bg-neutral-700 rounded px-4 py-2" onClick={clearQuestProgress}>
          Сбросить прогресс квестов
        </button>
        <button className="bg-red-800 hover:bg-red-700 rounded px-4 py-2" onClick={clearAll}>
          Сбросить всё
        </button>
        {import.meta.env.DEV && (
          <button className="bg-emerald-800 hover:bg-emerald-700 rounded px-4 py-2" onClick={pushDemoPointsToServer}>
          Отправить демо-точки в Convex
          </button>
        )}
        <button className="bg-indigo-800 hover:bg-indigo-700 rounded px-4 py-2" onClick={syncQuestProgressToServer}>
          Синхронизировать прогресс квестов с Convex
        </button>
        <button className="bg-purple-800 hover:bg-purple-700 rounded px-4 py-2" onClick={migrateDeviceToUser}>
          Миграция device → user (dev)
        </button>
      </div>

      <div className="mt-6 space-y-2">
        <div className="text-sm text-neutral-400">Игрок (dev): кредиты и навыки</div>
        <div className="flex items-center gap-2 text-sm">
          <span>Credits: {player.credits}</span>
          <button className="bg-neutral-800 hover:bg-neutral-700 rounded px-2 py-1" onClick={() => player.addCredits(20)}>
            +20
          </button>
          <button className="bg-neutral-800 hover:bg-neutral-700 rounded px-2 py-1" onClick={() => player.spendCredits(20)}>
            -20
          </button>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span>Навык tech: {player.skills.has('tech') ? 'есть' : 'нет'}</span>
          <button className="bg-neutral-800 hover:bg-neutral-700 rounded px-2 py-1" onClick={() => player.addSkill('tech')}>
            Выдать
          </button>
          <button className="bg-neutral-800 hover:bg-neutral-700 rounded px-2 py-1" onClick={() => player.removeSkill('tech')}>
            Убрать
          </button>
        </div>
      </div>

      {status && <div className="text-sm text-emerald-400">{status}</div>}
    </div>
  )
}

export default Component


