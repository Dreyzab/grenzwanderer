import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTable } from "spacetimedb/react";
import { tables } from "../../../shared/spacetime/bindings";
import { resolvePlayerPortrait } from "../../../shared/game/playerPortrait";
import {
  getActiveParliamentPresetId,
  getOriginProfileByFlags,
} from "../../character/originProfiles";
import type { EquipmentSlot } from "../../../shared/game/itemCatalog";
import { usePlayerBindings } from "../../../entities/player/hooks/usePlayerBindings";
import { useKarlsruheSceneBackground } from "../../release/sceneGeneration";
import { getVnStrings } from "../../i18n/uiStrings";
import { useVnAiLogic } from "../hooks/useVnAiLogic";
import { useVnDerivedState } from "../hooks/useVnDerivedState";
import { useVnDisplayMapping } from "../hooks/useVnDisplayMapping";
import { useI18n } from "../../i18n/I18nContext";
import { useVnProvidenceExpansion } from "../hooks/useVnProvidenceExpansion";
import { useVnSkillChecks } from "../hooks/useVnSkillChecks";
import { useVnSurfaceInteraction } from "../hooks/useVnSurfaceInteraction";
import { useVnTutorialState } from "../hooks/useVnTutorialState";
import { useVnTransitions } from "../hooks/useVnTransitions";
import { useNextVnVisualPrefetchUrls } from "../hooks/useNextVnVisualPrefetchUrls";
import { useEffectiveNarrativeLayout } from "../hooks/useEffectiveNarrativeLayout";
import { useVnContentSnapshot } from "../hooks/useVnContentSnapshot";
import { useVnScreenSpacetimeBindings } from "../hooks/useVnScreenSpacetimeBindings";
import { useCurrentNode } from "../hooks/useCurrentNode";
import { useVnSession } from "../hooks/useVnSession";
import { useNarrativeLog } from "../log/useNarrativeLog";
import { useUiLanguage } from "../../../shared/hooks/useUiLanguage";
import type { VnChoice } from "../types";
import type { GenerateDialoguePayload } from "../../ai/contracts";
import { VnScreenHeader } from "./VnScreenHeader";
import { VnScreenChoicesSlot } from "./VnScreenChoicesSlot";
import { VnScreenOverlaySlot } from "./VnScreenOverlaySlot";
import { VnSkillCheckToast } from "./VnSkillCheckToast";
import type { TypedTextHandle, TypedTextTokenHandler } from "./TypedText";
import {
  VnTokenFeedbackOverlay,
  type VnTokenFeedback,
  type VnTokenFeedbackVariant,
} from "./VnTokenFeedbackOverlay";
import { VnJournalEntryToast } from "./VnJournalEntryToast";
import { VnDmSidePanel } from "./VnDmSidePanel";
import { SceneComposer } from "./SceneComposer";
import { VnCreatorAssessmentPanel } from "./quality/VnCreatorAssessmentPanel";
import {
  playVnSkillCheckSfx,
  playVnTokenSfx,
  readVnSfxMuted,
  writeVnSfxMuted,
} from "./vnSkillCheckAudio";
import { VnNarrativePanel } from "../../../widgets/vn-overlay/VnNarrativePanel";
import { AUTO_CONTINUE_PREFIX } from "../vnScreenUtils";
import { VnHubInlinePanel } from "./hub/VnHubInlinePanel";
import { VnHubOverlay } from "./hub/VnHubOverlay";
import { VnHubOverlayButton } from "./hub/VnHubOverlayButton";
import { VnHubSchema } from "./hub/VnHubSchema";
import { collectVisibleOccupantNpcIds } from "./hub/evaluateOccupants";
import { useCurrentHubZone } from "../hooks/useCurrentHubZone";
import { isChoiceAvailable } from "../vnContent";
import type {
  ActiveAiThoughtContext,
  AwaitingSkillChoice,
  SkillCheckResultLike,
  TransitionState,
} from "../vnScreenTypes";

interface VnScreenProps {
  onOpenDebug?: () => void;
  initialScenarioId?: string;
  onScenarioChange?: (scenarioId: string) => void;
  onNavigateTab?: (
    tab:
      | "home"
      | "vn"
      | "character"
      | "map"
      | "mind_palace"
      | "command"
      | "battle",
  ) => void;
}

const CASE01_OPENING_VIDEO_NODE_ID = "scene_case01_opening_arrival_video";
const CASE01_WITCH_START_CHOICE_ID = "CASE01_WITCH_START_TO_DROWSE";

