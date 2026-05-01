import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useVnSceneTransition } from "./useVnSceneTransition";

const baseProps = {
  visualKey: "scene-a",
  layout: "split" as const,
  hasImage: true,
  hasVideo: false,
  needsSoundPrompt: false,
};

describe("useVnSceneTransition", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("moves from loading to admiring to revealed", () => {
    const { result } = renderHook(() => useVnSceneTransition(baseProps));

    expect(result.current.phase).toBe("loading");
    expect(result.current.isChromeRevealed).toBe(false);

    act(() => {
      result.current.markVisualReady();
    });

    expect(result.current.phase).toBe("admiring");

    act(() => {
      result.current.revealChrome();
    });

    expect(result.current.phase).toBe("revealed");
    expect(result.current.isChromeRevealed).toBe(true);
  });

  it("resets reveal state when the visual key changes", () => {
    const { result, rerender } = renderHook(
      (props: typeof baseProps) => useVnSceneTransition(props),
      { initialProps: baseProps },
    );

    act(() => {
      result.current.markVisualReady();
      result.current.revealChrome();
    });

    expect(result.current.isChromeRevealed).toBe(true);

    rerender({ ...baseProps, visualKey: "scene-b" });

    expect(result.current.phase).toBe("loading");
    expect(result.current.isChromeRevealed).toBe(false);
  });

  it("can auto reveal only when explicitly configured", () => {
    vi.useFakeTimers();

    const { result } = renderHook(() =>
      useVnSceneTransition({
        ...baseProps,
        revealMode: "auto",
        autoRevealAfterMs: 500,
      }),
    );

    act(() => {
      result.current.markVisualReady();
    });

    expect(result.current.phase).toBe("admiring");

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current.phase).toBe("revealed");
  });
});
