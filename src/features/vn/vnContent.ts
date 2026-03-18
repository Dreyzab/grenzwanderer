import type {
  MapAction,
  MapBinding,
  MapBindingIntent,
  MapBindingTrigger,
  MapCondition,
  MapEventTemplate,
  MapPointCategory,
  MapPointDefaultState,
  MapPointState,
  MapQrCodeRegistryEntry,
  MapShadowRoute,
  MapSnapshot,
  MapTestDefaults,
  MysticEntityArchetype,
  MysticObservationDefinition,
  MysticObservationKind,
  MindCaseContent,
  MindFactContent,
  MindHypothesisContent,
  MindThoughtContent,
  MindThoughtState,
  MindRequiredVar,
  QuestCatalogEntry,
  QuestStageContent,
  QrRedeemPolicy,
  RumorStateStatus,
  SightMode,
  VnChoice,
  VnCondition,
  VnDiceMode,
  VnEffect,
  VnNode,
  VnScenarioCompletionRoute,
  VnScenario,
  VnSnapshot,
} from "./types";
import {
  createMindThoughtInternalizedFlagKey,
  createMindThoughtResearchingFlagKey,
  createMindThoughtUnlockedFlagKey,
} from "../mindpalace/thoughtCabinet";
import {
  MIN_VN_SCHEMA_WITH_MAP,
  MIN_VN_SCHEMA_WITH_MAP_EXPANSIONS,
  MIN_VN_SCHEMA_WITH_MIND_PALACE,
  MIN_VN_SCHEMA_WITH_QUEST_CATALOG,
} from "./snapshotSchema";

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isDiceMode = (value: unknown): value is VnDiceMode =>
  value === "d20" || value === "d10";

const isCondition = (value: unknown): value is VnCondition => {
  if (!isObject(value) || typeof value.type !== "string") {
    return false;
  }

  if (value.type === "flag_equals") {
    return typeof value.key === "string" && typeof value.value === "boolean";
  }
  if (value.type === "var_gte" || value.type === "var_lte") {
    return typeof value.key === "string" && typeof value.value === "number";
  }
  if (value.type === "has_evidence") {
    return typeof value.evidenceId === "string";
  }
  if (value.type === "quest_stage_gte") {
    return typeof value.questId === "string" && typeof value.stage === "number";
  }
  if (value.type === "relationship_gte") {
    return (
      typeof value.characterId === "string" && typeof value.value === "number"
    );
  }
  if (value.type === "has_item") {
    return typeof value.itemId === "string";
  }
  if (value.type === "favor_balance_gte") {
    return typeof value.npcId === "string" && typeof value.value === "number";
  }
  if (value.type === "agency_standing_gte") {
    return typeof value.value === "number";
  }
  if (value.type === "rumor_state_is") {
    return (
      typeof value.rumorId === "string" &&
      (value.status === "registered" || value.status === "verified")
    );
  }
  if (value.type === "hypothesis_focus_is") {
    return (
      typeof value.caseId === "string" && typeof value.hypothesisId === "string"
    );
  }
  if (value.type === "thought_state_is") {
    return (
      typeof value.thoughtId === "string" &&
      (value.state === "available" ||
        value.state === "researching" ||
        value.state === "internalized")
    );
  }
  if (value.type === "career_rank_gte") {
    return typeof value.rankId === "string";
  }

  return false;
};

const isEffect = (value: unknown): value is VnEffect => {
  if (!isObject(value) || typeof value.type !== "string") {
    return false;
  }

  if (value.type === "set_flag") {
    return typeof value.key === "string" && typeof value.value === "boolean";
  }
  if (value.type === "set_var" || value.type === "add_var") {
    return typeof value.key === "string" && typeof value.value === "number";
  }
  if (value.type === "travel_to") {
    return typeof value.locationId === "string";
  }
  if (value.type === "open_command_mode") {
    return (
      typeof value.scenarioId === "string" &&
      (value.returnTab === undefined ||
        value.returnTab === "map" ||
        value.returnTab === "vn")
    );
  }
  if (value.type === "open_battle_mode") {
    return (
      typeof value.scenarioId === "string" &&
      (value.returnTab === undefined ||
        value.returnTab === "map" ||
        value.returnTab === "vn")
    );
  }
  if (value.type === "spawn_map_event") {
    return (
      typeof value.templateId === "string" &&
      (value.ttlMinutes === undefined || typeof value.ttlMinutes === "number")
    );
  }
  if (value.type === "track_event") {
    const tagsValid =
      value.tags === undefined ||
      (isObject(value.tags) && !Array.isArray(value.tags));

    return (
      typeof value.eventName === "string" &&
      tagsValid &&
      (value.value === undefined || typeof value.value === "number")
    );
  }
  if (value.type === "discover_fact") {
    return typeof value.caseId === "string" && typeof value.factId === "string";
  }
  if (value.type === "unlock_mind_thought") {
    return typeof value.thoughtId === "string";
  }
  if (value.type === "grant_xp") {
    return typeof value.amount === "number";
  }
  if (value.type === "unlock_group") {
    return typeof value.groupId === "string";
  }
  if (value.type === "set_quest_stage") {
    return typeof value.questId === "string" && typeof value.stage === "number";
  }
  if (value.type === "change_relationship") {
    return (
      typeof value.characterId === "string" && typeof value.delta === "number"
    );
  }
  if (value.type === "change_favor_balance") {
    return (
      typeof value.npcId === "string" &&
      typeof value.delta === "number" &&
      (value.reason === undefined || typeof value.reason === "string")
    );
  }
  if (value.type === "change_agency_standing") {
    return (
      typeof value.delta === "number" &&
      (value.reason === undefined || typeof value.reason === "string")
    );
  }
  if (value.type === "change_faction_signal") {
    return (
      typeof value.factionId === "string" &&
      typeof value.delta === "number" &&
      (value.reason === undefined || typeof value.reason === "string")
    );
  }
  if (value.type === "register_rumor") {
    return typeof value.rumorId === "string";
  }
  if (value.type === "verify_rumor") {
    return (
      typeof value.rumorId === "string" &&
      (value.verificationKind === "evidence" ||
        value.verificationKind === "fact" ||
        value.verificationKind === "service_unlock" ||
        value.verificationKind === "map_unlock")
    );
  }
  if (value.type === "record_service_criterion") {
    return (
      value.criterionId === "verified_rumor_chain" ||
      value.criterionId === "preserved_source_network" ||
      value.criterionId === "clean_closure"
    );
  }
  if (value.type === "grant_evidence") {
    return typeof value.evidenceId === "string";
  }
  if (value.type === "grant_item") {
    return (
      typeof value.itemId === "string" && typeof value.quantity === "number"
    );
  }
  if (
    value.type === "add_heat" ||
    value.type === "add_tension" ||
    value.type === "grant_influence"
  ) {
    return typeof value.amount === "number";
  }
  if (value.type === "shift_awakening") {
    return (
      typeof value.amount === "number" &&
      (value.exposureDelta === undefined ||
        typeof value.exposureDelta === "number")
    );
  }
  if (value.type === "record_entity_observation") {
    return (
      typeof value.observationId === "string" &&
      (value.entityArchetypeId === undefined ||
        typeof value.entityArchetypeId === "string") &&
      (value.signatureIds === undefined ||
        (Array.isArray(value.signatureIds) &&
          value.signatureIds.every((entry) => typeof entry === "string")))
    );
  }
  if (value.type === "unlock_distortion_point") {
    return typeof value.pointId === "string";
  }
  if (value.type === "set_sight_mode") {
    return isSightMode(value.mode);
  }
  if (value.type === "apply_rationalist_buffer") {
    return typeof value.amount === "number";
  }
  if (value.type === "tag_entity_signature") {
    return typeof value.signatureId === "string";
  }

  return false;
};

