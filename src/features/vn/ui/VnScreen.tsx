import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { VnScreenHeader } from "./VnScreenHeader";
import { VnScreenChoicesSlot } from "./VnScreenChoicesSlot";
import { VnScreenOverlaySlot } from "./VnScreenOverlaySlot";
import type { TypedTextHandle, TypedTextTokenHandler } from "./TypedText";
import {
  VnTokenFeedbackOverlay,
  type VnTokenFeedback,
  type VnTokenFeedbackVariant,
} from "./VnTokenFeedbackOverlay";
import {
  playVnSkillCheckSfx,
  playVnTokenSfx,
  readVnSfxMuted,
  writeVnSfxMuted,
} from "./vnSkillCheckAudio";
import { VnNarrativePanel } from "../../../widgets/vn-overlay/VnNarrativePanel";
import { AUTO_CONTINUE_PREFIX } from "../vnScreenUtils";
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
    snapshots,
    snapshotsReady,
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
  const [videoEnded, setVideoEnded] = useState(false);
  const [tokenFeedback, setTokenFeedback] = useState<VnTokenFeedback | null>(
    null,
  );

  const typedTextRef = useRef<TypedTextHandle>(null);
  const typingFinishedAtRef = useRef(0);
  const tokenFeedbackTimerRef = useRef<number | null>(null);
  const tokenFeedbackIdRef = useRef(0);
  const pendingTokenActionsRef = useRef<Set<string>>(new Set());

  const { flags: myFlags, vars: myVars } = usePlayerBindings();
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
      snapshots,
      snapshotsReady,
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
   * would false-trigger on nodes without `sceneGroupId` — the sheet must receive
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
    currentDiceMode,
    completionRoute,
    isScenarioCompleted,
    completionTargetLabel,
    passiveCheckItems,
    currentVisibleChoices,
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
    visibleFactsByCharacterId,
    trustByNpcId,
    enqueueAiRequest,
    setError,
  });
  const handleResolvedSkillCheckWithLog = useCallback(
    (pending: AwaitingSkillChoice, matchedResult: SkillCheckResultLike) => {
      appendCheckResult({
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
          setError(null);
          try {
            await discoverFact({
              requestId: createVnTokenRequestId(),
              caseId: parsed.caseId,
              factId: parsed.factId,
            });
          } catch (caughtError) {
            pendingTokenActionsRef.current.delete(actionKey);
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
    choiceEvaluationContext,
    currentVisibleChoices,
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

  const hideImmersiveChrome =
    effectiveNarrativeLayout === "fullscreen" ||
    effectiveNarrativeLayout === "letter_overlay";

  const { handleSurfaceTap, handleVideoEnded } = useVnSurfaceInteraction({
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
  const canTriggerCompletion =
    transitionState !== "handoff_in_flight" &&
    transitionState !== "handoff_failed";

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
        backgroundImageUrl={resolvedBgUrl ?? undefined}
        backgroundVideoUrl={currentNode?.backgroundVideoUrl}
        backgroundVideoPosterUrl={currentNode?.backgroundVideoPosterUrl}
        backgroundVideoSoundPrompt={currentNode?.backgroundVideoSoundPrompt}
        nextVisualUrls={nextVisualUrls}
        narrativeLayout={effectiveNarrativeLayout}
        narrativePresentation={currentNode?.narrativePresentation}
        logState={narrativeLog.state}
        logSnapshot={snapshot}
        letterOverlayRevealDelayMs={currentNode?.letterOverlayRevealDelayMs}
        onTypingChange={handleTypingChange}
        isTyping={isTyping}
        typedTextRef={typedTextRef}
        onTokenClick={handleTypedTextTokenClick}
        onSurfaceTap={handleSurfaceTap}
        onVideoEnded={handleVideoEnded}
        videoPlaybackComplete={videoEnded}
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
            onChoiceClick={handleLoggedChoiceClick}
            onCompletionTransition={() => void runCompletionTransition()}
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
      <VnTokenFeedbackOverlay feedback={tokenFeedback} />
    </section>
  );
};
