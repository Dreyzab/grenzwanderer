import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePlayerFlags } from "./usePlayerFlags";

const usePlayerBindingsMock = vi.fn();

vi.mock("./usePlayerBindings", () => ({
  usePlayerBindings: () => usePlayerBindingsMock(),
}));

describe("usePlayerFlags", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns flags from player bindings", () => {
    const flags = { lang_ru: true, lang_de: true };
    usePlayerBindingsMock.mockReturnValue({ flags });

    const { result } = renderHook(() => usePlayerFlags());

    expect(result.current).toBe(flags);
  });

  it("returns empty record from empty player bindings", () => {
    usePlayerBindingsMock.mockReturnValue({ flags: {} });

    const { result } = renderHook(() => usePlayerFlags());

    expect(result.current).toEqual({});
  });
});
