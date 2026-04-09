import { act, renderHook } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useVnSkillChecks } from "./useVnSkillChecks";
import type { SkillCheckResultLike, TransitionState } from "../vnScreenTypes";

const t = {
  choiceApplied: "Choice applied",
  sessionHydrating: "Syncing session...",
  skillFailed: "Skill check failed",
  skillResolved: "Skill check resolved on server",
  syncing: "Syncing...",
  unknownScenario: "Unknown Scenario",
} as const;

const timestamp = (micros: bigint) => ({
  microsSinceUnixEpoch: micros,
});

const baseChoice = {
  id: "choice_probe",
  text: "Lean in and make the tailor talk.",
  nextNodeId: "node_next",
  skillCheck: {
    id: "check_probe",
    voiceId: "charisma",
    difficulty: 8,
    showChancePercent: true,
  },
} as const;

const baseNode = {
  id: "node_start",
  scenarioId: "scenario_alpha",
  title: "Start",
  body: "Body",
  characterId: "npc_tailor",
  choices: [baseChoice],
  passiveChecks: [],
} as const;

const baseScenario = {
  id: "scenario_alpha",
  title: "Case Alpha",
  startNodeId: "node_start",
  nodeIds: ["node_start", "node_next"],
} as const;

const baseContext = {
  favorBalances: new Map<string, number>(),
  agencyStanding: 0,
  rumorStates: new Map<string, "registered" | "verified">(),
  careerRankId: null,
  careerRankOrder: new Map<string, number>(),
} as const;

type HarnessProps = {
  selectedScenarioId?: string;
  currentNode?: any;
  mySession?: any;
  mySkillResults?: SkillCheckResultLike[];
  currentSessionPointer?: string | null;
  isTyping?: boolean;
  isSfxMuted?: boolean;
  performSkillCheck?: ReturnType<typeof vi.fn>;
  recordChoice?: ReturnType<typeof vi.fn>;
  playImpactSfx?: ReturnType<typeof vi.fn>;
  markInteractionHandled?: ReturnType<typeof vi.fn>;
  interruptTyping?: ReturnType<typeof vi.fn>;
  handleResolvedSkillCheck?: ReturnType<typeof vi.fn>;
};

function useHarness(props: HarnessProps = {}) {
  const [transitionState, setTransitionState] =
    useState<TransitionState>("idle");
  const [statusLine, setStatusLine] = useState("");
  const [error, setError] = useState<string | null>(null);

  const skillChecks = useVnSkillChecks({
    selectedScenarioId: props.selectedScenarioId ?? "scenario_alpha",
    selectedScenario: baseScenario as any,
    snapshot: null,
    currentNode: props.currentNode ?? (baseNode as any),
    mySession: props.mySession ?? { completedAt: { tag: "none" } },
    sessionReady: true,
    transitionState,
    currentSessionPointer: props.currentSessionPointer ?? "session::alpha",
    myFlags: {},
    myVars: { charisma: 4 },
    choiceEvaluationContext: baseContext as any,
    mySkillResults: props.mySkillResults ?? [],
    currentDiceMode: "d20",
    isTyping: props.isTyping ?? false,
    interruptTyping: props.interruptTyping ?? vi.fn(),
    isSfxMuted: props.isSfxMuted ?? false,
    playImpactSfx: props.playImpactSfx ?? vi.fn(),
    markInteractionHandled: props.markInteractionHandled ?? vi.fn(),
    getChoiceChancePercent: () => 85,
    getChoiceEffectiveDifficulty: () => 8,
    handleResolvedSkillCheck: props.handleResolvedSkillCheck ?? vi.fn(),
    performSkillCheck:
      props.performSkillCheck ?? vi.fn().mockResolvedValue(undefined),
    recordChoice: props.recordChoice ?? vi.fn().mockResolvedValue(undefined),
    setTransitionState,
    setStatusLine,
    setError,
    t,
  });

  return {
    ...skillChecks,
    transitionState,
    statusLine,
    error,
  };
}

