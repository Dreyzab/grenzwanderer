import type { VisibleMapPoint } from '@/entities/map-point/model/types'

const POINT_ID_TO_NPC_ID: Record<string, string> = {
  fjr_office_start: 'hans',
}

export function getQuestSourceForPoint(
  point: VisibleMapPoint,
): { type: 'npc' | 'board'; key: string } | null {
  if (point.type === 'board') {
    // для досок используем id точки как ключ доски по умолчанию
    return { type: 'board', key: point.id }
  }
  if (point.type === 'npc' || point.type === 'npc_spawn') {
    const npcId = POINT_ID_TO_NPC_ID[point.id]
    if (npcId) return { type: 'npc', key: npcId }
  }
  return null
}


