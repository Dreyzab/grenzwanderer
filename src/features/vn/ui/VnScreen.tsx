import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useReducer, useTable } from "spacetimedb/react";
import { Volume2, VolumeX } from "lucide-react";
import { usePlayerFlags } from "../../../entities/player/hooks/usePlayerFlags";
import { usePlayerVars } from "../../../entities/player/hooks/usePlayerVars";
import { ENABLE_AI } from "../../../config";
import { getVnStrings } from "../../i18n/uiStrings";
import {
  AI_DIALOGUE_SOURCE_SKILL_CHECK,
  AI_GENERATE_DIALOGUE_KIND,
  matchesSkillCheckThought,
  parseGenerateDialoguePayload,
  parseGenerateDialogueResponse,
} from "../../ai/contracts";
import {
  calculateSkillCheckSuccessPercent,
  resolveSkillCheckDiceMode,
} from "../checkChance";
import { useCurrentNode } from "../hooks/useCurrentNode";
import { useVnSession } from "../hooks/useVnSession";
import { resolveCompletionRoute } from "../completionRoute";
import { useUiLanguage } from "../../../shared/hooks/useUiLanguage";
import { getNpcDisplayName } from "../../../shared/game/socialPresentation";
import { reducers, tables } from "../../../shared/spacetime/bindings";
import type {
  VnSession,
  VnSkillCheckResult,
} from "../../../shared/spacetime/bindings";
import { useIdentity } from "../../../shared/spacetime/useIdentity";
import {
  getNodeById,
  getScenarioById,
  isChoiceAvailable,
  isChoiceVisible,
  parseSnapshot,
  type VnChoiceEvaluationContext,
} from "../vnContent";
import { formatSkillCheckVoiceLabel } from "../skillCheckPalette";
import {
  formatVoiceEnsembleRoles,
  getVoiceProfile,
} from "../voiceRegistry";
import type { VnChoice, VnScenario, VnSnapshot } from "../types";
import { VnChoiceButton } from "./VnChoiceButton";
import {
  VnPassiveCheckBanner,
  type PassiveCheckDisplay,
} from "./VnPassiveCheckBanner";
import { OriginChoiceCards } from "./OriginChoiceCards";
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
  collectCaseIdsFromVnConditions,
  findActiveHypothesisLens,
} from "../../mindpalace/focusLens";
import { findPrimaryInternalizedThought } from "../../mindpalace/thoughtCabinet";

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
      | "dev"
      | "command"
      | "battle",
  ) => void;
}

interface AwaitingSkillChoice {
  scenarioId: string;
  nodeId: string;
  choiceId: string;
  checkId: string;
  choiceText: string;
  voiceId: string;
  voiceLabel: string;
  diceMode: "d20" | "d10";
  chancePercent?: number;
  frozen: FrozenSkillCheckPresentation;
}

interface ActiveSkillSequence {
  startedAt: number;
  token: number;
}

interface ActiveAiThoughtContext {
  scenarioId: string;
  nodeId: string;
  checkId: string;
  choiceId: string;
  voiceId: string;
  choiceText: string;
  resultCreatedAtMicros: bigint;
}

type SkillCheckAiStatus = "pending" | "processing" | "completed" | "failed";

type TransitionState =
  | "idle"
  | "autostarting"
  | "choice_pending"
  | "handoff_in_flight"
  | "handoff_failed";

const AUTO_CONTINUE_PREFIX = "AUTO_CONTINUE_";
const TAP_CONTINUE_COOLDOWN_MS = 220;
const ACTIVE_SKILL_ARMING_MS = 300;
const ACTIVE_SKILL_ROLLING_MS = 1200;
const ACTIVE_SKILL_IMPACT_MS = 500;
const AI_FOCUS_INTERLUDE_NODE_ID = "scene_case01_occult_bank_interlude";

