import type { ReactNode } from 'react'
import { ConvexProvider, useQuery } from 'convex/react'
import { convexClient } from '@/shared/lib/convexClient'
import { api } from '../../convex/_generated/api'
import { getOrCreateDeviceId } from '@/shared/lib/deviceId'
import { useEffect } from 'react'
import { useQuest } from '@/entities/quest/model/useQuest'
import { useAuthStore } from '@/entities/auth/model/store'
import { useProgressionStore } from '@/entities/quest/model/progressionStore'
import { usePlayerStore } from '@/entities/player/model/store'
import { questsApi } from '@/shared/api/quests'

type Props = { children: ReactNode }

export function AppConvexProvider({ children }: Props) {
  return <ConvexProvider client={convexClient}>{children}</ConvexProvider>
}

export function QuestHydrator({ children }: Props) {
  const deviceId = getOrCreateDeviceId()
  const { userId, setUserId } = useAuthStore()
  const me = useQuery((api as any).auth?.me, {})
  const meProfile = useQuery((api as any).auth?.meProfile, {})
  const serverProgress = useQuery(api.quests.getProgress, { deviceId, userId: (me?.userId ?? userId) || undefined })
  const world = useQuery((api as any).quests?.getWorldState, {})
  const quest = useQuest()
  const progression = useProgressionStore()
  const player = usePlayerStore()

  useEffect(() => {
    // Однократно: bootstrap нового игрока (фаза 0, статус refugee, предметы)
    ;(async () => {
      try { await questsApi.bootstrapNewPlayer() } catch {}
    })()
    if (me?.userId && me.userId !== userId) setUserId(me.userId)
    if (!serverProgress) return
    const mapped = serverProgress.map((p: any) => ({
      id: p.questId,
      currentStep: p.currentStep,
      completedAt: p.completedAt ?? null,
    }))
    // Если локальные данные пустые — гидратируем; иначе считаем локальные уже инициализированы и события пользователя важнее
    if (Object.keys(quest.activeQuests).length === 0 && (quest.completedQuests?.length ?? 0) === 0) {
      quest.hydrate(mapped as any)
    }
    // Если на сервере квест завершён, но локально не отмечен — отметим для триггера UI (рег. промпт и т.п.)
    try {
      const completedIds = new Set(mapped.filter((m: any) => m.completedAt).map((m: any) => m.id))
      for (const id of Array.from(completedIds)) {
        if (!(quest.completedQuests ?? []).includes(id as any)) {
          // локально выставим completed без побочных эффектов
          quest.hydrate(mapped as any)
          break
        }
      }
    } catch {}
    void progression.hydrateFromServer()
    // Попробуем подтянуть и состояние игрока (fame/rep/rel/flags/status)
    ;(async () => {
      try {
        const st = await (await import('@/shared/api/quests')).questsApi.getPlayerState()
        player.hydrateFromServer(st as any)
      } catch {}
    })()
  }, [serverProgress, userId, me?.userId])

  // После успешного логина — однократно переносим гостевой прогресс на user
  useEffect(() => {
    if (!me?.userId) return
    const flag = localStorage.getItem('device_progress_migrated') === '1'
    if (flag) return
    ;(async () => {
      try {
        const { questsApi } = await import('@/shared/api/quests')
        await questsApi.migrateDeviceToUser(me.userId as string)
        // После регистрации/миграции переводим игрока в Фазу 1
        await questsApi.setPlayerPhase(1)
        localStorage.setItem('device_progress_migrated', '1')
      } catch {}
    })()
  }, [me?.userId])

  useEffect(() => {
    if (!world || typeof world.phase !== 'number') return
    // До регистрации/аутентификации не поднимаем локальную фазу автоматически
    // Синхронизируем только для аутентифицированных пользователей
    if (me?.userId && world.phase > progression.phase) {
      progression.setPhase(world.phase as any)
    }
  }, [world?.phase])

  return children as any
}


