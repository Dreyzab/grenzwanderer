import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import convexClient from '@/shared/lib/convexClient/convexClient'
import { api } from '@/../convex/_generated/api'
import { useQuestStore } from '@/entities/quest/model/questStore'

// Query Keys для квестов
export const questQueryKeys = {
  all: ['quests'] as const,
  active: () => [...questQueryKeys.all, 'active'] as const,
  completed: () => [...questQueryKeys.all, 'completed'] as const,
  available: () => [...questQueryKeys.all, 'available'] as const,
} as const

// Active quests from server
export function useActiveQuests() {
  return useQuery({
    queryKey: questQueryKeys.active(),
    queryFn: async () => {
      const result = await convexClient.query(api.quests.getActive, {})
      return Array.isArray(result) ? result : []
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
  return useQuery({
    queryKey: [...questQueryKeys.all, 'stats'],
    queryFn: async () => {
      const stats = await convexClient.query(api.quests.getStats, {})
      if (stats) {
        return stats
      }

      const localQuests = useQuestStore.getState().quests ?? {}
      const completed = Object.values(localQuests).filter(q => q && q.currentStep === 'completed').length
      const total = Object.keys(localQuests).length
      
      return {
        completedQuests: completed,
        totalQuests: total,
        completionRate: total > 0 ? (completed / total) * 100 : 0
      }
    },
    // Обновляем каждые 30 секунд для актуальной статистики
    refetchInterval: 30000,
  })
}

// Mutation для завершения квеста
export function useCompleteQuest() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ questId, outcome }: { questId: string; outcome?: any }) => {
      // TODO: Server-side quest completion
      // return await convexClient.mutation(api.quests.complete, { questId, outcome })
      return { questId, outcome }
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
  
  return useMutation({
    mutationFn: async ({ questId, step, data }: { 
      questId: string; 
      step: string; 
      data?: any 
    }) => {
      // TODO: Background sync с сервером
      // await convexClient.mutation(api.quests.updateProgress, { questId, step, data })
      
      return { questId, step, data }
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
