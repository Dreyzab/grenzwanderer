import { api } from '../../../convex/_generated/api'
import { convexClient } from '@/shared/lib/convexClient'
import { getOrCreateDeviceId } from '@/shared/lib/deviceId'

export const questsApiConvex = {
  getProgress: async () => {
    const deviceId = getOrCreateDeviceId()
    return convexClient.query(api.quests.getProgress, { deviceId })
  },
  startQuest: async (questId: string, step: string) => {
    const deviceId = getOrCreateDeviceId()
    return convexClient.mutation(api.quests.startQuest, { deviceId, questId, step })
  },
  advanceQuest: async (questId: string, step: string) => {
    const deviceId = getOrCreateDeviceId()
    return convexClient.mutation(api.quests.advanceQuest, { deviceId, questId, step })
  },
  completeQuest: async (questId: string) => {
    const deviceId = getOrCreateDeviceId()
    return convexClient.mutation(api.quests.completeQuest, { deviceId, questId })
  },
  migrateDeviceToUser: async (userId: string) => {
    const deviceId = getOrCreateDeviceId()
    return convexClient.mutation(api.quests.migrateDeviceProgressToUser, { deviceId, userId })
  },
}


