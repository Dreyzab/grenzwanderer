import type { ReactNode } from 'react'
import { ConvexProvider, useQuery } from 'convex/react'
import { convexClient } from '@/shared/lib/convexClient'
import { api } from '../../convex/_generated/api'
// import { getOrCreateDeviceId } from '@/shared/lib/deviceId'
import { useEffect } from 'react'
// import { useQuest } from '@/entities/quest/model/useQuest'
import { useServerProgressHydration, useWorldPhaseSync } from '@/entities/quest/model/serverSync'
import { useAuthStore } from '@/entities/auth/model/store'
// import { useProgressionStore } from '@/entities/quest/model/progressionStore'
import { usePlayerStore } from '@/entities/player/model/store'
// import { questsApi } from '@/shared/api/quests'

type Props = { children: ReactNode }

export function AppConvexProvider({ children }: Props) {
  return <ConvexProvider client={convexClient}>{children}</ConvexProvider>
}

export function QuestHydrator({ children }: Props) {
  // const deviceId = getOrCreateDeviceId()
  const { userId, setUserId } = useAuthStore()
  const me = useQuery(api.auth.me, {})
  const player = usePlayerStore()
  useServerProgressHydration()
  useWorldPhaseSync()

  useEffect(() => {
    ;(async () => {
      try {
        const deviceId = (await import('@/shared/lib/deviceId')).getOrCreateDeviceId()
        const snapshot = await convexClient.mutation(api.quests.initializeSession, { deviceId })
        if (snapshot?.userId && snapshot.userId !== userId) setUserId(snapshot.userId)
        if (snapshot?.playerState) player.hydrateFromServer(snapshot.playerState as any)
        // world phase sync хук остаётся активным
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[HYDRATOR] initializeSession failed', e)
      }
    })()
  }, [me?.userId])

  // После успешного логина — однократно переносим гостевой прогресс на user
  // миграция и ensure происходят в initializeSession

  // синхронизация фазы перенесена в useWorldPhaseSync

  return children as any
}


