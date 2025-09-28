import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
      // TODO: Реализовать получение активных квестов с сервера
      // const result = await convexClient.query(api.quests.getActive, {})
      // return result
      return []
    },
    // Synchronize with local Zustand store
    select: (data) => {
      const localQuests = useQuestStore.getState().quests
      // Объединяем server state с local state
      return Object.entries(localQuests ?? {})
        .filter(([_, quest]) => quest && quest.currentStep !== 'completed' && quest.currentStep !== 'unavailable')
        .map(([questId, quest]) => ({ questId, ...quest }))
    },
  })
}

// Completed quests statistics
export function useQuestStats() {
  return useQuery({
    queryKey: [...questQueryKeys.all, 'stats'],
    queryFn: async () => {
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
      
      // Пока используем локальный store
      const questStore = useQuestStore.getState()
      questStore.completeQuest(questId)
      
      return { questId, outcome }
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
      // Optimistic update в local store
      const questStore = useQuestStore.getState()
      questStore.advanceQuest(questId, step as any)
      
      // TODO: Background sync с сервером
      // await convexClient.mutation(api.quests.updateProgress, { questId, step, data })
      
      return { questId, step, data }
    },
    // Optimistic update
    onMutate: async ({ questId, step }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: questQueryKeys.active() })
      
      // Snapshot the previous value
      const previousQuests = queryClient.getQueryData(questQueryKeys.active())
      
      // Optimistically update
      queryClient.setQueryData(questQueryKeys.active(), (old: any) => {
        if (!old) return old
        return old.map((quest: any) => 
          quest.questId === questId 
            ? { ...quest, currentStep: step }
            : quest
        )
      })
      
      return { previousQuests }
    },
    onError: (err, variables, context) => {
      // Rollback optimistic update
      if (context?.previousQuests) {
        queryClient.setQueryData(questQueryKeys.active(), context.previousQuests)
      }
    },
    onSettled: () => {
      // Refetch после завершения
      queryClient.invalidateQueries({ queryKey: questQueryKeys.all })
    },
  })
}
