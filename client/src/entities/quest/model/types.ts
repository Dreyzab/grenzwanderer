export type DeliveryQuestId = 'delivery_and_dilemma' | 'loyalty_fjr'

export type DeliveryQuestStep =
  | 'not_started'
  | 'need_pickup_from_trader'
  | 'deliver_parts_to_craftsman'
  | 'artifact_offer'
  | 'go_to_anomaly'
  | 'return_to_craftsman'
  | 'completed'
  | 'go_to_hole'

export interface ActiveQuest {
  id: DeliveryQuestId
  currentStep: DeliveryQuestStep
  startedAt: number
}


