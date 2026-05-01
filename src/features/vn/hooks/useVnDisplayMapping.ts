import { useMemo } from "react";
import type { UiLanguage } from "../../../shared/hooks/useUiLanguage";
import type { VnStrings } from "../../i18n/uiStrings";
import {
  localizeVnChoice,
  localizeVnChoices,
  resolveVnNodeText,
  resolveVnScenarioTitle,
} from "../../i18n/vnContentTranslations";
import { useI18n } from "../../i18n/I18nContext";
import {
  buildInnerVoiceFallbackText,
  readPsycheState,
  resolveInnerVoiceSelection,
} from "../../../shared/game/innerVoiceModel";
import { isInnerVoiceId } from "../../../../data/innerVoiceContract";
import { isChoiceAvailable } from "../vnContent";
import {
  buildChoiceKey,
  formatSpeaker,
  unwrapOptionalString,
} from "../vnScreenUtils";
import { parseGenerateDialoguePayload } from "../../ai/contracts";
import { getVoicePalette, getVoicePresentation } from "../voicePresentation";
import type {
  ActiveAiThoughtContext,
  ActiveReactionContext,
  ChoiceDisplayItem,
  ChoiceInnerVoiceHintDisplay,
  InnerVoiceCardDisplay,
  InlineStatusCard,
  SkillCheckAiStatus,
} from "../vnScreenTypes";
import type { VnChoice, VnScenario, VnSnapshot } from "../types";
import type { VnSkillCheckResolveState } from "../ui/VnSkillCheckResolveOverlay";

interface UseVnDisplayMappingParams {
  t: VnStrings;
  uiLanguage: UiLanguage;
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
  activeProvidenceThoughtContext: ActiveAiThoughtContext | null;
  activeReactionContext: ActiveReactionContext | null;
  activeAiThoughtStatus: SkillCheckAiStatus | null;
  activeProvidenceThoughtStatus: SkillCheckAiStatus | null;
  activeReactionStatus: SkillCheckAiStatus | null;
  activeAiThoughtVoiceLabel: string | null;
  activeAiThoughtRequest: { payloadJson: unknown } | null;
  activeAiThoughtResponse: { text: string } | null;
  activeProvidenceThoughtResponse: { text: string } | null;
  activeReactionResponse: { text: string } | null;
  activeReactionRequest: { error?: unknown } | null;
  narrativeResources: {
    providence: number;
  };
  completionTargetLabel: string | null;
  visitedChoiceKeys: Record<string, boolean>;
  failedChoiceKeys: Record<string, boolean>;
  pendingChoiceId: string | null;
  getChoiceChancePercent: (choice: any) => number | undefined;
}

