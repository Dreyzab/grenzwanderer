import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import convexClient from '@/shared/lib/convexClient/convexClient'
import { api } from '@/../convex/_generated/api'
import { useQuestStore } from '@/entities/quest/model/questStore'
import { useDeviceId } from '@/shared/hooks/useDeviceId'
import logger from '@/shared/lib/logger'

// Query Keys для квестов
export const questQueryKeys = {
  all: ['quests'] as const,
  active: () => [...questQueryKeys.all, 'active'] as const,
  completed: () => [...questQueryKeys.all, 'completed'] as const,
  available: () => [...questQueryKeys.all, 'available'] as const,
  stats: () => [...questQueryKeys.all, 'stats'] as const,
} as const

// Active quests from server
export function useActiveQuests() {
  const { deviceId } = useDeviceId()

  return useQuery({
    queryKey: [...questQueryKeys.active(), deviceId],
    queryFn: async () => {
      if (!deviceId) {
        logger.warn('[useActiveQuests] DeviceId не доступен')
        return []
      }

      try {
        const result = await convexClient.query(api.quests.getActiveQuests, { deviceId })
        return Array.isArray(result) ? result : []
      } catch (error) {
        logger.error('[useActiveQuests] Ошибка при получении активных квестов:', error)
        return []
      }
    },
    // Synchronize with local Zustand store
    select: (data) => {
      const storeState = useQuestStore.getState()
      const localQuests = storeState.quests ?? {}

      const serverMap = Array.isArray(data)
        ? data.reduce<Record<string, any>>((acc, item: any) => {
            if (!item) return acc
            const questId = item.questId ?? item.id
            if (!questId) return acc
            acc[questId] = item
            return acc
          }, {})
        : {}

      const combinedIds = new Set([
        ...Object.keys(serverMap),
        ...Object.keys(localQuests ?? {}),
      ])

      const merged = Array.from(combinedIds).map((questId) => {
        const serverQuest = serverMap[questId]
        const localQuest = localQuests[questId]
        return {
          questId,
          ...(serverQuest ?? {}),
          ...(localQuest ?? {}),
        }
      })

      return merged.filter((quest) => quest.currentStep !== 'completed' && quest.currentStep !== 'unavailable')
    },
  })
}

// Completed quests statistics
export function useQuestStats() {
  const { deviceId } = useDeviceId()

  return useQuery({
    queryKey: [...questQueryKeys.all, 'stats', deviceId],
    queryFn: async () => {
      if (!deviceId) {
        logger.warn('[useQuestStats] DeviceId не доступен')
        return {
          completedQuests: 0,
          totalQuests: 0,
          completionRate: 0,
          activeQuests: 0
        }
      }

      try {
        const stats = await convexClient.query(api.quests.getQuestStats, { deviceId })
        return stats || {
          completedQuests: 0,
          totalQuests: 0,
          completionRate: 0,
          activeQuests: 0
        }
      } catch (error) {
        logger.error('[useQuestStats] Ошибка при получении статистики квестов:', error)

        // Fallback к локальным данным при ошибке сервера
        const localQuests = useQuestStore.getState().quests ?? {}
        const completed = Object.values(localQuests).filter(q => q && q.currentStep === 'completed').length
        const total = Object.keys(localQuests).length

        return {
          completedQuests: completed,
          totalQuests: total,
          completionRate: total > 0 ? (completed / total) * 100 : 0,
          activeQuests: total - completed
        }
      }
    },
    // Обновляем каждые 30 секунд для актуальной статистики
    refetchInterval: 30000,
  })
}

// Доступные квесты для текущей фазы игрока
export function useAvailableQuests() {
  const { deviceId } = useDeviceId()

  return useQuery({
    queryKey: [...questQueryKeys.available(), deviceId],
    queryFn: async () => {
      if (!deviceId) {
        logger.warn('[useAvailableQuests] DeviceId не доступен')
        return []
      }

      try {
        const result = await convexClient.query(api.quests.getAvailableQuests, { deviceId })
        return Array.isArray(result) ? result : []
      } catch (error) {
        logger.error('[useAvailableQuests] Ошибка при получении доступных квестов:', error)
        return []
      }
    },
    // Обновляем каждые 60 секунд для актуальности доступных квестов
    refetchInterval: 60000,
  })
}

