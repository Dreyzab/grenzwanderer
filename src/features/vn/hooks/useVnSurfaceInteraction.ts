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
import { postRuntimeDebug } from "../../../shared/debug/runtimeDebug";
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

  useEffect(() => {
    videoEndedRef.current = false;
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

  const handleSurfaceTap = useCallback(() => {
    const now = Date.now();
    const elapsedSinceTypingFinish = now - typingFinishedAtRef.current;

    if (handleActiveResolveInteraction()) {
      return;
    }

    if (transitionState === "handoff_failed") {
      return;
    }

    if (isTyping) {
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
      if (videoEndedRef.current) {
        return;
      }

      postRuntimeDebug(
        "useVnSurfaceInteraction.ts:handleSurfaceTap",
        "Immersive video tap skipped to video end",
        { nodeId: currentNode.id },
        "H1",
        "post-fix",
      );
      handleVideoEnded();
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
      const shouldRevealLogStateOnly =
        !isFinalSegment ||
        choiceDisplayItemCount > 0 ||
        displayedScenarioCompleted ||
        !autoContinueChoice;

      if (shouldRevealLogStateOnly) {
        narrativeLog.advanceSegment();
        markInteractionHandled();
        return;
      }
    }

    if (displayedScenarioCompleted) {
      void runCompletionTransition();
      return;
    }

    if (!autoContinueChoice || !currentNode) {
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
  };
}
