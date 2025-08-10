import type { ReactNode } from 'react'
import { ConvexProvider, useQuery } from 'convex/react'
import { convexClient } from '@/shared/lib/convexClient'
import { api } from '../../convex/_generated/api'
import { getOrCreateDeviceId } from '@/shared/lib/deviceId'
import { useEffect } from 'react'
import { useQuest } from '@/entities/quest/model/useQuest'
import { useAuthStore } from '@/entities/auth/model/store'

type Props = { children: ReactNode }

export function AppConvexProvider({ children }: Props) {
  return <ConvexProvider client={convexClient}>{children}</ConvexProvider>
}

export function QuestHydrator({ children }: Props) {
  const deviceId = getOrCreateDeviceId()
  const { userId, setUserId } = useAuthStore()
  const me = useQuery((api as any).auth?.me, {})
  const serverProgress = useQuery(api.quests.getProgress, { deviceId, userId: (me?.userId ?? userId) || undefined })
  const quest = useQuest()

  useEffect(() => {
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
  }, [serverProgress, userId, me?.userId])

  return children as any
}


