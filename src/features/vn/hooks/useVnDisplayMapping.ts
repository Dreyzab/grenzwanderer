import { useMemo } from "react";
import type { VnStrings } from "../../i18n/uiStrings";
import { isChoiceAvailable } from "../vnContent";
import {
  buildChoiceKey,
  formatSpeaker,
  unwrapOptionalString,
} from "../vnScreenUtils";
import type {
  ActiveAiThoughtContext,
  ActiveReactionContext,
  ChoiceDisplayItem,
  InlineStatusCard,
  SkillCheckAiStatus,
} from "../vnScreenTypes";
import type { VnScenario, VnSnapshot } from "../types";
import type { VnSkillCheckResolveState } from "../ui/VnSkillCheckResolveOverlay";

interface UseVnDisplayMappingParams {
  t: VnStrings;
  selectedScenarioId: string;
  selectedScenario: VnScenario | null;
  snapshot: VnSnapshot | null;
  sessionReady: boolean;
  currentNode: any;
  mySession: any;
  myFlags: Record<string, boolean>;
  myVars: Record<string, number>;
  choiceEvaluationContext: any;
  currentVisibleChoices: any[];
  currentAutoContinueChoice: any;
  currentNarrativeText: string;
  currentResolvedBgUrl: string | null;
  currentSpeakerLabel: string;
  currentShowOriginCards: boolean;
  isScenarioCompleted: boolean;
  activeLens: { hypothesisText: string } | null;
  internalizedThought: { title: string } | null;
  activeSkillResolve: VnSkillCheckResolveState | null;
  activeAiThoughtContext: ActiveAiThoughtContext | null;
  activeReactionContext: ActiveReactionContext | null;
  activeAiThoughtStatus: SkillCheckAiStatus | null;
  activeReactionStatus: SkillCheckAiStatus | null;
  activeAiThoughtVoiceLabel: string | null;
  activeAiThoughtResponse: { text: string } | null;
  activeReactionResponse: { text: string } | null;
  activeReactionRequest: { error?: unknown } | null;
  completionTargetLabel: string | null;
  visitedChoiceKeys: Record<string, boolean>;
  failedChoiceKeys: Record<string, boolean>;
  pendingChoiceId: string | null;
  getChoiceChancePercent: (choice: any) => number | undefined;
}

