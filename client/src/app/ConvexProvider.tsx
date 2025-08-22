import type { ReactNode } from 'react'
// import { ConvexProvider, useQuery } from 'convex/react'
// import { convexClient } from '@/shared/lib/convexClient'
// import { api } from '../../convex/_generated/api'
// import { getOrCreateDeviceId } from '@/shared/lib/deviceId'
import { useEffect } from 'react'
// import { useQuest } from '@/entities/quest/model/useQuest'
import { useBackgroundQuestSync } from '@/entities/quest/model/serverSync'
import { useAuthStore } from '@/entities/auth/model/store'
// import { useProgressionStore } from '@/entities/quest/model/progressionStore'
import { usePlayerStore } from '@/entities/player/model/store'
// import { questsApi } from '@/shared/api/quests'

import { useQuestStore } from '@/entities/quest/model/questStore'

// Временный стор для статических данных сессии (реестр квестов и биндинги точек)
import { create } from 'zustand'

import { convexClient } from '@/shared/lib/convexClient'
import { api } from '../../convex/_generated/api'
import { useProgressionStore } from '@/entities/quest/model/progressionStore'

type GameDataState = {
	questRegistry: any[]
	mappointBindings: any[]
	mapPoints: any[]
	hydrate: (data: { questRegistry?: any[]; mappointBindings?: any[] }) => void
}

export const useGameDataStore = create<GameDataState>()((set) => ({
	questRegistry: [],
	mappointBindings: [],
	mapPoints: [],
	hydrate: (data) =>
		set((s) => ({
			questRegistry: data.questRegistry ?? s.questRegistry,
			mappointBindings: data.mappointBindings ?? s.mappointBindings,
			mapPoints: (data as any).mapPoints ?? s.mapPoints,
		})),
}))

type Props = { children: ReactNode }

export function AppConvexProvider({ children }: Props) {
	return children as any
}

export function QuestHydrator({ children }: Props) {
	// const deviceId = getOrCreateDeviceId()
	const { userId } = useAuthStore()
	const player = usePlayerStore()
	const quests = useQuestStore()
	const gameData = useGameDataStore()
	useProgressionStore((s) => s.setPhase) // init to keep store active; value not used directly
	useBackgroundQuestSync()

	useEffect(() => {
		;(async () => {
			try {
				const deviceId = (await import('@/shared/lib/deviceId')).getOrCreateDeviceId()
				const snapshot: any = await convexClient.mutation((api as any).quests.initializeSession, { deviceId, clientPhase: player.phase ?? 0 })
				if (Array.isArray(snapshot?.progress)) {
					quests.hydrate(
						snapshot.progress.map((p: any) => ({ id: p.questId, currentStep: p.currentStep, completedAt: p.completedAt ?? null })),
					)
				}
				gameData.hydrate({ questRegistry: snapshot?.questRegistry ?? [], mappointBindings: snapshot?.mappointBindings ?? [], mapPoints: snapshot?.mapPoints ?? [] } as any)
				if (snapshot?.playerState) {
					// Не понижаем фазу при гидрации: берём максимум из локальной, server и localStorage
					const localPhaseStr = (() => { try { return localStorage.getItem('player-phase') } catch { return null } })()
					const localPhase = localPhaseStr ? Number(localPhaseStr) : 0
					const mergedPhase = Math.max(snapshot.playerState.phase ?? 0, localPhase)
					player.hydrateFromServer({ ...(snapshot.playerState as any), phase: mergedPhase })
					try { localStorage.setItem('player-phase', String(mergedPhase)) } catch {}
				}
			} catch {}
		})()
	}, [userId])

	// Повторная гидрация при смене фазы (treat server as catalog authority)
	useEffect(() => {
		;(async () => {
			try {
				const deviceId = (await import('@/shared/lib/deviceId')).getOrCreateDeviceId()
				const snapshot: any = await convexClient.mutation((api as any).quests.initializeSession, { deviceId, clientPhase: player.phase ?? 0 })
				gameData.hydrate({ questRegistry: snapshot?.questRegistry ?? [], mappointBindings: snapshot?.mappointBindings ?? [], mapPoints: snapshot?.mapPoints ?? [] } as any)
			} catch {}
		})()
	}, [player.phase])

	return children as any
}


