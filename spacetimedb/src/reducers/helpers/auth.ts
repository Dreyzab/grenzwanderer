import { SenderError } from "spacetimedb/server";
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

export const ensureAdminIdentity = (ctx: any, action: string): void => {
  assertNonEmpty(action, "action");
  if (!hasAdminIdentity(ctx)) {
    throw new SenderError(`Only an admin identity can ${action}`);
  }
};

export const ensureAllowlistedWorker = (
  ctx: any,
  action: string,
  identity: { toHexString(): string } = ctx.sender,
): void => {
  assertNonEmpty(action, "action");
  if (!ctx.db.workerAllowlist.identity.find(identity)) {
    throw new SenderError(`Only an allowlisted worker can ${action}`);
  }
};
