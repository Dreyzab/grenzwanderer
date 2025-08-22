import { api } from '../../../../convex/_generated/api'
import { convexClient } from '@/shared/lib/convexClient'
import { getOrCreateDeviceId } from '@/shared/lib/deviceId'

export const questsApiConvex = {
  bootstrapNewPlayer: async () => {
    const deviceId = getOrCreateDeviceId()
    try {
      return await convexClient.mutation(api.quests.bootstrapNewPlayer, { deviceId })
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('bootstrapNewPlayer not available yet, skipping', e)
      return null
    }
  },
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
  finalizeRegistration: async (nickname: string, avatarKey?: string) => {
    const deviceId = getOrCreateDeviceId()
    try {
      return await convexClient.mutation(api.quests.finalizeRegistration, { deviceId, nickname, avatarKey })
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('finalizeRegistration failed', e)
      throw e
    }
  },
  // Dev-only helper to set phase 1 after registration
  setPhaseAfterRegistration: async () => {
    return questsApiConvex.setPlayerPhase(1)
  },
  getWorldState: async () => {
    return convexClient.query(api.quests.getWorldState, {})
  },
  // Устаревшие методы: тонкие прокси на универсальный вызов
  getAvailableQuestsForNpc: async (npcId: string) => {
    const deviceId = getOrCreateDeviceId()
    return convexClient.query(api.quests.getAvailableQuests, { sourceType: 'npc', sourceKey: npcId, deviceId })
  },
  getAvailableBoardQuests: async (boardKey: string) => {
    const deviceId = getOrCreateDeviceId()
    return convexClient.query(api.quests.getAvailableQuests, { sourceType: 'board', sourceKey: boardKey, deviceId })
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
  applyDialogOutcome: async (outcomeKey: string, payload?: { amount?: number }) => {
    const deviceId = getOrCreateDeviceId()
    // dialogs.applyDialogOutcome — новый серверный контракт
    // Оборачиваем на случай, если функция ещё не задеплоена
    try {
      // @ts-ignore — генерик API может ещё не быть в типах
      return await convexClient.mutation((api as any).dialogs.applyDialogOutcome, { deviceId, outcomeKey, payload })
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('applyDialogOutcome not available yet', e)
      throw e
    }
  },
  seedQuestRegistryDev: async (devToken: string) => {
    return convexClient.mutation(api.seed.seedQuestRegistryDev, { devToken })
  },
}


