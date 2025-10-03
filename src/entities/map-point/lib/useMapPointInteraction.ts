import { useCallback } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useMapPointStore } from '../model/store'
import type { MapPoint } from '../model/types'
import { useDeviceId } from '@/shared/hooks/useDeviceId'

/**
 * Хук для взаимодействия с точками карты
 * Обрабатывает клики, исследование и взаимодействие с NPC
 */
export function useMapPointInteraction() {
  const deviceId = useDeviceId()
  const updatePointStatus = useMapPointStore(state => state.updatePointStatus)
  
  // Convex mutation для пометки точки как исследованной
  const markResearched = useMutation(api.mapPoints.markResearched)

  /**
   * Исследовать точку (клик или QR сканирование)
   */
  const researchPoint = useCallback(async (point: MapPoint) => {
    if (!deviceId) {
      console.error('No device ID available')
      return { success: false, error: 'No device ID' }
    }

    if (point.status === 'researched') {
      return { success: false, error: 'Already researched' }
    }

    try {
      // Optimistic update
      updatePointStatus(point.id, 'researched')

      // Server update
      const result = await markResearched({
        deviceId,
        pointKey: point.id
      })

      console.log(`✅ Point researched: ${point.id}`, result)

      return { success: true, result }
    } catch (error) {
      console.error('Failed to research point:', error)
      
      // Rollback optimistic update
      updatePointStatus(point.id, point.status || 'discovered')
      
      return { success: false, error }
    }
  }, [deviceId, markResearched, updatePointStatus])

  /**
   * Проверить доступность точки
   */
  const checkAccessibility = useCallback((point: MapPoint, playerData?: {
    reputation?: number
    faction?: string
    level?: number
    flags?: string[]
  }) => {
    const { metadata } = point

    if (!metadata) {
      return { accessible: true }
    }

    const issues: string[] = []

    // Проверка репутации
    if (metadata.minReputation && playerData?.reputation !== undefined) {
      if (playerData.reputation < metadata.minReputation) {
        issues.push(`Требуется репутация: ${metadata.minReputation}`)
      }
    }

    // Проверка фракции
    if (metadata.requiresFaction && playerData?.faction) {
      if (playerData.faction !== metadata.requiresFaction) {
        issues.push(`Требуется принадлежность к фракции: ${metadata.requiresFaction}`)
      }
    }

    // Проверка уровня
    if (metadata.recommendedLevel && playerData?.level !== undefined) {
      if (playerData.level < metadata.recommendedLevel) {
        issues.push(`Рекомендуемый уровень: ${metadata.recommendedLevel}`)
      }
    }

    // Проверка требований разблокировки
    if (metadata.unlockRequirements && playerData?.flags) {
      const missingRequirements = metadata.unlockRequirements.filter(
        req => !playerData.flags?.includes(req)
      )
      if (missingRequirements.length > 0) {
        issues.push(`Требования: ${missingRequirements.join(', ')}`)
      }
    }

    return {
      accessible: issues.length === 0,
      issues
    }
  }, [])

  /**
   * Получить доступные действия для точки
   */
  const getAvailableActions = useCallback((point: MapPoint) => {
    const actions: Array<{
      id: string
      label: string
      icon: string
      color: string
      handler: () => void
    }> = []

    const { metadata, status } = point

    // Исследование
    if (status === 'discovered') {
      actions.push({
        id: 'research',
        label: 'Исследовать',
        icon: '🔍',
        color: 'emerald',
        handler: () => researchPoint(point)
      })
    }

    // Диалоги
    if (metadata?.dialogues && metadata.dialogues.length > 0) {
      actions.push({
        id: 'talk',
        label: 'Поговорить',
        icon: '💬',
        color: 'blue',
        handler: () => console.log('Start dialogue:', metadata.dialogues[0])
      })
    }

    // Торговля
    if (metadata?.services?.includes('trade' as any)) {
      actions.push({
        id: 'trade',
        label: 'Торговать',
        icon: '💰',
        color: 'amber',
        handler: () => console.log('Open trade')
      })
    }

    // Ремонт
    if (metadata?.services?.includes('repair' as any)) {
      actions.push({
        id: 'repair',
        label: 'Ремонт',
        icon: '🔧',
        color: 'zinc',
        handler: () => console.log('Open repair')
      })
    }

    // Лечение
    if (metadata?.services?.includes('healing' as any)) {
      actions.push({
        id: 'heal',
        label: 'Лечение',
        icon: '❤️',
        color: 'red',
        handler: () => console.log('Open healing')
      })
    }

    // Квесты
    if (metadata?.questBindings && metadata.questBindings.length > 0) {
      actions.push({
        id: 'quests',
        label: 'Квесты',
        icon: '📜',
        color: 'purple',
        handler: () => console.log('Open quests:', metadata.questBindings)
      })
    }

    // Чёрный рынок
    if (metadata?.tradeOptions?.blackMarket) {
      actions.push({
        id: 'black_market',
        label: 'Чёрный рынок',
        icon: '🎭',
        color: 'red',
        handler: () => console.log('Open black market')
      })
    }

    return actions
  }, [researchPoint])

  /**
   * Получить информацию об опасности
   */
  const getDangerInfo = useCallback((point: MapPoint) => {
    const { metadata } = point

    if (!metadata?.danger_level) {
      return null
    }

    const dangerLevels = {
      low: {
        label: 'Низкая опасность',
        color: 'yellow',
        icon: '⚠️',
        description: 'Минимальный риск, подходит для новичков'
      },
      medium: {
        label: 'Средняя опасность',
        color: 'orange',
        icon: '⚠️⚠️',
        description: 'Требуется осторожность и базовое снаряжение'
      },
      high: {
        label: 'Высокая опасность',
        color: 'red',
        icon: '⚠️⚠️⚠️',
        description: 'Серьезная угроза, рекомендуется команда'
      },
      extreme: {
        label: 'Экстремальная опасность',
        color: 'purple',
        icon: '☠️',
        description: 'Смертельная опасность, только для профессионалов'
      }
    }

    return dangerLevels[metadata.danger_level]
  }, [])

  /**
   * Проверить наличие необходимого снаряжения
   */
  const checkEquipment = useCallback((point: MapPoint, playerInventory?: string[]) => {
    const { metadata } = point

    if (!metadata?.requiresEquipment || !playerInventory) {
      return { hasRequired: true, missing: [] }
    }

    const missing = metadata.requiresEquipment.filter(
      item => !playerInventory.includes(item)
    )

    return {
      hasRequired: missing.length === 0,
      missing
    }
  }, [])

  return {
    researchPoint,
    checkAccessibility,
    getAvailableActions,
    getDangerInfo,
    checkEquipment
  }
}