const isSkillCheck = (value: unknown): boolean => {
  if (!isObject(value)) {
    return false;
  }
  return (
    typeof value.id === "string" &&
    typeof value.voiceId === "string" &&
    typeof value.difficulty === "number" &&
    (value.isPassive === undefined || typeof value.isPassive === "boolean") &&
    (value.showChancePercent === undefined ||
      typeof value.showChancePercent === "boolean")
  );
};

const isChoice = (value: unknown): value is VnChoice => {
  if (!isObject(value)) {
    return false;
  }

  const hasLegacyConditions =
    value.conditions === undefined ||
    (Array.isArray(value.conditions) && value.conditions.every(isCondition));
  const hasVisibleIfAll =
    value.visibleIfAll === undefined ||
    (Array.isArray(value.visibleIfAll) &&
      value.visibleIfAll.every(isCondition));
  const hasVisibleIfAny =
    value.visibleIfAny === undefined ||
    (Array.isArray(value.visibleIfAny) &&
      value.visibleIfAny.every(isCondition));
  const hasRequireAll =
    value.requireAll === undefined ||
    (Array.isArray(value.requireAll) && value.requireAll.every(isCondition));
  const hasRequireAny =
    value.requireAny === undefined ||
    (Array.isArray(value.requireAny) && value.requireAny.every(isCondition));
  const hasEffects =
    value.effects === undefined ||
    (Array.isArray(value.effects) && value.effects.every(isEffect));
  const hasSkillCheck =
    value.skillCheck === undefined || isSkillCheck(value.skillCheck);

  return (
    typeof value.id === "string" &&
    typeof value.text === "string" &&
    typeof value.nextNodeId === "string" &&
    hasLegacyConditions &&
    hasVisibleIfAll &&
    hasVisibleIfAny &&
    hasRequireAll &&
    hasRequireAny &&
    hasEffects &&
    hasSkillCheck
  );
};

const isNode = (value: unknown): value is VnNode => {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.scenarioId === "string" &&
    typeof value.title === "string" &&
    typeof value.body === "string" &&
    Array.isArray(value.choices) &&
    value.choices.every(isChoice)
  );
};

const isScenario = (value: unknown): value is VnScenario => {
  if (!isObject(value)) {
    return false;
  }

  const hasCompletionRoute =
    value.completionRoute === undefined ||
    isCompletionRoute(value.completionRoute);
  const hasSkillCheckDice =
    value.skillCheckDice === undefined || isDiceMode(value.skillCheckDice);

  return (
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.startNodeId === "string" &&
    Array.isArray(value.nodeIds) &&
    value.nodeIds.every((entry) => typeof entry === "string") &&
    hasCompletionRoute &&
    hasSkillCheckDice
  );
};

const isCompletionRoute = (
  value: unknown,
): value is VnScenarioCompletionRoute => {
  if (!isObject(value) || typeof value.nextScenarioId !== "string") {
    return false;
  }

  const requiredFlagsValid =
    value.requiredFlagsAll === undefined ||
    (Array.isArray(value.requiredFlagsAll) &&
      value.requiredFlagsAll.every((entry) => typeof entry === "string"));

  const blockedFlagsValid =
    value.blockedIfFlagsAny === undefined ||
    (Array.isArray(value.blockedIfFlagsAny) &&
      value.blockedIfFlagsAny.every((entry) => typeof entry === "string"));

  return requiredFlagsValid && blockedFlagsValid;
};

const isMindRequiredVar = (value: unknown): value is MindRequiredVar => {
  if (!isObject(value)) {
    return false;
  }

  const op = value.op;
  if (op !== "gte" && op !== "lte" && op !== "eq") {
    return false;
  }

  return (
    typeof value.key === "string" &&
    typeof value.value === "number" &&
    Number.isFinite(value.value)
  );
};

const isMindCase = (value: unknown): value is MindCaseContent =>
  isObject(value) &&
  typeof value.id === "string" &&
  typeof value.title === "string";

const isMindFact = (value: unknown): value is MindFactContent =>
  isObject(value) &&
  typeof value.id === "string" &&
  typeof value.caseId === "string" &&
  typeof value.sourceType === "string" &&
  typeof value.sourceId === "string" &&
  typeof value.text === "string" &&
  (value.tags === undefined || isObject(value.tags));

const isMindHypothesis = (value: unknown): value is MindHypothesisContent =>
  isObject(value) &&
  typeof value.id === "string" &&
  typeof value.caseId === "string" &&
  typeof value.key === "string" &&
  typeof value.text === "string" &&
  Array.isArray(value.requiredFactIds) &&
  value.requiredFactIds.every((entry) => typeof entry === "string") &&
  Array.isArray(value.requiredVars) &&
  value.requiredVars.every(isMindRequiredVar) &&
  Array.isArray(value.rewardEffects) &&
  value.rewardEffects.every(isEffect);

const isMindThoughtState = (value: unknown): value is MindThoughtState =>
  value === "available" || value === "researching" || value === "internalized";

const isMindThought = (value: unknown): value is MindThoughtContent =>
  isObject(value) &&
  typeof value.id === "string" &&
  typeof value.promptText === "string" &&
  typeof value.researchTime === "number" &&
  Number.isFinite(value.researchTime) &&
  value.researchTime >= 1 &&
  Array.isArray(value.duringResearchEffects) &&
  value.duringResearchEffects.every(isEffect) &&
  Array.isArray(value.onInternalizedEffects) &&
  value.onInternalizedEffects.every(isEffect) &&
  Array.isArray(value.contradictsThoughtIds) &&
  value.contradictsThoughtIds.every((entry) => typeof entry === "string") &&
  typeof value.purgeCost === "number" &&
  Number.isFinite(value.purgeCost) &&
  value.purgeCost >= 0;

