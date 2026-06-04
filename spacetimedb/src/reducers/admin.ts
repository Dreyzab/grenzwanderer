import { SenderError, t } from "spacetimedb/server";
import spacetimedb from "../schema";
import { ADMIN_BOOTSTRAP_CODE_HASH } from "../generated/bootstrap-config";
import {
  emitTelemetry,
  ensureAdminIdentity,
  hasAnyAdminIdentity,
  sha256Hex,
} from "./helpers";

export const bootstrap_admin_identity = spacetimedb.reducer(
  { bootstrapCode: t.string().optional() },
  (ctx, { bootstrapCode }) => {
    const existing = ctx.db.adminIdentity.identity.find(ctx.sender);
    if (existing) {
      return;
    }

    if (hasAnyAdminIdentity(ctx)) {
      throw new SenderError(
        "Admin bootstrap is closed because an admin identity already exists",
      );
    }

    if (!ADMIN_BOOTSTRAP_CODE_HASH) {
      throw new SenderError(
        "Admin bootstrap is disabled until ADMIN_BOOTSTRAP_CODE is configured for this module build",
      );
    }

    const normalizedCode = bootstrapCode?.trim() ?? "";
    if (
      !normalizedCode ||
      sha256Hex(normalizedCode) !== ADMIN_BOOTSTRAP_CODE_HASH
    ) {
      throw new SenderError("Invalid admin bootstrap code");
    }

    ctx.db.adminIdentity.insert({
      identity: ctx.sender,
      grantedAt: ctx.timestamp,
      grantedBy: undefined,
    });

    emitTelemetry(ctx, "admin_identity_bootstrapped", {
      admin: ctx.sender.toHexString(),
    });
  },
);

export const grant_admin_identity = spacetimedb.reducer(
  {
    identity: t.identity(),
  },
  (ctx, { identity }) => {
    ensureAdminIdentity(ctx, "grant admin identities");

    const existing = ctx.db.adminIdentity.identity.find(identity);
    if (existing) {
      return;
    }

    ctx.db.adminIdentity.insert({
      identity,
      grantedAt: ctx.timestamp,
      grantedBy: ctx.sender,
    });

    emitTelemetry(ctx, "admin_identity_granted", {
      admin: identity.toHexString(),
      grantedBy: ctx.sender.toHexString(),
    });
  },
);

export const allow_worker_identity = spacetimedb.reducer(
  {
    identity: t.identity(),
  },
  (ctx, { identity }) => {
    ensureAdminIdentity(ctx, "allow worker identities");

    const existing = ctx.db.workerAllowlist.identity.find(identity);
    if (existing) {
      return;
    }

    ctx.db.workerAllowlist.insert({
      identity,
      grantedAt: ctx.timestamp,
      grantedBy: ctx.sender,
    });

    emitTelemetry(ctx, "worker_identity_allowlisted", {
      worker: identity.toHexString(),
      grantedBy: ctx.sender.toHexString(),
    });
  },
);

export const seed_player_as_elias_thorne = spacetimedb.reducer(
  {
    targetIdentity: t.identity(),
  },
  (ctx, { targetIdentity }) => {
    ensureAdminIdentity(ctx, "seed player profiles");

    // We can't easily call other reducers with a different context sender,
    // so we'll implement the core seeding logic here.

    // 1. Ensure profile exists
    const profile = ctx.db.playerProfile.playerId.find(targetIdentity);
    if (!profile) {
      ctx.db.playerProfile.insert({
        playerId: targetIdentity,
        nickname: "Elias Thorne",
        createdAt: ctx.timestamp,
        updatedAt: ctx.timestamp,
      });
    } else {
      ctx.db.playerProfile.playerId.update({
        ...profile,
        nickname: "Elias Thorne",
        updatedAt: ctx.timestamp,
      });
    }

    // 2. Ensure location
    const location = ctx.db.playerLocation.playerId.find(targetIdentity);
    if (!location) {
      ctx.db.playerLocation.insert({
        playerId: targetIdentity,
        locationId: "loc_intro",
        updatedAt: ctx.timestamp,
      });
    }

    emitTelemetry(ctx, "player_seeded_manually", {
      target: targetIdentity.toHexString(),
      admin: ctx.sender.toHexString(),
    });
  },
);
