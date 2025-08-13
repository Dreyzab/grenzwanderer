export type DeliveryQuestId = 'delivery_and_dilemma' | 'loyalty_fjr' | 'water_crisis' | 'freedom_spark' | 'combat_baptism' | 'field_medicine' | 'quiet_cove_whisper' | 'bell_for_lost' | 'citizenship_invitation' | 'eyes_in_the_dark' | 'void_shards'

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
  // Ветвление для combat_baptism
  | 'combat_available_on_board'
  | 'assigned_to_patrol'
  | 'patrol_in_progress'
  | 'combat_completed'
  // Ветвление для field_medicine
  | 'medical_emergency'
  | 'treatment_needed'
  | 'accepted_moss_mission'
  | 'collecting_moss'
  | 'moss_collected'
  | 'medicine_completed'
  // Ветвление для quiet_cove_whisper
  | 'courier_missing'
  | 'talk_to_luda'
  | 'find_scar'
  | 'stealth_mission'
  | 'processors_recovered'
  | 'quiet_cove_completed'
  // Ветвление для bell_for_lost
  | 'bell_mission_offered'
  | 'going_to_chapel'
  | 'solving_bell_puzzle'
  | 'confronting_fanatics'
  | 'bell_retrieved'
  | 'bell_installed'
  // Ветвление для citizenship_invitation
  | 'official_summons_received'
  | 'meeting_with_mayor'
  | 'citizenship_offered'
  | 'citizenship_decision'
  | 'citizenship_granted'
  | 'citizenship_declined'
  | 'special_missions_unlocked'
  // Ветвление для eyes_in_the_dark
  | 'special_assignment_available'
  | 'joint_operation_briefing'
  | 'detector_installation_mission'
  | 'anomaly_discovered'
  | 'joint_mission_completed'
  // Ветвление для void_shards
  | 'crystal_collection_offer'
  | 'searching_for_shards'
  | 'mercenary_ambush'
  | 'crystal_recovery_attempt'
  | 'investigation_complete'
  | 'void_shards_delivered'

export interface ActiveQuest {
  id: DeliveryQuestId
  currentStep: DeliveryQuestStep
  startedAt: number
}

// Узкоспециализированный тип шагов для боевого туториала, чтобы не тянуть весь DeliveryQuestStep
export type CombatQuestStep =
  | 'combat_available_on_board'
  | 'assigned_to_patrol'
  | 'patrol_in_progress'
  | 'combat_completed'


