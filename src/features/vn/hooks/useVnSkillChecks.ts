import { useCallback, useEffect, useRef, useState } from "react";
import type { VnStrings } from "../../i18n/uiStrings";
import {
  buildCheckKey,
  buildChoiceKey,
  checkResultMatches,
  createRequestId,
} from "../vnScreenUtils";
import {
  classifyExistingSkillResult,
  createAwaitingSkillChoice,
  createFrozenSkillCheckPresentation,
} from "../vnSkillCheckUtils";
import type {
  AwaitingSkillChoice,
  SkillCheckResultLike,
  TransitionState,
} from "../vnScreenTypes";
import { useVnSkillResolveSequence } from "./useVnSkillResolveSequence";
import type { VnChoice, VnScenario, VnSnapshot } from "../types";
import type { VnChoiceEvaluationContext } from "../vnContent";
import {
  RESOURCE_FORTUNE_MOD_VAR,
  RESOURCE_FORTUNE_VAR,
  RESOURCE_KARMA_VAR,
  resolveDefaultProvidenceCost,
  resolveEffectiveFortune,
  resolveKarmaBand,
  resolveKarmaDifficultyDelta,
} from "../../../shared/game/narrativeResources";

interface UseVnSkillChecksParams {
  selectedScenarioId: string;
  selectedScenario: VnScenario | null;
  snapshot: VnSnapshot | null;
  currentNode: any;
  mySession: any;
  sessionReady: boolean;
  transitionState: TransitionState;
  currentSessionPointer: string | null;
  myFlags: Record<string, boolean>;
  myVars: Record<string, number>;
  choiceEvaluationContext: VnChoiceEvaluationContext;
  mySkillResults: SkillCheckResultLike[];
  currentDiceMode: "d20" | "d10";
  isTyping: boolean;
  interruptTyping: () => void;
  isSfxMuted: boolean;
  playImpactSfx: (passed: boolean) => void | Promise<void>;
  markInteractionHandled: () => void;
  getChoiceChancePercent: (
    choice: VnChoice,
    fortuneSpend?: number,
  ) => number | undefined;
  getChoiceEffectiveDifficulty: (
    choice: VnChoice,
    fortuneSpend?: number,
  ) => number | undefined;
  handleResolvedSkillCheck: (
    pending: AwaitingSkillChoice,
    matchedResult: SkillCheckResultLike,
  ) => void;
  performSkillCheck: (input: {
    requestId: string;
    scenarioId: string;
    checkId: string;
    fortuneSpend?: number;
  }) => Promise<unknown>;
  recordChoice: (input: {
    requestId: string;
    scenarioId: string;
    choiceId: string;
  }) => Promise<unknown>;
  setTransitionState: (
    value: TransitionState | ((previous: TransitionState) => TransitionState),
  ) => void;
  setStatusLine: (value: string) => void;
  setError: (value: string | null) => void;
  t: Pick<
    VnStrings,
    | "choiceApplied"
    | "sessionHydrating"
    | "skillFailed"
    | "skillResolved"
    | "syncing"
    | "unknownScenario"
  >;
}

