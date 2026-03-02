import spacetimedb from "./schema";
import {
  aggregate_telemetry,
  cleanup_idempotency_log,
  cleanup_telemetry_event,
  register_maintenance_reducers,
  seed_maintenance_schedules,
} from "./procedures/maintenance";
import { emitTelemetry, ensurePlayerProfile } from "./reducers/helpers";

register_maintenance_reducers(spacetimedb);

export {
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
  unlock_group,
  grant_xp,
} from "./reducers/core";
export { publish_content, rollback_content } from "./reducers/content";
export {
  record_choice,
  start_scenario,
  perform_skill_check,
} from "./reducers/vn";
export { map_interact } from "./reducers/map";
export {
  discover_fact,
  set_hypothesis_focus,
  start_mind_case,
  validate_hypothesis,
} from "./reducers/mindpalace";
export {
  deliver_thought,
  enqueue_ai_request,
  register_worker_identity,
} from "./reducers/ai";
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
