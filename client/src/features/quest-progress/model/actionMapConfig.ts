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


