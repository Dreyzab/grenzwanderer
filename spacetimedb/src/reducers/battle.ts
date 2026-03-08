import { SenderError, t } from "spacetimedb/server";
import spacetimedb from "../schema";
import {
  closeBattleModeInternal,
  endBattleTurnInternal,
  ensureIdempotent,
  ensurePlayerProfile,
  openBattleModeInternal,
  playBattleCardInternal,
  type BattleReturnTab,
  type BattleSourceTab,
} from "./helpers/all";

const isBattleReturnTab = (value: string): value is BattleReturnTab =>
  value === "map" || value === "vn" || value === "dev";

const isBattleSourceTab = (value: string): value is BattleSourceTab =>
  value === "map" || value === "vn" || value === "dev";

export const open_battle_mode = spacetimedb.reducer(
  {
    requestId: t.string(),
    scenarioId: t.string(),
    returnTab: t.string().optional(),
    sourceTab: t.string().optional(),
  },
  (ctx, { requestId, scenarioId, returnTab, sourceTab }) => {
    if (!scenarioId || scenarioId.trim().length === 0) {
      throw new SenderError("scenarioId must not be empty");
    }

    const nextReturnTab =
      returnTab && isBattleReturnTab(returnTab) ? returnTab : undefined;
    const nextSourceTab =
      sourceTab && isBattleSourceTab(sourceTab) ? sourceTab : undefined;

    ensureIdempotent(ctx, requestId, "open_battle_mode");
    ensurePlayerProfile(ctx);
    openBattleModeInternal(ctx, scenarioId, {
      returnTab: nextReturnTab,
      sourceTab: nextSourceTab,
    });
  },
);

export const play_battle_card = spacetimedb.reducer(
  {
    requestId: t.string(),
    instanceId: t.string(),
  },
  (ctx, { requestId, instanceId }) => {
    if (!instanceId || instanceId.trim().length === 0) {
      throw new SenderError("instanceId must not be empty");
    }

    ensureIdempotent(ctx, requestId, "play_battle_card");
    ensurePlayerProfile(ctx);
    playBattleCardInternal(ctx, instanceId);
  },
);

export const end_battle_turn = spacetimedb.reducer(
  {
    requestId: t.string(),
  },
  (ctx, { requestId }) => {
    ensureIdempotent(ctx, requestId, "end_battle_turn");
    ensurePlayerProfile(ctx);
    endBattleTurnInternal(ctx);
  },
);

export const close_battle_mode = spacetimedb.reducer(
  {
    requestId: t.string(),
  },
  (ctx, { requestId }) => {
    ensureIdempotent(ctx, requestId, "close_battle_mode");
    ensurePlayerProfile(ctx);
    closeBattleModeInternal(ctx);
  },
);
