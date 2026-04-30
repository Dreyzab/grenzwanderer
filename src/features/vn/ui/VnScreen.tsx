import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useReducer, useTable } from "spacetimedb/react";
import { Volume2, VolumeX } from "lucide-react";
import { usePlayerFlags } from "../../../entities/player/hooks/usePlayerFlags";
import { usePlayerVars } from "../../../entities/player/hooks/usePlayerVars";
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
import { useCurrentNode } from "../hooks/useCurrentNode";
import { useVnSession } from "../hooks/useVnSession";
import { LogChoicesRenderer } from "../log/LogChoicesRenderer";
import { useNarrativeLog } from "../log/useNarrativeLog";
import { useUiLanguage } from "../../../shared/hooks/useUiLanguage";
import { reducers, tables } from "../../../shared/spacetime/bindings";
import {
  getScenarioById,
  isChoiceAvailable,
  parseSnapshot,
} from "../vnContent";
import type {
  VnChoice,
  VnNarrativeLayout,
  VnScenario,
  VnSnapshot,
} from "../types";
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

export const VnScreen = ({
  onOpenDebug,
  initialScenarioId,
  onScenarioChange,
  onNavigateTab,
}: VnScreenProps) => {
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
  const { dictionary } = useI18n();
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

  const effectiveNarrativeLayout = useMemo<VnNarrativeLayout>(() => {
    const layout = currentNode?.narrativeLayout;
    if (
      currentNode?.narrativePresentation === "letter" &&
      (layout === undefined || layout === "split")
    ) {
      return "letter_overlay";
    }
    if (layout === "split" || layout === "thought_log") {
      return "log";
    }

    return layout ?? "split";
  }, [currentNode?.narrativeLayout, currentNode?.narrativePresentation]);

  const currentSceneGroupId =
    currentNode?.sceneGroupId ?? currentNode?.id ?? null;
  const narrativeLog = useNarrativeLog(
    currentNode,
    currentSceneGroupId,
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
    hasExplicitChoices,
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
  const logChoicesSlot = (
    <LogChoicesRenderer
      choiceDisplayItems={choiceDisplayItems}
      isInteractionLocked={isInteractionLocked}
      currentNodePresent={Boolean(currentNode)}
      displayedScenarioCompleted={displayedScenarioCompleted}
      canTriggerCompletion={canTriggerCompletion}
      completionRoute={completionRoute}
      completionTargetLabel={completionTargetLabel}
      hasAutoContinueChoice={hasAutoContinueChoice}
      sessionReady={sessionReady}
      labels={{
        terminalNoChoices: t.terminalNoChoices,
        openNextScene: t.openNextScene,
        continueScene: t.continueScene,
        restartScene: t.restartScene,
        sessionHydrating: t.sessionHydrating,
        noChoices: t.noChoices,
      }}
      onChoiceClick={(choice) => handleLoggedChoiceClick(choice, false)}
      onCompletionTransition={() => void runCompletionTransition()}
      onRestartScene={() => void handleStartScenario()}
    />
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
        />
      ) : null}

      <VnNarrativePanel
        t={t}
        sceneId={currentNode?.id}
        sceneGroupId={currentSceneGroupId}
        locationName={displayLocationName}
        characterName={speakerLabel === "Narrator" ? undefined : speakerLabel}
        narrativeText={narrativeText}
        backgroundImageUrl={resolvedBgUrl ?? undefined}
        backgroundVideoUrl={currentNode?.backgroundVideoUrl}
        backgroundVideoPosterUrl={currentNode?.backgroundVideoPosterUrl}
        backgroundVideoSoundPrompt={currentNode?.backgroundVideoSoundPrompt}
        narrativeLayout={effectiveNarrativeLayout}
        narrativePresentation={currentNode?.narrativePresentation}
        logState={narrativeLog.state}
        logSnapshot={snapshot}
        letterOverlayRevealDelayMs={currentNode?.letterOverlayRevealDelayMs}
        onTypingChange={handleTypingChange}
        isTyping={isTyping}
        typedTextRef={typedTextRef}
        onSurfaceTap={handleSurfaceTap}
        onVideoEnded={handleVideoEnded}
        videoPlaybackComplete={videoEnded}
        choicesSlot={
          effectiveNarrativeLayout === "log" ? (
            logChoicesSlot
          ) : hideImmersiveChrome ? null : (
            <VnChoicesRenderer
              t={t}
              uiLanguage={uiLanguage}
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
                handleLoggedChoiceClick(choice, !isAvailable || !mySession);
              }}
              onChoiceClick={(choice) => handleLoggedChoiceClick(choice, false)}
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
