import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useVnSkillResolveSequence } from "./useVnSkillResolveSequence";
import type {
  AwaitingSkillChoice,
  SkillCheckResultLike,
} from "../vnScreenTypes";

const pendingChoice: AwaitingSkillChoice = {
  scenarioId: "scenario_alpha",
  nodeId: "node_start",
  choiceId: "choice_probe",
  checkId: "check_probe",
  choiceText: "Lean in and make the tailor talk.",
  voiceId: "charisma",
  voiceLabel: "Charisma",
  diceMode: "d20",
  chancePercent: 85,
  frozen: {
    locationName: "Case Alpha",
    characterName: "Tailor",
    narrativeText: "Body",
    visibleChoices: [],
    autoContinueChoice: null,
    showOriginCards: false,
    isScenarioCompleted: false,
  },
};

const timestamp = (micros: bigint) => ({
  microsSinceUnixEpoch: micros,
});

const matchedResult: SkillCheckResultLike = {
  resultKey: "result_probe",
  playerId: { toHexString: () => "me" },
  scenarioId: "scenario_alpha",
  nodeId: "node_start",
  checkId: "check_probe",
  roll: 11,
  voiceLevel: 4,
  difficulty: 8,
  passed: true,
  nextNodeId: { tag: "none" },
  createdAt: timestamp(41n),
};

type HarnessProps = {
  isSfxMuted?: boolean;
  playImpactSfx?: ReturnType<typeof vi.fn>;
};

function useHarness(props: HarnessProps = {}) {
  return useVnSkillResolveSequence({
    isSfxMuted: props.isSfxMuted ?? false,
    playImpactSfx: props.playImpactSfx ?? vi.fn(),
  });
}

describe("useVnSkillResolveSequence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("runs the normal arming to result lifecycle", async () => {
    const playImpactSfx = vi.fn();
    const { result } = renderHook((props: HarnessProps) => useHarness(props), {
      initialProps: { playImpactSfx },
    });

    act(() => {
      result.current.startResolveSequence(pendingChoice);
    });
    expect(result.current.activeSkillResolve?.phase).toBe("arming");

    act(() => {
      result.current.applyResolvedResult(pendingChoice, matchedResult);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(result.current.activeSkillResolve?.phase).toBe("rolling");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1200);
    });
    expect(result.current.activeSkillResolve?.phase).toBe("impact");
    expect(playImpactSfx).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(result.current.activeSkillResolve?.phase).toBe("result");
    expect(result.current.activeSkillResolve?.passed).toBe(true);
  });

  it("waits for the server result when skip is requested during arming", () => {
    const playImpactSfx = vi.fn();
    const { result } = renderHook((props: HarnessProps) => useHarness(props), {
      initialProps: { playImpactSfx },
    });

    act(() => {
      result.current.startResolveSequence(pendingChoice);
    });

    act(() => {
      expect(result.current.handleResolveInteraction(null)).toBe("handled");
    });
    expect(result.current.activeSkillResolve?.phase).toBe("arming");

    act(() => {
      result.current.applyResolvedResult(pendingChoice, matchedResult);
    });

    expect(result.current.activeSkillResolve?.phase).toBe("result");
    expect(playImpactSfx).toHaveBeenCalledTimes(1);
  });

  it("skips from rolling straight to result", async () => {
    const playImpactSfx = vi.fn();
    const { result } = renderHook((props: HarnessProps) => useHarness(props), {
      initialProps: { playImpactSfx },
    });

    act(() => {
      result.current.startResolveSequence(pendingChoice);
      result.current.applyResolvedResult(pendingChoice, matchedResult);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(result.current.activeSkillResolve?.phase).toBe("rolling");

    act(() => {
      expect(result.current.handleResolveInteraction(matchedResult)).toBe(
        "handled",
      );
    });

    expect(result.current.activeSkillResolve?.phase).toBe("result");
    expect(playImpactSfx).toHaveBeenCalledTimes(1);
  });

  it("does not replay impact sfx when skipping during impact", async () => {
    const playImpactSfx = vi.fn();
    const { result } = renderHook((props: HarnessProps) => useHarness(props), {
      initialProps: { playImpactSfx },
    });

    act(() => {
      result.current.startResolveSequence(pendingChoice);
      result.current.applyResolvedResult(pendingChoice, matchedResult);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1200);
    });
    expect(result.current.activeSkillResolve?.phase).toBe("impact");
    expect(playImpactSfx).toHaveBeenCalledTimes(1);

    act(() => {
      expect(result.current.handleResolveInteraction(matchedResult)).toBe(
        "handled",
      );
    });

    expect(result.current.activeSkillResolve?.phase).toBe("result");
    expect(playImpactSfx).toHaveBeenCalledTimes(1);
  });

  it("ignores stale timers after reset", async () => {
    const playImpactSfx = vi.fn();
    const { result } = renderHook((props: HarnessProps) => useHarness(props), {
      initialProps: { playImpactSfx },
    });

    act(() => {
      result.current.startResolveSequence(pendingChoice);
      result.current.applyResolvedResult(pendingChoice, matchedResult);
      result.current.resetResolveSequence();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(result.current.activeSkillResolve).toBeNull();
    expect(playImpactSfx).not.toHaveBeenCalled();
  });

  it("suppresses impact sfx when muted without breaking phase transitions", async () => {
    const playImpactSfx = vi.fn();
    const { result } = renderHook((props: HarnessProps) => useHarness(props), {
      initialProps: { isSfxMuted: true, playImpactSfx },
    });

    act(() => {
      result.current.startResolveSequence(pendingChoice);
      result.current.applyResolvedResult(pendingChoice, matchedResult);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1200);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(result.current.activeSkillResolve?.phase).toBe("result");
    expect(playImpactSfx).not.toHaveBeenCalled();
  });
});