export function useVnDisplayMapping({
  t,
  selectedScenarioId,
  selectedScenario,
  snapshot,
  sessionReady,
  currentNode,
  mySession,
  myFlags,
  myVars,
  choiceEvaluationContext,
  currentVisibleChoices,
  currentAutoContinueChoice,
  currentNarrativeText,
  currentResolvedBgUrl,
  currentSpeakerLabel,
  currentShowOriginCards,
  isScenarioCompleted,
  activeLens,
  internalizedThought,
  activeSkillResolve,
  activeAiThoughtContext,
  activeReactionContext,
  activeAiThoughtStatus,
  activeReactionStatus,
  activeAiThoughtVoiceLabel,
  activeAiThoughtResponse,
  activeReactionResponse,
  activeReactionRequest,
  completionTargetLabel,
  visitedChoiceKeys,
  failedChoiceKeys,
  pendingChoiceId,
  getChoiceChancePercent,
}: UseVnDisplayMappingParams) {
  const showInlineAiThoughtCard =
    !activeSkillResolve &&
    Boolean(activeAiThoughtContext) &&
    Boolean(currentNode) &&
    activeAiThoughtContext?.nodeId === currentNode?.id &&
    activeAiThoughtStatus !== null &&
    activeAiThoughtStatus !== "failed";

  const showInlineReactionCard =
    !activeSkillResolve &&
    Boolean(activeReactionContext) &&
    activeReactionStatus !== null;

  const activeReactionLabel =
    activeReactionContext && currentNode?.characterId
      ? formatSpeaker(currentNode.characterId, snapshot)
      : "Unknown Contact";

  const activeReactionFailureMessage =
    activeReactionStatus === "failed"
      ? (unwrapOptionalString(activeReactionRequest?.error) ??
        t.reactionUnavailable)
      : null;

  const displayedPresentation = activeSkillResolve?.frozen;
  const visibleChoices =
    displayedPresentation?.visibleChoices ?? currentVisibleChoices;
  const autoContinueChoice =
    displayedPresentation?.autoContinueChoice ?? currentAutoContinueChoice;
  const narrativeText =
    displayedPresentation?.narrativeText ?? currentNarrativeText;
  const resolvedBgUrl =
    displayedPresentation?.backgroundImageUrl ?? currentResolvedBgUrl;
  const speakerLabel = displayedPresentation
    ? (displayedPresentation.characterName ?? "Narrator")
    : currentSpeakerLabel;
  const displayLocationName =
    displayedPresentation?.locationName ??
    selectedScenario?.title ??
    t.unknownScenario;
  const showOriginCards =
    displayedPresentation?.showOriginCards ?? currentShowOriginCards;
  const displayedScenarioCompleted =
    displayedPresentation?.isScenarioCompleted ?? isScenarioCompleted;
  const activeResolveAiStatus =
    activeSkillResolve &&
    activeAiThoughtContext &&
    activeSkillResolve.scenarioId === activeAiThoughtContext.scenarioId &&
    activeSkillResolve.nodeId === activeAiThoughtContext.nodeId &&
    activeSkillResolve.checkId === activeAiThoughtContext.checkId &&
    activeSkillResolve.choiceId === activeAiThoughtContext.choiceId
      ? activeAiThoughtStatus
      : null;
  const activeResolveAiText =
    activeResolveAiStatus === "completed"
      ? activeAiThoughtResponse?.text
      : null;

  const reactionCard = useMemo<InlineStatusCard | null>(() => {
    if (!showInlineReactionCard) {
      return null;
    }

    return {
      title: t.reactionTitle,
      eyebrow: activeReactionLabel,
      body:
        activeReactionStatus === "completed" && activeReactionResponse?.text
          ? activeReactionResponse.text
          : activeReactionStatus === "failed"
            ? (activeReactionFailureMessage ?? t.reactionUnavailable)
            : `${activeReactionLabel} ${t.reactionPending}`,
      tone: "reaction",
    };
  }, [
    activeReactionFailureMessage,
    activeReactionLabel,
    activeReactionResponse?.text,
    activeReactionStatus,
    showInlineReactionCard,
    t,
  ]);

  const thoughtCard = useMemo<InlineStatusCard | null>(() => {
    if (!showInlineAiThoughtCard) {
      return null;
    }

    const pendingVoiceLabel =
      activeAiThoughtStatus === "completed"
        ? activeAiThoughtVoiceLabel
        : t.innerThoughtThinking;
    return {
      title: t.innerThoughtTitle,
      eyebrow: pendingVoiceLabel ?? t.innerThoughtTitle,
      body:
        activeAiThoughtStatus === "completed" && activeAiThoughtResponse?.text
          ? activeAiThoughtResponse.text
          : `${activeAiThoughtVoiceLabel ?? t.innerThoughtTitle} ${t.innerThoughtPending}`,
      tone: "thought",
    };
  }, [
    activeAiThoughtResponse?.text,
    activeAiThoughtStatus,
    activeAiThoughtVoiceLabel,
    showInlineAiThoughtCard,
    t,
  ]);

  const choiceDisplayItems = useMemo<ChoiceDisplayItem[]>(
    () =>
      visibleChoices.map((choice, index) => {
        const choiceKey = buildChoiceKey(
          selectedScenarioId,
          currentNode.id,
          choice.id,
        );
        const isAvailable = isChoiceAvailable(
          choice,
          myFlags,
          myVars,
          choiceEvaluationContext,
        );
        const skillCheckState =
          activeSkillResolve?.choiceId === choice.id
            ? activeSkillResolve.phase === "arming"
              ? "arming"
              : activeSkillResolve.phase === "rolling"
                ? "rolling"
                : activeSkillResolve.phase === "impact"
                  ? activeSkillResolve.passed
                    ? "impact_success"
                    : "impact_fail"
                  : activeSkillResolve.passed
                    ? "result_success"
                    : "result_fail"
            : "idle";

        return {
          choice,
          index,
          chancePercent: getChoiceChancePercent(choice),
          skillCheckState,
          isVisited: Boolean(visitedChoiceKeys[choiceKey]),
          isLocked: !isAvailable || !mySession,
          isPending: pendingChoiceId === choice.id,
          hasFailedCheck: Boolean(failedChoiceKeys[choiceKey]),
        };
      }),
    [
      activeSkillResolve,
      choiceEvaluationContext,
      currentNode?.id,
      failedChoiceKeys,
      getChoiceChancePercent,
      myFlags,
      mySession,
      myVars,
      pendingChoiceId,
      selectedScenarioId,
      visibleChoices,
      visitedChoiceKeys,
    ],
  );

  return {
    reactionCard,
    thoughtCard,
    visibleChoices,
    autoContinueChoice,
    narrativeText,
    resolvedBgUrl,
    speakerLabel,
    displayLocationName,
    showOriginCards,
    displayedScenarioCompleted,
    activeResolveAiStatus,
    activeResolveAiText,
    activeLensBadgeText: activeLens
      ? `${t.activeLensLabel}: ${activeLens.hypothesisText}`
      : null,
    internalizedThoughtBadgeText: internalizedThought
      ? `${t.internalizedThoughtLabel}: ${internalizedThought.title}`
      : null,
    choiceDisplayItems,
    hasExplicitChoices: choiceDisplayItems.length > 0,
    hasAutoContinueChoice: Boolean(autoContinueChoice),
    emptyStateText:
      !sessionReady || !currentNode ? t.sessionHydrating : t.noChoices,
    completionTargetLabel,
  };
}
