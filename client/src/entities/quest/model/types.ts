export type DeliveryQuestId = 'delivery_and_dilemma' | 'loyalty_fjr' | 'water_crisis' | 'freedom_spark'

export type DeliveryQuestStep =
  | 'not_started'
  | 'need_pickup_from_trader'
  | 'deliver_parts_to_craftsman'
  | 'artifact_offer'
  | 'go_to_anomaly'
  | 'return_to_craftsman'
  | 'completed'
  | 'go_to_hole'
  // Ветвление для water_crisis
  | 'need_to_talk_to_gunter'
  | 'talk_to_travers'
  | 'got_proof'
  | 'final_talk_with_gunter'
  | 'travers_hunt'
  | 'leverage_hunt'
  | 'synthesis_samples'
  // Ветвление для freedom_spark
  | 'talk_to_odin'
  | 'find_rivet'
  | 'friendship_final'
  | 'order_final'
  | 'anarchy_final'
  | 'chaos_final'

export interface ActiveQuest {
  id: DeliveryQuestId
  currentStep: DeliveryQuestStep
  startedAt: number
}


