import { describe, expect, it, vi } from "vitest";

import { createReducerTestContext } from "./__tests__/serverTestContext";

vi.mock("spacetimedb/server", () => ({
  SenderError: class SenderError extends Error {},
}));

import { SenderError } from "spacetimedb/server";
import {
  ensureAdminIdentity,
  ensureAllowlistedWorker,
  hasAdminIdentity,
  hasAnyAdminIdentity,
} from "./auth";

describe("auth", () => {
  it("reports no admin identities on empty database", () => {
    const ctx = createReducerTestContext();
    expect(hasAnyAdminIdentity(ctx)).toBe(false);
    expect(hasAdminIdentity(ctx)).toBe(false);
  });

  it("detects admin identity after insert", () => {
    const ctx = createReducerTestContext();
    ctx.db.adminIdentity.insert({
      identity: ctx.sender,
      grantedAt: ctx.timestamp,
      grantedBy: undefined,
    });

    expect(hasAnyAdminIdentity(ctx)).toBe(true);
    expect(hasAdminIdentity(ctx)).toBe(true);
  });

  it("ensureAdminIdentity rejects non-admin senders", () => {
    const ctx = createReducerTestContext();
    expect(() => ensureAdminIdentity(ctx, "publish content")).toThrow(
      SenderError,
    );
  });

  it("ensureAllowlistedWorker rejects unknown workers", () => {
    const ctx = createReducerTestContext();
    expect(() => ensureAllowlistedWorker(ctx, "claim ai requests")).toThrow(
      SenderError,
    );
  });
});
