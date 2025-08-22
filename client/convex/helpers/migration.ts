import type { GenericMutationCtx } from "convex/server";
import { PLAYER_STATUS } from "../constants";

export async function migrateDeviceProgressToUserImpl(
  ctx: GenericMutationCtx<any>,
  deviceId: string,
  userId: string,
) {
  const now = Date.now();

  // Migrate quest_progress
  const rows = await ctx.db
    .query("quest_progress")
    .withIndex("by_device", (q: any) => q.eq("deviceId", deviceId))
    .collect();

  for (const r of rows) {
    const dupe = await ctx.db
      .query("quest_progress")
      .withIndex("by_user_quest", (q: any) => q.eq("userId", userId).eq("questId", r.questId))
      .unique();
    if (dupe) {
      const winner =
        ((dupe.completedAt ?? 0) >= (r.completedAt ?? 0)) &&
        ((dupe.updatedAt ?? 0) >= (r.updatedAt ?? 0))
          ? dupe
          : r;
      await ctx.db.patch(dupe._id, {
        currentStep: winner.currentStep,
        completedAt: winner.completedAt,
        updatedAt: now,
      });
      await ctx.db.delete(r._id);
    } else {
      await ctx.db.patch(r._id, { userId, updatedAt: now });
    }
  }

  // Merge player_state
  const pDev = await ctx.db
    .query("player_state")
    .withIndex("by_device", (q: any) => q.eq("deviceId", deviceId))
    .unique();
  if (pDev) {
    const pUser = await ctx.db
      .query("player_state")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .unique();
    if (pUser) {
      await ctx.db.patch(pUser._id, {
        phase: Math.max(pUser.phase ?? 0, pDev.phase ?? 0),
        fame: Math.max(pUser.fame ?? 0, pDev.fame ?? 0),
        flags: Array.from(new Set([...(pUser.flags ?? []), ...(pDev.flags ?? [])])),
        inventory: Array.from(new Set([...(pUser.inventory ?? []), ...(pDev.inventory ?? [])])),
        reputations: { ...(pUser.reputations ?? {}), ...(pDev.reputations ?? {}) },
        relationships: { ...(pUser.relationships ?? {}), ...(pDev.relationships ?? {}) },
        hasPda: (pUser.hasPda ?? false) || (pDev.hasPda ?? false),
        status: (pUser.status as any) ?? (pDev.status as any) ?? PLAYER_STATUS.REFUGEE,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("player_state", {
        userId,
        deviceId,
        phase: pDev.phase ?? 0,
        status: (pDev.status as any) ?? PLAYER_STATUS.REFUGEE,
        inventory: pDev.inventory ?? [],
        hasPda: pDev.hasPda ?? false,
        fame: pDev.fame ?? 0,
        flags: pDev.flags ?? [],
        reputations: pDev.reputations ?? {},
        relationships: pDev.relationships ?? {},
        updatedAt: now,
      });
    }
  }
}