const parseMindPalace = (value: unknown): VnSnapshot["mindPalace"] | null => {
  if (value === undefined) {
    return {
      cases: [],
      facts: [],
      hypotheses: [],
      thoughts: [],
    };
  }

  if (!isObject(value)) {
    return null;
  }

  if (!Array.isArray(value.cases) || !value.cases.every(isMindCase)) {
    return null;
  }
  if (!Array.isArray(value.facts) || !value.facts.every(isMindFact)) {
    return null;
  }
  if (
    !Array.isArray(value.hypotheses) ||
    !value.hypotheses.every(isMindHypothesis)
  ) {
    return null;
  }
  if (
    value.thoughts !== undefined &&
    (!Array.isArray(value.thoughts) || !value.thoughts.every(isMindThought))
  ) {
    return null;
  }

  return {
    cases: value.cases,
    facts: value.facts,
    hypotheses: value.hypotheses,
    thoughts: value.thoughts ?? [],
  };
};

const isSightMode = (value: unknown): value is SightMode =>
  value === "rational" || value === "sensitive" || value === "ether";

const isMysticObservationKind = (
  value: unknown,
): value is MysticObservationKind =>
  value === "sighting" ||
  value === "trace" ||
  value === "echo" ||
  value === "sample" ||
  value === "theory";

const isMysticEntityArchetype = (
  value: unknown,
): value is MysticEntityArchetype =>
  isObject(value) &&
  typeof value.id === "string" &&
  typeof value.label === "string" &&
  typeof value.veilLevel === "number" &&
  Array.isArray(value.signatures) &&
  value.signatures.every((entry) => typeof entry === "string") &&
  Array.isArray(value.habitats) &&
  value.habitats.every((entry) => typeof entry === "string") &&
  typeof value.temperament === "string" &&
  typeof value.witnessValue === "number" &&
  Array.isArray(value.rationalCoverStories) &&
  value.rationalCoverStories.every((entry) => typeof entry === "string") &&
  Array.isArray(value.allowedManifestations) &&
  value.allowedManifestations.every((entry) => typeof entry === "string");

const isMysticObservationDefinition = (
  value: unknown,
): value is MysticObservationDefinition =>
  isObject(value) &&
  typeof value.id === "string" &&
  isMysticObservationKind(value.kind) &&
  typeof value.title === "string" &&
  typeof value.text === "string" &&
  (value.entityArchetypeId === undefined ||
    typeof value.entityArchetypeId === "string") &&
  (value.signatureIds === undefined ||
    (Array.isArray(value.signatureIds) &&
      value.signatureIds.every((entry) => typeof entry === "string"))) &&
  (value.rationalInterpretation === undefined ||
    typeof value.rationalInterpretation === "string") &&
  (value.unlockedByDefault === undefined ||
    typeof value.unlockedByDefault === "boolean");

const parseMysticism = (
  value: unknown,
): VnSnapshot["mysticism"] | undefined | null => {
  if (value === undefined) {
    return undefined;
  }
  if (!isObject(value)) {
    return null;
  }

  if (
    !Array.isArray(value.entityArchetypes) ||
    !value.entityArchetypes.every((entry) => isMysticEntityArchetype(entry))
  ) {
    return null;
  }
  if (
    value.observations !== undefined &&
    (!Array.isArray(value.observations) ||
      !value.observations.every((entry) =>
        isMysticObservationDefinition(entry),
      ))
  ) {
    return null;
  }

  return {
    entityArchetypes: value.entityArchetypes,
    observations: value.observations ?? [],
  };
};

const parseVnRuntime = (value: unknown): VnSnapshot["vnRuntime"] | null => {
  if (value === undefined) {
    return undefined;
  }
  if (!isObject(value)) {
    return null;
  }

  if (value.skillCheckDice !== undefined && !isDiceMode(value.skillCheckDice)) {
    return null;
  }
  if (
    value.defaultEntryScenarioId !== undefined &&
    (typeof value.defaultEntryScenarioId !== "string" ||
      value.defaultEntryScenarioId.trim().length === 0)
  ) {
    return null;
  }

  return {
    skillCheckDice: value.skillCheckDice,
    defaultEntryScenarioId: value.defaultEntryScenarioId,
  };
};

const isQuestStage = (value: unknown): value is QuestStageContent =>
  isObject(value) &&
  typeof value.stage === "number" &&
  Number.isFinite(value.stage) &&
  Number.isInteger(value.stage) &&
  value.stage >= 1 &&
  typeof value.title === "string" &&
  value.title.trim().length > 0 &&
  typeof value.objectiveHint === "string" &&
  value.objectiveHint.trim().length > 0 &&
  (value.objectivePointIds === undefined ||
    (Array.isArray(value.objectivePointIds) &&
      value.objectivePointIds.every((entry) => typeof entry === "string")));

const isQuestCatalogEntry = (value: unknown): value is QuestCatalogEntry =>
  isObject(value) &&
  typeof value.id === "string" &&
  value.id.trim().length > 0 &&
  typeof value.title === "string" &&
  value.title.trim().length > 0 &&
  Array.isArray(value.stages) &&
  value.stages.length > 0 &&
  value.stages.every((entry) => isQuestStage(entry));

const parseQuestCatalog = (
  value: unknown,
  schemaVersion: number,
): VnSnapshot["questCatalog"] | undefined | null => {
  if (value === undefined) {
    return schemaVersion >= MIN_VN_SCHEMA_WITH_QUEST_CATALOG ? null : undefined;
  }
  if (
    !Array.isArray(value) ||
    !value.every((entry) => isQuestCatalogEntry(entry))
  ) {
    return null;
  }

  const questIds = new Set<string>();
  const parsedCatalog: QuestCatalogEntry[] = [];
  for (const quest of value) {
    if (questIds.has(quest.id)) {
      return null;
    }
    questIds.add(quest.id);

    const stageNumbers = new Set<number>();
    for (const stage of quest.stages) {
      if (stageNumbers.has(stage.stage)) {
        return null;
      }
      stageNumbers.add(stage.stage);
    }

    parsedCatalog.push({
      id: quest.id,
      title: quest.title,
      stages: quest.stages,
    });
  }

  return parsedCatalog;
};

const isMapPointState = (value: unknown): value is MapPointState =>
  value === "locked" ||
  value === "discovered" ||
  value === "visited" ||
  value === "completed";

