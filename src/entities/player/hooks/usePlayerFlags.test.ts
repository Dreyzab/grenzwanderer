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
  tables: { myPlayerFlags: Symbol("myPlayerFlags") },
}));

const makeIdentity = (hex: string) => ({
  toHexString: () => hex,
});

describe("usePlayerFlags", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns flags from the scoped self view", () => {
    useIdentityMock.mockReturnValue({ identityHex: "me" });
    useTableMock.mockReturnValue([
      [
        { playerId: makeIdentity("me"), key: "lang_ru", value: true },
        { playerId: makeIdentity("me"), key: "lang_de", value: true },
      ],
    ]);

    const { result } = renderHook(() => usePlayerFlags());

    expect(result.current).toEqual({ lang_ru: true, lang_de: true });
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
