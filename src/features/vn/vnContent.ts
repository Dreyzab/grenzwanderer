import type {
  MapAction,
  MapBinding,
  MapBindingIntent,
  MapBindingTrigger,
  MapCondition,
  MapPointDefaultState,
  MapPointState,
  MapSnapshot,
  MindCaseContent,
  MindFactContent,
  MindHypothesisContent,
  MindRequiredVar,
  QuestCatalogEntry,
  QuestStageContent,
  VnChoice,
  VnCondition,
  VnDiceMode,
  VnEffect,
  VnNode,
  VnScenarioCompletionRoute,
  VnScenario,
  VnSnapshot,
} from "./types";

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
  if (value.type === "grant_evidence") {
    return typeof value.evidenceId === "string";
  }
  if (
    value.type === "add_heat" ||
    value.type === "add_tension" ||
    value.type === "grant_influence"
  ) {
    return typeof value.amount === "number";
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
    typeof value.difficulty === "number"
  );
};

const isChoice = (value: unknown): value is VnChoice => {
  if (!isObject(value)) {
    return false;
  }

  const hasConditions =
    value.conditions === undefined ||
    (Array.isArray(value.conditions) && value.conditions.every(isCondition));
  const hasEffects =
    value.effects === undefined ||
    (Array.isArray(value.effects) && value.effects.every(isEffect));
  const hasSkillCheck =
    value.skillCheck === undefined || isSkillCheck(value.skillCheck);

  return (
    typeof value.id === "string" &&
    typeof value.text === "string" &&
    typeof value.nextNodeId === "string" &&
    hasConditions &&
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

const parseMindPalace = (value: unknown): VnSnapshot["mindPalace"] | null => {
  if (value === undefined) {
    return {
      cases: [],
      facts: [],
      hypotheses: [],
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

  return {
    cases: value.cases,
    facts: value.facts,
    hypotheses: value.hypotheses,
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
    return schemaVersion >= 4 ? null : undefined;
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

const isMapBindingTrigger = (value: unknown): value is MapBindingTrigger =>
  value === "card_primary" ||
  value === "card_secondary" ||
  value === "map_pin" ||
  value === "auto";

const isMapBindingIntent = (value: unknown): value is MapBindingIntent =>
  value === "objective" || value === "interaction" || value === "travel";

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
  if (value.type === "change_relationship") {
    return (
      typeof value.characterId === "string" && typeof value.delta === "number"
    );
  }
  if (value.type === "track_event") {
    return typeof value.eventName === "string";
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

const parseMap = (
  value: unknown,
  schemaVersion: number,
  scenarioIds: ReadonlySet<string>,
): MapSnapshot | undefined | null => {
  if (value === undefined) {
    return schemaVersion >= 3 ? null : undefined;
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
    if (
      !isObject(point) ||
      typeof point.id !== "string" ||
      typeof point.title !== "string" ||
      typeof point.regionId !== "string" ||
      typeof point.lat !== "number" ||
      typeof point.lng !== "number" ||
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
      defaultState: point.defaultState,
      unlockGroup: point.unlockGroup,
      isHiddenInitially: point.isHiddenInitially,
      bindings: point.bindings,
    });
  }

  return {
    defaultRegionId: value.defaultRegionId,
    regions: parsedRegions,
    points: parsedPoints,
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
  if (parsed.schemaVersion >= 2 && parsed.mindPalace === undefined) {
    return null;
  }

  return {
    schemaVersion: parsed.schemaVersion,
    scenarios: parsed.scenarios,
    nodes: parsed.nodes,
    vnRuntime,
    mindPalace,
    map,
    questCatalog,
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

export const isChoiceAvailable = (
  choice: VnChoice,
  flags: Record<string, boolean>,
  vars: Record<string, number>,
): boolean => {
  if (!choice.conditions || choice.conditions.length === 0) {
    return true;
  }

  return choice.conditions.every((condition) => {
    if (condition.type === "flag_equals") {
      return (flags[condition.key] ?? false) === condition.value;
    }
    if (condition.type === "var_gte") {
      return (vars[condition.key] ?? 0) >= condition.value;
    }
    if (condition.type === "var_lte") {
      return (vars[condition.key] ?? 0) <= condition.value;
    }
    return false;
  });
};