describe("useVnSkillChecks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("enqueues passive checks once while the request is in flight", async () => {
    let resolvePerform: ((value?: void) => void) | undefined;
    const performSkillCheck = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolvePerform = resolve;
        }),
    );
    const currentNode = {
      ...baseNode,
      choices: [],
      passiveChecks: [
        {
          id: "passive_probe",
          voiceId: "charisma",
          difficulty: 10,
        },
      ],
    };
    const { rerender } = renderHook(
      (props: HarnessProps) => useHarness(props),
      {
        initialProps: {
          currentNode,
          performSkillCheck,
        },
      },
    );

    expect(performSkillCheck).toHaveBeenCalledTimes(1);

    rerender({
      currentNode,
      performSkillCheck,
    } as any);

    expect(performSkillCheck).toHaveBeenCalledTimes(1);

    resolvePerform?.();
    await act(async () => {
      await Promise.resolve();
    });

    rerender({
      currentNode,
      performSkillCheck,
      mySkillResults: [
        {
          resultKey: "result_passive",
          playerId: { toHexString: () => "me" },
          scenarioId: "scenario_alpha",
          nodeId: "node_start",
          checkId: "passive_probe",
          roll: 12,
          voiceLevel: 4,
          difficulty: 10,
          passed: true,
          nextNodeId: { tag: "none" },
          createdAt: timestamp(10n),
        },
      ],
    } as any);

    expect(performSkillCheck).toHaveBeenCalledTimes(1);
  });

  it("runs the active resolve lifecycle and notifies AI when the result arrives", async () => {
    vi.useFakeTimers();
    const performSkillCheck = vi.fn().mockResolvedValue(undefined);
    const handleResolvedSkillCheck = vi.fn();

    const { result, rerender } = renderHook(
      (props: HarnessProps) => useHarness(props),
      {
        initialProps: {
          performSkillCheck,
          handleResolvedSkillCheck,
        },
      },
    );

    await act(async () => {
      await result.current.handleChoiceClick(baseChoice as any, false);
    });

    expect(result.current.pendingChoiceId).toBe("choice_probe");
    expect(result.current.armedSkillChoice?.checkId).toBe("check_probe");
    expect(result.current.awaitingSkillChoice).toBeNull();
    expect(result.current.activeSkillResolve?.phase).toBe("arming");
    expect(performSkillCheck).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.confirmArmedSkillCheck();
      await Promise.resolve();
    });

    expect(result.current.armedSkillChoice).toBeNull();
    expect(result.current.awaitingSkillChoice?.checkId).toBe("check_probe");
    expect(performSkillCheck).toHaveBeenCalledTimes(1);
    expect(performSkillCheck).toHaveBeenCalledWith({
      requestId: expect.any(String),
      scenarioId: "scenario_alpha",
      checkId: "check_probe",
      fortuneSpend: 0,
    });

    const matchedResult: SkillCheckResultLike = {
      resultKey: "result_probe",
      playerId: { toHexString: () => "me" },
      scenarioId: "scenario_alpha",
      nodeId: "node_start",
      checkId: "check_probe",
      roll: 9,
      voiceLevel: 4,
      difficulty: 8,
      passed: true,
      nextNodeId: { tag: "none" },
      createdAt: timestamp(30n),
    };

    await act(async () => {
      rerender({
        performSkillCheck,
        handleResolvedSkillCheck,
        mySkillResults: [matchedResult],
      } as any);
      await Promise.resolve();
    });

    expect(handleResolvedSkillCheck).toHaveBeenCalledWith(
      expect.objectContaining({
        choiceId: "choice_probe",
        checkId: "check_probe",
      }),
      matchedResult,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(result.current.activeSkillResolve?.phase).toBe("rolling");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1200);
    });
    expect(result.current.activeSkillResolve?.phase).toBe("impact");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(result.current.activeSkillResolve?.phase).toBe("result");
    expect(result.current.activeSkillResolve?.passed).toBe(true);
  });

  it("skips to the result phase when the overlay is tapped mid-animation", async () => {
    vi.useFakeTimers();
    const playImpactSfx = vi.fn();
    const { result, rerender } = renderHook(
      (props: HarnessProps) => useHarness(props),
      {
        initialProps: {
          playImpactSfx,
        },
      },
    );

    await act(async () => {
      await result.current.handleChoiceClick(baseChoice as any, false);
    });

    await act(async () => {
      await result.current.confirmArmedSkillCheck();
      await Promise.resolve();
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
      createdAt: timestamp(31n),
    };

    await act(async () => {
      rerender({
        playImpactSfx,
        mySkillResults: [matchedResult],
      } as any);
      await Promise.resolve();
    });

    expect(result.current.awaitingSkillChoice).toBeNull();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(result.current.activeSkillResolve?.phase).toBe("rolling");

    act(() => {
      expect(result.current.handleActiveResolveInteraction()).toBe(true);
    });

    expect(result.current.activeSkillResolve?.phase).toBe("result");
    expect(playImpactSfx).toHaveBeenCalledTimes(1);

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
  });

  it("dismisses a completed success result and commits the choice", async () => {
    vi.useFakeTimers();
    const recordChoice = vi.fn().mockResolvedValue(undefined);
    const markInteractionHandled = vi.fn();
    const { result, rerender } = renderHook(
      (props: HarnessProps) => useHarness(props),
      {
        initialProps: {
          recordChoice,
          markInteractionHandled,
        },
      },
    );

    await act(async () => {
      await result.current.handleChoiceClick(baseChoice as any, false);
    });

    await act(async () => {
      await result.current.confirmArmedSkillCheck();
      await Promise.resolve();
    });

    rerender({
      recordChoice,
      markInteractionHandled,
      mySkillResults: [
        {
          resultKey: "result_probe",
          playerId: { toHexString: () => "me" },
          scenarioId: "scenario_alpha",
          nodeId: "node_start",
          checkId: "check_probe",
          roll: 9,
          voiceLevel: 4,
          difficulty: 8,
          passed: true,
          nextNodeId: { tag: "none" },
          createdAt: timestamp(32n),
        },
      ],
    } as any);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1200);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    await act(async () => {
      expect(result.current.handleActiveResolveInteraction()).toBe(true);
      await Promise.resolve();
    });

    expect(markInteractionHandled).toHaveBeenCalledTimes(1);
    expect(recordChoice).toHaveBeenCalledWith({
      requestId: expect.any(String),
      scenarioId: "scenario_alpha",
      choiceId: "choice_probe",
    });
    expect(result.current.activeSkillResolve).toBeNull();
  });

  it("uses the existing passed result to commit immediately", async () => {
    const recordChoice = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook((props: HarnessProps) => useHarness(props), {
      initialProps: {
        recordChoice,
        mySkillResults: [
          {
            resultKey: "result_probe",
            playerId: { toHexString: () => "me" },
            scenarioId: "scenario_alpha",
            nodeId: "node_start",
            checkId: "check_probe",
            roll: 9,
            voiceLevel: 4,
            difficulty: 8,
            passed: true,
            nextNodeId: { tag: "none" },
            createdAt: timestamp(33n),
          },
        ],
      },
    });

    await act(async () => {
      await result.current.handleChoiceClick(baseChoice as any, false);
    });

    expect(recordChoice).toHaveBeenCalledTimes(1);
  });

  it("uses the existing failed result to mark the choice as failed", async () => {
    const { result } = renderHook((props: HarnessProps) => useHarness(props), {
      initialProps: {
        mySkillResults: [
          {
            resultKey: "result_probe",
            playerId: { toHexString: () => "me" },
            scenarioId: "scenario_alpha",
            nodeId: "node_start",
            checkId: "check_probe",
            roll: 4,
            voiceLevel: 1,
            difficulty: 8,
            passed: false,
            nextNodeId: { tag: "none" },
            createdAt: timestamp(34n),
          },
        ],
      },
    });

    await act(async () => {
      await result.current.handleChoiceClick(baseChoice as any, false);
    });

    expect(
      result.current.failedChoiceKeys[
        "scenario_alpha::node_start::choice_probe"
      ],
    ).toBe(true);
    expect(result.current.statusLine).toBe(t.skillFailed);
  });

  it("uses the existing branched result to resolve without committing", async () => {
    const recordChoice = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook((props: HarnessProps) => useHarness(props), {
      initialProps: {
        recordChoice,
        mySkillResults: [
          {
            resultKey: "result_probe",
            playerId: { toHexString: () => "me" },
            scenarioId: "scenario_alpha",
            nodeId: "node_start",
            checkId: "check_probe",
            roll: 12,
            voiceLevel: 4,
            difficulty: 8,
            passed: true,
            nextNodeId: { tag: "some", value: "node_branch" },
            createdAt: timestamp(35n),
          },
        ],
      },
    });

    await act(async () => {
      await result.current.handleChoiceClick(baseChoice as any, false);
    });

    expect(recordChoice).not.toHaveBeenCalled();
    expect(result.current.statusLine).toBe(t.skillResolved);
  });

  it("releases choice_pending after the commit timeout", async () => {
    vi.useFakeTimers();
    const nonSkillChoice = {
      id: "choice_plain",
      text: "Just continue",
      nextNodeId: "node_next",
    };
    const recordChoice = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook((props: HarnessProps) => useHarness(props), {
      initialProps: {
        currentNode: {
          ...baseNode,
          choices: [nonSkillChoice],
        },
        recordChoice,
      },
    });

    await act(async () => {
      await result.current.handleChoiceClick(nonSkillChoice as any, false);
    });

    expect(result.current.transitionState).toBe("choice_pending");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });

    expect(result.current.transitionState).toBe("idle");
  });

  it("clears the active resolve state when the scenario changes and ignores stale results", async () => {
    vi.useFakeTimers();
    const handleResolvedSkillCheck = vi.fn();
    const { result, rerender } = renderHook(
      (props: HarnessProps) => useHarness(props),
      {
        initialProps: {
          handleResolvedSkillCheck,
        },
      },
    );

    await act(async () => {
      await result.current.handleChoiceClick(baseChoice as any, false);
    });

    expect(result.current.activeSkillResolve?.phase).toBe("arming");

    await act(async () => {
      rerender({
        selectedScenarioId: "scenario_beta",
      } as any);
      await Promise.resolve();
    });

    expect(result.current.activeSkillResolve).toBeNull();
    expect(result.current.awaitingSkillChoice).toBeNull();
    expect(result.current.pendingChoiceId).toBeNull();

    await act(async () => {
      rerender({
        selectedScenarioId: "scenario_beta",
        handleResolvedSkillCheck,
        mySkillResults: [
          {
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
            createdAt: timestamp(36n),
          },
        ],
      } as any);
      await Promise.resolve();
    });

    expect(result.current.activeSkillResolve).toBeNull();
    expect(handleResolvedSkillCheck).not.toHaveBeenCalled();
  });

  it("releases choice_pending when the session pointer changes", async () => {
    vi.useFakeTimers();
    const nonSkillChoice = {
      id: "choice_plain",
      text: "Just continue",
      nextNodeId: "node_next",
    };
    const recordChoice = vi.fn().mockResolvedValue(undefined);
    const { result, rerender } = renderHook(
      (props: HarnessProps) => useHarness(props),
      {
        initialProps: {
          currentNode: {
            ...baseNode,
            choices: [nonSkillChoice],
          },
          currentSessionPointer: "session::alpha",
          recordChoice,
        },
      },
    );

    await act(async () => {
      await result.current.handleChoiceClick(nonSkillChoice as any, false);
    });

    expect(result.current.transitionState).toBe("choice_pending");

    await act(async () => {
      rerender({
        currentNode: {
          ...baseNode,
          choices: [nonSkillChoice],
        },
        currentSessionPointer: "session::beta",
        recordChoice,
      } as any);
      await Promise.resolve();
    });

    expect(result.current.transitionState).toBe("idle");
    expect(result.current.pendingChoiceId).toBeNull();
  });

  it("does not commit twice when the completed resolve is tapped repeatedly", async () => {
    vi.useFakeTimers();
    const recordChoice = vi.fn().mockResolvedValue(undefined);
    const { result, rerender } = renderHook(
      (props: HarnessProps) => useHarness(props),
      {
        initialProps: {
          recordChoice,
        },
      },
    );

    await act(async () => {
      await result.current.handleChoiceClick(baseChoice as any, false);
    });

    await act(async () => {
      await result.current.confirmArmedSkillCheck();
      await Promise.resolve();
    });

    await act(async () => {
      rerender({
        recordChoice,
        mySkillResults: [
          {
            resultKey: "result_probe",
            playerId: { toHexString: () => "me" },
            scenarioId: "scenario_alpha",
            nodeId: "node_start",
            checkId: "check_probe",
            roll: 12,
            voiceLevel: 4,
            difficulty: 8,
            passed: true,
            nextNodeId: { tag: "none" },
            createdAt: timestamp(37n),
          },
        ],
      } as any);
      await Promise.resolve();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    act(() => {
      expect(result.current.handleActiveResolveInteraction()).toBe(true);
    });

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      result.current.handleActiveResolveInteraction();
      await Promise.resolve();
    });

    expect(recordChoice).toHaveBeenCalledTimes(1);
  });
});
