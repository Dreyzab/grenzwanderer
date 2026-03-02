import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useReducer, useTable } from "spacetimedb/react";
import { usePlayerFlags } from "../../../entities/player/hooks/usePlayerFlags";
import { usePlayerVars } from "../../../entities/player/hooks/usePlayerVars";
import { getVnStrings } from "../../i18n/uiStrings";
import { useCurrentNode } from "../hooks/useCurrentNode";
import { useVnSession } from "../hooks/useVnSession";
import { resolveCompletionRoute } from "../completionRoute";
import { useUiLanguage } from "../../../shared/hooks/useUiLanguage";
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
  parseSnapshot,
} from "../vnContent";
import type { VnChoice, VnScenario, VnSkillCheck, VnSnapshot } from "../types";
import { VnChoiceButton } from "./VnChoiceButton";
import {
  VnPassiveCheckBanner,
  type PassiveCheckDisplay,
} from "./VnPassiveCheckBanner";
import { OriginChoiceCards } from "./OriginChoiceCards";
import {
  VnSkillCheckToast,
  type VnSkillCheckToastData,
} from "./VnSkillCheckToast";
import type { TypedTextHandle } from "./TypedText";
import { resolveBackgroundUrl } from "./VnBackgroundResolver";
import { VnNarrativePanel } from "../../../widgets/vn-overlay/VnNarrativePanel";

interface VnScreenProps {
  onOpenDebug?: () => void;
  initialScenarioId?: string;
  onScenarioChange?: (scenarioId: string) => void;
  onNavigateTab?: (
    tab: "home" | "vn" | "character" | "map" | "mind_palace" | "dev",
  ) => void;
}

interface AwaitingSkillChoice {
  scenarioId: string;
  nodeId: string;
  choiceId: string;
  checkId: string;
}

type TransitionState =
  | "idle"
  | "autostarting"
  | "choice_pending"
  | "handoff_in_flight"
  | "handoff_failed";

const AUTO_CONTINUE_PREFIX = "AUTO_CONTINUE_";
const TAP_CONTINUE_COOLDOWN_MS = 220;

