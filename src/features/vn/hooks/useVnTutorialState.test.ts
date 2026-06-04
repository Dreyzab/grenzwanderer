import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useVnTutorialState } from "./useVnTutorialState";

describe("useVnTutorialState", () => {
  it("shows tooltip on first continue intercept, then allows continue", () => {
    const { result } = renderHook(() =>
      useVnTutorialState({
        narrativeText: "Signed,\n[fact:Master:case01/master]",
        isLetterOverlay: true,
        discoveredFactKeys: new Set(),
      }),
    );

    let intercepted = false;
    act(() => {
      intercepted = result.current.interceptContinue();
    });
    expect(intercepted).toBe(true);
    expect(result.current.showTooltip).toBe(true);

    let interceptedAgain = true;
    act(() => {
      interceptedAgain = result.current.interceptContinue();
    });
    expect(interceptedAgain).toBe(false);
    expect(result.current.showTooltip).toBe(false);
  });
});
