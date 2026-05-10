import { SenderError } from "spacetimedb/server";
import { senderOf, type ReducerContextLike } from "./context";
import { assertNonEmpty } from "./payload_json";

export const hasAnyAdminIdentity = (ctx: any): boolean => {
  for (const _row of ctx.db.adminIdentity.iter()) {
    return true;
  }
  return false;
};

export const hasAdminIdentity = (
  ctx: any,
  identity: { toHexString(): string } = ctx.sender,
): boolean => Boolean(ctx.db.adminIdentity.identity.find(identity));

export const hasAllowlistedWorker = (
  ctx: ReducerContextLike,
  identity: { toHexString(): string } = senderOf(ctx) as {
    toHexString(): string;
  },
): boolean => Boolean(ctx.db.workerAllowlist.identity.find(identity));

export const hasRegisteredWorker = (
  ctx: ReducerContextLike,
  identity: { toHexString(): string } = senderOf(ctx) as {
    toHexString(): string;
  },
): boolean => Boolean(ctx.db.workerIdentity.identity.find(identity));

export const canReadWorkerQueue = (ctx: ReducerContextLike): boolean => {
  try {
    const senderRaw = senderOf(ctx);
    if (!senderRaw || typeof senderRaw !== "object") {
      return false;
    }
    const identity = senderRaw as { toHexString?: () => string };
    if (typeof identity.toHexString !== "function") {
      return false;
    }

    const workerIdentity = identity as { toHexString(): string };
    return (
      hasAllowlistedWorker(ctx, workerIdentity) &&
      hasRegisteredWorker(ctx, workerIdentity)
    );
  } catch {
    return false;
  }
};

export const ensureAdminIdentity = (ctx: any, action: string): void => {
  assertNonEmpty(action, "action");
  if (!hasAdminIdentity(ctx)) {
    throw new SenderError(`Only an admin identity can ${action}`);
  }
};

export const ensureAllowlistedWorker = (
  ctx: ReducerContextLike,
  action: string,
  identity: { toHexString(): string } = senderOf(ctx) as {
    toHexString(): string;
  },
): void => {
  assertNonEmpty(action, "action");
  if (!hasAllowlistedWorker(ctx, identity)) {
    throw new SenderError(`Only an allowlisted worker can ${action}`);
  }
};

export const ensureRegisteredWorker = (
  ctx: ReducerContextLike,
  action: string,
): { workerHex: string } => {
  ensureAllowlistedWorker(ctx, action);

  const senderRaw = senderOf(ctx);
  const identity = senderRaw as { toHexString?: () => string };
  if (
    !senderRaw ||
    typeof senderRaw !== "object" ||
    typeof identity.toHexString !== "function" ||
    !hasRegisteredWorker(ctx, identity as { toHexString(): string })
  ) {
    throw new SenderError(`Only a registered worker can ${action}`);
  }

  return {
    workerHex: identity.toHexString(),
  };
};
