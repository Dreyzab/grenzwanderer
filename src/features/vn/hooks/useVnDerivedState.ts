import { useMemo } from "react";
import { ENABLE_AI } from "../../../config";
import type {
  AiRequest,
  ContentTranslation,
  PlayerAgencyCareer,
  PlayerNpcFavor,
  PlayerNpcState,
  PlayerQuest,
  PlayerRumorState,
  VnSession,
} from "../../../shared/spacetime/bindings";
import {
  AI_GENERATE_CHARACTER_REACTION_KIND,
  AI_GENERATE_DIALOGUE_KIND,
  AI_PROPOSE_DIRECTOR_STEP_KIND,
  AI_PROPOSE_DM_TURN_KIND,
} from "../../ai/contracts";
import {
  buildVnNodeTranslationKey,
  resolveTranslatedText,
} from "../../i18n/vnContentTranslations";
import type { I18nDictionary } from "../../i18n/I18nContext";
import type { UiLanguage } from "../../../shared/hooks/useUiLanguage";
import {
  calculateSkillCheckSuccessPercent,
  resolveSkillCheckEffectiveDifficulty,
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
  directorRequestMatchesContext,
  dmTurnRequestMatchesContext,
  parseDirectorStepResponse,
  parseDmTurnResponse,
  formatSpeaker,
  formatVoiceLabel,
  hasOptionalValue,
  isAutoContinueChoice,
  resolveEffectiveAutoContinueChoice,
  normalizeBody,
  normalizeLetterBody,
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
import type {
  VnChoice,
  VnNode,
  VnScenario,
  VnSkillCheck,
  VnSnapshot,
} from "../types";
import type { PassiveCheckDisplay } from "../ui/VnPassiveCheckBanner";
import { resolveBackgroundUrl } from "../ui/VnBackgroundResolver";
import {
  RESOURCE_FORTUNE_MOD_VAR,
  RESOURCE_FORTUNE_VAR,
  RESOURCE_KARMA_VAR,
  RESOURCE_PROVIDENCE_VAR,
  RESOURCE_FATE_TOKEN_VAR,
  resolveEffectiveFortune,
} from "../../../shared/game/narrativeResources";
import { isSkillVoiceId } from "../../../../data/innerVoiceContract";
import {
  resolveEffectiveSkillCheckBonus,
  resolveOriginIdFromFlags,
} from "../../../shared/game/characterProgression";
import { isSkillRankGateSatisfiedFromVars } from "../../../shared/game/skillProgression";

interface UseVnDerivedStateParams {
  sessions: readonly VnSession[];
  sessionsReady: boolean;
  skillResults: readonly (SkillCheckResultLike & {
    playerId: { toHexString(): string };
  })[];
  aiRequests: readonly AiRequest[];
  questRows: readonly PlayerQuest[];
  npcStateRows: readonly PlayerNpcState[];
  npcFavorRows: readonly PlayerNpcFavor[];
  agencyCareerRows: readonly PlayerAgencyCareer[];
  rumorStateRows: readonly PlayerRumorState[];
  selectedScenarioId: string;
  snapshot: VnSnapshot | null;
  selectedScenario: VnScenario | null;
  contentReady: boolean;
  myFlags: Record<string, boolean>;
  myVars: Record<string, number>;
  mySession: VnSession | null;
  sessionReady: boolean;
  currentNode: VnNode | null;
  activeAiThoughtContext: ActiveAiThoughtContext | null;
  activeProvidenceThoughtContext: ActiveAiThoughtContext | null;
  activeReactionKey: string | null;
  tSessionHydrating: string;
  tTranslationsLoading: string;
  localePackReady: boolean;
  uiLanguage: UiLanguage;
  dictionary: I18nDictionary | null;
}

export function useVnDerivedState({
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
  tSessionHydrating,
  tTranslationsLoading,
  localePackReady,
  uiLanguage,
  dictionary,
}: UseVnDerivedStateParams) {
  const choiceEvaluationContext = useMemo<VnChoiceEvaluationContext>(() => {
    const favorBalances = new Map<string, number>();
    for (const row of npcFavorRows) {
      favorBalances.set(row.npcId, normalizeNumeric(row.balance));
    }

    const rumorStates = new Map<string, "registered" | "verified">();
    for (const row of rumorStateRows) {
      rumorStates.set(row.rumorId, row.status as "registered" | "verified");
    }

    const agencyCareer = agencyCareerRows[0] ?? null;

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
    npcFavorRows,
    rumorStateRows,
    snapshot?.socialCatalog?.careerRanks,
  ]);

  const trustByNpcId = useMemo(() => {
    const trust = new Map<string, number>();
    for (const row of npcStateRows) {
      trust.set(row.npcId, row.trustScore);
    }
    return trust;
  }, [npcStateRows]);

  const visibleFactsByCharacterId = useMemo(() => {
    const summaries = new Map<string, string[]>();
    for (const identity of snapshot?.socialCatalog?.npcIdentities ?? []) {
      const facts = [identity.publicRole].filter(
        (entry): entry is string =>
          typeof entry === "string" && entry.length > 0,
      );
      summaries.set(identity.id, facts);
    }

    return summaries;
  }, [snapshot?.socialCatalog?.npcIdentities]);

  const mySessions = useMemo(() => [...sessions], [sessions]);

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
      [...skillResults].sort((left, right) =>
        timestampMicros(right.createdAt) > timestampMicros(left.createdAt)
          ? 1
          : -1,
      ),
    [skillResults],
  );

  const myAiRequests = useMemo(
    () =>
      [...aiRequests]
        .filter((entry) => entry.kind === AI_GENERATE_DIALOGUE_KIND)
        .sort((left, right) =>
          timestampMicros(right.updatedAt) > timestampMicros(left.updatedAt)
            ? 1
            : -1,
        ),
    [aiRequests],
  );

  const myReactionRequests = useMemo(
    () =>
      [...aiRequests]
        .filter((entry) => entry.kind === AI_GENERATE_CHARACTER_REACTION_KIND)
        .sort((left, right) =>
          timestampMicros(right.updatedAt) > timestampMicros(left.updatedAt)
            ? 1
            : -1,
        ),
    [aiRequests],
  );

  const myDirectorRequests = useMemo(
    () =>
      [...aiRequests]
        .filter((entry) => entry.kind === AI_PROPOSE_DIRECTOR_STEP_KIND)
        .sort((left, right) =>
          timestampMicros(right.updatedAt) > timestampMicros(left.updatedAt)
            ? 1
            : -1,
        ),
    [aiRequests],
  );

  const myDmTurnRequests = useMemo(
    () =>
      [...aiRequests]
        .filter((entry) => entry.kind === AI_PROPOSE_DM_TURN_KIND)
        .sort((left, right) =>
          timestampMicros(right.updatedAt) > timestampMicros(left.updatedAt)
            ? 1
            : -1,
        ),
    [aiRequests],
  );

  const activeDirectorRequest = useMemo(() => {
    if (!selectedScenarioId || !currentNode) {
      return null;
    }
    return (
      myDirectorRequests.find((entry) =>
        directorRequestMatchesContext(
          entry,
          selectedScenarioId,
          currentNode.id,
        ),
      ) ?? null
    );
  }, [currentNode, myDirectorRequests, selectedScenarioId]);

  const activeDirectorProposal = useMemo(() => {
    if (!activeDirectorRequest) {
      return null;
    }
    if (activeDirectorRequest.status !== "completed") {
      return null;
    }
    return parseDirectorStepResponse(activeDirectorRequest.responseJson);
  }, [activeDirectorRequest]);

  const activeDmTurnRequest = useMemo(() => {
    if (!selectedScenarioId || !currentNode) {
      return null;
    }
    return (
      myDmTurnRequests.find((entry) =>
        dmTurnRequestMatchesContext(entry, selectedScenarioId, currentNode.id),
      ) ?? null
    );
  }, [currentNode, myDmTurnRequests, selectedScenarioId]);

  const activeDmTurnProposal = useMemo(() => {
    if (!activeDmTurnRequest || activeDmTurnRequest.status !== "completed") {
      return null;
    }
    return parseDmTurnResponse(activeDmTurnRequest.responseJson);
  }, [activeDmTurnRequest]);

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

  // All visible non-auto choices, regardless of hotspot. Used for legacy
  // consumers and for `hasNoChoices`/lock-state checks where the kind of
  // surface (text vs hotspot) does not matter.
  const currentVisibleChoicesAll = useMemo(
    () =>
      currentNode?.choices.filter(
        (choice: VnChoice) =>
          !isAutoContinueChoice(choice) &&
          isChoiceVisible(choice, myFlags, myVars, choiceEvaluationContext),
      ) ?? [],
    [choiceEvaluationContext, currentNode, myFlags, myVars],
  );

  // Text-only visible choices feed VnChoicesRenderer, log layout, lock-state
  // checks and auto-continue detection. Hotspot choices are intentionally
  // excluded so they never accidentally render as text buttons or block
  // tap-to-continue.
  const currentVisibleChoices = useMemo(
    () =>
      currentVisibleChoicesAll.filter((choice: VnChoice) => !choice.hotspot),
    [currentVisibleChoicesAll],
  );

  // Visible hotspot choices for the hub overlay. Already filtered by
  // visibility conditions. Disambiguation across multiple choices targeting
  // the same zone is performed downstream via `hotspot.priority`.
  const currentVisibleHotspotChoices = useMemo(
    () =>
      currentVisibleChoicesAll.filter((choice: VnChoice) => !!choice.hotspot),
    [currentVisibleChoicesAll],
  );

  const currentAutoContinueChoice = useMemo(
    () =>
      resolveEffectiveAutoContinueChoice(
        currentNode?.choices,
        myFlags,
        myVars,
        choiceEvaluationContext,
      ),
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
      (check: VnSkillCheck) =>
        (!check.minSkillRank ||
          (isSkillVoiceId(check.voiceId) &&
            isSkillRankGateSatisfiedFromVars(
              myVars,
              check.voiceId,
              check.minSkillRank,
            ))) &&
        !mySkillResults.some((entry) =>
          checkResultMatches(
            entry,
            selectedScenarioId,
            currentNode.id,
            check.id,
          ),
        ),
    );
  }, [currentNode, mySkillResults, myVars, selectedScenarioId]);

  const currentNarrativeText = useMemo(() => {
    if (!currentNode) {
      return sessionReady ? "" : tSessionHydrating;
    }
    if (!localePackReady && uiLanguage !== "en") {
      return tTranslationsLoading;
    }
    const translationKey = buildVnNodeTranslationKey(
      selectedScenarioId,
      currentNode.id,
      "body",
    );
    const resolvedTranslation = resolveTranslatedText(
      uiLanguage,
      translationKey,
      "",
      dictionary,
    );
    if (
      currentNode.narrativePresentation === "letter" ||
      currentNode.narrativeLayout === "letter_overlay"
    ) {
      const fallback = normalizeLetterBody(currentNode.body);
      if (resolvedTranslation) {
        return normalizeLetterBody(resolvedTranslation);
      }
      return uiLanguage === "en" ? fallback : `WARNING ${fallback}`;
    }
    const fallback = normalizeBody(currentNode.body);
    if (resolvedTranslation) {
      return normalizeBody(resolvedTranslation);
    }
    return uiLanguage === "en" ? fallback : `WARNING ${fallback}`;
  }, [
    currentNode,
    dictionary,
    localePackReady,
    selectedScenarioId,
    sessionReady,
    tSessionHydrating,
    tTranslationsLoading,
    uiLanguage,
  ]);

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

  const narrativeResources = useMemo(() => {
    const providence = Math.trunc(myVars[RESOURCE_PROVIDENCE_VAR] ?? 0);
    const fate = Math.trunc(myVars[RESOURCE_FATE_TOKEN_VAR] ?? 0);
    const fortune = Math.trunc(myVars[RESOURCE_FORTUNE_VAR] ?? 0);
    const fortuneMod = Math.trunc(myVars[RESOURCE_FORTUNE_MOD_VAR] ?? 0);
    const karma = Math.trunc(myVars[RESOURCE_KARMA_VAR] ?? 0);

    return {
      providence,
      fate,
      fortune,
      fortuneMod,
      karma,
      effectiveFortune: resolveEffectiveFortune(fortune, fortuneMod),
    };
  }, [myVars]);

  const activeAiThoughtRequest = useMemo(() => {
    if (!activeAiThoughtContext) {
      return null;
    }

    return (
      myAiRequests.find((entry) =>
        aiRequestMatchesContext(entry, activeAiThoughtContext),
      ) ?? null
    );
  }, [activeAiThoughtContext, myAiRequests]);

  const activeProvidenceThoughtRequest = useMemo(() => {
    if (!activeProvidenceThoughtContext) {
      return null;
    }

    return (
      myAiRequests.find((entry) =>
        aiRequestMatchesContext(entry, activeProvidenceThoughtContext),
      ) ?? null
    );
  }, [activeProvidenceThoughtContext, myAiRequests]);

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

  const activeProvidenceThoughtResponse = useMemo(
    () =>
      activeProvidenceThoughtRequest
        ? parseStoredDialogueResponse(
            activeProvidenceThoughtRequest.responseJson,
          )
        : null,
    [activeProvidenceThoughtRequest],
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

  const activeProvidenceThoughtStatus =
    useMemo<SkillCheckAiStatus | null>(() => {
      if (!ENABLE_AI || !activeProvidenceThoughtContext) {
        return null;
      }

      const status = activeProvidenceThoughtRequest?.status;
      return status === "processing" ||
        status === "completed" ||
        status === "failed"
        ? status
        : "pending";
    }, [
      activeProvidenceThoughtContext,
      activeProvidenceThoughtRequest?.status,
    ]);

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

  const getChoiceEffectiveDifficulty = (
    choice: VnChoice,
    fortuneSpend = 0,
  ): number | undefined => {
    if (!choice.skillCheck) {
      return undefined;
    }

    return resolveSkillCheckEffectiveDifficulty({
      baseDifficulty: choice.skillCheck.difficulty,
      karmaSensitive: choice.skillCheck.karmaSensitive,
      karma: narrativeResources.karma,
      fortuneMod: narrativeResources.fortuneMod,
      fortuneSpend,
    });
  };

  const getChoiceChancePercent = (
    choice: VnChoice,
    fortuneSpend = 0,
  ): number | undefined => {
    if (!choice.skillCheck?.showChancePercent) {
      return undefined;
    }

    const effectiveDifficulty = getChoiceEffectiveDifficulty(
      choice,
      fortuneSpend,
    );
    if (effectiveDifficulty === undefined) {
      return undefined;
    }

    const resolvedVoiceLevel = isSkillVoiceId(choice.skillCheck.voiceId)
      ? resolveEffectiveSkillCheckBonus(myVars, choice.skillCheck.voiceId, {
          originId: resolveOriginIdFromFlags(myFlags),
          synergyId: choice.skillCheck.synergyId,
          choiceSource: choice.choiceSource,
          choiceType: choice.choiceType,
        }).total
      : (myVars[choice.skillCheck.voiceId] ?? 0);

    return calculateSkillCheckSuccessPercent({
      diceMode: currentDiceMode,
      difficulty: effectiveDifficulty,
      voiceLevel: resolvedVoiceLevel,
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
    myDirectorRequests,
    myDmTurnRequests,
    activeDirectorRequest,
    activeDirectorProposal,
    activeDmTurnRequest,
    activeDmTurnProposal,
    currentDiceMode,
    completionRoute,
    isScenarioCompleted,
    completionTargetLabel,
    passiveCheckItems,
    currentVisibleChoices,
    currentVisibleChoicesAll,
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
  };
}
