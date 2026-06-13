import { useCallback, useEffect, useRef } from "react";
import type {
  Dispatch,
  MutableRefObject,
  RefObject,
  SetStateAction,
} from "react";
import type { TypedTextHandle } from "../ui/TypedText";
import {
  isChoiceAvailable,
  type VnChoiceEvaluationContext,
} from "../vnContent";
import type { VnChoice, VnNarrativeLayout, VnNode } from "../types";
import { TAP_CONTINUE_COOLDOWN_MS } from "../vnScreenUtils";
import type { TransitionState } from "../vnScreenTypes";
import type { NarrativeLogState } from "../log/useNarrativeLog";

interface NarrativeLogSurfaceControls {
  state: NarrativeLogState;
  advanceSegment: () => void;
  finishCurrentSegment: () => void;
}

interface UseVnSurfaceInteractionParams {
  autoContinueChoice: VnChoice | null;
  awaitingSkillChoice: unknown;
  choiceDisplayItemCount: number;
  choiceEvaluationContext: VnChoiceEvaluationContext;
  currentNode: VnNode | null;
  displayedScenarioCompleted: boolean;
  effectiveNarrativeLayout: VnNarrativeLayout;
  handleActiveResolveInteraction: () => boolean;
  handleChoiceClick: (choice: VnChoice, isLocked: boolean) => void;
  handleStartScenario: () => Promise<void>;
  isTyping: boolean;
  /**
   * When true, all tap-to-continue interactions are suppressed. Used when
   * a modal layer (e.g. the hub overlay) is open and must own the tap.
   */
  isBlocked?: boolean;
  markInteractionHandled: () => void;
  myFlags: Record<string, boolean>;
  mySession: unknown;
  myVars: Record<string, number>;
  narrativeLog: NarrativeLogSurfaceControls;
  pendingChoiceId: string | null;
  runCompletionTransition: () => Promise<void>;
  selectedScenarioId: string;
  setIsTyping: Dispatch<SetStateAction<boolean>>;
  setVideoEnded: Dispatch<SetStateAction<boolean>>;
  transitionState: TransitionState;
  typedTextRef: RefObject<TypedTextHandle>;
  typingFinishedAtRef: MutableRefObject<number>;
}

