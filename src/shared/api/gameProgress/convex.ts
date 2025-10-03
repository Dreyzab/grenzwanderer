import { useQuery, useMutation } from 'convex/react'
import { api } from '@/../convex/_generated/api'
import { useDeviceId } from '@/shared/hooks/useDeviceId'

/**
 * Хук для загрузки прогресса игры
 */
export function useGameProgress() {
  const { deviceId } = useDeviceId()

  return useQuery(api.gameProgress.loadProgress, {
    deviceId,
  })
}

/**
 * Хук для сохранения прогресса игры
 */
export function useSaveProgress() {
  const { deviceId } = useDeviceId()
  const mutation = useMutation(api.gameProgress.saveProgress)

  return async (currentScene: string, visitedScenes: string[], flags: Record<string, any>) => {
    return await mutation({
      deviceId,
      currentScene,
      visitedScenes,
      flags,
    })
  }
}

/**
 * Хук для установки флага игры
 */
export function useSetFlag() {
  const { deviceId } = useDeviceId()
  const mutation = useMutation(api.gameProgress.setFlag)

  return async (key: string, value: any) => {
    return await mutation({
      deviceId,
      key,
      value,
    })
  }
}

/**
 * Хук для получения значения флага
 */
export function useGetFlag(key: string, enabled = true) {
  const { deviceId } = useDeviceId()

  return useQuery(
    api.gameProgress.getFlag,
    enabled ? {
      deviceId,
      key,
    } : 'skip'
  )
}

/**
 * Хук для сброса прогресса игры
 */
export function useResetProgress() {
  const { deviceId } = useDeviceId()
  const mutation = useMutation(api.gameProgress.resetProgress)

  return async () => {
    return await mutation({
      deviceId,
    })
  }
}

/**
 * Хук для получения статистики прогресса
 */
export function useProgressStats() {
  const { deviceId } = useDeviceId()

  return useQuery(api.gameProgress.getProgressStats, {
    deviceId,
  })
}

