import type { VisibleMapPoint } from '@/entities/map-point/model/types'
import type { DialogDefinition } from '@/shared/dialogs/types'
// server-resolved now

export interface QuestStateSnapshot {
  deliveryStep: string | 'not_started'
  loyaltyStep?: string | null
  waterStep?: string | null
  freedomStep?: string | null
  quietCoveStep?: string | null
  phase?: number
}

// Удалено: решает сервер (qr.resolvePoint)
export function decideDialogKey(_: VisibleMapPoint, __: QuestStateSnapshot): DialogDefinition | null {
  return null
}