const isMapPointDefaultState = (
  value: unknown,
): value is MapPointDefaultState =>
  value === "locked" || value === "discovered";

const isMapPointCategory = (value: unknown): value is MapPointCategory =>
  value === "HUB" ||
  value === "PUBLIC" ||
  value === "SHADOW" ||
  value === "EPHEMERAL";

const isMapBindingTrigger = (value: unknown): value is MapBindingTrigger =>
  value === "card_primary" ||
  value === "card_secondary" ||
  value === "map_pin" ||
  value === "auto";

const isMapBindingIntent = (value: unknown): value is MapBindingIntent =>
  value === "objective" || value === "interaction" || value === "travel";

const isQrRedeemPolicy = (value: unknown): value is QrRedeemPolicy =>
  value === "once_per_player" || value === "repeatable";

const isMapCondition = (value: unknown): value is MapCondition => {
  if (!isObject(value) || typeof value.type !== "string") {
    return false;
  }

  if (value.type === "flag_is") {
    return typeof value.key === "string" && typeof value.value === "boolean";
  }
  if (value.type === "var_gte" || value.type === "var_lte") {
    return typeof value.key === "string" && typeof value.value === "number";
  }
  if (value.type === "has_item") {
    return typeof value.itemId === "string";
  }
  if (value.type === "has_evidence") {
    return typeof value.evidenceId === "string";
  }
  if (value.type === "quest_stage_gte") {
    return typeof value.questId === "string" && typeof value.stage === "number";
  }
  if (value.type === "relationship_gte") {
    return (
      typeof value.characterId === "string" && typeof value.value === "number"
    );
  }
  if (value.type === "favor_balance_gte") {
    return typeof value.npcId === "string" && typeof value.value === "number";
  }
  if (value.type === "agency_standing_gte") {
    return typeof value.value === "number";
  }
  if (value.type === "rumor_state_is") {
    return (
      typeof value.rumorId === "string" &&
      (value.status === "registered" || value.status === "verified")
    );
  }
  if (value.type === "hypothesis_focus_is") {
    return (
      typeof value.caseId === "string" && typeof value.hypothesisId === "string"
    );
  }
  if (value.type === "thought_state_is") {
    return (
      typeof value.thoughtId === "string" && isMindThoughtState(value.state)
    );
  }
  if (value.type === "career_rank_gte") {
    return typeof value.rankId === "string";
  }
  if (value.type === "unlock_group_has") {
    return typeof value.groupId === "string";
  }
  if (value.type === "point_state_is") {
    return isMapPointState(value.state);
  }
  if (value.type === "logic_and" || value.type === "logic_or") {
    return (
      Array.isArray(value.conditions) &&
      value.conditions.every((entry) => isMapCondition(entry))
    );
  }
  if (value.type === "logic_not") {
    return isMapCondition(value.condition);
  }

  return false;
};

const isMapAction = (value: unknown): value is MapAction => {
  if (!isObject(value) || typeof value.type !== "string") {
    return false;
  }

  if (value.type === "start_scenario") {
    return typeof value.scenarioId === "string";
  }
  if (value.type === "travel_to") {
    return typeof value.locationId === "string";
  }
  if (value.type === "open_command_mode") {
    return (
      typeof value.scenarioId === "string" &&
      (value.returnTab === undefined ||
        value.returnTab === "map" ||
        value.returnTab === "vn")
    );
  }
  if (value.type === "open_battle_mode") {
    return (
      typeof value.scenarioId === "string" &&
      (value.returnTab === undefined ||
        value.returnTab === "map" ||
        value.returnTab === "vn")
    );
  }
  if (value.type === "spawn_map_event") {
    return (
      typeof value.templateId === "string" &&
      (value.ttlMinutes === undefined || typeof value.ttlMinutes === "number")
    );
  }
  if (value.type === "set_flag") {
    return typeof value.key === "string" && typeof value.value === "boolean";
  }
  if (value.type === "unlock_group") {
    return typeof value.groupId === "string";
  }
  if (value.type === "set_quest_stage") {
    return typeof value.questId === "string" && typeof value.stage === "number";
  }
  if (value.type === "grant_evidence") {
    return typeof value.evidenceId === "string";
  }
  if (value.type === "grant_xp") {
    return typeof value.amount === "number";
  }
  if (value.type === "grant_influence") {
    return typeof value.amount === "number";
  }
  if (value.type === "change_relationship") {
    return (
      typeof value.characterId === "string" && typeof value.delta === "number"
    );
  }
  if (value.type === "change_favor_balance") {
    return (
      typeof value.npcId === "string" &&
      typeof value.delta === "number" &&
      (value.reason === undefined || typeof value.reason === "string")
    );
  }
  if (value.type === "change_agency_standing") {
    return (
      typeof value.delta === "number" &&
      (value.reason === undefined || typeof value.reason === "string")
    );
  }
  if (value.type === "change_faction_signal") {
    return (
      typeof value.factionId === "string" &&
      typeof value.delta === "number" &&
      (value.reason === undefined || typeof value.reason === "string")
    );
  }
  if (value.type === "register_rumor") {
    return typeof value.rumorId === "string";
  }
  if (value.type === "verify_rumor") {
    return (
      typeof value.rumorId === "string" &&
      (value.verificationKind === "evidence" ||
        value.verificationKind === "fact" ||
        value.verificationKind === "service_unlock" ||
        value.verificationKind === "map_unlock")
    );
  }
  if (value.type === "record_service_criterion") {
    return (
      value.criterionId === "verified_rumor_chain" ||
      value.criterionId === "preserved_source_network" ||
      value.criterionId === "clean_closure"
    );
  }
  if (value.type === "track_event") {
    return typeof value.eventName === "string";
  }
  if (value.type === "shift_awakening") {
    return (
      typeof value.amount === "number" &&
      (value.exposureDelta === undefined ||
        typeof value.exposureDelta === "number")
    );
  }
  if (value.type === "record_entity_observation") {
    return (
      typeof value.observationId === "string" &&
      (value.entityArchetypeId === undefined ||
        typeof value.entityArchetypeId === "string") &&
      (value.signatureIds === undefined ||
        (Array.isArray(value.signatureIds) &&
          value.signatureIds.every((entry) => typeof entry === "string")))
    );
  }
  if (value.type === "unlock_distortion_point") {
    return typeof value.pointId === "string";
  }
  if (value.type === "set_sight_mode") {
    return isSightMode(value.mode);
  }
  if (value.type === "apply_rationalist_buffer") {
    return typeof value.amount === "number";
  }
  if (value.type === "tag_entity_signature") {
    return typeof value.signatureId === "string";
  }

  return false;
};

