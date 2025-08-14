import type { QuestStep, CombatQuestStep } from '@/entities/quest/model/types'
import type { QuestId } from '@/entities/quest/model/ids'

export type DeliveryFsmEvent =
  | { type: 'START' }
  | { type: 'ADVANCE'; step: QuestStep }
  | { type: 'COMPLETE' }

export type CombatFsmEvent =
  | { type: 'START' }
  | { type: 'ASSIGN' }
  | { type: 'ADVANCE'; step: CombatQuestStep }
  | { type: 'COMPLETE' }

export type ActionDescriptor =
  | { kind: 'phase'; phase: 1 | 2 }
  | { kind: 'fsm'; machine: 'delivery'; event: DeliveryFsmEvent }
  | { kind: 'fsm'; machine: 'combat'; event: CombatFsmEvent }
  | { kind: 'quest'; op: 'start' | 'advance' | 'complete'; questId: QuestId; step?: QuestStep }

export const dialogActionMap: Record<string, ActionDescriptor> = {
  // Фазы
  set_phase_1: { kind: 'phase', phase: 1 },
  set_phase_2: { kind: 'phase', phase: 2 },

  // Delivery
  start_delivery_quest: { kind: 'fsm', machine: 'delivery', event: { type: 'START' } },
  take_parts: { kind: 'fsm', machine: 'delivery', event: { type: 'ADVANCE', step: 'deliver_parts_to_craftsman' } },
  deliver_parts: { kind: 'fsm', machine: 'delivery', event: { type: 'ADVANCE', step: 'artifact_offer' } },
  accept_artifact_quest: { kind: 'fsm', machine: 'delivery', event: { type: 'ADVANCE', step: 'go_to_anomaly' } },
  return_to_craftsman: { kind: 'fsm', machine: 'delivery', event: { type: 'ADVANCE', step: 'return_to_craftsman' } },
  complete_delivery_quest: { kind: 'fsm', machine: 'delivery', event: { type: 'COMPLETE' } },
  complete_delivery_quest_with_artifact: { kind: 'fsm', machine: 'delivery', event: { type: 'COMPLETE' } },

  // Combat baptism
  start_combat_baptism_quest: { kind: 'fsm', machine: 'combat', event: { type: 'START' } },
  accept_combat_baptism_quest: { kind: 'fsm', machine: 'combat', event: { type: 'ASSIGN' } },
  start_combat_tutorial_scarabs: { kind: 'fsm', machine: 'combat', event: { type: 'ADVANCE', step: 'patrol_in_progress' } },
  complete_combat_baptism_quest: { kind: 'fsm', machine: 'combat', event: { type: 'COMPLETE' } },

  // Quiet Cove
  start_quiet_cove_quest: { kind: 'quest', op: 'start', questId: 'quiet_cove_whisper', step: 'courier_missing' },

  // Bell for Lost
  start_bell_for_lost_quest: { kind: 'quest', op: 'start', questId: 'bell_for_lost', step: 'bell_mission_offered' },
  start_bell_quest: { kind: 'quest', op: 'start', questId: 'bell_for_lost', step: 'bell_mission_offered' },
  complete_bell_quest_perfect: { kind: 'quest', op: 'complete', questId: 'bell_for_lost' },
  complete_bell_quest_damaged: { kind: 'quest', op: 'complete', questId: 'bell_for_lost' },
  complete_bell_quest_violent: { kind: 'quest', op: 'complete', questId: 'bell_for_lost' },

  // Field medicine
  start_field_medicine_quest: { kind: 'quest', op: 'start', questId: 'field_medicine', step: 'medical_emergency' },

  // Loyalty FJR
  start_loyalty_quest_fjr: { kind: 'quest', op: 'start', questId: 'loyalty_fjr', step: 'go_to_hole' },
  go_to_hole: { kind: 'quest', op: 'start', questId: 'loyalty_fjr', step: 'go_to_hole' },
  complete_loyalty_quest_fjr: { kind: 'quest', op: 'complete', questId: 'loyalty_fjr' },
  complete_loyalty_quest_anarchist: { kind: 'quest', op: 'complete', questId: 'loyalty_fjr' },
  complete_loyalty_quest_double_cross: { kind: 'quest', op: 'complete', questId: 'loyalty_fjr' },
  accept_double_cross: { kind: 'quest', op: 'advance', questId: 'loyalty_fjr', step: 'go_to_hole' },
  accept_anarchist_side: { kind: 'quest', op: 'advance', questId: 'loyalty_fjr', step: 'go_to_hole' },
  fight_scar_for_map: { kind: 'quest', op: 'advance', questId: 'loyalty_fjr', step: 'go_to_hole' },
  fail_loyalty_quest_no_map: { kind: 'quest', op: 'advance', questId: 'loyalty_fjr', step: 'go_to_hole' },
  return_to_fjr_with_fake_map: { kind: 'quest', op: 'advance', questId: 'loyalty_fjr', step: 'go_to_hole' },

  // Water crisis
  start_water_quest: { kind: 'quest', op: 'start', questId: 'water_crisis', step: 'need_to_talk_to_gunter' },
  gain_gunter_proof_digital: { kind: 'quest', op: 'advance', questId: 'water_crisis', step: 'got_proof' },
  update_quest_travers_hunt: { kind: 'quest', op: 'advance', questId: 'water_crisis', step: 'travers_hunt' },
  update_quest_leverage_hunt: { kind: 'quest', op: 'advance', questId: 'water_crisis', step: 'leverage_hunt' },
  update_quest_to_synthesis_samples: { kind: 'quest', op: 'advance', questId: 'water_crisis', step: 'synthesis_samples' },
  complete_water_quest_blackmail: { kind: 'quest', op: 'complete', questId: 'water_crisis' },
  start_subquest_travers_leverage: { kind: 'quest', op: 'advance', questId: 'water_crisis', step: 'leverage_hunt' },
  start_subquest_synthesis_samples: { kind: 'quest', op: 'advance', questId: 'water_crisis', step: 'synthesis_samples' },

  // Freedom spark
  start_freedom_spark_quest: { kind: 'quest', op: 'start', questId: 'freedom_spark', step: 'talk_to_odin' },
  update_quest_find_rivet: { kind: 'quest', op: 'advance', questId: 'freedom_spark', step: 'find_rivet' },
  fight_rivet_for_cells: { kind: 'quest', op: 'advance', questId: 'freedom_spark', step: 'order_final' },
  sabotage_device_for_carl: { kind: 'quest', op: 'advance', questId: 'freedom_spark', step: 'order_final' },
  accept_rivet_mission_betray_carl: { kind: 'quest', op: 'advance', questId: 'freedom_spark', step: 'anarchy_final' },
  return_to_odin_with_info: { kind: 'quest', op: 'advance', questId: 'freedom_spark', step: 'friendship_final' },
  complete_quest_friendship: { kind: 'quest', op: 'complete', questId: 'freedom_spark' },
  complete_quest_order: { kind: 'quest', op: 'complete', questId: 'freedom_spark' },
  complete_quest_anarchy: { kind: 'quest', op: 'complete', questId: 'freedom_spark' },
  complete_quest_chaos: { kind: 'quest', op: 'complete', questId: 'freedom_spark' },
  complete_quest_chaos_haggled: { kind: 'quest', op: 'complete', questId: 'freedom_spark' },

  // Eyes in the dark
  start_eyes_in_the_dark_quest: { kind: 'quest', op: 'start', questId: 'eyes_in_the_dark', step: 'special_assignment_available' },
  complete_eyes_in_the_dark_quest: { kind: 'quest', op: 'complete', questId: 'eyes_in_the_dark' },

  // Void shards
  start_void_shards_quest: { kind: 'quest', op: 'start', questId: 'void_shards', step: 'crystal_collection_offer' },
  complete_quest_personal_gain: { kind: 'quest', op: 'complete', questId: 'void_shards' },
  fail_void_shards_quest: { kind: 'quest', op: 'complete', questId: 'void_shards' },
  complete_quest_info_only: { kind: 'quest', op: 'complete', questId: 'void_shards' },
  complete_void_shards_quest_success: { kind: 'quest', op: 'complete', questId: 'void_shards' },
  complete_void_shards_quest_bonus: { kind: 'quest', op: 'complete', questId: 'void_shards' },

  // Citizenship
  trigger_citizenship_quest: { kind: 'quest', op: 'start', questId: 'citizenship_invitation', step: 'official_summons_received' },
  complete_citizenship_quest: { kind: 'quest', op: 'complete', questId: 'citizenship_invitation' },
}


