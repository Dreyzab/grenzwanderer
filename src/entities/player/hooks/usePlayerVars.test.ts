import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePlayerVars } from "./usePlayerVars";

const usePlayerBindingsMock = vi.fn();

vi.mock("./usePlayerBindings", () => ({
  usePlayerBindings: () => usePlayerBindingsMock(),
}));

describe("usePlayerVars", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns vars from player bindings", () => {
    const vars = { attr_intellect: 4, rep_civic: 1.5 };
    usePlayerBindingsMock.mockReturnValue({ vars });

    const { result } = renderHook(() => usePlayerVars());

    expect(result.current).toBe(vars);
  });

  it("returns empty record from empty player bindings", () => {
    usePlayerBindingsMock.mockReturnValue({ vars: {} });

    const { result } = renderHook(() => usePlayerVars());

    expect(result.current).toEqual({});
  });
});
