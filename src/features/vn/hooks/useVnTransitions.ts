import { useCallback, useEffect, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { VnStrings } from "../../i18n/uiStrings";
import { getScenarioById } from "../vnContent";
import type { VnScenario, VnSnapshot } from "../types";
import {
  createRequestId,
  isCompletionRouteBlockedError,
} from "../vnScreenUtils";
import type { TransitionState } from "../vnScreenTypes";

type CompletionRoute = {
  nextScenarioId: string;
  hasExistingSession: boolean;
  isExistingSessionCompleted: boolean;
} | null;

type NavigateTab = (
  tab:
    | "home"
    | "vn"
    | "character"
    | "map"
    | "mind_palace"
    | "command"
    | "battle",
) => void;

interface UseVnTransitionsParams {
  snapshot: VnSnapshot | null;
  activeVersionChecksum: string | null;
  contentReady: boolean;
  initialScenarioId?: string;
  selectedScenarioId: string;
  setSelectedScenarioId: Dispatch<SetStateAction<string>>;
  transitionState: TransitionState;
  setTransitionState: Dispatch<SetStateAction<TransitionState>>;
  setStatusLine: Dispatch<SetStateAction<string>>;
  setError: Dispatch<SetStateAction<string | null>>;
  onScenarioChange?: (scenarioId: string) => void;
  onNavigateTab?: NavigateTab;
  selectedScenario: VnScenario | null;
  sessionReady: boolean;
  mySession: unknown;
  completionRoute: CompletionRoute;
  isScenarioCompleted: boolean;
  startScenario: (input: {
    requestId: string;
    scenarioId: string;
  }) => Promise<unknown>;
  t: Pick<
    VnStrings,
    | "autoStarting"
    | "handoffBlockedToMap"
    | "handoffStarted"
    | "invalidScenarioFallback"
    | "returningToMap"
    | "scenarioStarted"
    | "sceneCompleted"
    | "sessionHydrating"
    | "syncing"
    | "startBlockedByRoute"
  >;
}

export function useVnTransitions({
  snapshot,
  activeVersionChecksum,
  contentReady,
  initialScenarioId,
  selectedScenarioId,
  setSelectedScenarioId,
  transitionState,
  setTransitionState,
  setStatusLine,
  setError,
  onScenarioChange,
  onNavigateTab,
  selectedScenario,
  sessionReady,
  mySession,
  completionRoute,
  isScenarioCompleted,
  startScenario,
  t,
}: UseVnTransitionsParams) {
  const autoStartAttemptedRef = useRef<Set<string>>(new Set());
  const autoStartInFlightRef = useRef<Set<string>>(new Set());
  const mapFallbackTriggeredRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!snapshot || snapshot.scenarios.length === 0 || selectedScenarioId) {
      return;
    }

    const candidates = [
      initialScenarioId,
      snapshot.vnRuntime?.defaultEntryScenarioId,
      snapshot.scenarios[0].id,
    ].filter((candidate): candidate is string => Boolean(candidate));

    const chosenScenarioId =
      candidates.find((candidate) => getScenarioById(snapshot, candidate)) ??
      snapshot.scenarios[0].id;

    setSelectedScenarioId(chosenScenarioId);

    if (
      initialScenarioId &&
      getScenarioById(snapshot, initialScenarioId) === null
    ) {
      setStatusLine(t.invalidScenarioFallback);
    }
  }, [
    initialScenarioId,
    selectedScenarioId,
    setSelectedScenarioId,
    setStatusLine,
    snapshot,
    t.invalidScenarioFallback,
  ]);

  useEffect(() => {
    if (!snapshot || !initialScenarioId || !selectedScenarioId) {
      return;
    }
    if (selectedScenarioId === initialScenarioId) {
      return;
    }
    if (!getScenarioById(snapshot, initialScenarioId)) {
      return;
    }

    setSelectedScenarioId(initialScenarioId);
  }, [initialScenarioId, selectedScenarioId, setSelectedScenarioId, snapshot]);

  useEffect(() => {
    if (!selectedScenarioId) {
      return;
    }

    onScenarioChange?.(selectedScenarioId);
  }, [onScenarioChange, selectedScenarioId]);

  useEffect(() => {
    if (selectedScenarioId) {
      mapFallbackTriggeredRef.current.delete(selectedScenarioId);
    }
  }, [selectedScenarioId]);

  const runCompletionTransition = useCallback(async () => {
    if (!selectedScenarioId) {
      return;
    }

    if (
      transitionState === "handoff_in_flight" ||
      transitionState === "handoff_failed"
    ) {
      return;
    }

    const navigateToMapOnce = (reason: string) => {
      if (mapFallbackTriggeredRef.current.has(selectedScenarioId)) {
        return;
      }
      mapFallbackTriggeredRef.current.add(selectedScenarioId);
      setStatusLine(reason);
      onNavigateTab?.("map");
    };

    if (!completionRoute || completionRoute.isExistingSessionCompleted) {
      navigateToMapOnce(t.returningToMap);
      return;
    }

    setError(null);
    setStatusLine(t.handoffStarted);
    setTransitionState("handoff_in_flight");

    try {
      if (!completionRoute.hasExistingSession) {
        await startScenario({
          requestId: createRequestId(),
          scenarioId: completionRoute.nextScenarioId,
        });
      }
      setTransitionState("idle");
      setSelectedScenarioId(completionRoute.nextScenarioId);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Scenario handoff failed";
      setTransitionState("handoff_failed");
      if (isCompletionRouteBlockedError(message)) {
        setStatusLine(t.handoffBlockedToMap);
        setError(null);
      } else {
        setStatusLine(t.handoffBlockedToMap);
        setError(message);
      }
      onNavigateTab?.("map");
    }
  }, [
    completionRoute,
    onNavigateTab,
    selectedScenarioId,
    setError,
    setSelectedScenarioId,
    setStatusLine,
    setTransitionState,
    startScenario,
    t.handoffBlockedToMap,
    t.handoffStarted,
    t.returningToMap,
    transitionState,
  ]);

  useEffect(() => {
    if (!selectedScenarioId) {
      return;
    }
    if (!sessionReady && !mySession) {
      setStatusLine(t.sessionHydrating);
    }
  }, [
    mySession,
    selectedScenarioId,
    sessionReady,
    setStatusLine,
    t.sessionHydrating,
  ]);

  useEffect(() => {
    if (
      !contentReady ||
      !activeVersionChecksum ||
      !selectedScenarioId ||
      !selectedScenario ||
      !sessionReady ||
      mySession ||
      transitionState === "handoff_in_flight" ||
      transitionState === "handoff_failed"
    ) {
      return;
    }

    const attemptKey = `${activeVersionChecksum}::${selectedScenarioId}`;
    if (
      autoStartAttemptedRef.current.has(attemptKey) ||
      autoStartInFlightRef.current.has(attemptKey)
    ) {
      return;
    }

    autoStartAttemptedRef.current.add(attemptKey);
    autoStartInFlightRef.current.add(attemptKey);
    setTransitionState("autostarting");
    setError(null);
    setStatusLine(t.autoStarting);

    void startScenario({
      requestId: createRequestId(),
      scenarioId: selectedScenarioId,
    })
      .then(() => {
        setStatusLine(t.scenarioStarted);
      })
      .catch((caughtError) => {
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : "Scenario start failed";
        if (isCompletionRouteBlockedError(message)) {
          setStatusLine(t.startBlockedByRoute);
          setError(null);
        } else {
          setError(message);
        }
      })
      .finally(() => {
        autoStartInFlightRef.current.delete(attemptKey);
        setTransitionState((previous) =>
          previous === "autostarting" ? "idle" : previous,
        );
      });
  }, [
    activeVersionChecksum,
    contentReady,
    mySession,
    selectedScenario,
    selectedScenarioId,
    sessionReady,
    setError,
    setStatusLine,
    setTransitionState,
    startScenario,
    t.autoStarting,
    t.scenarioStarted,
    t.startBlockedByRoute,
    transitionState,
  ]);

  useEffect(() => {
    if (!isScenarioCompleted) {
      return;
    }

    setStatusLine(t.sceneCompleted);
    void runCompletionTransition();
  }, [
    isScenarioCompleted,
    runCompletionTransition,
    setStatusLine,
    t.sceneCompleted,
  ]);

  const handleStartScenario = useCallback(async () => {
    if (!selectedScenarioId) {
      return;
    }

    if (
      transitionState === "handoff_in_flight" ||
      transitionState === "choice_pending"
    ) {
      return;
    }

    setError(null);
    setStatusLine(t.syncing);
    setTransitionState("autostarting");

    try {
      await startScenario({
        requestId: createRequestId(),
        scenarioId: selectedScenarioId,
      });
      setStatusLine(t.scenarioStarted);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Scenario start failed";
      if (isCompletionRouteBlockedError(message)) {
        setStatusLine(t.startBlockedByRoute);
        setError(null);
      } else {
        setError(message);
      }
    } finally {
      setTransitionState("idle");
    }
  }, [
    selectedScenarioId,
    setError,
    setStatusLine,
    setTransitionState,
    startScenario,
    t.scenarioStarted,
    t.syncing,
    t.startBlockedByRoute,
    transitionState,
  ]);

  return {
    handleStartScenario,
    runCompletionTransition,
  };
}
