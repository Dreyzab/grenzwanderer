import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePlayerFlags } from "./usePlayerFlags";

const useTableMock = vi.fn();
const useIdentityMock = vi.fn();

vi.mock("spacetimedb/react", () => ({
  useTable: (...args: unknown[]) => useTableMock(...args),
}));

vi.mock("../../../shared/spacetime/useIdentity", () => ({
  useIdentity: () => useIdentityMock(),
}));

vi.mock("../../../shared/spacetime/bindings", () => ({
  tables: { playerFlag: Symbol("playerFlag") },
}));

const makeIdentity = (hex: string) => ({
  toHexString: () => hex,
});

describe("usePlayerFlags", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns only flags for current player", () => {
    useIdentityMock.mockReturnValue({ identityHex: "me" });
    useTableMock.mockReturnValue([
      [
        { playerId: makeIdentity("me"), key: "lang_ru", value: true },
        { playerId: makeIdentity("other"), key: "lang_de", value: true },
      ],
    ]);

    const { result } = renderHook(() => usePlayerFlags());

    expect(result.current).toEqual({ lang_ru: true });
  });

  it("returns empty record without identity", () => {
    useIdentityMock.mockReturnValue({ identityHex: "" });
    useTableMock.mockReturnValue([
      [{ playerId: makeIdentity("me"), key: "lang_ru", value: true }],
    ]);

    const { result } = renderHook(() => usePlayerFlags());

    expect(result.current).toEqual({});
  });
});