// Batch синхронизация состояния квестов с сервером
export function useSyncQuestState() {
  const queryClient = useQueryClient()
  const { deviceId } = useDeviceId()

  return useMutation({
    mutationFn: async (questUpdates: Array<{
      questId: string;
      currentStep?: string;
      completedAt?: number;
      progressData?: any;
    }>) => {
      if (!deviceId) {
        throw new Error('DeviceId не доступен для синхронизации квестов')
      }

      try {
        const result = await convexClient.mutation(api.quests.syncQuestState, {
          deviceId,
          questUpdates
        })
        return result
      } catch (error) {
        logger.error('[useSyncQuestState] Ошибка при синхронизации квестов:', error)
        throw error
      }
    },
    onSuccess: (data) => {
      if (data.success) {
        logger.info('[useSyncQuestState] Синхронизация квестов успешна')
        // Инвалидируем все quest queries для обновления данных
        queryClient.invalidateQueries({ queryKey: questQueryKeys.all })
      }
    },
    onError: (error) => {
      logger.error('[useSyncQuestState] Не удалось синхронизировать квесты:', error)
    }
  })
}

// Mutation для начала квеста
export function useStartQuest() {
  const queryClient = useQueryClient()
  const { deviceId } = useDeviceId()

  return useMutation({
    mutationFn: async ({ questId, initialStep }: { questId: string; initialStep: string }) => {
      if (!deviceId) {
        throw new Error('DeviceId не доступен для начала квеста')
      }

      try {
        const result = await convexClient.mutation(api.quests.startQuest, {
          deviceId,
          questId,
          initialStep
        })
        return result
      } catch (error) {
        logger.error('[useStartQuest] Ошибка при начале квеста:', error)
        throw error
      }
    },
    onSuccess: (data, { questId }) => {
      if (data.success) {
        logger.info(`[useStartQuest] Квест ${questId} успешно начат`)
        // Инвалидируем все quest queries для обновления данных
        queryClient.invalidateQueries({ queryKey: questQueryKeys.all })
      }
    },
    onError: (error, { questId }) => {
      logger.error(`[useStartQuest] Не удалось начать квест ${questId}:`, error)
    }
  })
}

