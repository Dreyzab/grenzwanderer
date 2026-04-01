import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useReducer, useTable } from "spacetimedb/react";
import { Volume2, VolumeX } from "lucide-react";
import { usePlayerFlags } from "../../../entities/player/hooks/usePlayerFlags";
import { usePlayerVars } from "../../../entities/player/hooks/usePlayerVars";
import { ENABLE_AI } from "../../../config";
import { getVnStrings } from "../../i18n/uiStrings";
import { useVnAiLogic } from "../hooks/useVnAiLogic";
import { useVnDerivedState } from "../hooks/useVnDerivedState";
import { useVnDisplayMapping } from "../hooks/useVnDisplayMapping";
import { useVnSkillChecks } from "../hooks/useVnSkillChecks";
import { useVnTransitions } from "../hooks/useVnTransitions";
import { useCurrentNode } from "../hooks/useCurrentNode";
import { useVnSession } from "../hooks/useVnSession";
import { useUiLanguage } from "../../../shared/hooks/useUiLanguage";
import { reducers, tables } from "../../../shared/spacetime/bindings";
import { useIdentity } from "../../../shared/spacetime/useIdentity";
import {
  getScenarioById,
  isChoiceAvailable,
  parseSnapshot,
} from "../vnContent";
import type { VnChoice, VnScenario, VnSnapshot } from "../types";
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
  const { identityHex } = useIdentity();

  const [versions, versionsReady] = useTable(tables.contentVersion);
  const [snapshots, snapshotsReady] = useTable(tables.contentSnapshot);
  const [sessions, sessionsReady] = useTable(tables.vnSession);
  const [skillResults] = useTable(tables.vnSkillCheckResult);
  const [aiRequests] = useTable(tables.aiRequest);
  const [questRows] = useTable(tables.playerQuest);
  const [npcStateRows, npcStateReady] = useTable(tables.playerNpcState);
  const [npcFavorRows] = useTable(tables.playerNpcFavor);
  const [agencyCareerRows] = useTable(tables.playerAgencyCareer);
  const [rumorStateRows] = useTable(tables.playerRumorState);

  const startScenario = useReducer(reducers.startScenario);
  const recordChoice = useReducer(reducers.recordChoice);
  const performSkillCheck = useReducer(reducers.performSkillCheck);
  const enqueueAiRequest = useReducer(reducers.enqueueAiRequest);

  const [selectedScenarioId, setSelectedScenarioId] = useState("");
  const [transitionState, setTransitionState] =
    useState<TransitionState>("idle");
  const [statusLine, setStatusLine] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isSfxMuted, setIsSfxMuted] = useState(() => readVnSfxMuted());
  const [activeAiThoughtContext, setActiveAiThoughtContext] =
    useState<ActiveAiThoughtContext | null>(null);
  const [activeReactionKey, setActiveReactionKey] = useState<string | null>(
    null,
  );

  const typedTextRef = useRef<TypedTextHandle>(null);
  const typingFinishedAtRef = useRef(0);

  const myFlags = usePlayerFlags();
  const myVars = usePlayerVars();
  const uiLanguage = useUiLanguage(myFlags);
  const t = useMemo(() => getVnStrings(uiLanguage), [uiLanguage]);

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
    activeReactionRequest,
    activeAiThoughtResponse,
    activeReactionResponse,
    activeAiThoughtVoiceLabel,
    activeAiThoughtStatus,
    activeReactionStatus,
    getChoiceChancePercent,
  } = useVnDerivedState({
    identityHex,
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
    activeReactionKey,
    tSessionHydrating: t.sessionHydrating,
  });
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
    awaitingSkillChoice,
    failedChoiceKeys,
    visitedChoiceKeys,
    activeSkillResolve,
    handleChoiceClick,
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
  const {
    reactionCard,
    thoughtCard,
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
    currentResolvedBgUrl,
    currentSpeakerLabel,
    currentShowOriginCards,
    isScenarioCompleted,
    activeLens,
    internalizedThought,
    activeSkillResolve,
    activeAiThoughtContext,
    activeReactionContext: currentReactionContext,
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
  });

  const handleSurfaceTap = () => {
    if (handleActiveResolveInteraction()) {
      return;
    }

    if (transitionState === "handoff_failed") {
      return;
    }

    if (isTyping) {
      typedTextRef.current?.finish();
      return;
    }

    const elapsedSinceTypingFinish = Date.now() - typingFinishedAtRef.current;
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
  };

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
      <VnScreenHeader
        t={t}
        selectedScenarioId={selectedScenarioId}
        scenarios={snapshot.scenarios}
        isInteractionLocked={isInteractionLocked}
        onScenarioChange={setSelectedScenarioId}
        onStartScenario={handleStartScenario}
        onOpenDebug={onOpenDebug}
      />

      <VnNarrativePanel
        locationName={displayLocationName}
        characterName={speakerLabel === "Narrator" ? undefined : speakerLabel}
        narrativeText={narrativeText}
        backgroundImageUrl={resolvedBgUrl ?? undefined}
        onTypingChange={handleTypingChange}
        isTyping={isTyping}
        typedTextRef={typedTextRef}
        onSurfaceTap={handleSurfaceTap}
        choicesSlot={
          <VnChoicesRenderer
            t={t}
            reactionCard={reactionCard}
            thoughtCard={thoughtCard}
            innerVoiceCards={innerVoiceCards}
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
            onCompletionTransition={() => void runCompletionTransition()}
            onRestartScene={() => void handleStartScenario()}
          />
        }
      >
        <VnSkillCheckResolveOverlay
          state={activeSkillResolve}
          aiStatus={activeResolveAiStatus}
          aiThoughtText={activeResolveAiText}
          aiThoughtVoiceLabel={activeAiThoughtVoiceLabel}
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