const isMapBinding = (value: unknown): value is MapBinding => {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    isMapBindingTrigger(value.trigger) &&
    typeof value.label === "string" &&
    typeof value.priority === "number" &&
    Number.isFinite(value.priority) &&
    isMapBindingIntent(value.intent) &&
    Array.isArray(value.actions) &&
    value.actions.length > 0 &&
    value.actions.every((entry) => isMapAction(entry)) &&
    (value.conditions === undefined ||
      (Array.isArray(value.conditions) &&
        value.conditions.every((entry) => isMapCondition(entry))))
  );
};

const isMapPointSnapshotLike = (
  value: unknown,
): value is MapEventTemplate["point"] => {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.regionId === "string" &&
    typeof value.lat === "number" &&
    typeof value.lng === "number" &&
    isMapPointCategory(value.category) &&
    (value.description === undefined ||
      typeof value.description === "string") &&
    (value.image === undefined || typeof value.image === "string") &&
    typeof value.locationId === "string" &&
    (value.defaultState === undefined ||
      isMapPointDefaultState(value.defaultState)) &&
    (value.unlockGroup === undefined ||
      typeof value.unlockGroup === "string") &&
    (value.isHiddenInitially === undefined ||
      typeof value.isHiddenInitially === "boolean") &&
    (value.visibilityModes === undefined ||
      (Array.isArray(value.visibilityModes) &&
        value.visibilityModes.every((entry) => isSightMode(entry)))) &&
    (value.distortionWindow === undefined ||
      (isObject(value.distortionWindow) &&
        (value.distortionWindow.minAwakening === undefined ||
          typeof value.distortionWindow.minAwakening === "number") &&
        (value.distortionWindow.maxAwakening === undefined ||
          typeof value.distortionWindow.maxAwakening === "number"))) &&
    (value.revealConditions === undefined ||
      (Array.isArray(value.revealConditions) &&
        value.revealConditions.every((entry) => isMapCondition(entry)))) &&
    (value.entitySignature === undefined ||
      typeof value.entitySignature === "string") &&
    (value.rumorHookId === undefined ||
      typeof value.rumorHookId === "string") &&
    Array.isArray(value.bindings) &&
    value.bindings.every((entry) => isMapBinding(entry))
  );
};

const isMapShadowRoute = (value: unknown): value is MapShadowRoute =>
  isObject(value) &&
  typeof value.id === "string" &&
  typeof value.regionId === "string" &&
  Array.isArray(value.pointIds) &&
  value.pointIds.every((entry) => typeof entry === "string") &&
  (value.color === undefined || typeof value.color === "string") &&
  (value.revealFlagsAll === undefined ||
    (Array.isArray(value.revealFlagsAll) &&
      value.revealFlagsAll.every((entry) => typeof entry === "string")));

const isMapEventTemplate = (value: unknown): value is MapEventTemplate =>
  isObject(value) &&
  typeof value.id === "string" &&
  isMapPointSnapshotLike(value.point) &&
  (value.ttlMinutes === undefined || typeof value.ttlMinutes === "number");

const isMapQrCodeRegistryEntry = (
  value: unknown,
): value is MapQrCodeRegistryEntry =>
  isObject(value) &&
  typeof value.codeId === "string" &&
  typeof value.codeHash === "string" &&
  /^[a-f0-9]{64}$/.test(value.codeHash) &&
  isQrRedeemPolicy(value.redeemPolicy) &&
  Array.isArray(value.effects) &&
  value.effects.every((entry) => isEffect(entry)) &&
  (value.requiresFlagsAll === undefined ||
    (Array.isArray(value.requiresFlagsAll) &&
      value.requiresFlagsAll.every((entry) => typeof entry === "string"))) &&
  (value.requiresBriefingBypass === undefined ||
    typeof value.requiresBriefingBypass === "boolean");

const parseMapTestDefaults = (
  value: unknown,
): MapTestDefaults | undefined | null => {
  if (value === undefined) {
    return undefined;
  }
  if (!isObject(value)) {
    return null;
  }

  if (
    value.defaultEventTtlMinutes !== undefined &&
    typeof value.defaultEventTtlMinutes !== "number"
  ) {
    return null;
  }

  return {
    defaultEventTtlMinutes: value.defaultEventTtlMinutes,
  };
};