// Mutation для завершения квеста
export function useCompleteQuest() {
  const queryClient = useQueryClient()
  const { deviceId } = useDeviceId()

  return useMutation({
    mutationFn: async ({ questId, finalStep }: { questId: string; finalStep?: string }) => {
      if (!deviceId) {
        throw new Error('DeviceId не доступен для завершения квеста')
      }

      try {
        const result = await convexClient.mutation(api.quests.completeQuest, {
          deviceId,
          questId,
          finalStep
        })
        return result
      } catch (error) {
        logger.error('[useCompleteQuest] Ошибка при завершении квеста:', error)
        throw error
      }
    },
    onMutate: async ({ questId }) => {
      await queryClient.cancelQueries({ queryKey: questQueryKeys.all })

      const questStore = useQuestStore.getState()
      const previousActiveExists = questId in questStore.activeQuests
      const previousActiveState = questStore.activeQuests[questId]
      const previousQuestExists = questId in questStore.quests
      const previousQuestState = questStore.quests[questId]
      const previousCompletedQuests = [...(questStore.completedQuests ?? [])]
      const previousTrackedQuestId = questStore.trackedQuestId

      questStore.completeQuest(questId)

      const previousAllQuests = queryClient.getQueryData(questQueryKeys.all)
      const previousActiveQuests = queryClient.getQueryData(questQueryKeys.active())
      const previousCompletedQuestsCache = queryClient.getQueryData(questQueryKeys.completed())

      queryClient.setQueryData(questQueryKeys.active(), (old: any) => {
        if (!Array.isArray(old)) return old
        return old.filter((quest: any) => quest.questId !== questId)
      })

      queryClient.setQueryData(questQueryKeys.completed(), (old: any) => {
        const completedEntry = {
          questId,
          ...(questStore.quests[questId] ?? {}),
          currentStep: 'completed',
        }

        if (!Array.isArray(old)) {
          return [completedEntry]
        }

        if (old.some((quest: any) => quest.questId === questId)) {
          return old
        }

        return [...old, completedEntry]
      })

      return {
        previousQuestState,
        previousQuestExists,
        previousActiveState,
        previousActiveExists,
        previousCompletedQuests,
        previousTrackedQuestId,
        previousAllQuests,
        previousActiveQuests,
        previousCompletedQuestsCache,
      }
    },
    onError: (_error, { questId }, context) => {
      if (context) {
        useQuestStore.setState((state) => {
          const nextActiveQuests = { ...state.activeQuests }

          if (context.previousActiveExists) {
            if (context.previousActiveState) {
              nextActiveQuests[questId] = context.previousActiveState
            } else {
              delete nextActiveQuests[questId]
            }
          } else {
            delete nextActiveQuests[questId]
          }

          const nextQuests = { ...state.quests }

          if (context.previousQuestExists) {
            if (context.previousQuestState) {
              nextQuests[questId] = context.previousQuestState
            }
          } else {
            delete nextQuests[questId]
          }

          const nextCompletedQuests = context.previousCompletedQuests
            ? [...context.previousCompletedQuests]
            : state.completedQuests
                .filter((id) => id !== questId)

          return {
            quests: nextQuests,
            activeQuests: nextActiveQuests,
            completedQuests: nextCompletedQuests,
            trackedQuestId: context.previousTrackedQuestId,
          }
        })
      }

      if (context?.previousAllQuests) {
        queryClient.setQueryData(questQueryKeys.all, context.previousAllQuests)
      }

      if (context?.previousActiveQuests) {
        queryClient.setQueryData(questQueryKeys.active(), context.previousActiveQuests)
      }

      if (context?.previousCompletedQuestsCache) {
        queryClient.setQueryData(questQueryKeys.completed(), context.previousCompletedQuestsCache)
      }
    },
    onSuccess: () => {
      // Инвалидируем все quest queries
      queryClient.invalidateQueries({ queryKey: questQueryKeys.all })
    },
  })
}

// Optimistic quest progress update
export function useUpdateQuestProgress() {
  const queryClient = useQueryClient()
  const { deviceId } = useDeviceId()

  return useMutation({
    mutationFn: async ({
      questId,
      step,
      data
    }: {
      questId: string;
      step: string;
      data?: any
    }) => {
      if (!deviceId) {
        throw new Error('DeviceId не доступен для обновления прогресса квеста')
      }

      try {
        const result = await convexClient.mutation(api.quests.updateQuestProgress, {
          deviceId,
          questId,
          newStep: step,
          progressData: data
        })
        return result
      } catch (error) {
        logger.error('[useUpdateQuestProgress] Ошибка при обновлении прогресса квеста:', error)
        throw error
      }
    },
    // Optimistic update
    onMutate: async ({ questId, step }) => {
      await queryClient.cancelQueries({ queryKey: questQueryKeys.active() })

      const questStoreState = useQuestStore.getState()
      const previousStoreState = {
        quests: { ...questStoreState.quests },
        activeQuests: { ...questStoreState.activeQuests },
      }

      useQuestStore.setState((state) => {
        const activeQuest = state.activeQuests[questId]
        if (!activeQuest) {
          return state
        }

        const updatedQuest = { ...activeQuest, currentStep: step as any }

        return {
          activeQuests: {
            ...state.activeQuests,
            [questId]: updatedQuest,
          },
          quests: {
            ...state.quests,
            [questId]: updatedQuest,
          },
        }
      })

      const previousQuests = queryClient.getQueryData(questQueryKeys.active())

      queryClient.setQueryData(questQueryKeys.active(), (old: any) => {
        if (!old) return old
        return old.map((quest: any) =>
          quest.questId === questId
            ? { ...quest, currentStep: step }
            : quest
        )
      })

      return { previousQuests, previousStoreState }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousQuests) {
        queryClient.setQueryData(questQueryKeys.active(), context.previousQuests)
      }

      if (context?.previousStoreState) {
        useQuestStore.setState(() => context.previousStoreState)
      }
    },
    onSettled: () => {
      // Refetch после завершения
      queryClient.invalidateQueries({ queryKey: questQueryKeys.all })
    },
  })
}
