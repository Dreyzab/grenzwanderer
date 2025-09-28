import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/../convex/_generated/api'
import type { Doc } from '@/../convex/_generated/dataModel'
import convexClient from '@/shared/lib/convexClient/convexClient'

// Query Keys для кэширования
export const playerQueryKeys = {
  all: ['player'] as const,
  profile: () => [...playerQueryKeys.all, 'profile'] as const,
  stats: () => [...playerQueryKeys.all, 'stats'] as const,
} as const

// Player profile данные с server state
export function usePlayerProfile() {
  return useQuery({
    queryKey: playerQueryKeys.profile(),
    queryFn: async (): Promise<Doc<'players'> | null> => {
      // TODO: Реализовать query для получения профиля игрока
      // const result = await convexClient.query(api.player.getProfile, {})
      // return result
      return null
    },
    enabled: true, // Включаем только если пользователь авторизован
  })
}

// Player statistics для dashboard
export function usePlayerStats() {
  return useQuery({
    queryKey: playerQueryKeys.stats(),
    queryFn: async () => {
      // TODO: Реализовать query для статистики
      return {
        completedQuests: 0,
        totalQuests: 0,
        currentPhase: 1,
        experienceGained: 0,
        daysSinceStart: 1
      }
    },
  })
}

// Mutation для bootstrap игрока
export function useBootstrapPlayer() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async () => {
      return await convexClient.mutation(api.player.bootstrap, {})
    },
    onSuccess: () => {
      // Инвалидируем все player queries при успешном bootstrap
      queryClient.invalidateQueries({ queryKey: playerQueryKeys.all })
    },
    onError: (error) => {
      console.error('[Player] Bootstrap failed:', error)
    },
  })
}

// Mutation для обновления репутации
export function useUpdatePlayerReputation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (updates: { fame?: number; phase?: number }) => {
      // TODO: Реализовать mutation для обновления репутации
      // return await convexClient.mutation(api.player.updateReputation, updates)
      return updates
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: playerQueryKeys.profile() })
      queryClient.invalidateQueries({ queryKey: playerQueryKeys.stats() })
    },
  })
}