const createRequestId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `req-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
};

const normalizeBody = (body: string): string =>
  body.replace(/\s+/g, " ").replace(/\|/g, " ").trim();

const formatSpeaker = (characterId?: string): string => {
  if (!characterId) {
    return "Narrator";
  }

  return characterId
    .replace(/^npc_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (entry) => entry.toUpperCase());
};

const formatVoiceLabel = (voiceId: string): string =>
  voiceId
    .replace(/^attr_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (entry) => entry.toUpperCase());

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

  const startScenario = useReducer(reducers.startScenario);
  const recordChoice = useReducer(reducers.recordChoice);
  const performSkillCheck = useReducer(reducers.performSkillCheck);

  const [selectedScenarioId, setSelectedScenarioId] = useState("");
  const [transitionState, setTransitionState] =
    useState<TransitionState>("idle");
  const [statusLine, setStatusLine] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [pendingChoiceId, setPendingChoiceId] = useState<string | null>(null);
  const [awaitingSkillChoice, setAwaitingSkillChoice] =
    useState<AwaitingSkillChoice | null>(null);
  const [failedChoiceKeys, setFailedChoiceKeys] = useState<
    Record<string, true>
  >({});
  const [visitedChoiceKeys, setVisitedChoiceKeys] = useState<
    Record<string, true>
  >({});
  const [toastQueue, setToastQueue] = useState<VnSkillCheckToastData[]>([]);
  const [activeToast, setActiveToast] = useState<VnSkillCheckToastData | null>(
    null,
  );

  const typedTextRef = useRef<TypedTextHandle>(null);
  const seenSkillResultKeysRef = useRef<Set<string>>(new Set());
  const primedScenarioRef = useRef<string | null>(null);
  const passiveInFlightRef = useRef<Set<string>>(new Set());
  const autoStartAttemptedRef = useRef<Set<string>>(new Set());
  const autoStartInFlightRef = useRef<Set<string>>(new Set());
  const mapFallbackTriggeredRef = useRef<Set<string>>(new Set());
  const choiceSessionPointerRef = useRef<string | null>(null);
  const typingFinishedAtRef = useRef(0);

  const myFlags = usePlayerFlags();
  const myVars = usePlayerVars();
  const uiLanguage = useUiLanguage(myFlags);
  const t = useMemo(() => getVnStrings(uiLanguage), [uiLanguage]);

  const contentReady = versionsReady && snapshotsReady;
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
    choiceSessionPointerRef.current = null;
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

  const scenarioCheckLookup = useMemo(() => {
    const lookup = new Map<string, VnSkillCheck>();

    if (!snapshot || !selectedScenario) {
      return lookup;
    }

    for (const nodeId of selectedScenario.nodeIds) {
      const node = getNodeById(snapshot, nodeId);
      if (!node) {
        continue;
      }

      for (const check of node.passiveChecks ?? []) {
        lookup.set(`${node.id}::${check.id}`, check);
      }

      for (const choice of node.choices) {
        if (choice.skillCheck) {
          lookup.set(`${node.id}::${choice.skillCheck.id}`, choice.skillCheck);
        }
      }
    }

    return lookup;
  }, [selectedScenario, snapshot]);

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

  useEffect(() => {
    if (!selectedScenarioId) {
      return;
    }

    if (primedScenarioRef.current !== selectedScenarioId) {
      primedScenarioRef.current = selectedScenarioId;
      seenSkillResultKeysRef.current = new Set(
        mySkillResults.map((entry) => entry.resultKey),
      );
      setToastQueue([]);
      setActiveToast(null);
      return;
    }

    const additions: VnSkillCheckToastData[] = [];
    for (const result of mySkillResults) {
      if (seenSkillResultKeysRef.current.has(result.resultKey)) {
        continue;
      }

      seenSkillResultKeysRef.current.add(result.resultKey);
      const check = scenarioCheckLookup.get(
        `${result.nodeId}::${result.checkId}`,
      );
      additions.push({
        resultKey: result.resultKey,
        checkId: result.checkId,
        voiceLabel: formatVoiceLabel(check?.voiceId ?? result.checkId),
        roll: result.roll,
        voiceLevel: result.voiceLevel,
        difficulty: result.difficulty,
        passed: result.passed,
      });
    }

    if (additions.length > 0) {
      setToastQueue((previous) => [...previous, ...additions]);
    }
  }, [mySkillResults, scenarioCheckLookup, selectedScenarioId]);

  useEffect(() => {
    if (activeToast || toastQueue.length === 0) {
      return;
    }
    setActiveToast(toastQueue[0]);
    setToastQueue((previous) => previous.slice(1));
  }, [activeToast, toastQueue]);

  const passiveCheckItems = useMemo<PassiveCheckDisplay[]>(() => {
    if (!currentNode) {
      return [];
    }

    return (currentNode.passiveChecks ?? [])
      .map((check) => {
        const result = mySkillResults.find((entry) =>
          checkResultMatches(
            entry,
            selectedScenarioId,
            currentNode.id,
            check.id,
          ),
        );

        if (!result) {
          return null;
        }

        return {
          checkId: check.id,
          voiceLabel: formatVoiceLabel(check.voiceId),
          passed: result.passed,
          difficulty: result.difficulty,
          roll: result.roll,
          voiceLevel: result.voiceLevel,
        };
      })
      .filter((entry): entry is PassiveCheckDisplay => entry !== null);
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

    const nextNodeId = unwrapOptionalString(matchedResult.nextNodeId);
    const failedChoiceKey = buildChoiceKey(
      awaitingSkillChoice.scenarioId,
      awaitingSkillChoice.nodeId,
      awaitingSkillChoice.choiceId,
    );

    setAwaitingSkillChoice(null);

    if (nextNodeId) {
      setPendingChoiceId(null);
      setStatusLine(t.skillResolved);
      return;
    }

    if (!matchedResult.passed) {
      setFailedChoiceKeys((previous) => ({
        ...previous,
        [failedChoiceKey]: true,
      }));
      setPendingChoiceId(null);
      setStatusLine(t.skillFailed);
      return;
    }

    void applyChoiceCommit(
      awaitingSkillChoice.scenarioId,
      awaitingSkillChoice.choiceId,
    );
  }, [
    applyChoiceCommit,
    awaitingSkillChoice,
    mySkillResults,
    t.skillFailed,
    t.skillResolved,
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

    setAwaitingSkillChoice({
      scenarioId: selectedScenarioId,
      nodeId: currentNode.id,
      choiceId: choice.id,
      checkId: choice.skillCheck.id,
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

  const visibleChoices = useMemo(
    () =>
      currentNode?.choices.filter((choice) => !isAutoContinueChoice(choice)) ??
      [],
    [currentNode],
  );
  const autoContinueChoice = useMemo(
    () =>
      currentNode?.choices.find((choice) => isAutoContinueChoice(choice)) ??
      null,
    [currentNode],
  );
  const narrativeText = useMemo(() => {
    if (!currentNode) {
      return sessionReady ? "" : t.sessionHydrating;
    }
    return normalizeBody(currentNode.body);
  }, [currentNode, sessionReady, t.sessionHydrating]);

  const handleSurfaceTap = () => {
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

    if (isScenarioCompleted) {
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

    const isAvailable = isChoiceAvailable(autoContinueChoice, myFlags, myVars);
    if (!isAvailable) {
      return;
    }

    void handleChoiceClick(autoContinueChoice, false);
  };

  const resolvedBgUrl = useMemo(
    () =>
      resolveBackgroundUrl(
        currentNode?.backgroundUrl,
        selectedScenario?.defaultBackgroundUrl,
      ),
    [currentNode, selectedScenario],
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

  const speakerLabel = formatSpeaker(currentNode?.characterId);
  const showOriginCards =
    selectedScenarioId === "sandbox_intro_pilot" &&
    currentNode?.id === "scene_backstory_select";
  const isInteractionLocked =
    transitionState !== "idle" || Boolean(awaitingSkillChoice);
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

      <VnSkillCheckToast
        toast={activeToast}
        onClose={() => setActiveToast(null)}
      />
      <VnPassiveCheckBanner items={passiveCheckItems} />

      <VnNarrativePanel
        locationName={selectedScenario?.title ?? t.unknownScenario}
        characterName={speakerLabel === "Narrator" ? undefined : speakerLabel}
        narrativeText={narrativeText}
        backgroundImageUrl={resolvedBgUrl ?? undefined}
        onTypingChange={handleTypingChange}
        isTyping={isTyping}
        typedTextRef={typedTextRef}
        onSurfaceTap={handleSurfaceTap}
        choicesSlot={
          <div className="flex flex-col gap-3 px-6 py-8 w-full max-w-[480px] mx-auto">
            {showOriginCards && currentNode ? (
              <OriginChoiceCards
                choices={visibleChoices}
                disabled={isInteractionLocked}
                onPick={(choice) => {
                  const isAvailable = isChoiceAvailable(
                    choice,
                    myFlags,
                    myVars,
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
                const isAvailable = isChoiceAvailable(choice, myFlags, myVars);
                return (
                  <VnChoiceButton
                    key={choice.id}
                    choice={choice}
                    index={index}
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
            ) : isScenarioCompleted ? (
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
      />

      {statusLine ? <p className="status-line success">{statusLine}</p> : null}
      {error ? <p className="status-line error">{error}</p> : null}
    </section>
  );
};
