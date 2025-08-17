import { api } from '../../../../convex/_generated/api'
import { convexClient } from '@/shared/lib/convexClient'
import { getOrCreateDeviceId } from '@/shared/lib/deviceId'

export const questsApiConvex = {
  getProgress: async () => {
    const deviceId = getOrCreateDeviceId()
    return convexClient.query(api.quests.getProgress, { deviceId })
  },
  getPlayerState: async () => {
    const deviceId = getOrCreateDeviceId()
    return convexClient.query(api.quests.getPlayerState, { deviceId })
  },
  setPlayerPhase: async (phase: number) => {
    const deviceId = getOrCreateDeviceId()
    // Оборачиваем на случай, если функция ещё не задеплоена на Convex
    try {
      return await convexClient.mutation(api.quests.setPlayerPhase, { deviceId, phase })
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('setPlayerPhase not available yet, skipping', e)
      return null
    }
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
  // Dev-only helper to set phase 1 after registration
  setPhaseAfterRegistration: async () => {
    return questsApiConvex.setPlayerPhase(1)
  },
  getWorldState: async () => {
    return convexClient.query(api.quests.getWorldState, {})
  },
  getAvailableQuestsForNpc: async (npcId: string) => {
    const deviceId = getOrCreateDeviceId()
    return convexClient.query(api.quests.getAvailableQuestsForNpc, { npcId, deviceId })
  },
  getAvailableBoardQuests: async (boardKey: string) => {
    const deviceId = getOrCreateDeviceId()
    return convexClient.query(api.quests.getAvailableBoardQuests, { boardKey, deviceId })
  },
  getAvailableQuests: async (sourceType: 'npc' | 'board', sourceKey: string) => {
    const deviceId = getOrCreateDeviceId()
    return convexClient.query(api.quests.getAvailableQuests, { sourceType, sourceKey, deviceId })
  },
  applyOutcome: async (args: {
    fameDelta?: number
    reputationsDelta?: Record<string, number>
    relationshipsDelta?: Record<string, number>
    addFlags?: string[]
    removeFlags?: string[]
    addWorldFlags?: string[]
    removeWorldFlags?: string[]
    setPhase?: number
    setStatus?: string
  }) => {
    const deviceId = getOrCreateDeviceId()
    return convexClient.mutation(api.quests.applyOutcome, { deviceId, ...args })
  },
  seedQuestRegistryDev: async (devToken: string) => {
    return convexClient.mutation(api.quests.seedQuestRegistryDev, { devToken })
  },
}