const parseMap = (
  value: unknown,
  schemaVersion: number,
  scenarioIds: ReadonlySet<string>,
): MapSnapshot | undefined | null => {
  if (value === undefined) {
    return schemaVersion >= MIN_VN_SCHEMA_WITH_MAP ? null : undefined;
  }

  if (!isObject(value)) {
    return null;
  }
  if (typeof value.defaultRegionId !== "string") {
    return null;
  }

  if (!Array.isArray(value.regions) || !Array.isArray(value.points)) {
    return null;
  }

  const parsedRegions: MapSnapshot["regions"] = [];
  for (const region of value.regions) {
    if (
      !isObject(region) ||
      typeof region.id !== "string" ||
      typeof region.name !== "string" ||
      typeof region.geoCenterLat !== "number" ||
      typeof region.geoCenterLng !== "number" ||
      typeof region.zoom !== "number"
    ) {
      return null;
    }

    parsedRegions.push({
      id: region.id,
      name: region.name,
      geoCenterLat: region.geoCenterLat,
      geoCenterLng: region.geoCenterLng,
      zoom: region.zoom,
    });
  }
  if (parsedRegions.length === 0) {
    return null;
  }

  const regionIds = new Set<string>();
  for (const region of parsedRegions) {
    if (regionIds.has(region.id)) {
      return null;
    }
    regionIds.add(region.id);
  }
  if (!regionIds.has(value.defaultRegionId)) {
    return null;
  }

  const parsedPoints: MapSnapshot["points"] = [];
  const pointIds = new Set<string>();
  const bindingIds = new Set<string>();

  for (const point of value.points) {
    const category =
      point && isObject(point) && typeof point.category === "string"
        ? point.category
        : schemaVersion >= MIN_VN_SCHEMA_WITH_MAP_EXPANSIONS
          ? undefined
          : "PUBLIC";

    if (
      !isObject(point) ||
      typeof point.id !== "string" ||
      typeof point.title !== "string" ||
      typeof point.regionId !== "string" ||
      typeof point.lat !== "number" ||
      typeof point.lng !== "number" ||
      !isMapPointCategory(category) ||
      (point.description !== undefined &&
        typeof point.description !== "string") ||
      (point.image !== undefined && typeof point.image !== "string") ||
      typeof point.locationId !== "string" ||
      (point.defaultState !== undefined &&
        !isMapPointDefaultState(point.defaultState)) ||
      (point.unlockGroup !== undefined &&
        typeof point.unlockGroup !== "string") ||
      (point.isHiddenInitially !== undefined &&
        typeof point.isHiddenInitially !== "boolean") ||
      (point.visibilityModes !== undefined &&
        (!Array.isArray(point.visibilityModes) ||
          !point.visibilityModes.every((entry) => isSightMode(entry)))) ||
      (point.distortionWindow !== undefined &&
        (!isObject(point.distortionWindow) ||
          (point.distortionWindow.minAwakening !== undefined &&
            typeof point.distortionWindow.minAwakening !== "number") ||
          (point.distortionWindow.maxAwakening !== undefined &&
            typeof point.distortionWindow.maxAwakening !== "number"))) ||
      (point.revealConditions !== undefined &&
        (!Array.isArray(point.revealConditions) ||
          !point.revealConditions.every((entry) => isMapCondition(entry)))) ||
      (point.entitySignature !== undefined &&
        typeof point.entitySignature !== "string") ||
      (point.rumorHookId !== undefined &&
        typeof point.rumorHookId !== "string") ||
      !Array.isArray(point.bindings) ||
      !point.bindings.every((entry) => isMapBinding(entry))
    ) {
      return null;
    }
    if (!regionIds.has(point.regionId)) {
      return null;
    }
    if (pointIds.has(point.id)) {
      return null;
    }
    pointIds.add(point.id);

    for (const binding of point.bindings) {
      if (bindingIds.has(binding.id)) {
        return null;
      }
      bindingIds.add(binding.id);

      for (const action of binding.actions) {
        if (
          action.type === "start_scenario" &&
          !scenarioIds.has(action.scenarioId)
        ) {
          return null;
        }
      }
    }

    parsedPoints.push({
      id: point.id,
      title: point.title,
      regionId: point.regionId,
      lat: point.lat,
      lng: point.lng,
      description: point.description,
      image: point.image,
      locationId: point.locationId,
      category,
      defaultState: point.defaultState,
      unlockGroup: point.unlockGroup,
      isHiddenInitially: point.isHiddenInitially,
      visibilityModes: point.visibilityModes,
      distortionWindow: point.distortionWindow,
      revealConditions: point.revealConditions,
      entitySignature: point.entitySignature,
      rumorHookId: point.rumorHookId,
      bindings: point.bindings,
    });
  }

  let shadowRoutes: MapSnapshot["shadowRoutes"];
  if (value.shadowRoutes !== undefined) {
    if (
      !Array.isArray(value.shadowRoutes) ||
      !value.shadowRoutes.every((entry) => isMapShadowRoute(entry))
    ) {
      return null;
    }

    const routeIds = new Set<string>();
    shadowRoutes = [];
    for (const route of value.shadowRoutes) {
      if (
        routeIds.has(route.id) ||
        !regionIds.has(route.regionId) ||
        route.pointIds.length < 2 ||
        route.pointIds.some((pointId) => !pointIds.has(pointId))
      ) {
        return null;
      }
      routeIds.add(route.id);
      shadowRoutes.push({
        id: route.id,
        regionId: route.regionId,
        pointIds: [...route.pointIds],
        color: route.color,
        revealFlagsAll: route.revealFlagsAll
          ? [...route.revealFlagsAll]
          : undefined,
      });
    }
  }

  let qrCodeRegistry: MapSnapshot["qrCodeRegistry"];
  if (value.qrCodeRegistry !== undefined) {
    if (
      !Array.isArray(value.qrCodeRegistry) ||
      !value.qrCodeRegistry.every((entry) => isMapQrCodeRegistryEntry(entry))
    ) {
      return null;
    }

    const codeIds = new Set<string>();
    qrCodeRegistry = [];
    for (const entry of value.qrCodeRegistry) {
      if (codeIds.has(entry.codeId)) {
        return null;
      }
      codeIds.add(entry.codeId);

      qrCodeRegistry.push({
        codeId: entry.codeId,
        codeHash: entry.codeHash,
        redeemPolicy: entry.redeemPolicy,
        effects: entry.effects,
        requiresFlagsAll: entry.requiresFlagsAll
          ? [...entry.requiresFlagsAll]
          : undefined,
        requiresBriefingBypass: entry.requiresBriefingBypass,
      });
    }
  }

  let mapEventTemplates: MapSnapshot["mapEventTemplates"];
  if (value.mapEventTemplates !== undefined) {
    if (
      !Array.isArray(value.mapEventTemplates) ||
      !value.mapEventTemplates.every((entry) => isMapEventTemplate(entry))
    ) {
      return null;
    }

    const templateIds = new Set<string>();
    const templatePointIds = new Set<string>();
    mapEventTemplates = [];
    for (const template of value.mapEventTemplates) {
      if (
        templateIds.has(template.id) ||
        templatePointIds.has(template.point.id) ||
        pointIds.has(template.point.id) ||
        !regionIds.has(template.point.regionId) ||
        template.point.category !== "EPHEMERAL"
      ) {
        return null;
      }
      templateIds.add(template.id);
      templatePointIds.add(template.point.id);

      mapEventTemplates.push({
        id: template.id,
        point: {
          ...template.point,
          bindings: [...template.point.bindings],
        },
        ttlMinutes: template.ttlMinutes,
      });
    }
  }

  const testDefaults = parseMapTestDefaults(value.testDefaults);
  if (testDefaults === null) {
    return null;
  }

  return {
    defaultRegionId: value.defaultRegionId,
    regions: parsedRegions,
    points: parsedPoints,
    shadowRoutes,
    qrCodeRegistry,
    mapEventTemplates,
    testDefaults,
  };
};

