import { SenderError, t } from "spacetimedb/server";
import spacetimedb from "../schema";
import {
  advanceQuestInstance,
  completeQuestInstance,
  ensureIdempotent,
  ensurePlayerProfile,
} from "./helpers";

export const advance_quest_instance = spacetimedb.reducer(
  {
    requestId: t.string(),
    instanceId: t.string(),
    stepId: t.string().optional(),
  },
  (ctx, { requestId, instanceId, stepId }) => {
    if (!instanceId || instanceId.trim().length === 0) {
      throw new SenderError("instanceId must not be empty");
    }
    if (stepId !== undefined && stepId.trim().length === 0) {
      throw new SenderError("stepId must not be empty");
    }

    ensureIdempotent(ctx, requestId, "advance_quest_instance");
    ensurePlayerProfile(ctx);
    advanceQuestInstance(ctx, instanceId, requestId, stepId);
  },
);

export const complete_quest_instance = spacetimedb.reducer(
  {
    requestId: t.string(),
    instanceId: t.string(),
  },
  (ctx, { requestId, instanceId }) => {
    if (!instanceId || instanceId.trim().length === 0) {
      throw new SenderError("instanceId must not be empty");
    }

    ensureIdempotent(ctx, requestId, "complete_quest_instance");
    ensurePlayerProfile(ctx);
    completeQuestInstance(ctx, instanceId, requestId);
  },
);