const createRequestId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `req-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
};

const normalizeBody = (body: string): string =>
  body.replace(/\s+/g, " ").replace(/\|/g, " ").trim();

const formatSpeaker = (
  characterId?: string,
  snapshot?: VnSnapshot | null,
): string => {
  if (!characterId) {
    return "Narrator";
  }

  return getNpcDisplayName(snapshot?.socialCatalog, characterId);
};

const formatVoiceLabel = (voiceId: string): string =>
  formatSkillCheckVoiceLabel(voiceId);

const collectChoiceLensCaseIds = (choice: VnChoice): string[] => [
  ...collectCaseIdsFromVnConditions(choice.visibleIfAll),
  ...collectCaseIdsFromVnConditions(choice.visibleIfAny),
  ...collectCaseIdsFromVnConditions(choice.requireAll),
  ...collectCaseIdsFromVnConditions(choice.requireAny),
  ...collectCaseIdsFromVnConditions(choice.conditions),
];

const buildCheckKey = (
  scenarioId: string,
  nodeId: string,
  checkId: string,
): string => `${scenarioId}::${nodeId}::${checkId}`;

const buildChoiceKey = (
  scenarioId: string,
  nodeId: string,
  choiceId: string,
): string => `${scenarioId}::${nodeId}::${choiceId}`;

const buildAiThoughtKey = (
  scenarioId: string,
  nodeId: string,
  checkId: string,
  choiceId: string,
  resultCreatedAtMicros: bigint,
): string =>
  `${scenarioId}::${nodeId}::${checkId}::${choiceId}::${resultCreatedAtMicros.toString()}`;

const unwrapOptionalString = (value: unknown): string | null => {
  if (typeof value === "string") {
    return value;
  }
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value === "object" && value !== null && "tag" in value) {
    const tagged = value as { tag?: string; value?: unknown };
    if (tagged.tag === "some" && typeof tagged.value === "string") {
      return tagged.value;
    }
  }
  return null;
};

const hasOptionalValue = (value: unknown): boolean => {
  if (value === undefined || value === null) {
    return false;
  }
  if (typeof value === "object" && value !== null && "tag" in value) {
    const tagged = value as { tag?: string };
    return tagged.tag === "some";
  }
  return true;
};

const normalizeNumeric = (value: number | bigint | null | undefined): number =>
  typeof value === "bigint" ? Number(value) : (value ?? 0);

const timestampMicros = (value: unknown): bigint => {
  if (
    typeof value === "object" &&
    value !== null &&
    "microsSinceUnixEpoch" in value
  ) {
    const micros = (
      value as { microsSinceUnixEpoch?: number | bigint | string }
    ).microsSinceUnixEpoch;
    if (typeof micros === "bigint") {
      return micros;
    }
    if (typeof micros === "number" && Number.isFinite(micros)) {
      return BigInt(Math.trunc(micros));
    }
    if (typeof micros === "string" && micros.trim().length > 0) {
      return BigInt(micros);
    }
  }

  if (typeof value === "bigint") {
    return value;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return BigInt(Math.trunc(value));
  }
  if (typeof value === "string" && value.trim().length > 0) {
    return BigInt(value);
  }

  return 0n;
};

const isCompletionRouteBlockedError = (message: string): boolean =>
  message.includes("Scenario start is blocked by completion route rules");

const checkResultMatches = (
  result: VnSkillCheckResult,
  scenarioId: string,
  nodeId: string,
  checkId: string,
): boolean =>
  result.scenarioId === scenarioId &&
  result.nodeId === nodeId &&
  result.checkId === checkId;

const isAutoContinueChoice = (choice: VnChoice): boolean =>
  choice.id.startsWith(AUTO_CONTINUE_PREFIX);

const sessionPointer = (session: VnSession | null): string | null => {
  if (!session) {
    return null;
  }

  const updatedAt = session.updatedAt as
    | { microsSinceUnixEpoch?: unknown }
    | undefined;
  const updatedToken =
    updatedAt && "microsSinceUnixEpoch" in updatedAt
      ? String(updatedAt.microsSinceUnixEpoch)
      : String(session.updatedAt);

  return `${session.nodeId}::${updatedToken}`;
};

const waitMs = (time: number): Promise<void> =>
  new Promise((resolve) => {
    window.setTimeout(resolve, time);
  });

const nowMs = (): number =>
  typeof performance !== "undefined" ? performance.now() : Date.now();

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
  const choiceEvaluationContext = useMemo<VnChoiceEvaluationContext>(() => {
    const favorBalances = new Map<string, number>();
    for (const row of npcFavorRows) {
      if (row.playerId.toHexString() !== identityHex) {
        continue;
      }
      favorBalances.set(row.npcId, normalizeNumeric(row.balance));
    }

    const rumorStates = new Map<string, "registered" | "verified">();
    for (const row of rumorStateRows) {
      if (row.playerId.toHexString() !== identityHex) {
        continue;
      }
      rumorStates.set(row.rumorId, row.status as "registered" | "verified");
    }

    const agencyCareer =
      agencyCareerRows.find(
        (row) => row.playerId.toHexString() === identityHex,
      ) ?? null;

    return {
      favorBalances,
      agencyStanding: normalizeNumeric(agencyCareer?.standingScore),
      rumorStates,
      careerRankId: agencyCareer?.rankId ?? null,
      careerRankOrder: new Map<string, number>(
        (snapshot?.socialCatalog?.careerRanks ?? []).map((rank) => [
          rank.id,
          rank.order,
        ]),
      ),
    };
  }, [
    agencyCareerRows,
    identityHex,
    npcFavorRows,
    rumorStateRows,
    snapshot?.socialCatalog?.careerRanks,
  ]);
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

  const mySessions = useMemo(
    () =>
      sessions.filter((entry) => entry.playerId.toHexString() === identityHex),
    [identityHex, sessions],
  );

  const { session: mySession, isReady: sessionReady } =
    useVnSession(selectedScenarioId);
  const currentNode = useCurrentNode(
    snapshot,
    selectedScenario,
    mySession,
    sessionReady,
  );

  const currentSessionPointer = useMemo(
    () => sessionPointer(mySession),
    [mySession],
  );

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

  const mySkillResults = useMemo(
    () =>
      skillResults.filter(
        (entry) =>
          entry.playerId.toHexString() === identityHex &&
          entry.scenarioId === selectedScenarioId,
      ),
    [identityHex, selectedScenarioId, skillResults],
  );

  const myAiRequests = useMemo(
    () =>
      aiRequests
        .filter((entry) => entry.playerId.toHexString() === identityHex)
        .sort((left, right) =>
          timestampMicros(right.updatedAt) > timestampMicros(left.updatedAt)
            ? 1
            : -1,
        ),
    [aiRequests, identityHex],
  );

  const currentDiceMode = useMemo(
    () =>
      snapshot && selectedScenarioId
        ? resolveSkillCheckDiceMode(snapshot, selectedScenarioId)
        : "d20",
    [selectedScenarioId, snapshot],
  );

  const buildActiveAiThoughtContext = useCallback(
    (
      pending: AwaitingSkillChoice,
      matchedResult: VnSkillCheckResult,
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

  const aiRequestMatchesContext = useCallback(
    (entry: (typeof aiRequests)[number], context: ActiveAiThoughtContext) => {
      const payload = parseGenerateDialoguePayload(entry.payloadJson);
      return (
        matchesSkillCheckThought(
          payload,
          context.scenarioId,
          context.nodeId,
          context.checkId,
          context.choiceId,
        ) && timestampMicros(entry.createdAt) >= context.resultCreatedAtMicros
      );
    },
    [aiRequests],
  );

  const enqueueResolvedSkillAiThought = useCallback(
    async (pending: AwaitingSkillChoice, matchedResult: VnSkillCheckResult) => {
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
      const context = buildActiveAiThoughtContext(
        pending,
        matchedResult,
        targetNodeId,
      );
      setActiveAiThoughtContext(context);

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

      if (myAiRequests.some((entry) => aiRequestMatchesContext(entry, context))) {
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
            locationName: pending.frozen.locationName,
            characterName:
              targetNode?.characterId
                ? formatSpeaker(targetNode.characterId, snapshot)
                : pending.frozen.characterName,
            narrativeText: targetNode
              ? normalizeBody(targetNode.body)
              : pending.frozen.narrativeText,
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
      aiRequestMatchesContext,
      buildActiveAiThoughtContext,
      currentNode,
      enqueueAiRequest,
      myAiRequests,
      snapshot,
    ],
  );

  const getChoiceChancePercent = useCallback(
    (choice: VnChoice): number | undefined => {
      if (!choice.skillCheck?.showChancePercent) {
        return undefined;
      }

      return calculateSkillCheckSuccessPercent({
        diceMode: currentDiceMode,
        difficulty: choice.skillCheck.difficulty,
        voiceLevel: myVars[choice.skillCheck.voiceId] ?? 0,
      });
    },
    [currentDiceMode, myVars],
  );

  const completionRoute = useMemo(() => {
    if (!sessionsReady) {
      return null;
    }
    return resolveCompletionRoute(selectedScenario, myFlags, mySessions);
  }, [myFlags, mySessions, selectedScenario, sessionsReady]);

  const isScenarioCompleted = Boolean(
    mySession &&
    currentNode &&
    currentNode.terminal &&
    hasOptionalValue(mySession.completedAt),
  );

  const completionTargetLabel = useMemo(() => {
    if (!snapshot || !completionRoute) {
      return null;
    }
    const target = getScenarioById(snapshot, completionRoute.nextScenarioId);
    return target?.title ?? completionRoute.nextScenarioId;
  }, [completionRoute, snapshot]);

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

  const passiveCheckItems = useMemo<PassiveCheckDisplay[]>(() => {
    if (!currentNode) {
      return [];
    }

    const items: PassiveCheckDisplay[] = [];
    for (const check of currentNode.passiveChecks ?? []) {
      const result = mySkillResults.find((entry) =>
        checkResultMatches(entry, selectedScenarioId, currentNode.id, check.id),
      );

      if (!result) {
        continue;
      }

      const voiceProfile = getVoiceProfile(check.voiceId);
      items.push({
        checkId: check.id,
        voiceLabel: formatVoiceLabel(check.voiceId),
        personaLabel: voiceProfile.personaLabel,
        interventionSummary: formatVoiceEnsembleRoles(
          voiceProfile.ensembleRoles,
        ),
        passed: result.passed,
        difficulty: result.difficulty,
        roll: result.roll,
        voiceLevel: result.voiceLevel,
      });
    }

    return items;
  }, [currentNode, mySkillResults, selectedScenarioId]);

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
      matchedResult: VnSkillCheckResult,
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
      matchedResult: VnSkillCheckResult,
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
      matchedResult: VnSkillCheckResult,
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

  const currentVisibleChoices = useMemo(
    () =>
      currentNode?.choices.filter(
        (choice) =>
          !isAutoContinueChoice(choice) &&
          isChoiceVisible(choice, myFlags, myVars, choiceEvaluationContext),
      ) ?? [],
    [choiceEvaluationContext, currentNode, myFlags, myVars],
  );
  const currentAutoContinueChoice = useMemo(
    () =>
      currentNode?.choices.find(
        (choice) =>
          isAutoContinueChoice(choice) &&
          isChoiceVisible(choice, myFlags, myVars, choiceEvaluationContext),
      ) ?? null,
    [choiceEvaluationContext, currentNode, myFlags, myVars],
  );
  const hasPendingPassiveChecks = useMemo(() => {
    if (!selectedScenarioId || !currentNode) {
      return false;
    }
    const checks = currentNode.passiveChecks ?? [];
    if (checks.length === 0) {
      return false;
    }
    return checks.some(
      (check) =>
        !mySkillResults.some((entry) =>
          checkResultMatches(
            entry,
            selectedScenarioId,
            currentNode.id,
            check.id,
          ),
        ),
    );
  }, [currentNode, mySkillResults, selectedScenarioId]);
  const currentNarrativeText = useMemo(() => {
    if (!currentNode) {
      return sessionReady ? "" : t.sessionHydrating;
    }
    return normalizeBody(currentNode.body);
  }, [currentNode, sessionReady, t.sessionHydrating]);
  const currentResolvedBgUrl = useMemo(
    () =>
      resolveBackgroundUrl(
        currentNode?.backgroundUrl,
        selectedScenario?.defaultBackgroundUrl,
      ),
    [currentNode, selectedScenario],
  );
  const currentSpeakerLabel = useMemo(
    () => formatSpeaker(currentNode?.characterId, snapshot),
    [currentNode?.characterId, snapshot],
  );
  const currentShowOriginCards =
    selectedScenarioId === "sandbox_intro_pilot" &&
    currentNode?.id === "scene_backstory_select";
  const activeLensCaseIds = useMemo(() => {
    const caseIds = new Set<string>();
    for (const caseId of collectCaseIdsFromVnConditions(
      currentNode?.preconditions,
    )) {
      caseIds.add(caseId);
    }
    for (const choice of currentNode?.choices ?? []) {
      for (const caseId of collectChoiceLensCaseIds(choice)) {
        caseIds.add(caseId);
      }
    }
    return [...caseIds];
  }, [currentNode]);
  const activeLens = useMemo(
    () => findActiveHypothesisLens(snapshot, myFlags, activeLensCaseIds),
    [activeLensCaseIds, myFlags, snapshot],
  );
  const internalizedThought = useMemo(
    () => findPrimaryInternalizedThought(snapshot, myFlags, myVars),
    [myFlags, myVars, snapshot],
  );
  const activeAiThoughtRequest = useMemo(() => {
    if (!activeAiThoughtContext) {
      return null;
    }

    return (
      myAiRequests.find((entry) =>
        aiRequestMatchesContext(entry, activeAiThoughtContext),
      ) ?? null
    );
  }, [activeAiThoughtContext, aiRequestMatchesContext, myAiRequests]);
  const activeAiThoughtResponse = useMemo(
    () =>
      activeAiThoughtRequest
        ? parseGenerateDialogueResponse(activeAiThoughtRequest.responseJson)
        : null,
    [activeAiThoughtRequest],
  );
  const activeAiThoughtVoiceLabel = useMemo(() => {
    if (activeAiThoughtResponse) {
      return getVoiceProfile(activeAiThoughtResponse.canonicalVoiceId).label;
    }
    if (activeAiThoughtContext) {
      return formatVoiceLabel(activeAiThoughtContext.voiceId);
    }
    return null;
  }, [activeAiThoughtContext, activeAiThoughtResponse]);
  const activeAiThoughtStatus = useMemo<SkillCheckAiStatus | null>(() => {
    if (!ENABLE_AI || !activeAiThoughtContext) {
      return null;
    }
    const status = activeAiThoughtRequest?.status;
    return status === "processing" ||
      status === "completed" ||
      status === "failed"
      ? status
      : "pending";
  }, [activeAiThoughtContext, activeAiThoughtRequest?.status]);
  const showInlineAiThoughtCard =
    !activeSkillResolve &&
    Boolean(activeAiThoughtContext) &&
    Boolean(currentNode) &&
    activeAiThoughtContext?.nodeId === currentNode?.id &&
    activeAiThoughtStatus !== null &&
    activeAiThoughtStatus !== "failed";

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
    activeResolveAiStatus === "completed" ? activeAiThoughtResponse?.text : null;

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
  const hasExplicitChoices = visibleChoices.length > 0;
  const hasAutoContinueChoice = Boolean(autoContinueChoice);

  return (
    <section className="vn-screen-root">
      <header className="vn-screen-toolbar card compact">
        <label className="field">
          {t.scenario}
          <select
            value={selectedScenarioId}
            onChange={(event) => setSelectedScenarioId(event.target.value)}
          >
            {snapshot.scenarios.map((scenario) => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.title}
              </option>
            ))}
          </select>
        </label>

        <div className="button-row">
          <button
            type="button"
            onClick={handleStartScenario}
            disabled={!selectedScenarioId || isInteractionLocked}
          >
            {t.startScenario}
          </button>
          {onOpenDebug ? (
            <button type="button" onClick={onOpenDebug}>
              {t.openDebug}
            </button>
          ) : null}
        </div>
      </header>

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
          <div className="flex flex-col gap-3 px-6 py-8 w-full max-w-[480px] mx-auto">
            {showInlineAiThoughtCard ? (
              <div className="rounded-[1.4rem] border border-amber-200/20 bg-black/40 px-4 py-4 text-left shadow-[0_18px_44px_rgba(0,0,0,0.32)] backdrop-blur-md">
                <p className="text-[10px] uppercase tracking-[0.18em] text-amber-200/70">
                  Inner Parliament
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.14em] text-amber-100/85">
                  {activeAiThoughtStatus === "completed"
                    ? activeAiThoughtVoiceLabel
                    : "Thinking"}
                </p>
                <p className="mt-2 text-sm leading-6 text-stone-100/88">
                  {activeAiThoughtStatus === "completed" &&
                  activeAiThoughtResponse?.text
                    ? activeAiThoughtResponse.text
                    : `${activeAiThoughtVoiceLabel ?? "Inner Parliament"} is turning the result over...`}
                </p>
              </div>
            ) : null}
            {activeLens ? (
              <div className="rounded-full border border-sky-200/20 bg-sky-400/10 px-4 py-2 text-center text-[11px] uppercase tracking-[0.16em] text-sky-100">
                Active Lens: {activeLens.hypothesisText}
              </div>
            ) : null}
            {internalizedThought ? (
              <div className="rounded-full border border-amber-200/20 bg-amber-400/10 px-4 py-2 text-center text-[11px] uppercase tracking-[0.16em] text-amber-100">
                Internalized Thought: {internalizedThought.promptText}
              </div>
            ) : null}
            {showOriginCards && currentNode ? (
              <OriginChoiceCards
                choices={visibleChoices}
                disabled={isInteractionLocked}
                onPick={(choice) => {
                  const isAvailable = isChoiceAvailable(
                    choice,
                    myFlags,
                    myVars,
                    choiceEvaluationContext,
                  );
                  void handleChoiceClick(choice, !isAvailable || !mySession);
                }}
              />
            ) : !showOriginCards && hasExplicitChoices && currentNode ? (
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
                const chancePercent = getChoiceChancePercent(choice);
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
                return (
                  <VnChoiceButton
                    key={choice.id}
                    choice={choice}
                    index={index}
                    chancePercent={chancePercent}
                    skillCheckState={skillCheckState}
                    isVisited={Boolean(visitedChoiceKeys[choiceKey])}
                    isLocked={!isAvailable || !mySession}
                    isPending={pendingChoiceId === choice.id}
                    hasFailedCheck={Boolean(failedChoiceKeys[choiceKey])}
                    disabled={isInteractionLocked}
                    onClick={() =>
                      handleChoiceClick(choice, !isAvailable || !mySession)
                    }
                  />
                );
              })
            ) : displayedScenarioCompleted ? (
              <div className="flex flex-col gap-3">
                <p className="opacity-70 italic text-sm text-center">
                  {t.terminalNoChoices}
                </p>
                {completionRoute && canTriggerCompletion ? (
                  <button
                    type="button"
                    className="px-4 py-3 rounded-md border border-amber-600/60 bg-amber-800/20 text-amber-100 hover:bg-amber-700/30 transition-colors"
                    onClick={() => void runCompletionTransition()}
                    disabled={isInteractionLocked}
                  >
                    {completionRoute.hasExistingSession
                      ? t.openNextScene
                      : t.continueScene}
                    {completionTargetLabel ? `: ${completionTargetLabel}` : ""}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="px-4 py-3 rounded-md border border-white/20 bg-black/20 text-white hover:bg-black/35 transition-colors"
                  onClick={() => void handleStartScenario()}
                  disabled={isInteractionLocked}
                >
                  {t.restartScene}
                </button>
              </div>
            ) : !showOriginCards &&
              (!sessionReady || !currentNode || !hasAutoContinueChoice) ? (
              <p className="opacity-60 italic text-sm text-center">
                {!sessionReady || !currentNode
                  ? t.sessionHydrating
                  : t.noChoices}
              </p>
            ) : null}
          </div>
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
            isSfxMuted ? "Unmute skill check audio" : "Mute skill check audio"
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