const parseSocialCatalog = (
  value: unknown,
): VnSnapshot["socialCatalog"] | undefined | null => {
  if (value === undefined) {
    return undefined;
  }
  if (!isObject(value)) {
    return null;
  }
  if (
    !Array.isArray(value.npcIdentities) ||
    !Array.isArray(value.services) ||
    !Array.isArray(value.rumors) ||
    !Array.isArray(value.careerRanks)
  ) {
    return null;
  }

  const parsedNpcIdentities = value.npcIdentities.map((entry) => {
    if (
      !isObject(entry) ||
      typeof entry.id !== "string" ||
      typeof entry.displayName !== "string" ||
      typeof entry.factionId !== "string" ||
      typeof entry.publicRole !== "string" ||
      (entry.rosterTier !== "archetype" &&
        entry.rosterTier !== "functional" &&
        entry.rosterTier !== "major") ||
      (entry.portraitUrl !== undefined &&
        typeof entry.portraitUrl !== "string") ||
      (entry.introFlag !== undefined && typeof entry.introFlag !== "string") ||
      (entry.homePointId !== undefined &&
        typeof entry.homePointId !== "string") ||
      (entry.workPointId !== undefined &&
        typeof entry.workPointId !== "string") ||
      (entry.serviceIds !== undefined &&
        (!Array.isArray(entry.serviceIds) ||
          !entry.serviceIds.every(
            (serviceId) => typeof serviceId === "string",
          )))
    ) {
      return null;
    }

    return {
      id: entry.id,
      displayName: entry.displayName,
      factionId: entry.factionId,
      publicRole: entry.publicRole,
      rosterTier: entry.rosterTier as "archetype" | "functional" | "major",
      portraitUrl: entry.portraitUrl,
      introFlag: entry.introFlag,
      homePointId: entry.homePointId,
      workPointId: entry.workPointId,
      serviceIds: entry.serviceIds,
    };
  });

  const parsedServices = value.services.map((entry) => {
    if (
      !isObject(entry) ||
      typeof entry.id !== "string" ||
      typeof entry.npcId !== "string" ||
      (entry.role !== "information" &&
        entry.role !== "archives" &&
        entry.role !== "social_introduction" &&
        entry.role !== "political_cover" &&
        entry.role !== "transport") ||
      typeof entry.label !== "string" ||
      typeof entry.baseAccess !== "string" ||
      (entry.unlockFlag !== undefined &&
        typeof entry.unlockFlag !== "string") ||
      (entry.costNote !== undefined && typeof entry.costNote !== "string") ||
      (entry.qualityNote !== undefined &&
        typeof entry.qualityNote !== "string") ||
      (entry.consequenceNote !== undefined &&
        typeof entry.consequenceNote !== "string")
    ) {
      return null;
    }

    return {
      id: entry.id,
      npcId: entry.npcId,
      role: entry.role as
        | "information"
        | "archives"
        | "social_introduction"
        | "political_cover"
        | "transport",
      label: entry.label,
      baseAccess: entry.baseAccess,
      unlockFlag: entry.unlockFlag,
      costNote: entry.costNote,
      qualityNote: entry.qualityNote,
      consequenceNote: entry.consequenceNote,
    };
  });

  const parsedRumors = value.rumors.map((entry) => {
    if (
      !isObject(entry) ||
      typeof entry.id !== "string" ||
      typeof entry.title !== "string" ||
      typeof entry.caseId !== "string" ||
      (entry.leadPointId !== undefined &&
        typeof entry.leadPointId !== "string") ||
      (entry.sourceNpcId !== undefined &&
        typeof entry.sourceNpcId !== "string") ||
      !Array.isArray(entry.verifiesOn) ||
      !entry.verifiesOn.every(
        (verificationKind) =>
          verificationKind === "evidence" ||
          verificationKind === "fact" ||
          verificationKind === "service_unlock" ||
          verificationKind === "map_unlock",
      ) ||
      (entry.careerCriterionOnVerify !== undefined &&
        entry.careerCriterionOnVerify !== "verified_rumor_chain" &&
        entry.careerCriterionOnVerify !== "preserved_source_network" &&
        entry.careerCriterionOnVerify !== "clean_closure")
    ) {
      return null;
    }

    return {
      id: entry.id,
      title: entry.title,
      caseId: entry.caseId,
      leadPointId: entry.leadPointId,
      sourceNpcId: entry.sourceNpcId,
      verifiesOn: entry.verifiesOn as Array<
        "evidence" | "fact" | "service_unlock" | "map_unlock"
      >,
      careerCriterionOnVerify: entry.careerCriterionOnVerify as
        | "verified_rumor_chain"
        | "preserved_source_network"
        | "clean_closure"
        | undefined,
    };
  });

  const parsedCareerRanks = value.careerRanks.map((entry) => {
    if (
      !isObject(entry) ||
      typeof entry.id !== "string" ||
      typeof entry.label !== "string" ||
      typeof entry.order !== "number" ||
      typeof entry.standingRequired !== "number" ||
      (entry.qualifyingCaseId !== undefined &&
        typeof entry.qualifyingCaseId !== "string") ||
      typeof entry.serviceCriteriaNeeded !== "number" ||
      !Array.isArray(entry.privileges) ||
      !entry.privileges.every((privilege) => typeof privilege === "string")
    ) {
      return null;
    }

    return {
      id: entry.id,
      label: entry.label,
      order: entry.order,
      standingRequired: entry.standingRequired,
      qualifyingCaseId: entry.qualifyingCaseId,
      serviceCriteriaNeeded: entry.serviceCriteriaNeeded,
      privileges: entry.privileges,
    };
  });

  if (
    parsedNpcIdentities.includes(null) ||
    parsedServices.includes(null) ||
    parsedRumors.includes(null) ||
    parsedCareerRanks.includes(null)
  ) {
    return null;
  }

  const validNpcIdentities = parsedNpcIdentities.filter(
    (entry): entry is NonNullable<typeof entry> => entry !== null,
  );
  const validServices = parsedServices.filter(
    (entry): entry is NonNullable<typeof entry> => entry !== null,
  );
  const validRumors = parsedRumors.filter(
    (entry): entry is NonNullable<typeof entry> => entry !== null,
  );
  const validCareerRanks = parsedCareerRanks.filter(
    (entry): entry is NonNullable<typeof entry> => entry !== null,
  );

  const ensureUniqueIds = (entries: ReadonlyArray<{ id: string }>): boolean =>
    new Set(entries.map((entry) => entry.id)).size === entries.length;

  if (
    !ensureUniqueIds(validNpcIdentities) ||
    !ensureUniqueIds(validServices) ||
    !ensureUniqueIds(validRumors) ||
    !ensureUniqueIds(validCareerRanks)
  ) {
    return null;
  }

  return {
    npcIdentities: validNpcIdentities,
    services: validServices,
    rumors: validRumors,
    careerRanks: validCareerRanks,
  };
};