export function useVnDisplayMapping({
  t,
  uiLanguage,
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
  activeProvidenceThoughtContext,
  activeReactionContext,
  activeAiThoughtStatus,
  activeProvidenceThoughtStatus,
  activeReactionStatus,
  activeAiThoughtVoiceLabel,
  activeAiThoughtRequest,
  activeAiThoughtResponse,
  activeProvidenceThoughtResponse,
  activeReactionResponse,
  activeReactionRequest,
  narrativeResources,
  completionTargetLabel,
  visitedChoiceKeys,
  failedChoiceKeys,
  pendingChoiceId,
  getChoiceChancePercent,
}: UseVnDisplayMappingParams) {
  const { dictionary, localePackReady } = useI18n();

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
  const showInlineProvidenceThoughtCard =
    !activeSkillResolve &&
    Boolean(activeProvidenceThoughtContext) &&
    Boolean(currentNode) &&
    activeProvidenceThoughtContext?.nodeId === currentNode?.id &&
    activeProvidenceThoughtStatus !== null &&
    activeProvidenceThoughtStatus !== "failed";

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
  const presentationScenarioId =
    activeSkillResolve?.scenarioId ?? selectedScenarioId;
  const presentationNodeId =
    activeSkillResolve?.nodeId ?? currentNode?.id ?? null;
  const baseVisibleChoices =
    displayedPresentation?.visibleChoices ?? currentVisibleChoices;
  const baseAutoContinueChoice =
    displayedPresentation?.autoContinueChoice ?? currentAutoContinueChoice;
  const visibleChoices = useMemo(
    () =>
      localePackReady || uiLanguage === "en"
        ? localizeVnChoices(
            uiLanguage,
            presentationScenarioId,
            presentationNodeId,
            baseVisibleChoices,
            dictionary,
          )
        : baseVisibleChoices,
    [
      baseVisibleChoices,
      dictionary,
      localePackReady,
      presentationNodeId,
      presentationScenarioId,
      uiLanguage,
    ],
  );
  const autoContinueChoice = useMemo(() => {
    if (!baseAutoContinueChoice) {
      return null;
    }
    if (!localePackReady && uiLanguage !== "en") {
      return baseAutoContinueChoice;
    }
    return localizeVnChoice(
      uiLanguage,
      presentationScenarioId,
      presentationNodeId,
      baseAutoContinueChoice,
      dictionary,
    );
  }, [
    baseAutoContinueChoice,
    dictionary,
    localePackReady,
    presentationNodeId,
    presentationScenarioId,
    uiLanguage,
  ]);
  const baseNarrativeText =
    displayedPresentation?.narrativeText ?? currentNarrativeText;
  const narrativeText =
    !localePackReady && uiLanguage !== "en"
      ? t.translationsLoading
      : resolveVnNodeText(
          uiLanguage,
          presentationScenarioId,
          presentationNodeId,
          "body",
          baseNarrativeText,
          dictionary,
        );
  const resolvedBgUrl =
    displayedPresentation?.backgroundImageUrl ?? currentResolvedBgUrl;
  const speakerLabel = displayedPresentation
    ? (displayedPresentation.characterName ?? "Narrator")
    : currentSpeakerLabel;
  const baseDisplayLocationName =
    displayedPresentation?.locationName ??
    selectedScenario?.title ??
    t.unknownScenario;
  const displayLocationName = resolveVnScenarioTitle(
    uiLanguage,
    selectedScenario?.id === presentationScenarioId
      ? selectedScenario
      : { id: presentationScenarioId, title: baseDisplayLocationName },
    baseDisplayLocationName,
    dictionary,
  );
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

  const innerVoiceCards = useMemo<InnerVoiceCardDisplay[]>(() => {
    if (
      currentNode?.voicePresenceMode !== "parliament" ||
      !Array.isArray(currentNode.activeSpeakers)
    ) {
      return [];
    }

    const pool = currentNode.activeSpeakers.filter(isInnerVoiceId);
    if (pool.length === 0) {
      return [];
    }

    const selection = resolveInnerVoiceSelection(
      readPsycheState(myVars),
      pool,
      {
        includeCounter: pool.length >= 3,
      },
    );

    return selection.ordered.map((entry) => {
      const presentation = getVoicePresentation(entry.voiceId);
      return {
        voiceId: entry.voiceId,
        label: presentation.label,
        text: buildInnerVoiceFallbackText(entry.voiceId, entry.stance),
        role: entry.role,
        stance: entry.stance,
        resonance: entry.resonance,
        palette: presentation.palette,
      };
    });
  }, [currentNode?.activeSpeakers, currentNode?.voicePresenceMode, myVars]);

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

  const providenceThoughtCard = useMemo<InlineStatusCard | null>(() => {
    if (!showInlineProvidenceThoughtCard) {
      return null;
    }

    return {
      title: t.providenceThoughtTitle,
      eyebrow: t.providenceThoughtEyebrow,
      body:
        activeProvidenceThoughtStatus === "completed" &&
        activeProvidenceThoughtResponse?.text
          ? activeProvidenceThoughtResponse.text
          : t.providenceThoughtPending,
      tone: "thought",
    };
  }, [
    activeProvidenceThoughtResponse?.text,
    activeProvidenceThoughtStatus,
    showInlineProvidenceThoughtCard,
    t,
  ]);

  const providencePayload = useMemo(
    () =>
      activeAiThoughtRequest
        ? parseGenerateDialoguePayload(
            typeof activeAiThoughtRequest.payloadJson === "string"
              ? activeAiThoughtRequest.payloadJson
              : null,
          )
        : null,
    [activeAiThoughtRequest],
  );

  const providenceCost = Math.max(
    0,
    Math.trunc(providencePayload?.providenceCost ?? 0),
  );
  const canExpandThoughtWithProvidence =
    Boolean(thoughtCard) &&
    providencePayload?.dialogueLayer === "base" &&
    providenceCost > 0 &&
    narrativeResources.providence >= providenceCost &&
    activeProvidenceThoughtStatus !== "pending" &&
    activeProvidenceThoughtStatus !== "processing" &&
    activeProvidenceThoughtStatus !== "completed";
  const providenceCtaLabel =
    providencePayload?.dialogueLayer === "base" && providenceCost > 0
      ? `${t.providenceExpand} ${providenceCost} ${t.providenceLabel}`
      : null;

  const choiceDisplayItems = useMemo<ChoiceDisplayItem[]>(
    () =>
      visibleChoices.map((choice, index) => {
        const choiceKey = buildChoiceKey(
          selectedScenarioId,
          presentationNodeId ?? currentNode?.id ?? "",
          choice.id,
        );
        const isAvailable = isChoiceAvailable(
          choice,
          myFlags,
          myVars,
          choiceEvaluationContext,
        );
        const resolve = activeSkillResolve;
        const skillCheckState =
          resolve && resolve.choiceId === choice.id
            ? resolve.phase === "arming"
              ? "arming"
              : resolve.phase === "rolling"
                ? "rolling"
                : resolve.phase === "impact"
                  ? resolve.passed
                    ? "impact_success"
                    : "impact_fail"
                  : resolve.passed
                    ? "result_success"
                    : "result_fail"
            : "idle";
        const innerVoiceHints: ChoiceInnerVoiceHintDisplay[] = (
          choice.innerVoiceHints ?? []
        ).map((hint: NonNullable<VnChoice["innerVoiceHints"]>[number]) => {
          const presentation = getVoicePresentation(hint.voiceId);
          return {
            voiceId: hint.voiceId,
            label: presentation.label,
            text: hint.text,
            stance: hint.stance,
            palette: getVoicePalette(hint.voiceId),
          };
        });

        return {
          choice,
          index,
          chancePercent: getChoiceChancePercent(choice),
          skillCheckState,
          isVisited: Boolean(visitedChoiceKeys[choiceKey]),
          isLocked: !isAvailable || !mySession,
          isPending: pendingChoiceId === choice.id,
          hasFailedCheck: Boolean(failedChoiceKeys[choiceKey]),
          innerVoiceHints,
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
      presentationNodeId,
      selectedScenarioId,
      visibleChoices,
      visitedChoiceKeys,
    ],
  );

  return {
    reactionCard,
    thoughtCard,
    providenceThoughtCard,
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
    canExpandThoughtWithProvidence,
    providenceCtaLabel,
    innerVoiceCards,
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
