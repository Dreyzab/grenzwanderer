import { useRef } from 'react'
import { questsApi } from '@/shared/api/quests'
import { sanitizeQuestItems } from '@/shared/lib/sanitizeQuests'

type QuestSourceType = 'board' | 'npc'

interface LastRequest {
  type: QuestSourceType
  key: string
  title: string
}

export function useAvailableQuests(
  setModal: (val: { title: string; items?: { id: import('@/entities/quest/model/ids').QuestId; type?: string; priority?: number }[] } | null) => void,
) {
  const last = useRef<LastRequest | null>(null)

  const open = async (type: QuestSourceType, key: string, title: string) => {
    last.current = { type, key, title }
    const raw = (await questsApi.getAvailableQuests(type, key)) as any[]
    if (Array.isArray(raw)) {
      const sanitized = sanitizeQuestItems(raw)
      if (sanitized.length > 0) setModal({ title, items: sanitized })
      else setModal({ title, items: [] })
    }
  }

  const refresh = async () => {
    if (!last.current) return
    await open(last.current.type, last.current.key, last.current.title)
  }

  return {
    openBoard: (boardKey: string, title: string) => open('board', boardKey, title),
    openNpc: (npcId: string, title: string) => open('npc', npcId, title),
    refresh,
  }
}


