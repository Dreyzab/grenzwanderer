import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useReducer, useTable } from "spacetimedb/react";
import { Volume2, VolumeX } from "lucide-react";
import { usePlayerFlags } from "../../../entities/player/hooks/usePlayerFlags";
import { usePlayerVars } from "../../../entities/player/hooks/usePlayerVars";
import { useKarlsruheSceneBackground } from "../../release/sceneGeneration";
import { getVnStrings } from "../../i18n/uiStrings";
import { parseGenerateDialoguePayload } from "../../ai/contracts";
import { useVnAiLogic } from "../hooks/useVnAiLogic";
import { useVnDerivedState } from "../hooks/useVnDerivedState";
import { useVnDisplayMapping } from "../hooks/useVnDisplayMapping";
import { useVnSkillChecks } from "../hooks/useVnSkillChecks";
import { useVnTransitions } from "../hooks/useVnTransitions";
import { useCurrentNode } from "../hooks/useCurrentNode";
import { useVnSession } from "../hooks/useVnSession";
import { useUiLanguage } from "../../../shared/hooks/useUiLanguage";
import { reducers, tables } from "../../../shared/spacetime/bindings";
import {
  getScenarioById,
  isChoiceAvailable,
  parseSnapshot,
} from "../vnContent";
import type { VnNarrativeLayout, VnScenario, VnSnapshot } from "../types";
import { VnPassiveCheckBanner } from "./VnPassiveCheckBanner";
import { VnChoicesRenderer } from "./VnChoicesRenderer";
import { VnScreenHeader } from "./VnScreenHeader";
import { VnSkillCheckResolveOverlay } from "./VnSkillCheckResolveOverlay";
import type { TypedTextHandle } from "./TypedText";
import {
  playVnSkillCheckSfx,
  readVnSfxMuted,
  writeVnSfxMuted,
} from "./vnSkillCheckAudio";
import { VnNarrativePanel } from "../../../widgets/vn-overlay/VnNarrativePanel";
import { createRequestId, TAP_CONTINUE_COOLDOWN_MS } from "../vnScreenUtils";
import type { ActiveAiThoughtContext, TransitionState } from "../vnScreenTypes";

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