export function useVnSkillChecks({
  selectedScenarioId,
  selectedScenario,
  snapshot,
  currentNode,
  mySession,
  sessionReady,
  transitionState,
  currentSessionPointer,
  myFlags,
  myVars,
  choiceEvaluationContext,
  mySkillResults,
  currentDiceMode,
  isTyping,
  interruptTyping,
  isSfxMuted,
  playImpactSfx,
  markInteractionHandled,
  getChoiceChancePercent,
  getChoiceEffectiveDifficulty,
  handleResolvedSkillCheck,
  performSkillCheck,
  recordChoice,
  setTransitionState,
  setStatusLine,
  setError,
  t,
}: UseVnSkillChecksParams) {
  const [pendingChoiceId, setPendingChoiceId] = useState<string | null>(null);
  const [armedSkillChoice, setArmedSkillChoice] =
    useState<AwaitingSkillChoice | null>(null);
  const [awaitingSkillChoice, setAwaitingSkillChoice] =
    useState<AwaitingSkillChoice | null>(null);
  const [failedChoiceKeys, setFailedChoiceKeys] = useState<
    Record<string, true>
  >({});
  const [visitedChoiceKeys, setVisitedChoiceKeys] = useState<
    Record<string, true>
  >({});

  const passiveInFlightRef = useRef<Set<string>>(new Set());
  const choiceSessionPointerRef = useRef<string | null>(null);

  const {
    activeSkillResolve,
    startResolveSequence,
    applyResolvedResult,
    resetResolveSequence,
    handleResolveInteraction,
  } = useVnSkillResolveSequence({
    isSfxMuted,
    playImpactSfx,
  });

  useEffect(() => {
    setPendingChoiceId(null);
    setArmedSkillChoice(null);
    setAwaitingSkillChoice(null);
    setFailedChoiceKeys({});
    choiceSessionPointerRef.current = null;
    resetResolveSequence();
  }, [resetResolveSequence, selectedScenarioId]);

  useEffect(() => {
    if (mySession) {
      return;
    }

    setArmedSkillChoice(null);
    setAwaitingSkillChoice(null);
    setPendingChoiceId(null);
    choiceSessionPointerRef.current = null;
    resetResolveSequence();
    setTransitionState((previous) =>
      previous === "choice_pending" ? "idle" : previous,
    );
  }, [mySession, resetResolveSequence, setTransitionState]);

  useEffect(() => {
    if (
      transitionState !== "choice_pending" ||
      !choiceSessionPointerRef.current ||
      !currentSessionPointer
    ) {
      return;
    }

    if (choiceSessionPointerRef.current !== currentSessionPointer) {
      setTransitionState("idle");
      choiceSessionPointerRef.current = null;
      setPendingChoiceId(null);
    }
  }, [currentSessionPointer, setTransitionState, transitionState]);

  useEffect(() => {
    if (
      !mySession ||
      !currentNode ||
      !selectedScenarioId ||
      transitionState === "handoff_in_flight" ||
      transitionState === "handoff_failed"
    ) {
      return;
    }

    const passiveChecks = currentNode.passiveChecks ?? [];
    if (passiveChecks.length === 0) {
      return;
    }

    for (const check of passiveChecks) {
      const key = buildCheckKey(selectedScenarioId, currentNode.id, check.id);
      const alreadyExists = mySkillResults.some((entry) =>
        checkResultMatches(entry, selectedScenarioId, currentNode.id, check.id),
      );

      if (alreadyExists || passiveInFlightRef.current.has(key)) {
        continue;
      }

      passiveInFlightRef.current.add(key);

      void performSkillCheck({
        requestId: createRequestId(),
        scenarioId: selectedScenarioId,
        checkId: check.id,
      })
        .catch((caughtError) => {
          const message =
            caughtError instanceof Error
              ? caughtError.message
              : "Passive check failed";
          setError(message);
        })
        .finally(() => {
          passiveInFlightRef.current.delete(key);
        });
    }
  }, [
    currentNode,
    mySession,
    mySkillResults,
    performSkillCheck,
    selectedScenarioId,
    setError,
    transitionState,
  ]);

  const buildPendingSkillChoice = useCallback(
    (choice: VnChoice, fortuneSpend = 0): AwaitingSkillChoice | null => {
      if (!choice.skillCheck || !selectedScenarioId || !currentNode) {
        return null;
      }

      const frozen = createFrozenSkillCheckPresentation({
        selectedScenarioId,
        selectedScenario,
        snapshot,
        currentNode,
        mySession,
        sessionReady,
        myFlags,
        myVars,
        choiceEvaluationContext,
        tSessionHydrating: t.sessionHydrating,
        tUnknownScenario: t.unknownScenario,
      });
      const fortuneBalance = Math.trunc(myVars[RESOURCE_FORTUNE_VAR] ?? 0);
      const fortuneMod = Math.trunc(myVars[RESOURCE_FORTUNE_MOD_VAR] ?? 0);
      const karma = Math.trunc(myVars[RESOURCE_KARMA_VAR] ?? 0);
      const effectiveDifficulty =
        getChoiceEffectiveDifficulty(choice, fortuneSpend) ??
        choice.skillCheck.difficulty;
      const difficultyBreakdown = [];
      const karmaDelta = choice.skillCheck.karmaSensitive
        ? resolveKarmaDifficultyDelta(karma)
        : 0;
      if (choice.skillCheck.karmaSensitive && karmaDelta !== 0) {
        difficultyBreakdown.push({
          source: "karma",
          sourceId: resolveKarmaBand(karma),
          delta: karmaDelta,
        });
      }
      if (fortuneMod !== 0) {
        difficultyBreakdown.push({
          source: "fortune_mod",
          sourceId: RESOURCE_FORTUNE_MOD_VAR,
          delta: fortuneMod,
        });
      }
      if (fortuneSpend > 0) {
        difficultyBreakdown.push({
          source: "fortune_spend",
          sourceId: RESOURCE_FORTUNE_VAR,
          delta: -(fortuneSpend * 2),
        });
      }

      const aiMode = choice.aiMode ?? currentNode.aiModeDefault;
      const providenceCost = resolveDefaultProvidenceCost(
        aiMode,
        choice.providenceCost ?? currentNode.providenceCostDefault,
      );

      return createAwaitingSkillChoice({
        scenarioId: selectedScenarioId,
        nodeId: currentNode.id,
        choice,
        diceMode: currentDiceMode,
        chancePercent: getChoiceChancePercent(choice, fortuneSpend),
        effectiveDifficulty,
        fortuneSpend,
        fortuneBalance,
        effectiveFortune: resolveEffectiveFortune(fortuneBalance, fortuneMod),
        aiMode,
        providenceCost,
        karmaBand: resolveKarmaBand(karma),
        difficultyBreakdown,
        frozen,
      });
    },
    [
      choiceEvaluationContext,
      currentDiceMode,
      currentNode,
      getChoiceChancePercent,
      getChoiceEffectiveDifficulty,
      myFlags,
      mySession,
      myVars,
      selectedScenario,
      selectedScenarioId,
      sessionReady,
      snapshot,
      t.sessionHydrating,
      t.unknownScenario,
    ],
  );

  const applyChoiceCommit = useCallback(
    async (scenarioId: string, choiceId: string) => {
      setTransitionState("choice_pending");
      choiceSessionPointerRef.current = currentSessionPointer;

      try {
        await recordChoice({
          requestId: createRequestId(),
          scenarioId,
          choiceId,
        });

        setStatusLine(`${t.choiceApplied}: ${choiceId}`);
        const pendingPointer = choiceSessionPointerRef.current;
        setTimeout(() => {
          if (!pendingPointer) {
            return;
          }
          if (choiceSessionPointerRef.current !== pendingPointer) {
            return;
          }
          choiceSessionPointerRef.current = null;
          setTransitionState((previous) =>
            previous === "choice_pending" ? "idle" : previous,
          );
        }, 800);
      } catch (caughtError) {
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : "Choice action failed";
        setError(message);
        setTransitionState("idle");
        choiceSessionPointerRef.current = null;
      } finally {
        setPendingChoiceId(null);
      }
    },
    [
      currentSessionPointer,
      recordChoice,
      setError,
      setStatusLine,
      setTransitionState,
      t.choiceApplied,
    ],
  );

  const dismissActiveSkillResolve = useCallback(
    async (resolveState: NonNullable<typeof activeSkillResolve>) => {
      const failedChoiceKey = buildChoiceKey(
        resolveState.scenarioId,
        resolveState.nodeId,
        resolveState.choiceId,
      );

      markInteractionHandled();
      resetResolveSequence();

      if (resolveState.nextNodeId) {
        setPendingChoiceId(null);
        setStatusLine(t.skillResolved);
        return;
      }

      if (!resolveState.passed) {
        setFailedChoiceKeys((previous) => ({
          ...previous,
          [failedChoiceKey]: true,
        }));
        setPendingChoiceId(null);
        setStatusLine(t.skillFailed);
        return;
      }

      await applyChoiceCommit(resolveState.scenarioId, resolveState.choiceId);
    },
    [
      applyChoiceCommit,
      markInteractionHandled,
      resetResolveSequence,
      setStatusLine,
      t.skillFailed,
      t.skillResolved,
    ],
  );

  const handleActiveResolveInteraction = useCallback((): boolean => {
    if (!activeSkillResolve) {
      return false;
    }

    if (activeSkillResolve.phase === "arming") {
      return false;
    }

    const matchedResult = mySkillResults.find((entry) =>
      checkResultMatches(
        entry,
        activeSkillResolve.scenarioId,
        activeSkillResolve.nodeId,
        activeSkillResolve.checkId,
      ),
    );

    const interactionOutcome = handleResolveInteraction(matchedResult ?? null);
    if (interactionOutcome === "ignored") {
      return false;
    }

    if (interactionOutcome === "dismiss") {
      void dismissActiveSkillResolve(activeSkillResolve);
    }

    return true;
  }, [
    activeSkillResolve,
    dismissActiveSkillResolve,
    handleResolveInteraction,
    mySkillResults,
  ]);

  useEffect(() => {
    if (!awaitingSkillChoice) {
      return;
    }

    const matchedResult = mySkillResults.find((entry) =>
      checkResultMatches(
        entry,
        awaitingSkillChoice.scenarioId,
        awaitingSkillChoice.nodeId,
        awaitingSkillChoice.checkId,
      ),
    );

    if (!matchedResult) {
      return;
    }

    handleResolvedSkillCheck(awaitingSkillChoice, matchedResult);
    setAwaitingSkillChoice(null);
    applyResolvedResult(awaitingSkillChoice, matchedResult);
  }, [
    applyResolvedResult,
    awaitingSkillChoice,
    handleResolvedSkillCheck,
    mySkillResults,
  ]);

  const handleChoiceClick = useCallback(
    async (choice: VnChoice, isLocked: boolean) => {
      if (
        !selectedScenarioId ||
        !currentNode ||
        !mySession ||
        isLocked ||
        pendingChoiceId ||
        awaitingSkillChoice ||
        activeSkillResolve ||
        transitionState !== "idle"
      ) {
        return;
      }

      if (isTyping) {
        interruptTyping();
        return;
      }

      setError(null);
      setStatusLine(t.syncing);
      setPendingChoiceId(choice.id);

      const choiceKey = buildChoiceKey(
        selectedScenarioId,
        currentNode.id,
        choice.id,
      );
      setVisitedChoiceKeys((previous) => ({ ...previous, [choiceKey]: true }));

      const skillCheck = choice.skillCheck;
      if (!skillCheck) {
        await applyChoiceCommit(selectedScenarioId, choice.id);
        return;
      }

      const existingResult = mySkillResults.find((entry) =>
        checkResultMatches(
          entry,
          selectedScenarioId,
          currentNode.id,
          skillCheck.id,
        ),
      );

      if (existingResult) {
        const existingResultKind = classifyExistingSkillResult(existingResult);

        if (existingResultKind === "branched") {
          setPendingChoiceId(null);
          setStatusLine(t.skillResolved);
          return;
        }

        if (existingResultKind === "failed") {
          setFailedChoiceKeys((previous) => ({
            ...previous,
            [choiceKey]: true,
          }));
          setPendingChoiceId(null);
          setStatusLine(t.skillFailed);
          return;
        }

        await applyChoiceCommit(selectedScenarioId, choice.id);
        return;
      }

      const pending = buildPendingSkillChoice(choice, 0);
      if (!pending) {
        setPendingChoiceId(null);
        return;
      }

      setArmedSkillChoice(pending);
      startResolveSequence(pending);
    },
    [
      activeSkillResolve,
      applyChoiceCommit,
      buildPendingSkillChoice,
      awaitingSkillChoice,
      currentNode,
      interruptTyping,
      isTyping,
      mySession,
      mySkillResults,
      pendingChoiceId,
      selectedScenarioId,
      setError,
      setStatusLine,
      startResolveSequence,
      t.skillFailed,
      t.skillResolved,
      t.syncing,
      transitionState,
    ],
  );

  const handleFortuneSpendChange = useCallback(
    (fortuneSpend: number) => {
      if (!armedSkillChoice || !currentNode) {
        return;
      }

      const choice = currentNode.choices.find(
        (entry: VnChoice) => entry.id === armedSkillChoice.choiceId,
      );
      if (!choice?.skillCheck) {
        return;
      }

      const nextPending = buildPendingSkillChoice(choice, fortuneSpend);
      if (!nextPending) {
        return;
      }

      setArmedSkillChoice(nextPending);
      startResolveSequence(nextPending);
    },
    [
      armedSkillChoice,
      buildPendingSkillChoice,
      currentNode,
      startResolveSequence,
    ],
  );

  const confirmArmedSkillCheck = useCallback(async () => {
    if (
      !armedSkillChoice ||
      !selectedScenarioId ||
      activeSkillResolve?.phase !== "arming"
    ) {
      return;
    }

    setAwaitingSkillChoice(armedSkillChoice);
    setArmedSkillChoice(null);

    try {
      await performSkillCheck({
        requestId: createRequestId(),
        scenarioId: selectedScenarioId,
        checkId: armedSkillChoice.checkId,
        fortuneSpend: armedSkillChoice.fortuneSpend,
      });
    } catch (caughtError) {
      setAwaitingSkillChoice(null);
      setPendingChoiceId(null);
      resetResolveSequence();
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Skill check request failed";
      setError(message);
    }
  }, [
    activeSkillResolve?.phase,
    armedSkillChoice,
    performSkillCheck,
    resetResolveSequence,
    selectedScenarioId,
    setError,
  ]);

  return {
    pendingChoiceId,
    armedSkillChoice,
    awaitingSkillChoice,
    failedChoiceKeys,
    visitedChoiceKeys,
    activeSkillResolve,
    handleChoiceClick,
    handleFortuneSpendChange,
    confirmArmedSkillCheck,
    handleActiveResolveInteraction,
  };
}