export const parseSnapshot = (payloadJson: string): VnSnapshot | null => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(payloadJson);
  } catch (_error) {
    return null;
  }

  if (!isObject(parsed)) {
    return null;
  }

  if (
    typeof parsed.schemaVersion !== "number" ||
    !Array.isArray(parsed.scenarios) ||
    !Array.isArray(parsed.nodes) ||
    !parsed.scenarios.every(isScenario) ||
    !parsed.nodes.every(isNode)
  ) {
    return null;
  }

  const mindPalace = parseMindPalace(parsed.mindPalace);
  if (!mindPalace) {
    return null;
  }
  const mysticism = parseMysticism(parsed.mysticism);
  if (mysticism === null) {
    return null;
  }
  const vnRuntime = parseVnRuntime(parsed.vnRuntime);
  if (vnRuntime === null) {
    return null;
  }

  const scenarioIds = new Set(parsed.scenarios.map((scenario) => scenario.id));
  const map = parseMap(parsed.map, parsed.schemaVersion, scenarioIds);
  if (map === null) {
    return null;
  }
  const questCatalog = parseQuestCatalog(
    parsed.questCatalog,
    parsed.schemaVersion,
  );
  if (questCatalog === null) {
    return null;
  }
  const socialCatalog = parseSocialCatalog(parsed.socialCatalog);
  if (socialCatalog === null) {
    return null;
  }
  if (
    parsed.schemaVersion >= MIN_VN_SCHEMA_WITH_MIND_PALACE &&
    parsed.mindPalace === undefined
  ) {
    return null;
  }

  return {
    schemaVersion: parsed.schemaVersion,
    scenarios: parsed.scenarios,
    nodes: parsed.nodes,
    vnRuntime,
    mindPalace,
    mysticism,
    map,
    questCatalog,
    socialCatalog,
  };
};

export const getScenarioById = (
  snapshot: VnSnapshot,
  scenarioId: string,
): VnScenario | null =>
  snapshot.scenarios.find((entry) => entry.id === scenarioId) ?? null;

export const getNodeById = (
  snapshot: VnSnapshot,
  nodeId: string,
): VnNode | null => snapshot.nodes.find((entry) => entry.id === nodeId) ?? null;

export interface VnChoiceEvaluationContext {
  favorBalances?:
    | ReadonlyMap<string, number>
    | Readonly<Record<string, number>>;
  agencyStanding?: number;
  rumorStates?:
    | ReadonlyMap<string, RumorStateStatus>
    | Readonly<Record<string, RumorStateStatus>>;
  careerRankId?: string | null;
  careerRankOrder?:
    | ReadonlyMap<string, number>
    | Readonly<Record<string, number>>;
}

const readMappedNumber = (
  source:
    | ReadonlyMap<string, number>
    | Readonly<Record<string, number>>
    | undefined,
  key: string,
): number => {
  if (!source) {
    return 0;
  }
  if (source instanceof Map) {
    return source.get(key) ?? 0;
  }
  return (source as Readonly<Record<string, number>>)[key] ?? 0;
};

const readMappedString = <T extends string>(
  source: ReadonlyMap<string, T> | Readonly<Record<string, T>> | undefined,
  key: string,
): T | null => {
  if (!source) {
    return null;
  }
  if (source instanceof Map) {
    return source.get(key) ?? null;
  }
  return (source as Readonly<Record<string, T>>)[key] ?? null;
};

const evaluateChoiceCondition = (
  condition: VnCondition,
  flags: Record<string, boolean>,
  vars: Record<string, number>,
  context?: VnChoiceEvaluationContext,
): boolean => {
  if (condition.type === "flag_equals") {
    return (flags[condition.key] ?? false) === condition.value;
  }
  if (condition.type === "var_gte") {
    return (vars[condition.key] ?? 0) >= condition.value;
  }
  if (condition.type === "var_lte") {
    return (vars[condition.key] ?? 0) <= condition.value;
  }
  if (condition.type === "favor_balance_gte") {
    return (
      readMappedNumber(context?.favorBalances, condition.npcId) >=
      condition.value
    );
  }
  if (condition.type === "agency_standing_gte") {
    return (context?.agencyStanding ?? 0) >= condition.value;
  }
  if (condition.type === "rumor_state_is") {
    return (
      readMappedString(context?.rumorStates, condition.rumorId) ===
      condition.status
    );
  }
  if (condition.type === "hypothesis_focus_is") {
    return (
      (flags[`mind_focus::${condition.caseId}::${condition.hypothesisId}`] ??
        false) === true
    );
  }
  if (condition.type === "thought_state_is") {
    if (condition.state === "internalized") {
      return (
        flags[createMindThoughtInternalizedFlagKey(condition.thoughtId)] ??
        false
      );
    }
    if (condition.state === "researching") {
      return (
        flags[createMindThoughtResearchingFlagKey(condition.thoughtId)] ?? false
      );
    }
    return (
      flags[createMindThoughtUnlockedFlagKey(condition.thoughtId)] ?? false
    );
  }
  if (condition.type === "career_rank_gte") {
    const currentRankId = context?.careerRankId;
    if (!currentRankId) {
      return false;
    }
    const currentOrder = readMappedNumber(
      context?.careerRankOrder,
      currentRankId,
    );
    const requiredOrder = readMappedNumber(
      context?.careerRankOrder,
      condition.rankId,
    );
    return currentOrder >= requiredOrder;
  }

  // Client pre-check is advisory; leave server as authority for unsupported
  // local data sources (inventory/evidence/quest/relationship).
  return true;
};

const groupAll = (
  conditions: VnCondition[] | undefined,
  flags: Record<string, boolean>,
  vars: Record<string, number>,
  context?: VnChoiceEvaluationContext,
): boolean => {
  if (!conditions || conditions.length === 0) {
    return true;
  }
  return conditions.every((condition) =>
    evaluateChoiceCondition(condition, flags, vars, context),
  );
};

const groupAny = (
  conditions: VnCondition[] | undefined,
  flags: Record<string, boolean>,
  vars: Record<string, number>,
  context?: VnChoiceEvaluationContext,
): boolean => {
  if (!conditions || conditions.length === 0) {
    return true;
  }
  return conditions.some((condition) =>
    evaluateChoiceCondition(condition, flags, vars, context),
  );
};

const resolveRequireAll = (choice: VnChoice): VnCondition[] | undefined =>
  choice.requireAll ?? choice.conditions;

export const isChoiceVisible = (
  choice: VnChoice,
  flags: Record<string, boolean>,
  vars: Record<string, number>,
  context?: VnChoiceEvaluationContext,
): boolean =>
  groupAll(choice.visibleIfAll, flags, vars, context) &&
  groupAny(choice.visibleIfAny, flags, vars, context);

export const isChoiceEnabled = (
  choice: VnChoice,
  flags: Record<string, boolean>,
  vars: Record<string, number>,
  context?: VnChoiceEvaluationContext,
): boolean =>
  groupAll(resolveRequireAll(choice), flags, vars, context) &&
  groupAny(choice.requireAny, flags, vars, context);

export const isChoiceAvailable = (
  choice: VnChoice,
  flags: Record<string, boolean>,
  vars: Record<string, number>,
  context?: VnChoiceEvaluationContext,
): boolean => {
  return isChoiceEnabled(choice, flags, vars, context);
};
