import type { VisibleMapPoint } from '@/entities/map-point/model/types'
import type { DialogDefinition } from '@/shared/dialogs/types'
import { getDialogByKey } from '@/shared/storage/dialogs'

export interface QuestStateSnapshot {
  deliveryStep: string | 'not_started'
  loyaltyStep?: string | null
  waterStep?: string | null
  freedomStep?: string | null
}

export function decideDialogKey(point: VisibleMapPoint, qs: QuestStateSnapshot): DialogDefinition | null {
  let dialogKey = point.dialogKey

  if (point.id === 'fjr_office_start') dialogKey = 'loyalty_quest_start'

  // Доставка: возврат к Дитеру с кристаллом
  if (point.dialogKey === 'craftsman_meeting_dialog' && qs.deliveryStep === 'return_to_craftsman') {
    dialogKey = 'quest_complete_with_artifact_dialog'
  }

  // Повторные визиты/проверка прогресса вместо повторного старта
  if (qs.deliveryStep !== 'not_started') {
    if (point.id === 'settlement_center' && point.dialogKey === 'quest_start_dialog') {
      dialogKey = 'delivery_progress_check'
    }
  }
  if (qs.deliveryStep && ['need_pickup_from_trader', 'deliver_parts_to_craftsman', 'artifact_offer', 'go_to_anomaly'].includes(qs.deliveryStep)) {
    if (point.id === 'trader_camp' && point.dialogKey === 'trader_meeting_dialog') {
      dialogKey = 'trader_progress_check'
    }
  }
  if (qs.deliveryStep && ['go_to_anomaly', 'return_to_craftsman'].includes(qs.deliveryStep)) {
    if (point.id === 'workshop_center' && point.dialogKey === 'craftsman_meeting_dialog') {
      dialogKey = 'craftsman_progress_check'
    }
  }

  // Finals for freedom_spark
  if (qs.freedomStep === 'friendship_final' && point.id === 'anarchist_bar') {
    dialogKey = 'friendship_path_final'
  }
  if (qs.freedomStep === 'order_final' && point.id === 'carl_private_workshop') {
    dialogKey = 'order_path_final'
  }
  if (qs.freedomStep === 'anarchy_final' && point.id === 'anarchist_arena_basement') {
    dialogKey = 'anarchy_path_final'
  }
  if (qs.freedomStep === 'chaos_final' && point.id === 'city_gate_travers') {
    dialogKey = 'chaos_path_final'
  }

  // ВОДА: повторные визиты
  if (point.id === 'old_believers_square' && qs.waterStep && qs.waterStep !== 'completed') {
    dialogKey = 'water_quest_start_v2' // старт или прогресс обсуждается у Отца Иоанна
  }
  if (point.id === 'gunter_brewery' && qs.waterStep && ['need_to_talk_to_gunter', 'talk_to_travers', 'got_proof', 'final_talk_with_gunter'].includes(qs.waterStep)) {
    dialogKey = qs.waterStep === 'need_to_talk_to_gunter' ? 'gunter_meeting_dialog_v2' : 'final_choice_dialog_v2'
  }
  if (point.id === 'city_gate_travers' && qs.waterStep && ['talk_to_travers', 'got_proof'].includes(qs.waterStep)) {
    dialogKey = qs.waterStep === 'talk_to_travers' ? 'travers_investigation_dialog' : 'final_choice_dialog_v2'
  }

  if (!dialogKey) return null
  const def = getDialogByKey(dialogKey)
  return def ?? null
}


