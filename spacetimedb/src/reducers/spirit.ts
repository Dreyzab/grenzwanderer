import { SenderError, t } from "spacetimedb/server";
import spacetimedb from "../schema";
import {
  ensureIdempotent,
  ensurePlayerProfile,
  emitTelemetry,
  upsertFlag,
} from "./helpers";

const VALID_SPIRIT_STATES = [
  "hostile",
  "imprisoned",
  "controlled",
  "destroyed",
];
const VALID_METHODS = ["dialogue", "battle", "ritual"];

const createSpiritStateKey = (playerHex: string, spiritId: string): string =>
  `${playerHex}::spirit::${spiritId}`;

const setSpiritStateFlags = (
  ctx: Parameters<Parameters<typeof spacetimedb.reducer>[1]>[0],
  spiritId: string,
  state: string,
): void => {
  const prefix = `spirit_state_${spiritId}`;
  for (const s of VALID_SPIRIT_STATES) {
    upsertFlag(ctx, `${prefix}::${s}`, s === state);
  }
};

const setSpiritMethodFlag = (
  ctx: Parameters<Parameters<typeof spacetimedb.reducer>[1]>[0],
  spiritId: string,
  method: string,
): void => {
  const prefix = `spirit_method_${spiritId}`;
  for (const m of VALID_METHODS) {
    upsertFlag(ctx, `${prefix}::${m}`, m === method);
  }
};

const upsertSpiritState = (
  ctx: Parameters<Parameters<typeof spacetimedb.reducer>[1]>[0],
  spiritId: string,
  state: string,
  method?: string,
  imprisonmentItemId?: string,
): void => {
  const key = createSpiritStateKey(ctx.sender.toHexString(), spiritId);
  const existing = ctx.db.playerSpiritState.spiritStateKey.find(key);

  if (existing) {
    ctx.db.playerSpiritState.spiritStateKey.update({
      ...existing,
      state,
      method: method ?? existing.method,
      imprisonmentItemId: imprisonmentItemId ?? existing.imprisonmentItemId,
      capturedAt: state !== "hostile" ? ctx.timestamp : existing.capturedAt,
      updatedAt: ctx.timestamp,
    });
  } else {
    ctx.db.playerSpiritState.insert({
      spiritStateKey: key,
      playerId: ctx.sender,
      spiritId,
      state,
      method,
      imprisonmentItemId,
      capturedAt: state !== "hostile" ? ctx.timestamp : undefined,
      updatedAt: ctx.timestamp,
    });
  }

  setSpiritStateFlags(ctx, spiritId, state);
  if (method) {
    setSpiritMethodFlag(ctx, spiritId, method);
  }
};

export const subjugate_spirit = spacetimedb.reducer(
  {
    requestId: t.string(),
    spiritId: t.string(),
    method: t.string(),
  },
  (ctx, { requestId, spiritId, method }) => {
    if (!spiritId || spiritId.trim().length === 0) {
      throw new SenderError("spiritId must not be empty");
    }
    if (!VALID_METHODS.includes(method)) {
      throw new SenderError(
        `method must be one of: ${VALID_METHODS.join(", ")}`,
      );
    }

    ensureIdempotent(ctx, requestId, "subjugate_spirit");
    ensurePlayerProfile(ctx);

    const key = createSpiritStateKey(ctx.sender.toHexString(), spiritId);
    const existing = ctx.db.playerSpiritState.spiritStateKey.find(key);

    if (existing && existing.state === "destroyed") {
      throw new SenderError("Cannot subjugate a destroyed spirit");
    }

    upsertSpiritState(ctx, spiritId, "controlled", method);
    emitTelemetry(ctx, "spirit_subjugated", { spiritId, method });
  },
);

export const destroy_spirit = spacetimedb.reducer(
  {
    requestId: t.string(),
    spiritId: t.string(),
  },
  (ctx, { requestId, spiritId }) => {
    if (!spiritId || spiritId.trim().length === 0) {
      throw new SenderError("spiritId must not be empty");
    }

    ensureIdempotent(ctx, requestId, "destroy_spirit");
    ensurePlayerProfile(ctx);

    const key = createSpiritStateKey(ctx.sender.toHexString(), spiritId);
    const existing = ctx.db.playerSpiritState.spiritStateKey.find(key);

    if (existing && existing.state === "destroyed") {
      throw new SenderError("Spirit is already destroyed");
    }

    upsertSpiritState(ctx, spiritId, "destroyed");
    emitTelemetry(ctx, "spirit_destroyed", { spiritId });
  },
);

export const imprison_spirit = spacetimedb.reducer(
  {
    requestId: t.string(),
    spiritId: t.string(),
    itemId: t.string(),
  },
  (ctx, { requestId, spiritId, itemId }) => {
    if (!spiritId || spiritId.trim().length === 0) {
      throw new SenderError("spiritId must not be empty");
    }
    if (!itemId || itemId.trim().length === 0) {
      throw new SenderError("itemId must not be empty for imprisonment");
    }

    ensureIdempotent(ctx, requestId, "imprison_spirit");
    ensurePlayerProfile(ctx);

    const key = createSpiritStateKey(ctx.sender.toHexString(), spiritId);
    const existing = ctx.db.playerSpiritState.spiritStateKey.find(key);

    if (existing && existing.state === "destroyed") {
      throw new SenderError("Cannot imprison a destroyed spirit");
    }

    const inventoryKey = `${ctx.sender.toHexString()}::${itemId}`;
    const inventoryRow = ctx.db.playerInventory.inventoryKey.find(inventoryKey);
    if (!inventoryRow || inventoryRow.quantity < 1) {
      throw new SenderError(`Missing required item: ${itemId}`);
    }

    ctx.db.playerInventory.inventoryKey.update({
      ...inventoryRow,
      quantity: inventoryRow.quantity - 1,
      updatedAt: ctx.timestamp,
    });

    upsertSpiritState(ctx, spiritId, "imprisoned", "ritual", itemId);
    emitTelemetry(ctx, "spirit_imprisoned", { spiritId, itemId });
  },
);

export const release_spirit = spacetimedb.reducer(
  {
    requestId: t.string(),
    spiritId: t.string(),
  },
  (ctx, { requestId, spiritId }) => {
    if (!spiritId || spiritId.trim().length === 0) {
      throw new SenderError("spiritId must not be empty");
    }

    ensureIdempotent(ctx, requestId, "release_spirit");
    ensurePlayerProfile(ctx);

    const key = createSpiritStateKey(ctx.sender.toHexString(), spiritId);
    const existing = ctx.db.playerSpiritState.spiritStateKey.find(key);

    if (!existing) {
      throw new SenderError("No record for this spirit");
    }
    if (existing.state === "destroyed") {
      throw new SenderError("Cannot release a destroyed spirit");
    }
    if (existing.state === "hostile") {
      throw new SenderError("Spirit is already free");
    }

    upsertSpiritState(ctx, spiritId, "hostile");
    emitTelemetry(ctx, "spirit_released", { spiritId });
  },
);
