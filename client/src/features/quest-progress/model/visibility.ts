import type { VisibleMapPoint } from '@/entities/map-point/model/types'
import logger from '@/shared/lib/logger'

export interface QuestStepsState {
  deliveryStep?: string | null
  loyaltyStep?: string | null
  waterStep?: string | null
  freedomStep?: string | null
}

export function filterVisiblePoints(points: VisibleMapPoint[], steps: QuestStepsState): VisibleMapPoint[] {
  const { deliveryStep, loyaltyStep, waterStep, freedomStep } = steps

  const filtered = points.filter((p) => {
    // Ветвь квеста лояльности
    if (loyaltyStep === 'go_to_hole') return p.id === 'anarchist_hole'

    // Ветвь квеста воды
    if (waterStep === 'need_to_talk_to_gunter') return p.id === 'gunter_brewery'
    if (waterStep === 'talk_to_travers') return p.id === 'city_gate_travers'
    if (waterStep === 'got_proof' || waterStep === 'final_talk_with_gunter') return p.id === 'gunter_brewery'

    // Ветвь квеста свободы
    if (freedomStep === 'talk_to_odin') return p.id === 'anarchist_bar'
    if (freedomStep === 'find_rivet') return p.id === 'anarchist_arena_basement'
    if (freedomStep === 'friendship_final') return p.id === 'anarchist_bar'
    if (freedomStep === 'order_final') return p.id === 'carl_private_workshop'

    // Базовый квест доставки
    if (deliveryStep === 'not_started') return p.dialogKey === 'quest_start_dialog'
    if (deliveryStep === 'need_pickup_from_trader') return p.dialogKey === 'trader_meeting_dialog'
    if (deliveryStep === 'deliver_parts_to_craftsman' || deliveryStep === 'artifact_offer')
      return p.dialogKey === 'craftsman_meeting_dialog'
    if (deliveryStep === 'go_to_anomaly') return p.dialogKey === 'anomaly_exploration_dialog'
    if (deliveryStep === 'return_to_craftsman') return p.dialogKey === 'craftsman_meeting_dialog'
    if (deliveryStep === 'completed') return p.id === 'fjr_office_start'

    return true
  })

  logger.info(
    'MAP',
    'Filtered points',
    deliveryStep,
    loyaltyStep,
    waterStep,
    freedomStep,
    '→ ids:',
    filtered.map((p) => p.id),
  )

  return filtered
}