export function useVnSurfaceInteraction({
  autoContinueChoice,
  awaitingSkillChoice,
  choiceDisplayItemCount,
  choiceEvaluationContext,
  currentNode,
  displayedScenarioCompleted,
  effectiveNarrativeLayout,
  handleActiveResolveInteraction,
  handleChoiceClick,
  handleStartScenario,
  isTyping,
  isBlocked = false,
  markInteractionHandled,
  myFlags,
  mySession,
  myVars,
  narrativeLog,
  pendingChoiceId,
  runCompletionTransition,
  selectedScenarioId,
  setIsTyping,
  setVideoEnded,
  transitionState,
  typedTextRef,
  typingFinishedAtRef,
}: UseVnSurfaceInteractionParams) {
  const videoEndedRef = useRef(false);
  const visualSequenceEndedRef = useRef(false);

  useEffect(() => {
    videoEndedRef.current = false;
    visualSequenceEndedRef.current = false;
    setVideoEnded(false);
  }, [currentNode?.id, setVideoEnded]);

  const handleVideoEnded = useCallback(() => {
    if (videoEndedRef.current) {
      return;
    }

    videoEndedRef.current = true;
    setVideoEnded(true);

    if (
      !currentNode?.advanceOnVideoEnd ||
      !currentNode.backgroundVideoUrl ||
      transitionState !== "idle" ||
      !autoContinueChoice ||
      !selectedScenarioId ||
      !mySession
    ) {
      return;
    }

    const isAvailable = isChoiceAvailable(
      autoContinueChoice,
      myFlags,
      myVars,
      choiceEvaluationContext,
    );
    if (!isAvailable) {
      return;
    }

    void handleChoiceClick(autoContinueChoice, false);
  }, [
    autoContinueChoice,
    choiceEvaluationContext,
    currentNode?.advanceOnVideoEnd,
    currentNode?.backgroundVideoUrl,
    handleChoiceClick,
    myFlags,
    mySession,
    myVars,
    selectedScenarioId,
    setVideoEnded,
    transitionState,
  ]);

  const handleVisualSequenceEnded = useCallback(() => {
    if (visualSequenceEndedRef.current) {
      return;
    }

    visualSequenceEndedRef.current = true;
    if (
      !currentNode?.visualSequence?.advanceOnEnd ||
      transitionState !== "idle" ||
      !autoContinueChoice ||
      !selectedScenarioId ||
      !mySession
    ) {
      return;
    }

    const isAvailable = isChoiceAvailable(
      autoContinueChoice,
      myFlags,
      myVars,
      choiceEvaluationContext,
    );
    if (!isAvailable) {
      return;
    }

    void handleChoiceClick(autoContinueChoice, false);
  }, [
    autoContinueChoice,
    choiceEvaluationContext,
    currentNode?.visualSequence?.advanceOnEnd,
    handleChoiceClick,
    myFlags,
    mySession,
    myVars,
    selectedScenarioId,
    transitionState,
  ]);

  const handleSurfaceTap = useCallback(() => {
    if (isBlocked) {
      // #region agent log
      fetch(
        "http://127.0.0.1:7294/ingest/ef318824-e957-404b-968c-a90292600258",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "b6c52c",
          },
          body: JSON.stringify({
            sessionId: "b6c52c",
            runId: "post-fix",
            hypothesisId: "E",
            location: "useVnSurfaceInteraction.ts:handleSurfaceTap",
            message: "surface tap blocked (hub overlay)",
            data: { nodeId: currentNode?.id ?? null },
            timestamp: Date.now(),
          }),
        },
      ).catch(() => {});
      // #endregion
      return;
    }

    if (currentNode?.visualSequence) {
      return;
    }

    const now = Date.now();
    const elapsedSinceTypingFinish = now - typingFinishedAtRef.current;

    if (handleActiveResolveInteraction()) {
      return;
    }

    if (transitionState === "handoff_failed") {
      return;
    }

    const segmentTypingActive = isTyping || narrativeLog.state.isTypingSegment;

    if (segmentTypingActive) {
      narrativeLog.finishCurrentSegment();
      typedTextRef.current?.finish();
      setIsTyping(false);
      typingFinishedAtRef.current = Date.now();
      return;
    }

    if (elapsedSinceTypingFinish < TAP_CONTINUE_COOLDOWN_MS) {
      return;
    }

    if (
      transitionState !== "idle" ||
      awaitingSkillChoice ||
      pendingChoiceId ||
      !selectedScenarioId
    ) {
      return;
    }

    if (currentNode?.advanceOnVideoEnd && currentNode.backgroundVideoUrl) {
      if (!videoEndedRef.current) {
        handleVideoEnded();
        return;
      }
      // Video end already committed auto-continue; ignore same-turn surface tap.
      return;
    }

    if (
      effectiveNarrativeLayout === "log" &&
      narrativeLog.state.currentSegmentIndex <
        narrativeLog.state.currentNodeSegments.length
    ) {
      const isFinalSegment =
        narrativeLog.state.currentSegmentIndex + 1 >=
        narrativeLog.state.currentNodeSegments.length;
      const pendingLogSegmentsOnly =
        !isFinalSegment ||
        choiceDisplayItemCount > 0 ||
        displayedScenarioCompleted ||
        !autoContinueChoice;

      narrativeLog.advanceSegment();

      if (pendingLogSegmentsOnly) {
        markInteractionHandled();
        return;
      }
    }

    if (displayedScenarioCompleted) {
      void runCompletionTransition();
      return;
    }

    if (!autoContinueChoice || !currentNode) {
      // #region agent log
      fetch(
        "http://127.0.0.1:7294/ingest/ef318824-e957-404b-968c-a90292600258",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "b6c52c",
          },
          body: JSON.stringify({
            sessionId: "b6c52c",
            runId: "post-fix",
            hypothesisId: "C",
            location: "useVnSurfaceInteraction.ts:handleSurfaceTap",
            message: "no auto-continue on surface tap",
            data: {
              nodeId: currentNode?.id ?? null,
              choiceDisplayItemCount,
              layout: effectiveNarrativeLayout,
            },
            timestamp: Date.now(),
          }),
        },
      ).catch(() => {});
      // #endregion
      return;
    }

    if (!mySession) {
      void handleStartScenario();
      return;
    }

    const isAvailable = isChoiceAvailable(
      autoContinueChoice,
      myFlags,
      myVars,
      choiceEvaluationContext,
    );
    if (!isAvailable) {
      // #region agent log
      fetch(
        "http://127.0.0.1:7294/ingest/ef318824-e957-404b-968c-a90292600258",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "b6c52c",
          },
          body: JSON.stringify({
            sessionId: "b6c52c",
            runId: "post-fix",
            hypothesisId: "C",
            location: "useVnSurfaceInteraction.ts:handleSurfaceTap",
            message: "auto-continue not available",
            data: {
              nodeId: currentNode.id,
              autoContinueId: autoContinueChoice.id,
            },
            timestamp: Date.now(),
          }),
        },
      ).catch(() => {});
      // #endregion
      return;
    }

    void handleChoiceClick(autoContinueChoice, false);
  }, [
    autoContinueChoice,
    awaitingSkillChoice,
    choiceDisplayItemCount,
    choiceEvaluationContext,
    currentNode,
    displayedScenarioCompleted,
    effectiveNarrativeLayout,
    handleActiveResolveInteraction,
    handleChoiceClick,
    handleStartScenario,
    handleVideoEnded,
    isBlocked,
    isTyping,
    markInteractionHandled,
    myFlags,
    mySession,
    myVars,
    narrativeLog,
    pendingChoiceId,
    runCompletionTransition,
    selectedScenarioId,
    setIsTyping,
    transitionState,
    typedTextRef,
    typingFinishedAtRef,
  ]);

  return {
    handleSurfaceTap,
    handleVideoEnded,
    handleVisualSequenceEnded,
  };
}
