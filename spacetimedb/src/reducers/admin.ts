import { SenderError, t } from "spacetimedb/server";
import spacetimedb from "../schema";
import {
  emitTelemetry,
  ensureAdminIdentity,
  hasAnyAdminIdentity,
} from "./helpers";

export const bootstrap_admin_identity = spacetimedb.reducer((ctx) => {
  const existing = ctx.db.adminIdentity.identity.find(ctx.sender);
  if (existing) {
    return;
  }

  if (hasAnyAdminIdentity(ctx)) {
    throw new SenderError(
      "Admin bootstrap is closed because an admin identity already exists",
    );
  }

  ctx.db.adminIdentity.insert({
    identity: ctx.sender,
    grantedAt: ctx.timestamp,
    grantedBy: undefined,
  });

  emitTelemetry(ctx, "admin_identity_bootstrapped", {
    admin: ctx.sender.toHexString(),
  });
});

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
