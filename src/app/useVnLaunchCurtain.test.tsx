import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  useVnLaunchCurtain,
  VN_LAUNCH_CURTAIN_HOLD_MS,
} from "./useVnLaunchCurtain";

describe("useVnLaunchCurtain", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("opens VN scenarios without curtain by default", () => {
    const navigateToVnScenario = vi.fn();
    const { result } = renderHook(() =>
      useVnLaunchCurtain(navigateToVnScenario),
    );

    act(() => {
      result.current.openVnScenario("scenario_alpha");
    });

    expect(navigateToVnScenario).toHaveBeenCalledWith("scenario_alpha");
    expect(result.current.vnLaunchCoverPhase).toBe("off");
  });

  it("runs solid to out to off when launchCurtain is requested", () => {
    const navigateToVnScenario = vi.fn();
    const { result } = renderHook(() =>
      useVnLaunchCurtain(navigateToVnScenario),
    );

    act(() => {
      result.current.openVnScenario("scenario_alpha", {
        launchCurtain: true,
      });
    });

    expect(result.current.vnLaunchCoverPhase).toBe("solid");

    act(() => {
      vi.advanceTimersByTime(VN_LAUNCH_CURTAIN_HOLD_MS);
    });

    expect(result.current.vnLaunchCoverPhase).toBe("out");

    act(() => {
      result.current.onVnLaunchCoverTransitionEnd();
    });

    expect(result.current.vnLaunchCoverPhase).toBe("off");
  });
});
