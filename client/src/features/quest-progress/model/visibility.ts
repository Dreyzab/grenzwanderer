import type { VisibleMapPoint } from '@/entities/map-point/model/types'
import logger from '@/shared/lib/logger'
import { useProgressionStore } from '@/entities/quest/model/progressionStore'

export interface QuestStepsState {
  deliveryStep?: string | null
  loyaltyStep?: string | null
  waterStep?: string | null
  freedomStep?: string | null
}

export function filterVisiblePoints(points: VisibleMapPoint[], steps: QuestStepsState): VisibleMapPoint[] {
  const { deliveryStep, loyaltyStep, waterStep, freedomStep } = steps
  const phase = useProgressionStore.getState().phase
  const N = 3

  const filtered = points.filter((p) => {
    // Никогда не показывать точки завершённых квестов
    if (deliveryStep === 'completed' && p.questId === 'delivery_and_dilemma') return false
    if (loyaltyStep === 'completed' && p.questId === 'loyalty_fjr') return false
    if (waterStep === 'completed' && p.questId === 'water_crisis') return false
    if (freedomStep === 'completed' && p.questId === 'freedom_spark') return false

    // ФАЗЫ
    const phase1Starts = ['settlement_center', 'synthesis_medbay', 'quiet_cove_bar', 'cathedral']
    const phase2Starts = ['rathaus', 'seepark', 'wasserschlossle', 'fjr_office_start']
    if (phase === 1 && phase1Starts.includes(p.id)) return true
    if (phase === 2 && (phase2Starts.includes(p.id) || phase1Starts.includes(p.id))) return true

    // Разблокировка гражданства при выполнении N вводных
    if (phase === 1) {
      // Примечание: Клиентскую проверку лучше делать из стора; быстрое временное решение — только сервер должен быть источником истины
      if (Array.isArray((steps as any).completedPhase1) && (steps as any).completedPhase1 >= N) {
        if (p.id === 'rathaus') return true
      }
    }
    // Ветвь квеста лояльности (появляется только в Фазе 2 либо после завершения доставки)
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

    return false
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


