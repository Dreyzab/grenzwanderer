import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useVnSession } from "./useVnSession";

const useTableMock = vi.fn();
const useIdentityMock = vi.fn();

vi.mock("spacetimedb/react", () => ({
  useTable: (...args: unknown[]) => useTableMock(...args),
}));

vi.mock("../../../shared/spacetime/useIdentity", () => ({
  useIdentity: () => useIdentityMock(),
}));

vi.mock("../../../shared/spacetime/bindings", () => ({
  tables: { vnSession: Symbol("vnSession") },
}));

const makeIdentity = (hex: string) => ({
  toHexString: () => hex,
});

describe("useVnSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns scenario-specific session when scenarioId is provided", () => {
    useIdentityMock.mockReturnValue({ identityHex: "me" });
    useTableMock.mockReturnValue([
      [
        {
          playerId: makeIdentity("me"),
          scenarioId: "s1",
          nodeId: "n1",
          completedAt: { tag: "none" },
        },
      ],
      true,
    ]);

    const { result } = renderHook(() => useVnSession("s1"));
    expect(result.current.session?.scenarioId).toBe("s1");
    expect(result.current.isReady).toBe(true);
  });

  it("returns active session when scenarioId is omitted", () => {
    useIdentityMock.mockReturnValue({ identityHex: "me" });
    useTableMock.mockReturnValue([
      [
        {
          playerId: makeIdentity("me"),
          scenarioId: "s_done",
          nodeId: "n2",
          completedAt: { tag: "some", value: 123 },
        },
        {
          playerId: makeIdentity("me"),
          scenarioId: "s_active",
          nodeId: "n1",
          completedAt: { tag: "none" },
        },
      ],
      true,
    ]);

    const { result } = renderHook(() => useVnSession());
    expect(result.current.session?.scenarioId).toBe("s_active");
    expect(result.current.isReady).toBe(true);
  });
});
