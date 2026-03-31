import { useMemo } from "react";
import { ENABLE_AI } from "../../../config";
import {
  AI_GENERATE_CHARACTER_REACTION_KIND,
  AI_GENERATE_DIALOGUE_KIND,
} from "../../ai/contracts";
import {
  calculateSkillCheckSuccessPercent,
  resolveSkillCheckDiceMode,
} from "../checkChance";
import { resolveCompletionRoute } from "../completionRoute";
import {
  getScenarioById,
  isChoiceVisible,
  type VnChoiceEvaluationContext,
} from "../vnContent";
import {
  aiRequestMatchesContext,
  checkResultMatches,
  collectChoiceLensCaseIds,
  formatSpeaker,
  formatVoiceLabel,
  hasOptionalValue,
  isAutoContinueChoice,
  normalizeBody,
  normalizeNumeric,
  parseStoredCharacterReactionResponse,
  parseStoredDialogueResponse,
  reactionRequestMatchesContext,
  sessionPointer,
  timestampMicros,
} from "../vnScreenUtils";
import type {
  ActiveAiThoughtContext,
  ActiveReactionContext,
  SkillCheckAiStatus,
  SkillCheckResultLike,
} from "../vnScreenTypes";
import {
  collectCaseIdsFromVnConditions,
  findActiveHypothesisLens,
} from "../../mindpalace/focusLens";
import { findPrimaryInternalizedThought } from "../../mindpalace/thoughtCabinet";
import { formatVoiceEnsembleRoles, getVoiceProfile } from "../voiceRegistry";
import type { VnScenario, VnSnapshot } from "../types";
import type { PassiveCheckDisplay } from "../ui/VnPassiveCheckBanner";
import { resolveBackgroundUrl } from "../ui/VnBackgroundResolver";
import type { VnSkillCheckResolveState } from "../ui/VnSkillCheckResolveOverlay";

interface UseVnDerivedStateParams {
  identityHex: string;
  sessions: any[];
  sessionsReady: boolean;
  skillResults: any[];
  aiRequests: any[];
  questRows: any[];
  npcStateRows: any[];
  npcFavorRows: any[];
  characterRevealRows: any[];
  agencyCareerRows: any[];
  rumorStateRows: any[];
  selectedScenarioId: string;
  snapshot: VnSnapshot | null;
  selectedScenario: VnScenario | null;
  contentReady: boolean;
  myFlags: Record<string, boolean>;
  myVars: Record<string, number>;
  mySession: any;
  sessionReady: boolean;
  currentNode: any;
  activeAiThoughtContext: ActiveAiThoughtContext | null;
  activeReactionKey: string | null;
  activeSkillResolve: VnSkillCheckResolveState | null;
  tSessionHydrating: string;
}

