import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useReducer, useTable } from "spacetimedb/react";
import { Volume2, VolumeX } from "lucide-react";
import { usePlayerFlags } from "../../../entities/player/hooks/usePlayerFlags";
import { usePlayerVars } from "../../../entities/player/hooks/usePlayerVars";
import { ENABLE_AI } from "../../../config";
import { getVnStrings } from "../../i18n/uiStrings";
import {
  AI_CHARACTER_REACTION_SOURCE_VN_SCENE,
  AI_DIALOGUE_SOURCE_SKILL_CHECK,
  AI_GENERATE_CHARACTER_REACTION_KIND,
  AI_GENERATE_DIALOGUE_KIND,
  trustToDisposition,
} from "../../ai/contracts";
import type { SceneResultEnvelope } from "../../ai/sceneResultEnvelope";
import { useVnDerivedState } from "../hooks/useVnDerivedState";
import { useVnDisplayMapping } from "../hooks/useVnDisplayMapping";
import { useCurrentNode } from "../hooks/useCurrentNode";
import { useVnSession } from "../hooks/useVnSession";
import { useUiLanguage } from "../../../shared/hooks/useUiLanguage";
import { reducers, tables } from "../../../shared/spacetime/bindings";
import { useIdentity } from "../../../shared/spacetime/useIdentity";
import {
  getNodeById,
  getScenarioById,
  isChoiceAvailable,
  isChoiceVisible,
  parseSnapshot,
} from "../vnContent";
import type { VnChoice, VnScenario, VnSnapshot } from "../types";
import { VnPassiveCheckBanner } from "./VnPassiveCheckBanner";
import { VnChoicesRenderer } from "./VnChoicesRenderer";
import { VnScreenHeader } from "./VnScreenHeader";
import {
  VnSkillCheckResolveOverlay,
  type FrozenSkillCheckPresentation,
  type VnSkillCheckResolveState,
} from "./VnSkillCheckResolveOverlay";
import type { TypedTextHandle } from "./TypedText";
import { resolveBackgroundUrl } from "./VnBackgroundResolver";
import {
  playVnSkillCheckSfx,
  readVnSfxMuted,
  writeVnSfxMuted,
} from "./vnSkillCheckAudio";
import { VnNarrativePanel } from "../../../widgets/vn-overlay/VnNarrativePanel";
import {
  ACTIVE_SKILL_ARMING_MS,
  ACTIVE_SKILL_IMPACT_MS,
  ACTIVE_SKILL_ROLLING_MS,
  AI_FOCUS_INTERLUDE_NODE_ID,
  aiRequestMatchesContext,
  buildAiThoughtKey,
  buildCheckKey,
  buildChoiceKey,
  checkResultMatches,
  createRequestId,
  formatVoiceLabel,
  formatSpeaker,
  hasOptionalValue,
  isAutoContinueChoice,
  isCompletionRouteBlockedError,
  nowMs,
  normalizeBody,
  normalizeNumeric,
  parseSkillCheckBreakdown,
  reactionRequestMatchesContext,
  resolveOutcomeGrade,
  sumBreakdownDelta,
  TAP_CONTINUE_COOLDOWN_MS,
  timestampMicros,
  unwrapOptionalString,
  waitMs,
} from "../vnScreenUtils";
import type {
  ActiveAiThoughtContext,
  ActiveReactionContext,
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

interface ActiveSkillSequence {
  startedAt: number;
  token: number;
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
  const [characterRevealRows, characterRevealReady] = useTable(
    tables.playerCharacterReveal,
  );
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
  const [pendingChoiceId, setPendingChoiceId] = useState<string | null>(null);
  const [awaitingSkillChoice, setAwaitingSkillChoice] =
    useState<AwaitingSkillChoice | null>(null);
  const [failedChoiceKeys, setFailedChoiceKeys] = useState<
    Record<string, true>
  >({});
  const [visitedChoiceKeys, setVisitedChoiceKeys] = useState<
    Record<string, true>
  >({});
  const [activeSkillResolve, setActiveSkillResolve] =
    useState<VnSkillCheckResolveState | null>(null);
  const [activeAiThoughtContext, setActiveAiThoughtContext] =
    useState<ActiveAiThoughtContext | null>(null);
  const [activeReactionKey, setActiveReactionKey] = useState<string | null>(
    null,
  );

  const typedTextRef = useRef<TypedTextHandle>(null);
  const passiveInFlightRef = useRef<Set<string>>(new Set());
  const autoStartAttemptedRef = useRef<Set<string>>(new Set());
  const autoStartInFlightRef = useRef<Set<string>>(new Set());
  const mapFallbackTriggeredRef = useRef<Set<string>>(new Set());
  const choiceSessionPointerRef = useRef<string | null>(null);
  const typingFinishedAtRef = useRef(0);
  const activeSkillTokenRef = useRef(0);
  const activeSkillSequenceRef = useRef<ActiveSkillSequence | null>(null);
  const activeSkillSkipTokenRef = useRef(0);
  const activeSkillSfxTokenRef = useRef(0);
  const enqueuedAiThoughtKeysRef = useRef<Set<string>>(new Set());
  const enqueuedReactionKeysRef = useRef<Set<string>>(new Set());

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
  }, [initialScenarioId, selectedScenarioId, snapshot]);

  useEffect(() => {
    if (!selectedScenarioId) {
      return;
    }
    onScenarioChange?.(selectedScenarioId);
  }, [onScenarioChange, selectedScenarioId]);

  useEffect(() => {
    setPendingChoiceId(null);
    setAwaitingSkillChoice(null);
    setFailedChoiceKeys({});
    setTransitionState("idle");
    setError(null);
    setActiveSkillResolve(null);
    setActiveAiThoughtContext(null);
    setActiveReactionKey(null);
    choiceSessionPointerRef.current = null;
    activeSkillTokenRef.current += 1;
    activeSkillSequenceRef.current = null;
    activeSkillSkipTokenRef.current = 0;
    activeSkillSfxTokenRef.current = 0;
    if (selectedScenarioId) {
      mapFallbackTriggeredRef.current.delete(selectedScenarioId);
    }
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
    characterRevealRows,
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
    activeSkillResolve,
    tSessionHydrating: t.sessionHydrating,
  });

  useEffect(() => {
    if (!activeAiThoughtContext || !currentNode) {
      return;
    }

    if (
      activeAiThoughtContext.scenarioId !== selectedScenarioId ||
      activeAiThoughtContext.nodeId !== currentNode.id
    ) {
      setActiveAiThoughtContext(null);
    }
  }, [activeAiThoughtContext, currentNode, selectedScenarioId]);

  useEffect(() => {
    if (
      transitionState !== "choice_pending" ||
      !choiceSessionPointerRef.current ||
      !currentSessionPointer
    ) {
      return;
    }

    if (choiceSessionPointerRef.current !== currentSessionPointer) {
      setTransitionState("idle");
      choiceSessionPointerRef.current = null;
      setPendingChoiceId(null);
    }
  }, [currentSessionPointer, transitionState]);

  useEffect(() => {
    if (!currentReactionContext) {
      setActiveReactionKey(null);
      return;
    }

    const hasExistingRequest = myReactionRequests.some((entry) =>
      reactionRequestMatchesContext(entry, currentReactionContext),
    );

    if (
      hasExistingRequest ||
      enqueuedReactionKeysRef.current.has(currentReactionContext.reactionKey)
    ) {
      setActiveReactionKey(currentReactionContext.reactionKey);
    } else {
      setActiveReactionKey(null);
    }
  }, [currentReactionContext, myReactionRequests]);

  const buildActiveAiThoughtContext = useCallback(
    (
      pending: AwaitingSkillChoice,
      matchedResult: SkillCheckResultLike,
      targetNodeId: string,
    ): ActiveAiThoughtContext => ({
      scenarioId: pending.scenarioId,
      nodeId: targetNodeId,
      checkId: pending.checkId,
      choiceId: pending.choiceId,
      voiceId: pending.voiceId,
      choiceText: pending.choiceText,
      resultCreatedAtMicros: timestampMicros(matchedResult.createdAt),
    }),
    [],
  );

  const enqueueResolvedSkillAiThought = useCallback(
    async (
      pending: AwaitingSkillChoice,
      matchedResult: SkillCheckResultLike,
    ) => {
      if (!ENABLE_AI) {
        return;
      }

      const nextNodeId = unwrapOptionalString(matchedResult.nextNodeId);
      const targetNodeId =
        nextNodeId === AI_FOCUS_INTERLUDE_NODE_ID
          ? AI_FOCUS_INTERLUDE_NODE_ID
          : pending.nodeId;
      const targetNode =
        snapshot && targetNodeId !== pending.nodeId
          ? getNodeById(snapshot, targetNodeId)
          : currentNode;
      const outcomeNode =
        snapshot && nextNodeId ? getNodeById(snapshot, nextNodeId) : null;
      const envelopeNode = outcomeNode ?? targetNode ?? currentNode;
      const breakdown = parseSkillCheckBreakdown(
        matchedResult.breakdownJson,
        pending.voiceId,
        matchedResult.voiceLevel,
      );
      const outcomeGrade = resolveOutcomeGrade(
        matchedResult.outcomeGrade,
        matchedResult.passed,
      );
      const margin =
        matchedResult.roll +
        sumBreakdownDelta(breakdown) -
        matchedResult.difficulty;
      const voicePresenceMode =
        envelopeNode?.voicePresenceMode ?? "text_variability";
      const activeSpeakers =
        envelopeNode?.activeSpeakers && envelopeNode.activeSpeakers.length > 0
          ? envelopeNode.activeSpeakers
          : [pending.voiceId];
      const context = buildActiveAiThoughtContext(
        pending,
        matchedResult,
        targetNodeId,
      );
      setActiveAiThoughtContext(context);
      const sceneResultEnvelope: SceneResultEnvelope = {
        source: "skill_check",
        scenarioId: pending.scenarioId,
        nodeId: envelopeNode?.id ?? targetNodeId,
        locationName: pending.frozen.locationName,
        timestamp: Number(context.resultCreatedAtMicros),
        playerState: {
          flags: Object.entries(myFlags)
            .filter(([, value]) => value)
            .map(([key]) => key)
            .sort(),
          activeQuests: questRows
            .map((row) => ({
              questId: row.questId,
              stage: normalizeNumeric(row.stage),
            }))
            .sort((left, right) => left.questId.localeCompare(right.questId)),
          voiceLevels: Object.fromEntries(
            Object.entries(myVars)
              .filter(
                ([key]) =>
                  key.startsWith("attr_") ||
                  key === pending.voiceId ||
                  activeSpeakers.includes(key),
              )
              .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey)),
          ),
        },
        checkResult: {
          checkId: pending.checkId,
          voiceId: pending.voiceId,
          outcomeGrade,
          margin,
          breakdown,
        },
        ensemble: {
          presenceMode: voicePresenceMode,
          activeSpeakers,
        },
      };

      const thoughtKey = buildAiThoughtKey(
        context.scenarioId,
        context.nodeId,
        context.checkId,
        context.choiceId,
        context.resultCreatedAtMicros,
      );
      if (enqueuedAiThoughtKeysRef.current.has(thoughtKey)) {
        return;
      }

      if (
        myAiRequests.some((entry) => aiRequestMatchesContext(entry, context))
      ) {
        enqueuedAiThoughtKeysRef.current.add(thoughtKey);
        return;
      }

      enqueuedAiThoughtKeysRef.current.add(thoughtKey);

      try {
        await enqueueAiRequest({
          requestId: createRequestId(),
          kind: AI_GENERATE_DIALOGUE_KIND,
          payloadJson: JSON.stringify({
            source: AI_DIALOGUE_SOURCE_SKILL_CHECK,
            scenarioId: pending.scenarioId,
            nodeId: targetNodeId,
            checkId: pending.checkId,
            choiceId: pending.choiceId,
            voiceId: pending.voiceId,
            choiceText: pending.choiceText,
            passed: matchedResult.passed,
            roll: matchedResult.roll,
            difficulty: matchedResult.difficulty,
            voiceLevel: matchedResult.voiceLevel,
            outcomeGrade,
            breakdown,
            margin,
            voicePresenceMode,
            activeSpeakers,
            locationName: pending.frozen.locationName,
            characterName: targetNode?.characterId
              ? formatSpeaker(targetNode.characterId, snapshot)
              : pending.frozen.characterName,
            narrativeText: targetNode
              ? normalizeBody(targetNode.body)
              : pending.frozen.narrativeText,
            sceneResultEnvelope,
          }),
        });
      } catch (caughtError) {
        console.error("AI skill-check enqueue failed:", caughtError);
        setActiveAiThoughtContext((current) =>
          current &&
          current.scenarioId === context.scenarioId &&
          current.nodeId === context.nodeId &&
          current.checkId === context.checkId &&
          current.choiceId === context.choiceId
            ? null
            : current,
        );
      }
    },
    [
      buildActiveAiThoughtContext,
      currentNode,
      enqueueAiRequest,
      myFlags,
      myAiRequests,
      myVars,
      questRows,
      snapshot,
    ],
  );

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
      navigateToMapOnce(t.handoffBlockedToMap);
    }
  }, [
    completionRoute,
    onNavigateTab,
    selectedScenarioId,
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

    if (!sessionReady) {
      setStatusLine(t.sessionHydrating);
    }
  }, [selectedScenarioId, sessionReady, t.sessionHydrating]);

  useEffect(() => {
    if (
      !contentReady ||
      !snapshot ||
      !activeVersion ||
      !selectedScenario ||
      !selectedScenarioId ||
      !sessionReady ||
      mySession
    ) {
      return;
    }

    const attemptKey = `${activeVersion.checksum}::${selectedScenarioId}`;
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
    activeVersion,
    contentReady,
    mySession,
    selectedScenario,
    selectedScenarioId,
    sessionReady,
    snapshot,
    startScenario,
    t.autoStarting,
    t.scenarioStarted,
    t.startBlockedByRoute,
  ]);

  useEffect(() => {
    if (!isScenarioCompleted) {
      return;
    }
    setStatusLine(t.sceneCompleted);
    void runCompletionTransition();
  }, [isScenarioCompleted, runCompletionTransition, t.sceneCompleted]);

  useEffect(() => {
    if (
      !mySession ||
      !currentNode ||
      !selectedScenarioId ||
      transitionState === "handoff_in_flight" ||
      transitionState === "handoff_failed"
    ) {
      return;
    }

    const passiveChecks = currentNode.passiveChecks ?? [];
    if (passiveChecks.length === 0) {
      return;
    }

    for (const check of passiveChecks) {
      const key = buildCheckKey(selectedScenarioId, currentNode.id, check.id);
      const alreadyExists = mySkillResults.some((entry) =>
        checkResultMatches(entry, selectedScenarioId, currentNode.id, check.id),
      );

      if (alreadyExists || passiveInFlightRef.current.has(key)) {
        continue;
      }

      passiveInFlightRef.current.add(key);

      void performSkillCheck({
        requestId: createRequestId(),
        scenarioId: selectedScenarioId,
        checkId: check.id,
      })
        .catch((caughtError) => {
          const message =
            caughtError instanceof Error
              ? caughtError.message
              : "Passive check failed";
          setError(message);
        })
        .finally(() => {
          passiveInFlightRef.current.delete(key);
        });
    }
  }, [
    currentNode,
    mySession,
    mySkillResults,
    performSkillCheck,
    selectedScenarioId,
    transitionState,
  ]);

  const applyChoiceCommit = useCallback(
    async (scenarioId: string, choiceId: string) => {
      setTransitionState("choice_pending");
      choiceSessionPointerRef.current = currentSessionPointer;

      try {
        await recordChoice({
          requestId: createRequestId(),
          scenarioId,
          choiceId,
        });
        setStatusLine(`${t.choiceApplied}: ${choiceId}`);
        const pendingPointer = choiceSessionPointerRef.current;
        setTimeout(() => {
          if (!pendingPointer) {
            return;
          }
          if (choiceSessionPointerRef.current !== pendingPointer) {
            return;
          }
          choiceSessionPointerRef.current = null;
          setTransitionState((previous) =>
            previous === "choice_pending" ? "idle" : previous,
          );
        }, 800);
      } catch (caughtError) {
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : "Choice action failed";
        setError(message);
        setTransitionState("idle");
        choiceSessionPointerRef.current = null;
      } finally {
        setPendingChoiceId(null);
      }
    },
    [currentSessionPointer, recordChoice, t.choiceApplied],
  );

  const createFrozenSkillCheckPresentation =
    useCallback((): FrozenSkillCheckPresentation => {
      const fallbackSpeakerLabel = formatSpeaker(
        currentNode?.characterId,
        snapshot,
      );

      return {
        locationName: selectedScenario?.title ?? t.unknownScenario,
        characterName:
          fallbackSpeakerLabel === "Narrator"
            ? undefined
            : fallbackSpeakerLabel,
        narrativeText: currentNode
          ? normalizeBody(currentNode.body)
          : sessionReady
            ? ""
            : t.sessionHydrating,
        backgroundImageUrl:
          resolveBackgroundUrl(
            currentNode?.backgroundUrl,
            selectedScenario?.defaultBackgroundUrl,
          ) ?? undefined,
        visibleChoices:
          currentNode?.choices.filter(
            (choice) =>
              !isAutoContinueChoice(choice) &&
              isChoiceVisible(choice, myFlags, myVars, choiceEvaluationContext),
          ) ?? [],
        autoContinueChoice:
          currentNode?.choices.find(
            (choice) =>
              isAutoContinueChoice(choice) &&
              isChoiceVisible(choice, myFlags, myVars, choiceEvaluationContext),
          ) ?? null,
        showOriginCards:
          selectedScenarioId === "sandbox_intro_pilot" &&
          currentNode?.id === "scene_backstory_select",
        isScenarioCompleted: Boolean(
          mySession &&
          currentNode &&
          currentNode.terminal &&
          hasOptionalValue(mySession.completedAt),
        ),
      };
    }, [
      choiceEvaluationContext,
      currentNode,
      myFlags,
      mySession,
      myVars,
      selectedScenario,
      selectedScenarioId,
      sessionReady,
      snapshot,
      t.sessionHydrating,
      t.unknownScenario,
    ]);

  const cancelActiveSkillResolve = useCallback(() => {
    activeSkillTokenRef.current += 1;
    activeSkillSequenceRef.current = null;
    activeSkillSkipTokenRef.current = 0;
    activeSkillSfxTokenRef.current = 0;
    setActiveSkillResolve(null);
  }, []);

  const playActiveSkillImpactSfx = useCallback(
    (passed: boolean, token: number) => {
      if (isSfxMuted || activeSkillSfxTokenRef.current === token) {
        return;
      }

      activeSkillSfxTokenRef.current = token;
      void playVnSkillCheckSfx(passed, false);
    },
    [isSfxMuted],
  );

  const buildResolvedSkillState = useCallback(
    (
      pending: AwaitingSkillChoice,
      matchedResult: SkillCheckResultLike,
      phase: VnSkillCheckResolveState["phase"],
    ): VnSkillCheckResolveState => ({
      scenarioId: pending.scenarioId,
      nodeId: pending.nodeId,
      checkId: pending.checkId,
      choiceId: pending.choiceId,
      choiceText: pending.choiceText,
      voiceId: pending.voiceId,
      voiceLabel: pending.voiceLabel,
      diceMode: pending.diceMode,
      chancePercent: pending.chancePercent,
      phase,
      passed: matchedResult.passed,
      roll: matchedResult.roll,
      voiceLevel: matchedResult.voiceLevel,
      difficulty: matchedResult.difficulty,
      nextNodeId: unwrapOptionalString(matchedResult.nextNodeId),
      frozen: pending.frozen,
    }),
    [],
  );

  const hydrateExistingSkillState = useCallback(
    (
      base: VnSkillCheckResolveState,
      matchedResult: SkillCheckResultLike,
      phase: VnSkillCheckResolveState["phase"],
    ): VnSkillCheckResolveState => ({
      ...base,
      phase,
      passed: matchedResult.passed,
      roll: matchedResult.roll,
      voiceLevel: matchedResult.voiceLevel,
      difficulty: matchedResult.difficulty,
      nextNodeId: unwrapOptionalString(matchedResult.nextNodeId),
    }),
    [],
  );

  const dismissActiveSkillResolve = useCallback(
    async (resolveState: VnSkillCheckResolveState) => {
      const failedChoiceKey = buildChoiceKey(
        resolveState.scenarioId,
        resolveState.nodeId,
        resolveState.choiceId,
      );

      typingFinishedAtRef.current = Date.now();
      cancelActiveSkillResolve();

      if (resolveState.nextNodeId) {
        setPendingChoiceId(null);
        setStatusLine(t.skillResolved);
        return;
      }

      if (!resolveState.passed) {
        setFailedChoiceKeys((previous) => ({
          ...previous,
          [failedChoiceKey]: true,
        }));
        setPendingChoiceId(null);
        setStatusLine(t.skillFailed);
        return;
      }

      await applyChoiceCommit(resolveState.scenarioId, resolveState.choiceId);
    },
    [
      applyChoiceCommit,
      cancelActiveSkillResolve,
      t.skillFailed,
      t.skillResolved,
    ],
  );

  const handleActiveResolveInteraction = useCallback((): boolean => {
    if (!activeSkillResolve) {
      return false;
    }

    const currentToken = activeSkillTokenRef.current;
    const matchedResult = mySkillResults.find((entry) =>
      checkResultMatches(
        entry,
        activeSkillResolve.scenarioId,
        activeSkillResolve.nodeId,
        activeSkillResolve.checkId,
      ),
    );

    if (activeSkillResolve.phase !== "result") {
      activeSkillSkipTokenRef.current = currentToken;

      if (matchedResult) {
        playActiveSkillImpactSfx(matchedResult.passed, currentToken);
        setActiveSkillResolve((previous) =>
          previous
            ? hydrateExistingSkillState(previous, matchedResult, "result")
            : previous,
        );
        activeSkillSequenceRef.current = null;
      }

      return true;
    }

    void dismissActiveSkillResolve(activeSkillResolve);
    return true;
  }, [
    activeSkillResolve,
    dismissActiveSkillResolve,
    hydrateExistingSkillState,
    mySkillResults,
    playActiveSkillImpactSfx,
  ]);

  const runActiveSkillResolveSequence = useCallback(
    async (
      pending: AwaitingSkillChoice,
      matchedResult: SkillCheckResultLike,
    ): Promise<void> => {
      const sequence =
        activeSkillSequenceRef.current ??
        ({
          startedAt: nowMs(),
          token: activeSkillTokenRef.current,
        } satisfies ActiveSkillSequence);
      const remainingArming = Math.max(
        0,
        ACTIVE_SKILL_ARMING_MS - (nowMs() - sequence.startedAt),
      );

      if (remainingArming > 0) {
        await waitMs(remainingArming);
      }
      if (activeSkillTokenRef.current !== sequence.token) {
        return;
      }

      if (activeSkillSkipTokenRef.current === sequence.token) {
        playActiveSkillImpactSfx(matchedResult.passed, sequence.token);
        activeSkillSequenceRef.current = null;
        setActiveSkillResolve(
          buildResolvedSkillState(pending, matchedResult, "result"),
        );
        return;
      }

      setActiveSkillResolve(
        buildResolvedSkillState(pending, matchedResult, "rolling"),
      );

      await waitMs(ACTIVE_SKILL_ROLLING_MS);
      if (activeSkillTokenRef.current !== sequence.token) {
        return;
      }

      if (activeSkillSkipTokenRef.current === sequence.token) {
        playActiveSkillImpactSfx(matchedResult.passed, sequence.token);
        activeSkillSequenceRef.current = null;
        setActiveSkillResolve(
          buildResolvedSkillState(pending, matchedResult, "result"),
        );
        return;
      }

      setActiveSkillResolve(
        buildResolvedSkillState(pending, matchedResult, "impact"),
      );
      playActiveSkillImpactSfx(matchedResult.passed, sequence.token);

      if (activeSkillSkipTokenRef.current === sequence.token) {
        activeSkillSequenceRef.current = null;
        setActiveSkillResolve(
          buildResolvedSkillState(pending, matchedResult, "result"),
        );
        return;
      }

      await waitMs(ACTIVE_SKILL_IMPACT_MS);
      if (activeSkillTokenRef.current !== sequence.token) {
        return;
      }

      activeSkillSequenceRef.current = null;
      setActiveSkillResolve(
        buildResolvedSkillState(pending, matchedResult, "result"),
      );
    },
    [buildResolvedSkillState, playActiveSkillImpactSfx],
  );

  useEffect(() => {
    if (!awaitingSkillChoice) {
      return;
    }

    const matchedResult = mySkillResults.find((entry) =>
      checkResultMatches(
        entry,
        awaitingSkillChoice.scenarioId,
        awaitingSkillChoice.nodeId,
        awaitingSkillChoice.checkId,
      ),
    );

    if (!matchedResult) {
      return;
    }

    void enqueueResolvedSkillAiThought(awaitingSkillChoice, matchedResult);
    setAwaitingSkillChoice(null);
    void runActiveSkillResolveSequence(awaitingSkillChoice, matchedResult);
  }, [
    awaitingSkillChoice,
    enqueueResolvedSkillAiThought,
    mySkillResults,
    runActiveSkillResolveSequence,
  ]);

  useEffect(() => {
    if (
      !ENABLE_AI ||
      !contentReady ||
      !sessionReady ||
      !npcStateReady ||
      !characterRevealReady ||
      !currentReactionContext
    ) {
      return;
    }

    const { characterId, nodeId, reactionKey, scenarioId } =
      currentReactionContext;
    if (enqueuedReactionKeysRef.current.has(reactionKey)) {
      return;
    }

    if (
      myReactionRequests.some((entry) =>
        reactionRequestMatchesContext(entry, currentReactionContext),
      )
    ) {
      enqueuedReactionKeysRef.current.add(reactionKey);
      setActiveReactionKey(reactionKey);
      return;
    }

    enqueuedReactionKeysRef.current.add(reactionKey);
    setActiveReactionKey(reactionKey);

    const visibleFacts = visibleFactsByCharacterId.get(characterId) ?? [];
    const trustScore = trustByNpcId.get(characterId) ?? 0;

    void enqueueAiRequest({
      requestId: createRequestId(),
      kind: AI_GENERATE_CHARACTER_REACTION_KIND,
      payloadJson: JSON.stringify({
        source: AI_CHARACTER_REACTION_SOURCE_VN_SCENE,
        characterId,
        scenarioId,
        nodeId,
        eventText: normalizeBody(currentNode?.body ?? ""),
        visibleFacts,
        relationshipState: {
          trust: trustScore,
          disposition: trustToDisposition(trustScore),
        },
      }),
    }).catch((caughtError) => {
      enqueuedReactionKeysRef.current.delete(reactionKey);
      setActiveReactionKey((current) =>
        current === reactionKey ? null : current,
      );
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Character reaction request failed",
      );
    });
  }, [
    characterRevealReady,
    contentReady,
    currentNode?.body,
    currentReactionContext,
    enqueueAiRequest,
    myReactionRequests,
    npcStateReady,
    sessionReady,
    trustByNpcId,
    visibleFactsByCharacterId,
  ]);

  const handleStartScenario = async () => {
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
  };

  const handleChoiceClick = async (choice: VnChoice, isLocked: boolean) => {
    if (
      !selectedScenarioId ||
      !currentNode ||
      !mySession ||
      isLocked ||
      pendingChoiceId ||
      awaitingSkillChoice ||
      activeSkillResolve ||
      transitionState !== "idle"
    ) {
      return;
    }

    if (isTyping) {
      typedTextRef.current?.finish();
      return;
    }

    setError(null);
    setStatusLine(t.syncing);
    setPendingChoiceId(choice.id);

    const choiceKey = buildChoiceKey(
      selectedScenarioId,
      currentNode.id,
      choice.id,
    );
    setVisitedChoiceKeys((previous) => ({ ...previous, [choiceKey]: true }));

    if (!choice.skillCheck) {
      await applyChoiceCommit(selectedScenarioId, choice.id);
      return;
    }

    const existingResult = mySkillResults.find((entry) =>
      checkResultMatches(
        entry,
        selectedScenarioId,
        currentNode.id,
        choice.skillCheck!.id,
      ),
    );

    if (existingResult) {
      const nextNodeId = unwrapOptionalString(existingResult.nextNodeId);
      if (nextNodeId) {
        setPendingChoiceId(null);
        setStatusLine(t.skillResolved);
        return;
      }

      if (!existingResult.passed) {
        setFailedChoiceKeys((previous) => ({
          ...previous,
          [choiceKey]: true,
        }));
        setPendingChoiceId(null);
        setStatusLine(t.skillFailed);
        return;
      }

      await applyChoiceCommit(selectedScenarioId, choice.id);
      return;
    }

    const chancePercent = getChoiceChancePercent(choice);
    const voiceLabel = formatVoiceLabel(choice.skillCheck.voiceId);
    const frozen = createFrozenSkillCheckPresentation();
    const nextActiveToken = activeSkillTokenRef.current + 1;
    activeSkillTokenRef.current = nextActiveToken;
    activeSkillSequenceRef.current = {
      startedAt: nowMs(),
      token: nextActiveToken,
    };
    activeSkillSkipTokenRef.current = 0;
    activeSkillSfxTokenRef.current = 0;
    setActiveSkillResolve({
      scenarioId: selectedScenarioId,
      nodeId: currentNode.id,
      checkId: choice.skillCheck.id,
      choiceId: choice.id,
      choiceText: choice.text,
      voiceId: choice.skillCheck.voiceId,
      voiceLabel,
      diceMode: currentDiceMode,
      chancePercent,
      phase: "arming",
      frozen,
    });

    setAwaitingSkillChoice({
      scenarioId: selectedScenarioId,
      nodeId: currentNode.id,
      choiceId: choice.id,
      checkId: choice.skillCheck.id,
      choiceText: choice.text,
      voiceId: choice.skillCheck.voiceId,
      voiceLabel,
      diceMode: currentDiceMode,
      chancePercent,
      frozen,
    });

    try {
      await performSkillCheck({
        requestId: createRequestId(),
        scenarioId: selectedScenarioId,
        checkId: choice.skillCheck.id,
      });
    } catch (caughtError) {
      setAwaitingSkillChoice(null);
      setPendingChoiceId(null);
      cancelActiveSkillResolve();
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Skill check request failed";
      setError(message);
    }
  };

  const handleTypingChange = useCallback((typing: boolean) => {
    setIsTyping(typing);
    if (!typing) {
      typingFinishedAtRef.current = Date.now();
    }
  }, []);
  const {
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
