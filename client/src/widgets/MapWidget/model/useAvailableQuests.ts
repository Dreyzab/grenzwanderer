import { useCallback } from 'react'
import { questsApi } from '@/shared/api/quests'

export function useAvailableQuests(onShow: (v: { title: string; ids?: any[]; items?: { id: any; type?: string; priority?: number }[] }) => void) {
  const openBoard = useCallback(async (boardKey: string, title: string) => {
    const items = await questsApi.getAvailableBoardQuests(boardKey)
    onShow({ title, items: items as any })
  }, [onShow])

  const openNpc = useCallback(async (npcId: string, title: string) => {
    const items = await questsApi.getAvailableQuestsForNpc(npcId)
    onShow({ title, items: items as any })
  }, [onShow])

  const refresh = useCallback(async () => {
    // В текущем минимуме — no-op, вызывающий компонент повторно запросит по месту
  }, [])

  return { openBoard, openNpc, refresh }
}


