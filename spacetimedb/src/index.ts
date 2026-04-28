import spacetimedb from "./schema";
export {
  my_agency_career,
  my_ai_requests,
  my_battle_cards,
  my_battle_combatants,
  my_battle_history,
  my_battle_sessions,
  my_command_history,
  my_command_party,
  my_command_sessions,
  my_evidence,
  my_faction_signals,
  my_map_events,
  my_mind_cases,
  my_mind_facts,
  my_mind_hypotheses,
  my_npc_favors,
  my_npc_state,
  my_player_flags,
  my_player_inventory,
  my_player_location,
  my_player_profile,
  my_player_vars,
  my_quests,
  my_redeemed_codes,
  my_relationships,
  my_rumor_state,
  my_spirit_state,
  my_unlock_groups,
  my_vn_sessions,
  my_vn_skill_results,
  worker_ai_requests,
  content_translations,
} from "./schema";
import {
  aggregate_telemetry,
  cleanup_idempotency_log,
  cleanup_telemetry_event,
  register_maintenance_reducers,
  seed_maintenance_schedules,
} from "./procedures/maintenance";
import { emitTelemetry, ensurePlayerProfile } from "./reducers/helpers";
export {
  allow_worker_identity,
  bootstrap_admin_identity,
  grant_admin_identity,
} from "./reducers/admin";

register_maintenance_reducers(spacetimedb);

export {
  begin_karlsruhe_event_entry,
  begin_freiburg_origin,
  buy_item,
  set_flag,
  set_nickname,
  set_var,
  track_event,
  travel_to,
  set_quest_stage,
  advance_quest,
  grant_evidence,
  change_relationship,
  change_favor_balance,
  change_agency_standing,
  change_faction_signal,
  register_rumor,
  verify_rumor,
  record_service_criterion,
  unlock_group,
  grant_xp,
  grant_item,
} from "./reducers/core";
export {
  publish_content,
  rollback_content,
  update_translations,
} from "./reducers/content";
export {
  record_choice,
  start_scenario,
  perform_skill_check,
} from "./reducers/vn";
export { map_interact, redeem_map_code } from "./reducers/map";
export {
  discover_fact,
  set_hypothesis_focus,
  start_mind_case,
  validate_hypothesis,
} from "./reducers/mindpalace";
export {
  claim_next_ai_request,
  complete_ai_request,
  enqueue_ai_request,
  enqueue_providence_dialogue,
  fail_ai_request,
  renew_ai_request_lease,
  requeue_ai_request,
  register_worker_identity,
} from "./reducers/ai";
export {
  close_command_mode,
  issue_command,
  open_command_mode,
  resolve_command,
} from "./reducers/command";
export {
  close_battle_mode,
  end_battle_turn,
  open_battle_mode,
  play_battle_card,
} from "./reducers/battle";
export {
  aggregate_telemetry,
  cleanup_idempotency_log,
  cleanup_telemetry_event,
};

export const init = spacetimedb.init((ctx) => {
  seed_maintenance_schedules(ctx);
});

export const on_connect = spacetimedb.clientConnected((ctx) => {
  ensurePlayerProfile(ctx);
  emitTelemetry(ctx, "session_started", {
    player: ctx.sender.toHexString(),
  });
});

export const on_disconnect = spacetimedb.clientDisconnected((ctx) => {
  emitTelemetry(ctx, "session_ended", {
    player: ctx.sender.toHexString(),
  });
});

export default spacetimedb;
