export type OutcomeArgs = {
  fameDelta?: number
  reputationsDelta?: Record<string, number>
  relationshipsDelta?: Record<string, number>
  addFlags?: string[]
  removeFlags?: string[]
  addWorldFlags?: string[]
  removeWorldFlags?: string[]
  setPhase?: number
  setStatus?: string
}

const outcomeTable: Record<string, OutcomeArgs> = {
  // Citizenship gateway
  citizenship_granted: { setPhase: 2, setStatus: 'citizen', fameDelta: 50, addFlags: ['citizenship_granted'] },

  // Combat baptism
  accept_combat_baptism_quest: { reputationsDelta: { fjr: 2 }, addFlags: ['combat_baptism_accepted'] },
  complete_combat_baptism_quest: { fameDelta: 5, reputationsDelta: { fjr: 10 }, addFlags: ['combat_baptism_completed'] },

  // Bell for Lost
  accept_bell_quest: { addFlags: ['bell_quest_accepted'], fameDelta: 1 },
  complete_bell_quest_perfect: { fameDelta: 5, relationshipsDelta: { cathedral_priest: 10 }, addFlags: ['bell_restored'] },
  complete_bell_quest_damaged: { fameDelta: 2, relationshipsDelta: { cathedral_priest: 3 }, addFlags: ['bell_restored_damaged'] },
  complete_bell_quest_violent: { fameDelta: -5, addFlags: ['bell_restored_violent'] },

  // Quiet Cove
  accept_quiet_cove_quest: { addFlags: ['quiet_cove_accepted'] },
  complete_quiet_cove_quest_traders: { reputationsDelta: { traders: 10, anarchists: -5 }, addFlags: ['quiet_cove_traders'] },
  complete_quiet_cove_quest_anarchists: { reputationsDelta: { anarchists: 10, traders: -5 }, addFlags: ['quiet_cove_anarchists'] },

  // Field Medicine
  accept_field_medicine_quest: { addFlags: ['field_medicine_accepted'] },
  complete_field_medicine_quest: { fameDelta: 3, reputationsDelta: { synthesis: 8 }, addFlags: ['field_medicine_completed'] },

  // Water Crisis
  accept_water_quest: { addFlags: ['water_quest_accepted'] },
  // Delivery quest
  accept_delivery_quest: { addFlags: ['accept_delivery_quest'] },
  decline_delivery_quest: { addFlags: ['decline_delivery_quest'] },
  parts_collected: { addFlags: ['delivery_parts_collected'] },
  deliver_parts_to_craftsman: { addFlags: ['delivery_delivered_to_craftsman'] },
  accept_artifact_quest: { addFlags: ['delivery_artifact_branch'] },
  decline_artifact_quest: { addFlags: ['delivery_declined_artifact'] },
  complete_delivery_quest: { addFlags: ['delivery_completed'] },
  complete_delivery_quest_with_artifact: { addFlags: ['delivery_completed_with_artifact'] },
  gunter_proof_gained: { addFlags: ['water_proof_collected'] },
  water_quest_outcome_blackmail: { reputationsDelta: { traders: 10, synthesis: -10 }, addFlags: ['water_blackmail'] },
  water_quest_update_travers: { addFlags: ['water_update_travers'] },
  water_quest_update_leverage: { addFlags: ['water_update_leverage'] },
  water_quest_update_synthesis: { addFlags: ['water_update_synthesis'] },

  // Freedom Spark outcomes
  quest_outcome_friendship: { reputationsDelta: { anarchists: 8 }, addFlags: ['freedom_friendship'] },
  quest_outcome_order: { reputationsDelta: { carl_artisan: 10 }, addFlags: ['freedom_order'] },
  quest_outcome_anarchy: { reputationsDelta: { anarchists: 12, fjr: -8 }, addFlags: ['freedom_anarchy'] },
  quest_outcome_chaos: { fameDelta: -5, reputationsDelta: { anarchists: -5, traders: -5 }, addFlags: ['freedom_chaos'] },

  // Loyalty FJR (subset)
  accept_fjr_quest: { reputationsDelta: { fjr: 5 }, addFlags: ['loyalty_fjr_accepted'] },
  go_to_hole: { addFlags: ['loyalty_go_to_hole'] },
  complete_loyalty_quest_fjr: { reputationsDelta: { fjr: 15, anarchists: -10 }, addFlags: ['loyalty_completed_fjr'] },
  complete_loyalty_quest_anarchist: { reputationsDelta: { anarchists: 15, fjr: -10 }, addFlags: ['loyalty_completed_anarchists'] },
  complete_loyalty_quest_double_cross: { reputationsDelta: { fjr: -5, anarchists: -5 }, addFlags: ['loyalty_completed_double'] },

  // Loyalty additional branches (flags only)
  accept_double_cross: { addFlags: ['loyalty_accept_double_cross'] },
  accept_anarchist_side: { addFlags: ['loyalty_accept_anarchist_side'] },
  fight_scar_for_map: { addFlags: ['loyalty_fight_scar'] },
  fail_loyalty_quest_no_map: { addFlags: ['loyalty_failed_no_map'] },
  return_to_fjr_with_fake_map: { addFlags: ['loyalty_return_with_fake_map'] },
  return_to_one_anarchist_side: { addFlags: ['loyalty_return_to_odin'] },
  return_to_fjr_with_map: { addFlags: ['loyalty_return_with_map'] },

  // Eyes in the dark
  accept_eyes_in_the_dark_quest: { addFlags: ['eyes_quest_accepted'] },
  complete_eyes_in_the_dark_quest: { reputationsDelta: { synthesis: 8, fjr: 5 }, addFlags: ['eyes_quest_completed'] },

  // Void shards
  accept_void_shards_quest: { addFlags: ['void_shards_accepted'] },
  void_shards_personal_gain: { fameDelta: -3, reputationsDelta: { traders: 8 }, addFlags: ['void_shards_personal_gain'] },
  void_shards_failed: { addFlags: ['void_shards_failed'] },
  void_shards_info_only: { addFlags: ['void_shards_info_only'] },
  void_shards_success: { fameDelta: 5, reputationsDelta: { carl_artisan: 10, anarchists: 5 }, addFlags: ['void_shards_success'] },
  void_shards_bonus: { fameDelta: 2, addFlags: ['void_shards_bonus'] },
}

export function resolveOutcome(key?: string | null): OutcomeArgs | null {
  if (!key) return null
  // Базовое правило: всегда добавляем флаг с ключом события (для трассировки), если конкретного маппинга нет
  const base: OutcomeArgs = { addFlags: [key] }
  return outcomeTable[key] ? { ...base, ...outcomeTable[key] } : base
}


