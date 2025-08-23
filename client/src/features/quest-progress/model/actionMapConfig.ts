import type { ActionDescriptor } from './actionMap'

// In future can be loaded from server/DB; for now keep bundled defaults.
const bundledMap: Record<string, ActionDescriptor> = {
  set_phase_1: { kind: 'phase', phase: 1 },
  set_phase_2: { kind: 'phase', phase: 2 },
  start_delivery_quest: { kind: 'fsm', machine: 'delivery', event: { type: 'START' } },
  advance_delivery_pickup: { kind: 'fsm', machine: 'delivery', event: { type: 'ADVANCE', step: 'need_pickup_from_trader' } },
  take_parts: { kind: 'fsm', machine: 'delivery', event: { type: 'ADVANCE', step: 'deliver_parts_to_craftsman' } },
  deliver_parts: { kind: 'fsm', machine: 'delivery', event: { type: 'ADVANCE', step: 'artifact_offer' } },
  accept_artifact_quest: { kind: 'fsm', machine: 'delivery', event: { type: 'ADVANCE', step: 'go_to_anomaly' } },
  return_to_craftsman: { kind: 'fsm', machine: 'delivery', event: { type: 'ADVANCE', step: 'return_to_craftsman' } },
  complete_delivery_quest: { kind: 'fsm', machine: 'delivery', event: { type: 'COMPLETE' } },
  complete_delivery_quest_with_artifact: { kind: 'fsm', machine: 'delivery', event: { type: 'COMPLETE' } },

  // Combat quest: accept on FJR board
  accept_combat_baptism_quest: { kind: 'fsm', machine: 'combat', event: { type: 'ASSIGN' } },
  // Combat VN scenes progression hooks (optionally used if привязываем к шагам)
  combat_patrol_start: { kind: 'fsm', machine: 'combat', event: { type: 'ADVANCE', step: 'patrol_in_progress' } },
  combat_after_battle: { kind: 'fsm', machine: 'combat', event: { type: 'ADVANCE', step: 'combat_completed' } },
  complete_combat_baptism_quest: { kind: 'fsm', machine: 'combat', event: { type: 'COMPLETE' } },

  // Field Medicine quest: accept from Synthesis medical center
  start_field_medicine_quest: { kind: 'fsm', machine: 'field_medicine', event: { type: 'START' } },
  trigger_field_medicine_quest: { kind: 'fsm', machine: 'field_medicine', event: { type: 'START' } },
  unlock_synthesis_vendor: { kind: 'player', action: 'unlock_vendor' },
  complete_moss_collection_injured: { kind: 'fsm', machine: 'field_medicine', event: { type: 'ADVANCE', step: 'moss_collected_injured' } },
  complete_moss_collection_success: { kind: 'fsm', machine: 'field_medicine', event: { type: 'ADVANCE', step: 'moss_collected_success' } },
  complete_moss_collection_cautious: { kind: 'fsm', machine: 'field_medicine', event: { type: 'ADVANCE', step: 'moss_collected_cautious' } },
  complete_field_medicine_quest: { kind: 'fsm', machine: 'field_medicine', event: { type: 'COMPLETE' } },

  // Quiet Cove quest: accept from city gate Travers
  start_quiet_cove_quest: { kind: 'fsm', machine: 'quiet_cove', event: { type: 'START' } },
  update_quest_find_scar: { kind: 'fsm', machine: 'quiet_cove', event: { type: 'ADVANCE', step: 'find_scar' } },
  start_stealth_mission_rivet: { kind: 'fsm', machine: 'quiet_cove', event: { type: 'ADVANCE', step: 'stealth_mission' } },
  complete_stealth_mission_peaceful: { kind: 'fsm', machine: 'quiet_cove', event: { type: 'ADVANCE', step: 'mission_completed_peaceful' } },
  complete_stealth_mission_violent: { kind: 'fsm', machine: 'quiet_cove', event: { type: 'ADVANCE', step: 'mission_completed_violent' } },
  complete_quiet_cove_quest_traders: { kind: 'fsm', machine: 'quiet_cove', event: { type: 'COMPLETE' } },
  complete_quiet_cove_quest_anarchists: { kind: 'fsm', machine: 'quiet_cove', event: { type: 'COMPLETE' } },
}

export async function loadActionMap(): Promise<Record<string, ActionDescriptor>> {
  try {
    // Placeholder for dynamic loading, e.g., from Convex or localStorage.
    // If dynamic source fails or not available, fall back to bundledMap.
    return bundledMap
  } catch (_e) {
    return bundledMap
  }
}


