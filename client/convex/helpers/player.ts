import type { GenericMutationCtx, GenericQueryCtx } from "convex/server";
import { PLAYER_STATUS } from "../constants";

type Ctx = GenericQueryCtx<any> | GenericMutationCtx<any>;

export async function ensurePlayerState(
  ctx: Ctx,
  args: { deviceId?: string; defaultPhase?: number; createIfMissing?: boolean },
) {
  const now = Date.now();
  const identity = await (ctx as any).auth.getUserIdentity?.().catch?.(() => null) ?? await (ctx as any).auth.getUserIdentity?.();
  const subject: string | null = identity?.subject ?? null;
  const defaultPhase = typeof args.defaultPhase === "number" ? args.defaultPhase : 0;
  const createIfMissing = args.createIfMissing !== false;

  if (subject) {
    const byUser = await (ctx as any).db
      .query("player_state")
      .withIndex("by_user", (q: any) => q.eq("userId", subject))
      .unique();
    if (byUser) return byUser;
    if (!createIfMissing) return null;
    if (!args.deviceId) return null;
    const id = await (ctx as any).db.insert("player_state", {
      userId: subject,
      deviceId: args.deviceId,
      phase: defaultPhase,
      status: PLAYER_STATUS.REFUGEE,
      inventory: [],
      hasPda: false,
      fame: 0,
      reputations: {},
      relationships: {},
      flags: [],
      updatedAt: now,
    });
    return await (ctx as any).db.get(id);
  }

  // guest by device
  if (!args.deviceId) return null;
  const byDev = await (ctx as any).db
    .query("player_state")
    .withIndex("by_device", (q: any) => q.eq("deviceId", args.deviceId))
    .unique();
  if (byDev) return byDev;
  if (!createIfMissing) return null;
  const id = await (ctx as any).db.insert("player_state", {
    userId: undefined,
    deviceId: args.deviceId,
    phase: defaultPhase,
    status: PLAYER_STATUS.REFUGEE,
    inventory: [],
    hasPda: false,
    fame: 0,
    reputations: {},
    relationships: {},
    flags: [],
    updatedAt: now,
  });
  return await (ctx as any).db.get(id);
}