export function useVnDerivedState({
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
  tSessionHydrating,
}: UseVnDerivedStateParams) {
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

  const trustByNpcId = useMemo(() => {
    const trust = new Map<string, number>();
    for (const row of npcStateRows) {
      if (row.playerId.toHexString() !== identityHex) {
        continue;
      }
      trust.set(row.npcId, row.trustScore);
    }
    return trust;
  }, [identityHex, npcStateRows]);

  const visibleFactsByCharacterId = useMemo(() => {
    const factById = new Map(
      (snapshot?.socialCatalog?.characterRevealFacts ?? []).map((fact) => [
        fact.id,
        fact,
      ]),
    );
    const tierOrder = {
      hidden: 0,
      hinted: 1,
      surface: 2,
    } as const;
    const factsByCharacterId = new Map<
      string,
      Array<{ factId: string; summary: string; tier: number }>
    >();

    for (const row of characterRevealRows) {
      if (row.playerId.toHexString() !== identityHex) {
        continue;
      }

      const fact = factById.get(row.factId);
      if (!fact) {
        continue;
      }

      const current = factsByCharacterId.get(row.characterId) ?? [];
      if (current.some((entry) => entry.factId === row.factId)) {
        continue;
      }

      current.push({
        factId: row.factId,
        summary: fact.summary,
        tier: tierOrder[fact.tier],
      });
      factsByCharacterId.set(row.characterId, current);
    }

    const summaries = new Map<string, string[]>();
    for (const [characterId, facts] of factsByCharacterId) {
      summaries.set(
        characterId,
        facts
          .sort(
            (left, right) =>
              left.tier - right.tier || left.factId.localeCompare(right.factId),
          )
          .map((entry) => entry.summary),
      );
    }

    return summaries;
  }, [
    characterRevealRows,
    identityHex,
    snapshot?.socialCatalog?.characterRevealFacts,
  ]);

  const mySessions = useMemo(
    () =>
      sessions.filter((entry) => entry.playerId.toHexString() === identityHex),
    [identityHex, sessions],
  );

  const currentSessionPointer = useMemo(
    () => sessionPointer(mySession),
    [mySession],
  );

  const currentReactionContext = useMemo<ActiveReactionContext | null>(() => {
    if (
      !selectedScenarioId ||
      !currentNode?.characterId ||
      !currentSessionPointer ||
      !mySession
    ) {
      return null;
    }

    return {
      scenarioId: selectedScenarioId,
      nodeId: currentNode.id,
      characterId: currentNode.characterId,
      sessionPointer: currentSessionPointer,
      sessionUpdatedAtMicros: timestampMicros(mySession.updatedAt),
      reactionKey: `${selectedScenarioId}::${currentNode.id}::${currentNode.characterId}::${currentSessionPointer}`,
    };
  }, [currentNode, currentSessionPointer, mySession, selectedScenarioId]);

  const mySkillResults = useMemo<SkillCheckResultLike[]>(
    () =>
      skillResults
        .filter((entry) => entry.playerId.toHexString() === identityHex)
        .sort((left, right) =>
          timestampMicros(right.createdAt) > timestampMicros(left.updatedAt)
            ? 1
            : -1,
        ),
    [identityHex, skillResults],
  );

  const myAiRequests = useMemo(
    () =>
      aiRequests
        .filter(
          (entry) =>
            entry.playerId.toHexString() === identityHex &&
            entry.kind === AI_GENERATE_DIALOGUE_KIND,
        )
        .sort((left, right) =>
          timestampMicros(right.updatedAt) > timestampMicros(left.updatedAt)
            ? 1
            : -1,
        ),
    [aiRequests, identityHex],
  );

  const myReactionRequests = useMemo(
    () =>
      aiRequests
        .filter(
          (entry) =>
            entry.playerId.toHexString() === identityHex &&
            entry.kind === AI_GENERATE_CHARACTER_REACTION_KIND,
        )
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
      return sessionReady ? "" : tSessionHydrating;
    }
    return normalizeBody(currentNode.body);
  }, [currentNode, sessionReady, tSessionHydrating]);

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
      ) ??
      myAiRequests.find(
        (entry) =>
          timestampMicros(entry.createdAt) >=
          activeAiThoughtContext.resultCreatedAtMicros,
      ) ??
      null
    );
  }, [activeAiThoughtContext, myAiRequests]);

  const activeReactionRequest = useMemo(() => {
    if (!currentReactionContext) {
      return null;
    }

    return (
      myReactionRequests.find((entry) =>
        reactionRequestMatchesContext(entry, currentReactionContext),
      ) ?? null
    );
  }, [currentReactionContext, myReactionRequests]);

  const activeAiThoughtResponse = useMemo(
    () =>
      activeAiThoughtRequest
        ? parseStoredDialogueResponse(activeAiThoughtRequest.responseJson)
        : null,
    [activeAiThoughtRequest],
  );

  const activeReactionResponse = useMemo(
    () =>
      activeReactionRequest
        ? parseStoredCharacterReactionResponse(
            activeReactionRequest.responseJson,
          )
        : null,
    [activeReactionRequest],
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

  const activeReactionStatus = useMemo<SkillCheckAiStatus | null>(() => {
    if (
      !ENABLE_AI ||
      !currentReactionContext ||
      activeReactionKey !== currentReactionContext.reactionKey
    ) {
      return null;
    }

    const status = activeReactionRequest?.status;
    return status === "processing" ||
      status === "completed" ||
      status === "failed"
      ? status
      : "pending";
  }, [
    activeReactionKey,
    activeReactionRequest?.status,
    currentReactionContext,
  ]);

  const getChoiceChancePercent = (choice: any): number | undefined => {
    if (!choice.skillCheck?.showChancePercent) {
      return undefined;
    }

    return calculateSkillCheckSuccessPercent({
      diceMode: currentDiceMode,
      difficulty: choice.skillCheck.difficulty,
      voiceLevel: myVars[choice.skillCheck.voiceId] ?? 0,
    });
  };

  return {
    choiceEvaluationContext,
    trustByNpcId,
    visibleFactsByCharacterId,
    contentReady,
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
  };
}