export const VnScreen = ({
  onOpenDebug,
  initialScenarioId,
  onScenarioChange,
  onNavigateTab,
}: VnScreenProps) => {
  const postDebugLog = useCallback(
    (
      location: string,
      message: string,
      data: Record<string, unknown>,
      hypothesisId: string,
      runId = "run1",
    ) => {
      // #region agent log
      fetch(
        "http://127.0.0.1:7827/ingest/516e26f3-8222-4f1d-b4fe-801d6fa79ab1",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "f85e6b",
          },
          body: JSON.stringify({
            sessionId: "f85e6b",
            runId,
            hypothesisId,
            location,
            message,
            data,
            timestamp: Date.now(),
          }),
        },
      ).catch(() => {});
      // #endregion
    },
    [],
  );

  const [versions, versionsReady] = useTable(tables.contentVersion);
  const [snapshots, snapshotsReady] = useTable(tables.contentSnapshot);
  const [sessions, sessionsReady] = useTable(tables.myVnSessions);
  const [skillResults] = useTable(tables.myVnSkillResults);
  const [aiRequests] = useTable(tables.myAiRequests);
  const [questRows] = useTable(tables.myQuests);
  const [npcStateRows, npcStateReady] = useTable(tables.myNpcState);
  const [npcFavorRows] = useTable(tables.myNpcFavors);
  const [agencyCareerRows] = useTable(tables.myAgencyCareer);
  const [rumorStateRows] = useTable(tables.myRumorState);

  const startScenario = useReducer(reducers.startScenario);
  const recordChoice = useReducer(reducers.recordChoice);
  const performSkillCheckReducer = useReducer(reducers.performSkillCheck);
  const enqueueAiRequest = useReducer(reducers.enqueueAiRequest);
  const enqueueProvidenceDialogue = useReducer(
    reducers.enqueueProvidenceDialogue,
  );

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

  const typedTextRef = useRef<TypedTextHandle>(null);
  const typingFinishedAtRef = useRef(0);

  const myFlags = usePlayerFlags();
  const myVars = usePlayerVars();
  const uiLanguage = useUiLanguage(myFlags);
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

  const activeVersion = useMemo(
    () => versions.find((entry) => entry.isActive) ?? null,
    [versions],
  );

  const snapshot = useMemo<VnSnapshot | null>(() => {
    if (!activeVersion) {
      return null;
    }

    const snapshotRow = snapshots.find(
      (entry) => entry.checksum === activeVersion.checksum,
    );
    if (!snapshotRow) {
      return null;
    }

    return parseSnapshot(snapshotRow.payloadJson);
  }, [activeVersion, snapshots]);
  const contentReady =
    (versionsReady && snapshotsReady) || Boolean(activeVersion && snapshot);

  useEffect(() => {
    setTransitionState("idle");
    setError(null);
    setActiveAiThoughtContext(null);
    setActiveProvidenceThoughtContext(null);
    setActiveReactionKey(null);
  }, [selectedScenarioId]);

  const selectedScenario = useMemo<VnScenario | null>(() => {
    if (!snapshot || !selectedScenarioId) {
      return null;
    }
    return getScenarioById(snapshot, selectedScenarioId);
  }, [selectedScenarioId, snapshot]);

  const { session: mySession, isReady: sessionReady } =
    useVnSession(selectedScenarioId);
  const currentNode = useCurrentNode(
    snapshot,
    selectedScenario,
    mySession,
    sessionReady,
  );
  useEffect(() => {
    setVideoEnded(false);
  }, [currentNode?.id]);
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
  const playSkillCheckImpactSfx = useCallback((passed: boolean) => {
    void playVnSkillCheckSfx(passed, false);
  }, []);
  const markInteractionHandled = useCallback(() => {
    typingFinishedAtRef.current = Date.now();
  }, []);
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
    handleResolvedSkillCheck: enqueueResolvedSkillAiThought,
    performSkillCheck,
    recordChoice,
    setTransitionState,
    setStatusLine,
    setError,
    t,
  });

  const handleTypingChange = useCallback((typing: boolean) => {
    setIsTyping(typing);
    if (!typing) {
      typingFinishedAtRef.current = Date.now();
    }
  }, []);
  const handleProvidenceExpand = useCallback(async () => {
    if (!activeAiThoughtContext || !activeAiThoughtRequest) {
      return;
    }

    const payload = parseGenerateDialoguePayload(
      typeof activeAiThoughtRequest.payloadJson === "string"
        ? activeAiThoughtRequest.payloadJson
        : null,
    );
    if (!payload || payload.dialogueLayer !== "base") {
      return;
    }

    const providenceCost = Math.max(0, Math.trunc(payload.providenceCost ?? 0));
    if (providenceCost <= 0) {
      return;
    }

    if (
      activeProvidenceThoughtStatus === "pending" ||
      activeProvidenceThoughtStatus === "processing" ||
      activeProvidenceThoughtStatus === "completed"
    ) {
      return;
    }

    const context: ActiveAiThoughtContext = {
      ...activeAiThoughtContext,
      dialogueLayer: "providence",
    };

    setActiveProvidenceThoughtContext(context);

    try {
      await enqueueProvidenceDialogue({
        requestId: createRequestId(),
        scenarioId: payload.scenarioId,
        nodeId: payload.nodeId,
        checkId: payload.checkId,
        choiceId: payload.choiceId,
        providenceCost,
        payloadJson: JSON.stringify({
          ...payload,
          dialogueLayer: "providence",
          providenceCost,
        }),
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
          : "Providence dialogue request failed",
      );
    }
  }, [
    activeAiThoughtContext,
    activeAiThoughtRequest,
    activeProvidenceThoughtStatus,
    enqueueProvidenceDialogue,
  ]);
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
    hasExplicitChoices,
    hasAutoContinueChoice,
  } = useVnDisplayMapping({
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

  const effectiveNarrativeLayout = useMemo<VnNarrativeLayout>(() => {
    const layout = currentNode?.narrativeLayout;
    if (
      currentNode?.narrativePresentation === "letter" &&
      (layout === undefined || layout === "split")
    ) {
      return "letter_overlay";
    }

    return layout ?? "split";
  }, [currentNode?.narrativeLayout, currentNode?.narrativePresentation]);
  const hideImmersiveChrome =
    effectiveNarrativeLayout === "fullscreen" ||
    effectiveNarrativeLayout === "letter_overlay";

  useEffect(() => {
    postDebugLog(
      "VnScreen.tsx:node-layout",
      "Node and layout state",
      {
        selectedScenarioId: selectedScenarioId || null,
        nodeId: currentNode?.id ?? null,
        narrativeLayout: currentNode?.narrativeLayout ?? null,
        narrativePresentation: currentNode?.narrativePresentation ?? null,
        effectiveNarrativeLayout,
        hideImmersiveChrome,
        autoContinueChoiceId: autoContinueChoice?.id ?? null,
      },
      "H2",
    );
  }, [
    autoContinueChoice?.id,
    currentNode?.id,
    currentNode?.narrativeLayout,
    currentNode?.narrativePresentation,
    effectiveNarrativeLayout,
    hideImmersiveChrome,
    postDebugLog,
    selectedScenarioId,
  ]);

  const handleVideoEnded = useCallback(() => {
    if (videoEnded) {
      return;
    }

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
    postDebugLog(
      "VnScreen.tsx:handleVideoEnded",
      "Auto-continue fired from video end",
      {
        nodeId: currentNode?.id ?? null,
        autoContinueChoiceId: autoContinueChoice.id,
        selectedScenarioId: selectedScenarioId ?? null,
      },
      "H4",
    );
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
    transitionState,
    videoEnded,
    postDebugLog,
    currentNode?.id,
  ]);

  const handleSurfaceTap = useCallback(() => {
    postDebugLog(
      "VnScreen.tsx:handleSurfaceTap:entry-v2",
      "Surface tap branch entry",
      {
        nodeId: currentNode?.id ?? null,
        layout: effectiveNarrativeLayout,
        transitionState,
        isTyping,
        awaitingSkillChoice: Boolean(awaitingSkillChoice),
        pendingChoiceId: pendingChoiceId ?? null,
        autoContinueChoiceId: autoContinueChoice?.id ?? null,
        videoEnded,
      },
      "H6",
    );
    if (handleActiveResolveInteraction()) {
      postDebugLog(
        "VnScreen.tsx:handleSurfaceTap:resolve",
        "Tap consumed by active resolve interaction",
        { nodeId: currentNode?.id ?? null },
        "H6",
      );
      return;
    }

    if (transitionState === "handoff_failed") {
      return;
    }

    if (isTyping) {
      postDebugLog(
        "VnScreen.tsx:handleSurfaceTap:typing",
        "Tap finishes typing",
        { nodeId: currentNode?.id ?? null },
        "H6",
      );
      typedTextRef.current?.finish();
      return;
    }

    const elapsedSinceTypingFinish = Date.now() - typingFinishedAtRef.current;
    if (elapsedSinceTypingFinish < TAP_CONTINUE_COOLDOWN_MS) {
      postDebugLog(
        "VnScreen.tsx:handleSurfaceTap:cooldown",
        "Tap blocked by typing cooldown",
        { nodeId: currentNode?.id ?? null, elapsedSinceTypingFinish },
        "H6",
      );
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

    if (
      currentNode?.advanceOnVideoEnd &&
      currentNode.backgroundVideoUrl &&
      !videoEnded
    ) {
      postDebugLog(
        "VnScreen.tsx:handleSurfaceTap",
        "Surface tap blocked waiting for video end",
        {
          nodeId: currentNode.id,
          backgroundVideoUrl: currentNode.backgroundVideoUrl,
          videoEnded,
        },
        "H4",
      );
      return;
    }

    if (displayedScenarioCompleted) {
      void runCompletionTransition();
      return;
    }

    if (!autoContinueChoice || !currentNode) {
      postDebugLog(
        "VnScreen.tsx:handleSurfaceTap:no-auto",
        "No auto-continue choice on tap",
        {
          nodeId: currentNode?.id ?? null,
          hasCurrentNode: Boolean(currentNode),
          autoContinueChoiceId: autoContinueChoice?.id ?? null,
        },
        "H6",
      );
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
    postDebugLog(
      "VnScreen.tsx:handleSurfaceTap",
      "Surface tap auto-continue committed",
      {
        nodeId: currentNode.id,
        autoContinueChoiceId: autoContinueChoice.id,
        selectedScenarioId: selectedScenarioId ?? null,
        transitionState,
      },
      "H3",
    );
  }, [
    autoContinueChoice,
    awaitingSkillChoice,
    choiceEvaluationContext,
    currentNode,
    displayedScenarioCompleted,
    handleActiveResolveInteraction,
    handleChoiceClick,
    handleStartScenario,
    isTyping,
    myFlags,
    mySession,
    myVars,
    pendingChoiceId,
    runCompletionTransition,
    selectedScenarioId,
    transitionState,
    videoEnded,
    postDebugLog,
    effectiveNarrativeLayout,
  ]);

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
        sceneId={currentNode?.id}
        locationName={displayLocationName}
        characterName={speakerLabel === "Narrator" ? undefined : speakerLabel}
        narrativeText={narrativeText}
        backgroundImageUrl={resolvedBgUrl ?? undefined}
        backgroundVideoUrl={currentNode?.backgroundVideoUrl}
        backgroundVideoPosterUrl={currentNode?.backgroundVideoPosterUrl}
        backgroundVideoSoundPrompt={currentNode?.backgroundVideoSoundPrompt}
        narrativeLayout={effectiveNarrativeLayout}
        narrativePresentation={currentNode?.narrativePresentation}
        letterOverlayRevealDelayMs={currentNode?.letterOverlayRevealDelayMs}
        onTypingChange={handleTypingChange}
        isTyping={isTyping}
        typedTextRef={typedTextRef}
        onSurfaceTap={handleSurfaceTap}
        onVideoEnded={handleVideoEnded}
        choicesSlot={
          hideImmersiveChrome ? null : (
            <VnChoicesRenderer
              t={t}
              reactionCard={reactionCard}
              thoughtCard={thoughtCard}
              providenceThoughtCard={providenceThoughtCard}
              innerVoiceCards={innerVoiceCards}
              canExpandThoughtWithProvidence={canExpandThoughtWithProvidence}
              providenceCtaLabel={providenceCtaLabel}
              activeLensBadgeText={activeLensBadgeText}
              internalizedThoughtBadgeText={internalizedThoughtBadgeText}
              showOriginCards={showOriginCards}
              visibleChoices={visibleChoices}
              choiceDisplayItems={choiceDisplayItems}
              isInteractionLocked={isInteractionLocked}
              currentNodePresent={Boolean(currentNode)}
              displayedScenarioCompleted={displayedScenarioCompleted}
              canTriggerCompletion={canTriggerCompletion}
              completionRoute={completionRoute}
              completionTargetLabel={completionTargetLabel}
              hasAutoContinueChoice={hasAutoContinueChoice}
              sessionReady={sessionReady}
              onOriginPick={(choice) => {
                const isAvailable = isChoiceAvailable(
                  choice,
                  myFlags,
                  myVars,
                  choiceEvaluationContext,
                );
                void handleChoiceClick(choice, !isAvailable || !mySession);
              }}
              onChoiceClick={(choice) => void handleChoiceClick(choice, false)}
              onProvidenceExpand={() => void handleProvidenceExpand()}
              onCompletionTransition={() => void runCompletionTransition()}
              onRestartScene={() => void handleStartScenario()}
            />
          )
        }
      >
        <VnSkillCheckResolveOverlay
          state={activeSkillResolve}
          aiStatus={activeResolveAiStatus}
          aiThoughtText={activeResolveAiText}
          aiThoughtVoiceLabel={activeAiThoughtVoiceLabel}
          onFortuneSpendChange={handleFortuneSpendChange}
          onRoll={() => void confirmArmedSkillCheck()}
          canRoll={Boolean(
            armedSkillChoice &&
            activeSkillResolve?.phase === "arming" &&
            !awaitingSkillChoice,
          )}
          onInteract={handleActiveResolveInteraction}
        />
        {!activeSkillResolve ? (
          <VnPassiveCheckBanner items={passiveCheckItems} />
        ) : null}
        <button
          type="button"
          className={["vn-sfx-toggle", isSfxMuted ? "is-muted" : ""].join(" ")}
          aria-label={
            isSfxMuted ? t.unmuteSkillCheckAudio : t.muteSkillCheckAudio
          }
          onClick={(event) => {
            event.stopPropagation();
            setIsSfxMuted((previous) => !previous);
          }}
        >
          {isSfxMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          <span>SFX</span>
        </button>
      </VnNarrativePanel>

      {statusLine ? <p className="status-line success">{statusLine}</p> : null}
      {error ? <p className="status-line error">{error}</p> : null}
    </section>
  );
};