const createVnTokenRequestId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `vn-token-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
};

const parseFactTokenPayload = (
  payload: string,
): { caseId: string; factId: string } | null => {
  const [caseId, factId] = payload
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);

  if (!caseId || !factId) {
    return null;
  }

  return { caseId, factId };
};

const parseItemTokenPayload = (
  payload: string,
): { itemId: string; quantity: number } | null => {
  const [itemIdRaw, quantityRaw] = payload.split(":");
  const itemId = itemIdRaw?.trim() ?? "";
  if (!itemId) {
    return null;
  }

  const parsedQuantity =
    quantityRaw === undefined ? 1 : Number.parseInt(quantityRaw, 10);
  const quantity =
    Number.isFinite(parsedQuantity) && parsedQuantity > 0 ? parsedQuantity : 1;

  return { itemId, quantity };
};

const toTokenFeedbackVariant = (type: string): VnTokenFeedbackVariant => {
  if (
    type === "clue" ||
    type === "fact" ||
    type === "lead" ||
    type === "item"
  ) {
    return type;
  }
  return "unknown";
};

export const VnScreen = ({
  onOpenDebug,
  initialScenarioId,
  onScenarioChange,
  onNavigateTab,
}: VnScreenProps) => {
  const {
    versions,
    versionsReady,
    sessions,
    sessionsReady,
    skillResults,
    aiRequests,
    questRows,
    npcStateRows,
    npcStateReady,
    npcFavorRows,
    agencyCareerRows,
    rumorStateRows,
    mindFactRows,
    evidenceRows,
    inventoryRows,
    startScenario,
    recordChoice,
    performSkillCheckReducer,
    enqueueAiRequest,
    enqueueProvidenceDialogue,
    discoverFact,
    grantEvidence,
    grantItem,
  } = useVnScreenSpacetimeBindings();

  /** Set of fact keys already discovered (for tutorial state). */
  const discoveredFactKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const row of mindFactRows) {
      keys.add(`${row.caseId}/${row.factId}`);
    }
    return keys;
  }, [mindFactRows]);

  const [selectedScenarioId, setSelectedScenarioId] = useState("");
  const [transitionState, setTransitionState] =
    useState<TransitionState>("idle");
  const [statusLine, setStatusLine] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isSfxMuted, setIsSfxMuted] = useState(() => readVnSfxMuted());
  const [activeAiThoughtContext, setActiveAiThoughtContext] =
    useState<ActiveAiThoughtContext | null>(null);
  const [activeProvidenceThoughtContext, setActiveProvidenceThoughtContext] =
    useState<ActiveAiThoughtContext | null>(null);
  const [activeReactionKey, setActiveReactionKey] = useState<string | null>(
    null,
  );
  const [highlightProvidenceTrigger, setHighlightProvidenceTrigger] =
    useState(0);
  const [videoEnded, setVideoEnded] = useState(false);
  const [tokenFeedback, setTokenFeedback] = useState<VnTokenFeedback | null>(
    null,
  );

  const typedTextRef = useRef<TypedTextHandle>(null);
  const typingFinishedAtRef = useRef(0);
  const tokenFeedbackTimerRef = useRef<number | null>(null);
  const tokenFeedbackIdRef = useRef(0);
  const pendingTokenActionsRef = useRef<Set<string>>(new Set());
  const skippedWitchIntroNodeRef = useRef<string | null>(null);
  const tutorialActionsRef = useRef<{
    startRecordingFact: (factPayload: string) => void;
    showJournalToast: (factPayload: string) => void;
    failRecordingFact: (factPayload: string) => void;
  } | null>(null);

  const { flags: myFlags, vars: myVars } = usePlayerBindings();
  const activeParliamentPresetId = useMemo(
    () => getActiveParliamentPresetId(myFlags) ?? undefined,
    [myFlags],
  );
  const [equipmentRows] = useTable(tables.myPlayerEquipment);
  const equippedBySlot = useMemo(() => {
    const equipped: Record<string, string> = {
      head: "",
      body: "",
      hands: "",
      weapon: "",
      accessory: "",
    };
    for (const row of equipmentRows) {
      equipped[row.slotId] = row.itemId;
    }
    return equipped as Record<EquipmentSlot, string>;
  }, [equipmentRows]);

  const playerPortraitUrl = useMemo(
    () => resolvePlayerPortrait(myFlags, equippedBySlot),
    [myFlags, equippedBySlot],
  );

  const activeOrigin = useMemo(
    () => getOriginProfileByFlags(myFlags),
    [myFlags],
  );

  const playerProfileForLog = useMemo(() => {
    if (!activeOrigin) return null;
    return {
      name: activeOrigin.dossier.characterName,
      avatarUrl: playerPortraitUrl,
      accentColor: activeOrigin.dossier.accentColor,
    };
  }, [activeOrigin, playerPortraitUrl]);

  const uiLanguage = useUiLanguage(myFlags);
  const { dictionary, localePackReady } = useI18n();
  const t = useMemo(() => getVnStrings(uiLanguage), [uiLanguage]);

  const performSkillCheck = useCallback(
    (input: {
      requestId: string;
      scenarioId: string;
      checkId: string;
      fortuneSpend?: number;
    }) =>
      performSkillCheckReducer({
        ...input,
        fortuneSpend: input.fortuneSpend,
      }),
    [performSkillCheckReducer],
  );

  useEffect(() => {
    writeVnSfxMuted(isSfxMuted);
  }, [isSfxMuted]);

  useEffect(() => {
    return () => {
      if (tokenFeedbackTimerRef.current !== null) {
        window.clearTimeout(tokenFeedbackTimerRef.current);
      }
    };
  }, []);

  const { activeVersion, contentReady, selectedScenario, snapshot } =
    useVnContentSnapshot({
      selectedScenarioId,
      versions,
      versionsReady,
    });

  useEffect(() => {
    setTransitionState("idle");
    setError(null);
    setActiveAiThoughtContext(null);
    setActiveProvidenceThoughtContext(null);
    setActiveReactionKey(null);
  }, [selectedScenarioId]);

  const { session: mySession, isReady: sessionReady } =
    useVnSession(selectedScenarioId);
  const currentNode = useCurrentNode(
    snapshot,
    selectedScenario,
    mySession,
    sessionReady,
  );

  const effectiveNarrativeLayout = useEffectiveNarrativeLayout(currentNode);

  /**
   * Authored-group input for `useNarrativeLog` only. Passing this to `VnLogBottomSheet`
   * would false-trigger on nodes without `sceneGroupId` - the sheet must receive
   * `narrativeLog.state.sceneGroupId` (sticky / resolved coordinator).
   */
  const vnExplicitSceneGroupId = currentNode?.sceneGroupId ?? null;
  const narrativeLog = useNarrativeLog(
    currentNode,
    vnExplicitSceneGroupId,
    uiLanguage,
  );
  const { appendCheckResult, appendChoice, setTypingSegment } = narrativeLog;

  const generatedBackgroundUrl =
    useKarlsruheSceneBackground(selectedScenarioId);
  const {
    choiceEvaluationContext,
    trustByNpcId,
    visibleFactsByCharacterId,
    mySessions,
    currentSessionPointer,
    currentReactionContext,
    mySkillResults,
    myAiRequests,
    myReactionRequests,
    myDirectorRequests,
    activeDirectorProposal,
    activeDmTurnRequest,
    activeDmTurnProposal,
    currentDiceMode,
    completionRoute,
    isScenarioCompleted,
    completionTargetLabel,
    passiveCheckItems,
    currentVisibleChoices,
    currentVisibleHotspotChoices,
    currentAutoContinueChoice,
    hasPendingPassiveChecks,
    currentNarrativeText,
    currentResolvedBgUrl,
    currentSpeakerLabel,
    currentShowOriginCards,
    activeLens,
    internalizedThought,
    activeAiThoughtRequest,
    activeProvidenceThoughtRequest,
    activeReactionRequest,
    activeAiThoughtResponse,
    activeProvidenceThoughtResponse,
    activeReactionResponse,
    activeAiThoughtVoiceLabel,
    activeAiThoughtStatus,
    activeProvidenceThoughtStatus,
    activeReactionStatus,
    narrativeResources,
    getChoiceEffectiveDifficulty,
    getChoiceChancePercent,
  } = useVnDerivedState({
    sessions,
    sessionsReady,
    skillResults,
    aiRequests,
    questRows,
    npcStateRows,
    npcFavorRows,
    agencyCareerRows,
    rumorStateRows,
    selectedScenarioId,
    snapshot,
    selectedScenario,
    contentReady,
    myFlags,
    myVars,
    activeParliamentPresetId,
    mySession,
    sessionReady,
    currentNode,
    activeAiThoughtContext,
    activeProvidenceThoughtContext,
    activeReactionKey,
    tSessionHydrating: t.sessionHydrating,
    tTranslationsLoading: t.translationsLoading,
    localePackReady,
    uiLanguage,
    dictionary,
  });
  const effectiveBackgroundUrl = generatedBackgroundUrl ?? currentResolvedBgUrl;
  const dmVisibleFacts = useMemo(
    () =>
      Array.from(
        new Set(
          [...visibleFactsByCharacterId.values()].flatMap((entries) => entries),
        ),
      ).sort(),
    [visibleFactsByCharacterId],
  );
  const { handleStartScenario, runCompletionTransition } = useVnTransitions({
    snapshot,
    activeVersionChecksum: activeVersion?.checksum ?? null,
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
  });
  const { enqueueResolvedSkillAiThought } = useVnAiLogic({
    snapshot,
    selectedScenarioId,
    currentNode,
    contentReady,
    sessionReady,
    npcStateReady,
    activeAiThoughtContext,
    setActiveAiThoughtContext,
    setActiveReactionKey,
    currentReactionContext,
    myFlags,
    myVars,
    questRows,
    myAiRequests,
    myReactionRequests,
    myDirectorRequests,
    visibleFactsByCharacterId,
    trustByNpcId,
    enqueueAiRequest,
    setError,
  });
  const handleResolvedSkillCheckWithLog = useCallback(
    (pending: AwaitingSkillChoice, matchedResult: SkillCheckResultLike) => {
      appendCheckResult({
        voiceId: pending.voiceId,
        voiceLabel: pending.voiceLabel,
        passed: matchedResult.passed,
        roll: matchedResult.roll,
        dc: matchedResult.difficulty,
      });
      enqueueResolvedSkillAiThought(pending, matchedResult);
    },
    [appendCheckResult, enqueueResolvedSkillAiThought],
  );
  const playSkillCheckImpactSfx = useCallback((passed: boolean) => {
    void playVnSkillCheckSfx(passed, false);
  }, []);
  const markInteractionHandled = useCallback(() => {
    typingFinishedAtRef.current = Date.now();
  }, []);
  const showTokenFeedback = useCallback(
    (
      variant: VnTokenFeedbackVariant,
      label: string,
      event: Parameters<TypedTextTokenHandler>[1],
    ) => {
      const eventLike = event as unknown as {
        clientX?: number;
        clientY?: number;
        currentTarget?: HTMLElement;
      };
      const rect = eventLike.currentTarget?.getBoundingClientRect();
      const x =
        typeof eventLike.clientX === "number" && eventLike.clientX > 0
          ? eventLike.clientX
          : (rect?.left ?? 0) + (rect?.width ?? 0) / 2;
      const y =
        typeof eventLike.clientY === "number" && eventLike.clientY > 0
          ? eventLike.clientY
          : (rect?.top ?? 0) + (rect?.height ?? 0) / 2;

      tokenFeedbackIdRef.current += 1;
      setTokenFeedback({
        id: tokenFeedbackIdRef.current,
        label,
        variant,
        x,
        y,
      });

      if (tokenFeedbackTimerRef.current !== null) {
        window.clearTimeout(tokenFeedbackTimerRef.current);
      }
      tokenFeedbackTimerRef.current = window.setTimeout(() => {
        setTokenFeedback(null);
        tokenFeedbackTimerRef.current = null;
      }, 920);
    },
    [],
  );
  const handleTypedTextTokenClick = useCallback<TypedTextTokenHandler>(
    (token, event) => {
      if (token.type === "fact" || token.type === "lead") {
        const parsed = parseFactTokenPayload(token.payload);
        if (parsed) {
          const actionKey = `fact:${parsed.caseId}:${parsed.factId}`;
          if (
            mindFactRows.some(
              (row) =>
                row.caseId === parsed.caseId && row.factId === parsed.factId,
            ) ||
            pendingTokenActionsRef.current.has(actionKey)
          ) {
            return;
          }
        }
      }

      markInteractionHandled();
      const variant = toTokenFeedbackVariant(token.type);
      showTokenFeedback(variant, token.text, event);
      if (!isSfxMuted) {
        void playVnTokenSfx(variant, false);
      }

      const run = async () => {
        if (token.type === "clue") {
          const evidenceId = token.payload.trim();
          if (!evidenceId) {
            setError("Interactive clue token is missing an evidence id.");
            return;
          }

          const actionKey = `clue:${evidenceId}`;
          if (
            evidenceRows.some((row) => row.evidenceId === evidenceId) ||
            pendingTokenActionsRef.current.has(actionKey)
          ) {
            return;
          }

          pendingTokenActionsRef.current.add(actionKey);
          setError(null);
          try {
            await grantEvidence({
              requestId: createVnTokenRequestId(),
              evidenceId,
            });
          } catch (caughtError) {
            pendingTokenActionsRef.current.delete(actionKey);
            setError(
              caughtError instanceof Error
                ? caughtError.message
                : "Failed to save clue token.",
            );
          }
          return;
        }

        if (token.type === "fact" || token.type === "lead") {
          const parsed = parseFactTokenPayload(token.payload);
          if (!parsed) {
            setError(
              "Interactive fact token must use payload case_id/fact_id.",
            );
            return;
          }

          const actionKey = `fact:${parsed.caseId}:${parsed.factId}`;
          if (
            mindFactRows.some(
              (row) =>
                row.caseId === parsed.caseId && row.factId === parsed.factId,
            ) ||
            pendingTokenActionsRef.current.has(actionKey)
          ) {
            return;
          }

          pendingTokenActionsRef.current.add(actionKey);
          tutorialActionsRef.current?.startRecordingFact(token.payload);
          setError(null);
          try {
            await discoverFact({
              requestId: createVnTokenRequestId(),
              caseId: parsed.caseId,
              factId: parsed.factId,
            });
            // Trigger journal entry toast with fact metadata
            tutorialActionsRef.current?.showJournalToast(token.payload.trim());
          } catch (caughtError) {
            pendingTokenActionsRef.current.delete(actionKey);
            tutorialActionsRef.current?.failRecordingFact(token.payload);
            setError(
              caughtError instanceof Error
                ? caughtError.message
                : "Failed to save fact token.",
            );
          }
          return;
        }

        if (token.type === "item") {
          const parsed = parseItemTokenPayload(token.payload);
          if (!parsed) {
            setError("Interactive item token is missing an item id.");
            return;
          }

          const actionKey = `item:${parsed.itemId}`;
          if (
            inventoryRows.some(
              (row) => row.itemId === parsed.itemId && row.quantity > 0,
            ) ||
            pendingTokenActionsRef.current.has(actionKey)
          ) {
            return;
          }

          pendingTokenActionsRef.current.add(actionKey);
          setError(null);
          try {
            await grantItem({
              requestId: createVnTokenRequestId(),
              itemId: parsed.itemId,
              quantity: parsed.quantity,
            });
          } catch (caughtError) {
            pendingTokenActionsRef.current.delete(actionKey);
            setError(
              caughtError instanceof Error
                ? caughtError.message
                : "Failed to save item token.",
            );
          }
        }
      };

      void run();
    },
    [
      discoverFact,
      evidenceRows,
      grantEvidence,
      grantItem,
      inventoryRows,
      isSfxMuted,
      markInteractionHandled,
      mindFactRows,
      showTokenFeedback,
    ],
  );
  const {
    pendingChoiceId,
    armedSkillChoice,
    awaitingSkillChoice,
    failedChoiceKeys,
    visitedChoiceKeys,
    activeSkillResolve,
    skillCheckToast,
    clearSkillCheckToast,
    handleChoiceClick,
    handleFortuneSpendChange,
    confirmArmedSkillCheck,
    handleActiveResolveInteraction,
  } = useVnSkillChecks({
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
    activeParliamentPresetId,
    choiceEvaluationContext,
    mySkillResults,
    currentDiceMode,
    isTyping,
    interruptTyping: () => typedTextRef.current?.finish(),
    isSfxMuted,
    playImpactSfx: playSkillCheckImpactSfx,
    markInteractionHandled,
    getChoiceChancePercent,
    getChoiceEffectiveDifficulty,
    handleResolvedSkillCheck: handleResolvedSkillCheckWithLog,
    performSkillCheck,
    recordChoice,
    setTransitionState,
    setStatusLine,
    setError,
    t,
  });

  const handleTypingChange = useCallback(
    (typing: boolean) => {
      setTypingSegment(typing);
      setIsTyping(typing);
      if (!typing) {
        typingFinishedAtRef.current = Date.now();
      }
    },
    [setTypingSegment, setIsTyping],
  );

  const { handleProvidenceExpand } = useVnProvidenceExpansion({
    activeAiThoughtContext,
    activeAiThoughtRequest,
    activeProvidenceThoughtStatus,
    setActiveProvidenceThoughtContext,
    enqueueProvidenceDialogue,
    setError,
  });

  const {
    reactionCard,
    thoughtCard,
    providenceThoughtCard,
    innerVoiceCards,
    visibleChoices,
    visibleHotspotChoices,
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
    activeLensBadgeText,
    internalizedThoughtBadgeText,
    choiceDisplayItems,
    hasAutoContinueChoice,
  } = useVnDisplayMapping({
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
    activeParliamentPresetId,
    choiceEvaluationContext,
    currentVisibleChoices,
    currentVisibleHotspotChoices,
    currentAutoContinueChoice,
    currentNarrativeText,
    currentResolvedBgUrl: effectiveBackgroundUrl,
    currentSpeakerLabel,
    currentShowOriginCards,
    isScenarioCompleted,
    activeLens,
    internalizedThought,
    activeSkillResolve,
    activeAiThoughtContext,
    activeProvidenceThoughtContext,
    activeReactionContext: currentReactionContext,
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
  });

  const handleInsufficientTokens = useCallback(() => {
    setHighlightProvidenceTrigger((prev) => prev + 1);
  }, []);

  const handleCustomSubmit = useCallback(
    async (choice: VnChoice, text: string) => {
      if (!mySession || !currentNode) return;
      if (narrativeResources.providence < 1) {
        setHighlightProvidenceTrigger((prev) => prev + 1);
        return;
      }
      setError(null);

      const checkId = `${choice.id}_custom`;
      const context: ActiveAiThoughtContext = {
        scenarioId: selectedScenarioId,
        nodeId: currentNode.id,
        checkId,
        choiceId: choice.id,
        dialogueLayer: "providence",
        voiceId: "narrator",
        choiceText: text,
        resultCreatedAtMicros: BigInt(Date.now()) * 1000n,
      };

      setActiveProvidenceThoughtContext(context);

      try {
        const payload: GenerateDialoguePayload = {
          source: "vn_skill_check",
          scenarioId: selectedScenarioId,
          nodeId: currentNode.id,
          checkId,
          choiceId: choice.id,
          voiceId: "narrator",
          choiceText: text,
          dialogueLayer: "providence",
          providenceCost: 1,
          passed: true,
          roll: 20,
          difficulty: 0,
          voiceLevel: 1,
          locationName: displayLocationName || "",
          narrativeText: currentNode.body || "",
        };

        await enqueueProvidenceDialogue({
          requestId: createVnTokenRequestId(),
          scenarioId: selectedScenarioId,
          nodeId: currentNode.id,
          checkId,
          choiceId: choice.id,
          providenceCost: 1,
          payloadJson: JSON.stringify(payload),
        });
      } catch (caughtError) {
        setActiveProvidenceThoughtContext((current) =>
          current?.scenarioId === context.scenarioId &&
          current?.nodeId === context.nodeId &&
          current?.checkId === context.checkId &&
          current?.choiceId === context.choiceId &&
          current?.dialogueLayer === "providence"
            ? null
            : current,
        );
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Failed to submit custom action.",
        );
      }
    },
    [
      mySession,
      currentNode,
      narrativeResources.providence,
      selectedScenarioId,
      displayLocationName,
      enqueueProvidenceDialogue,
      setError,
    ],
  );

  const hideImmersiveChrome =
    effectiveNarrativeLayout === "fullscreen" ||
    effectiveNarrativeLayout === "letter_overlay";
  const isWitchDmMode = Boolean(myFlags.origin_witch);
  const isCreatorMode = import.meta.env.DEV || isWitchDmMode;
  // Phase 2 aggregation compares stored ratings against the content *version*
  // (semantic), not the checksum, to flag stale ratings after a rebuild.
  const contentVersionLabel = activeVersion?.version ?? undefined;
  const isEleonoraTrainPrologue =
    isWitchDmMode &&
    (currentNode?.sceneGroupId === "witch_train_compartment" ||
      currentNode?.sceneGroupId === "train_bahn_video");

  useEffect(() => {
    if (
      !isWitchDmMode ||
      currentNode?.id !== CASE01_OPENING_VIDEO_NODE_ID ||
      autoContinueChoice?.id !== CASE01_WITCH_START_CHOICE_ID ||
      transitionState !== "idle" ||
      pendingChoiceId ||
      skippedWitchIntroNodeRef.current === currentNode.id ||
      !mySession
    ) {
      return;
    }

    skippedWitchIntroNodeRef.current = currentNode.id;
    void handleChoiceClick(autoContinueChoice, false);
  }, [
    autoContinueChoice,
    currentNode?.id,
    handleChoiceClick,
    isWitchDmMode,
    mySession,
    pendingChoiceId,
    transitionState,
  ]);

  const isHubNode = currentNode?.interactionMode === "hub";
  const isHubInlinePanel =
    isHubNode && currentNode?.hubPresentation === "inline_panel";
  const hubSchema = isHubNode ? (currentNode?.hubSchema ?? null) : null;
  const currentHubZoneId = useCurrentHubZone(hubSchema, myFlags);
  const visibleHubOccupantsByZoneId = useMemo(() => {
    if (!hubSchema) {
      return undefined;
    }

    return Object.fromEntries(
      hubSchema.zones.map((zone) => [
        zone.id,
        collectVisibleOccupantNpcIds(
          zone,
          myFlags,
          myVars,
          choiceEvaluationContext,
        ),
      ]),
    );
  }, [choiceEvaluationContext, hubSchema, myFlags, myVars]);
  const isHubChoiceLocked = useCallback(
    (choice: VnChoice) =>
      !mySession ||
      !isChoiceAvailable(choice, myFlags, myVars, choiceEvaluationContext),
    [choiceEvaluationContext, myFlags, mySession, myVars],
  );
  const [isHubOverlayOpen, setIsHubOverlayOpen] = useState(false);
  // Auto-close the overlay whenever the active node changes — a hotspot
  // choice transitions to a new node, and the next node should decide its
  // own surface mode.
  useEffect(() => {
    setIsHubOverlayOpen(false);
  }, [currentNode?.id]);

  const handleHotspotChoiceClick = useCallback(
    (choice: VnChoice) => {
      setIsHubOverlayOpen(false);
      void handleChoiceClick(choice, isHubChoiceLocked(choice));
    },
    [handleChoiceClick, isHubChoiceLocked],
  );

  const { handleSurfaceTap, handleVideoEnded, handleVisualSequenceEnded } =
    useVnSurfaceInteraction({
      autoContinueChoice,
      awaitingSkillChoice,
      choiceDisplayItemCount: choiceDisplayItems.length,
      choiceEvaluationContext,
      currentNode,
      displayedScenarioCompleted,
      effectiveNarrativeLayout,
      handleActiveResolveInteraction,
      handleChoiceClick,
      handleStartScenario,
      isTyping,
      isBlocked: isHubOverlayOpen,
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
    });

  const tutorialState = useVnTutorialState({
    narrativeText,
    isLetterOverlay: effectiveNarrativeLayout === "letter_overlay",
    discoveredFactKeys,
  });
  tutorialActionsRef.current = {
    startRecordingFact: tutorialState.startRecordingFact,
    showJournalToast: tutorialState.showJournalToast,
    failRecordingFact: tutorialState.failRecordingFact,
  };

  /** Wraps surface tap to intercept for tutorial tooltip on letter overlays. */
  const handleSurfaceTapWithTutorial = useCallback(() => {
    if (tutorialState.interceptContinue()) {
      return;
    }
    handleSurfaceTap();
  }, [handleSurfaceTap, tutorialState]);

  const handleLoggedChoiceClick = useCallback(
    (choice: VnChoice, isLocked: boolean) => {
      if (
        effectiveNarrativeLayout === "log" &&
        !isLocked &&
        !choice.id.startsWith(AUTO_CONTINUE_PREFIX)
      ) {
        appendChoice(choice.text);
      }
      void handleChoiceClick(choice, isLocked);
    },
    [appendChoice, effectiveNarrativeLayout, handleChoiceClick],
  );

  const nextVisualUrls = useNextVnVisualPrefetchUrls({
    autoContinueChoice: currentAutoContinueChoice,
    currentNode,
    resolvedBgUrl,
    snapshot,
    visibleChoices: currentVisibleChoices,
  });

  if (!activeVersion || !snapshot) {
    return (
      <section className="vn-empty-state">
        <article className="card warning">
          <h3>{t.vnContentTitle}</h3>
          <p>{t.vnContentBody}</p>
          {onOpenDebug ? (
            <button type="button" onClick={onOpenDebug}>
              {t.openDebugPanel}
            </button>
          ) : null}
        </article>
      </section>
    );
  }

  const isInteractionLocked =
    transitionState !== "idle" ||
    Boolean(awaitingSkillChoice) ||
    Boolean(activeSkillResolve) ||
    hasPendingPassiveChecks;
  const isHubInteractionDisabled = isInteractionLocked || isTyping;
  const canTriggerCompletion =
    transitionState !== "handoff_in_flight" &&
    transitionState !== "handoff_failed";
  const hasPlayerFacingChoices = choiceDisplayItems.some(
    (item) => !item.choice.id.startsWith(AUTO_CONTINUE_PREFIX),
  );

  return (
    <section className="vn-screen-root">
      {!hideImmersiveChrome ? (
        <VnScreenHeader
          t={t}
          selectedScenarioId={selectedScenarioId}
          scenarios={snapshot.scenarios}
          isInteractionLocked={isInteractionLocked}
          narrativeResources={narrativeResources}
          onScenarioChange={setSelectedScenarioId}
          onStartScenario={handleStartScenario}
          onOpenDebug={onOpenDebug}
          highlightProvidenceTrigger={highlightProvidenceTrigger}
        />
      ) : null}

      <VnNarrativePanel
        t={t}
        sceneId={currentNode?.id}
        sceneGroupId={narrativeLog.state.sceneGroupId}
        locationName={displayLocationName}
        characterId={currentNode?.characterId}
        characterName={speakerLabel === "Narrator" ? undefined : speakerLabel}
        narrativeText={narrativeText}
        hasVisibleChoices={hasPlayerFacingChoices}
        backgroundImageUrl={resolvedBgUrl ?? undefined}
        backgroundVideoUrl={currentNode?.backgroundVideoUrl}
        backgroundVideoPosterUrl={currentNode?.backgroundVideoPosterUrl}
        backgroundVideoSoundPrompt={currentNode?.backgroundVideoSoundPrompt}
        visualSequence={currentNode?.visualSequence}
        nextVisualUrls={nextVisualUrls}
        narrativeLayout={effectiveNarrativeLayout}
        narrativePresentation={currentNode?.narrativePresentation}
        logState={narrativeLog.state}
        logSnapshot={snapshot}
        parliamentPresetId={activeParliamentPresetId}
        playerProfile={playerProfileForLog}
        letterOverlayRevealDelayMs={currentNode?.letterOverlayRevealDelayMs}
        onTypingChange={handleTypingChange}
        onNarrativeComplete={narrativeLog.finishCurrentSegment}
        isTyping={isTyping}
        typedTextRef={typedTextRef}
        onTokenClick={handleTypedTextTokenClick}
        onSurfaceTap={handleSurfaceTapWithTutorial}
        tokenStateByPayload={tutorialState.tokenStateByPayload}
        showTutorialTooltip={tutorialState.showTooltip}
        onDismissTutorialTooltip={tutorialState.dismissTooltip}
        onVideoEnded={handleVideoEnded}
        onVisualSequenceEnded={handleVisualSequenceEnded}
        videoPlaybackComplete={videoEnded}
        suppressImmersiveSurfaceOverlay={isEleonoraTrainPrologue}
        choicesSlot={
          <VnScreenChoicesSlot
            activeLensBadgeText={activeLensBadgeText}
            canExpandThoughtWithProvidence={canExpandThoughtWithProvidence}
            canTriggerCompletion={canTriggerCompletion}
            choiceDisplayItems={choiceDisplayItems}
            choiceEvaluationContext={choiceEvaluationContext}
            completionRoute={completionRoute}
            completionTargetLabel={completionTargetLabel}
            currentNodePresent={Boolean(currentNode)}
            displayedScenarioCompleted={displayedScenarioCompleted}
            effectiveNarrativeLayout={effectiveNarrativeLayout}
            hasAutoContinueChoice={hasAutoContinueChoice}
            hideImmersiveChrome={hideImmersiveChrome}
            innerVoiceCards={innerVoiceCards}
            internalizedThoughtBadgeText={internalizedThoughtBadgeText}
            isInteractionLocked={isInteractionLocked}
            myFlags={myFlags}
            mySession={mySession}
            myVars={myVars}
            providenceCtaLabel={providenceCtaLabel}
            providenceThoughtCard={providenceThoughtCard}
            reactionCard={reactionCard}
            sessionReady={sessionReady}
            showOriginCards={showOriginCards}
            t={t}
            thoughtCard={thoughtCard}
            uiLanguage={uiLanguage}
            visibleChoices={visibleChoices}
            providenceCount={narrativeResources.providence}
            onChoiceClick={handleLoggedChoiceClick}
            onCompletionTransition={() => void runCompletionTransition()}
            onCustomSubmit={handleCustomSubmit}
            onInsufficientTokens={handleInsufficientTokens}
            onProvidenceExpand={() => void handleProvidenceExpand()}
            onRestartScene={() => void handleStartScenario()}
          />
        }
      >
        <VnScreenOverlaySlot
          activeResolveAiStatus={activeResolveAiStatus}
          activeResolveAiText={activeResolveAiText}
          activeSkillResolve={activeSkillResolve}
          aiThoughtVoiceLabel={activeAiThoughtVoiceLabel}
          canRoll={Boolean(
            armedSkillChoice &&
            activeSkillResolve?.phase === "arming" &&
            !awaitingSkillChoice,
          )}
          isSfxMuted={isSfxMuted}
          passiveCheckItems={passiveCheckItems}
          t={t}
          onActiveResolveInteraction={handleActiveResolveInteraction}
          onFortuneSpendChange={handleFortuneSpendChange}
          onRoll={() => void confirmArmedSkillCheck()}
          onSfxMutedChange={setIsSfxMuted}
        />
      </VnNarrativePanel>

      {statusLine ? <p className="status-line success">{statusLine}</p> : null}
      {error ? <p className="status-line error">{error}</p> : null}
      {activeDirectorProposal ? (
        <aside
          className="vn-director-card"
          data-testid="vn-director-card"
          data-step-type={activeDirectorProposal.stepType}
          data-return-beat={activeDirectorProposal.suggestedReturnBeatId}
        >
          <p className="vn-director-card__framing">
            {activeDirectorProposal.framingText}
          </p>
          {activeDirectorProposal.bridgeText ? (
            <p className="vn-director-card__bridge">
              {activeDirectorProposal.bridgeText}
            </p>
          ) : null}
        </aside>
      ) : null}
      {isWitchDmMode ? (
        <VnDmSidePanel
          scenarioId={selectedScenarioId}
          nodeId={currentNode?.id}
          narrativeResources={narrativeResources}
          myFlags={myFlags}
          myVars={myVars}
          parliamentPresetId={activeParliamentPresetId}
          visibleFacts={dmVisibleFacts}
          activeRequest={activeDmTurnRequest}
          activeProposal={activeDmTurnProposal}
          enqueueAiRequest={enqueueAiRequest}
          onError={setError}
        />
      ) : null}
      {selectedScenarioId ? (
        <SceneComposer
          scenarioId={selectedScenarioId}
          enqueueAiRequest={enqueueAiRequest}
          reactionRequests={myReactionRequests}
          onError={setError}
        />
      ) : null}
      {isCreatorMode ? (
        <VnCreatorAssessmentPanel
          node={currentNode}
          scenario={selectedScenario}
          contentVersion={contentVersionLabel}
        />
      ) : null}
      <VnSkillCheckToast
        toast={skillCheckToast}
        onClose={clearSkillCheckToast}
      />
      <VnTokenFeedbackOverlay feedback={tokenFeedback} />
      <VnJournalEntryToast
        toast={tutorialState.journalToast}
        t={t}
        onDismiss={tutorialState.clearJournalToast}
      />
      {isHubNode && hubSchema ? (
        isHubInlinePanel ? (
          <VnHubInlinePanel title={currentNode?.title}>
            <VnHubSchema
              schema={hubSchema}
              hotspotChoices={visibleHotspotChoices}
              currentZoneId={currentHubZoneId}
              visibleOccupantsByZoneId={visibleHubOccupantsByZoneId}
              onZoneSelect={handleHotspotChoiceClick}
              isChoiceLocked={isHubChoiceLocked}
              disabled={isHubInteractionDisabled}
            />
          </VnHubInlinePanel>
        ) : (
          <>
            <VnHubOverlayButton
              onClick={() => setIsHubOverlayOpen(true)}
              disabled={isHubInteractionDisabled}
            />
            <VnHubOverlay
              open={isHubOverlayOpen}
              onClose={() => setIsHubOverlayOpen(false)}
              title={currentNode?.title}
            >
              <VnHubSchema
                schema={hubSchema}
                hotspotChoices={visibleHotspotChoices}
                currentZoneId={currentHubZoneId}
                visibleOccupantsByZoneId={visibleHubOccupantsByZoneId}
                onZoneSelect={handleHotspotChoiceClick}
                isChoiceLocked={isHubChoiceLocked}
                disabled={isHubInteractionDisabled}
              />
            </VnHubOverlay>
          </>
        )
      ) : null}
    </section>
  );
};
