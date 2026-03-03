import { Timestamp } from "spacetimedb";
import { SenderError } from "spacetimedb/server";

const IDEMPOTENCY_TTL_MICROS = 86_400_000_000n;

export type VnCondition =
  | { type: "flag_equals"; key: string; value: boolean }
  | { type: "var_gte"; key: string; value: number }
  | { type: "var_lte"; key: string; value: number }
  | { type: "has_evidence"; evidenceId: string }
  | { type: "quest_stage_gte"; questId: string; stage: number }
  | { type: "relationship_gte"; characterId: string; value: number }
  | { type: "has_item"; itemId: string };

export type VnEffect =
  | { type: "set_flag"; key: string; value: boolean }
  | { type: "set_var"; key: string; value: number }
  | { type: "add_var"; key: string; value: number }
  | { type: "travel_to"; locationId: string }
  | {
      type: "track_event";
      eventName: string;
      tags?: Record<string, unknown>;
      value?: number;
    }
  | {
      type: "discover_fact";
      caseId: string;
      factId: string;
    }
  | { type: "grant_xp"; amount: number }
  | { type: "unlock_group"; groupId: string }
  | { type: "set_quest_stage"; questId: string; stage: number }
  | { type: "change_relationship"; characterId: string; delta: number }
  | { type: "grant_evidence"; evidenceId: string }
  | { type: "add_heat"; amount: number }
  | { type: "add_tension"; amount: number }
  | { type: "grant_influence"; amount: number };

export type VnDiceMode = "d20" | "d10";

export interface VnSkillCheck {
  id: string;
  voiceId: string;
  difficulty: number;
  isPassive?: boolean;
  onSuccess?: { nextNodeId?: string; effects?: VnEffect[] };
  onFail?: { nextNodeId?: string; effects?: VnEffect[] };
}

export interface VnChoice {
  id: string;
  text: string;
  nextNodeId: string;
  choiceType?: "action" | "inquiry" | "flavor";
  conditions?: VnCondition[];
  effects?: VnEffect[];
  skillCheck?: VnSkillCheck;
}

export interface VnNode {
  id: string;
  scenarioId: string;
  title: string;
  body: string;
  backgroundUrl?: string;
  characterId?: string;
  terminal?: boolean;
  choices: VnChoice[];
  onEnter?: VnEffect[];
  preconditions?: VnCondition[];
  passiveChecks?: VnSkillCheck[];
}

export interface VnScenario {
  id: string;
  title: string;
  startNodeId: string;
  nodeIds: string[];
  completionRoute?: VnScenarioCompletionRoute;
  skillCheckDice?: VnDiceMode;
  mode?: "overlay" | "fullscreen";
  packId?: string;
  musicUrl?: string;
  defaultBackgroundUrl?: string;
}

export interface VnScenarioCompletionRoute {
  nextScenarioId: string;
  requiredFlagsAll?: string[];
  blockedIfFlagsAny?: string[];
}

export interface MindCaseContent {
  id: string;
  title: string;
}

export interface MindFactContent {
  id: string;
  caseId: string;
  sourceType: string;
  sourceId: string;
  text: string;
  tags?: Record<string, unknown>;
}

export type MindVarOperator = "gte" | "lte" | "eq";

export interface MindRequiredVar {
  key: string;
  op: MindVarOperator;
  value: number;
}

export interface MindHypothesisContent {
  id: string;
  caseId: string;
  key: string;
  text: string;
  requiredFactIds: string[];
  requiredVars: MindRequiredVar[];
  rewardEffects: VnEffect[];
}

export interface MindPalaceSnapshot {
  cases: MindCaseContent[];
  facts: MindFactContent[];
  hypotheses: MindHypothesisContent[];
}

export interface VnRuntimeSettings {
  skillCheckDice?: VnDiceMode;
  defaultEntryScenarioId?: string;
}

export interface QuestStageContent {
  stage: number;
  title: string;
  objectiveHint: string;
  objectivePointIds?: string[];
}

export interface QuestCatalogEntry {
  id: string;
  title: string;
  stages: QuestStageContent[];
}

export type MapPointState = "locked" | "discovered" | "visited" | "completed";
export type MapPointDefaultState = "locked" | "discovered";
export type MapBindingTrigger =
  | "card_primary"
  | "card_secondary"
  | "map_pin"
  | "auto";
export type MapBindingIntent = "objective" | "interaction" | "travel";

export type MapCondition =
  | { type: "flag_is"; key: string; value: boolean }
  | { type: "var_gte"; key: string; value: number }
  | { type: "var_lte"; key: string; value: number }
  | { type: "has_item"; itemId: string }
  | { type: "has_evidence"; evidenceId: string }
  | { type: "quest_stage_gte"; questId: string; stage: number }
  | { type: "relationship_gte"; characterId: string; value: number }
  | { type: "unlock_group_has"; groupId: string }
  | { type: "point_state_is"; state: MapPointState }
  | { type: "logic_and"; conditions: MapCondition[] }
  | { type: "logic_or"; conditions: MapCondition[] }
  | { type: "logic_not"; condition: MapCondition };

export type MapAction =
  | { type: "start_scenario"; scenarioId: string }
  | { type: "travel_to"; locationId: string }
  | { type: "set_flag"; key: string; value: boolean }
  | { type: "unlock_group"; groupId: string }
  | { type: "set_quest_stage"; questId: string; stage: number }
  | { type: "grant_evidence"; evidenceId: string }
  | { type: "grant_xp"; amount: number }
  | { type: "change_relationship"; characterId: string; delta: number }
  | {
      type: "track_event";
      eventName: string;
      tags?: Record<string, unknown>;
      value?: number;
    };

export interface MapBinding {
  id: string;
  trigger: MapBindingTrigger;
  label: string;
  priority: number;
  intent: MapBindingIntent;
  conditions?: MapCondition[];
  actions: MapAction[];
}

export interface MapRegion {
  id: string;
  name: string;
  geoCenterLat: number;
  geoCenterLng: number;
  zoom: number;
}

export interface MapPoint {
  id: string;
  title: string;
  regionId: string;
  lat: number;
  lng: number;
  description?: string;
  image?: string;
  locationId: string;
  defaultState?: MapPointDefaultState;
  unlockGroup?: string;
  isHiddenInitially?: boolean;
  bindings: MapBinding[];
}

export interface MapSnapshot {
  defaultRegionId: string;
  regions: MapRegion[];
  points: MapPoint[];
}

export interface VnSnapshot {
  schemaVersion: number;
  scenarios: VnScenario[];
  nodes: VnNode[];
  vnRuntime?: VnRuntimeSettings;
  mindPalace?: MindPalaceSnapshot;
  map?: MapSnapshot;
  questCatalog?: QuestCatalogEntry[];
}

export interface HypothesisReadiness {
  requiredFacts: string[];
  requiredVars: MindRequiredVar[];
  rewardEffects: VnEffect[];
  missingFacts: string[];
  failedVarConditions: MindRequiredVar[];
  ready: boolean;
}

const assertNonEmpty = (value: string, fieldName: string): void => {
  if (!value || value.trim().length === 0) {
    throw new SenderError(`${fieldName} must not be empty`);
  }
};

const asRecord = (
  value: unknown,
  fieldName: string,
): Record<string, unknown> => {
  if (!value || typeof value !== "object") {
    throw new SenderError(`${fieldName} must be an object`);
  }

  return value as Record<string, unknown>;
};

const asStringArray = (value: unknown, fieldName: string): string[] => {
  if (
    !Array.isArray(value) ||
    !value.every((entry) => typeof entry === "string")
  ) {
    throw new SenderError(`${fieldName} must be an array of strings`);
  }

  return value;
};

const asNumber = (value: unknown, fieldName: string): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new SenderError(`${fieldName} must be a finite number`);
  }

  return value;
};

const asBoolean = (value: unknown, fieldName: string): boolean => {
  if (typeof value !== "boolean") {
    throw new SenderError(`${fieldName} must be a boolean`);
  }

  return value;
};

const isVnDiceMode = (value: unknown): value is VnDiceMode =>
  value === "d20" || value === "d10";

const isVnCondition = (value: unknown): value is VnCondition => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const condition = value as Record<string, unknown>;
  if (condition.type === "flag_equals") {
    return (
      typeof condition.key === "string" && typeof condition.value === "boolean"
    );
  }

  if (condition.type === "var_gte" || condition.type === "var_lte") {
    return (
      typeof condition.key === "string" && typeof condition.value === "number"
    );
  }

  if (condition.type === "has_evidence") {
    return typeof condition.evidenceId === "string";
  }

  if (condition.type === "quest_stage_gte") {
    return (
      typeof condition.questId === "string" &&
      typeof condition.stage === "number"
    );
  }

  if (condition.type === "relationship_gte") {
    return (
      typeof condition.characterId === "string" &&
      typeof condition.value === "number"
    );
  }

  if (condition.type === "has_item") {
    return typeof condition.itemId === "string";
  }

  return false;
};

const isVnEffect = (value: unknown): value is VnEffect => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const effect = value as Record<string, unknown>;
  if (effect.type === "set_flag") {
    return typeof effect.key === "string" && typeof effect.value === "boolean";
  }
  if (effect.type === "set_var" || effect.type === "add_var") {
    return typeof effect.key === "string" && typeof effect.value === "number";
  }
  if (effect.type === "travel_to") {
    return typeof effect.locationId === "string";
  }
  if (effect.type === "track_event") {
    return typeof effect.eventName === "string";
  }
  if (effect.type === "discover_fact") {
    return (
      typeof effect.caseId === "string" && typeof effect.factId === "string"
    );
  }
  if (effect.type === "grant_xp") {
    return typeof effect.amount === "number";
  }
  if (effect.type === "unlock_group") {
    return typeof effect.groupId === "string";
  }
  if (effect.type === "set_quest_stage") {
    return (
      typeof effect.questId === "string" && typeof effect.stage === "number"
    );
  }
  if (effect.type === "change_relationship") {
    return (
      typeof effect.characterId === "string" && typeof effect.delta === "number"
    );
  }
  if (effect.type === "grant_evidence") {
    return typeof effect.evidenceId === "string";
  }
  if (
    effect.type === "add_heat" ||
    effect.type === "add_tension" ||
    effect.type === "grant_influence"
  ) {
    return typeof effect.amount === "number";
  }

  return false;
};

const isVnScenarioCompletionRoute = (
  value: unknown,
): value is VnScenarioCompletionRoute => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const route = value as Record<string, unknown>;
  if (typeof route.nextScenarioId !== "string") {
    return false;
  }

  const requiredFlagsValid =
    route.requiredFlagsAll === undefined ||
    (Array.isArray(route.requiredFlagsAll) &&
      route.requiredFlagsAll.every((entry) => typeof entry === "string"));

  const blockedFlagsValid =
    route.blockedIfFlagsAny === undefined ||
    (Array.isArray(route.blockedIfFlagsAny) &&
      route.blockedIfFlagsAny.every((entry) => typeof entry === "string"));

  return requiredFlagsValid && blockedFlagsValid;
};

const isScenario = (value: unknown): value is VnScenario => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const scenario = value as Record<string, unknown>;
  const hasCompletionRoute =
    scenario.completionRoute === undefined ||
    isVnScenarioCompletionRoute(scenario.completionRoute);
  const hasSkillCheckDice =
    scenario.skillCheckDice === undefined ||
    isVnDiceMode(scenario.skillCheckDice);
  return (
    typeof scenario.id === "string" &&
    typeof scenario.title === "string" &&
    typeof scenario.startNodeId === "string" &&
    Array.isArray(scenario.nodeIds) &&
    scenario.nodeIds.every((entry) => typeof entry === "string") &&
    hasCompletionRoute &&
    hasSkillCheckDice
  );
};

const isSkillCheck = (value: unknown): value is VnSkillCheck => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const check = value as Record<string, unknown>;
  return (
    typeof check.id === "string" &&
    typeof check.voiceId === "string" &&
    typeof check.difficulty === "number"
  );
};

const isChoice = (value: unknown): value is VnChoice => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const choice = value as Record<string, unknown>;
  if (
    typeof choice.id !== "string" ||
    typeof choice.text !== "string" ||
    typeof choice.nextNodeId !== "string"
  ) {
    return false;
  }

  if (
    choice.conditions !== undefined &&
    (!Array.isArray(choice.conditions) ||
      !choice.conditions.every((entry) => isVnCondition(entry)))
  ) {
    return false;
  }

  if (
    choice.effects !== undefined &&
    (!Array.isArray(choice.effects) ||
      !choice.effects.every((entry) => isVnEffect(entry)))
  ) {
    return false;
  }

  if (choice.skillCheck !== undefined && !isSkillCheck(choice.skillCheck)) {
    return false;
  }

  return true;
};

const isNode = (value: unknown): value is VnNode => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const node = value as Record<string, unknown>;
  return (
    typeof node.id === "string" &&
    typeof node.scenarioId === "string" &&
    typeof node.title === "string" &&
    typeof node.body === "string" &&
    Array.isArray(node.choices) &&
    node.choices.every((entry) => isChoice(entry))
  );
};

const isMindVarOperator = (value: unknown): value is MindVarOperator =>
  value === "gte" || value === "lte" || value === "eq";

const isMindRequiredVar = (value: unknown): value is MindRequiredVar => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const required = value as Record<string, unknown>;
  return (
    typeof required.key === "string" &&
    isMindVarOperator(required.op) &&
    typeof required.value === "number" &&
    Number.isFinite(required.value)
  );
};

const isMindCaseContent = (value: unknown): value is MindCaseContent => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const entry = value as Record<string, unknown>;
  return typeof entry.id === "string" && typeof entry.title === "string";
};

const isMindFactContent = (value: unknown): value is MindFactContent => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const entry = value as Record<string, unknown>;
  return (
    typeof entry.id === "string" &&
    typeof entry.caseId === "string" &&
    typeof entry.sourceType === "string" &&
    typeof entry.sourceId === "string" &&
    typeof entry.text === "string"
  );
};

const isMindHypothesisContent = (
  value: unknown,
): value is MindHypothesisContent => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const entry = value as Record<string, unknown>;
  return (
    typeof entry.id === "string" &&
    typeof entry.caseId === "string" &&
    typeof entry.key === "string" &&
    typeof entry.text === "string" &&
    Array.isArray(entry.requiredFactIds) &&
    entry.requiredFactIds.every(
      (requiredFactId) => typeof requiredFactId === "string",
    ) &&
    Array.isArray(entry.requiredVars) &&
    entry.requiredVars.every((requiredVar) => isMindRequiredVar(requiredVar)) &&
    Array.isArray(entry.rewardEffects) &&
    entry.rewardEffects.every((effect) => isVnEffect(effect))
  );
};

const isVnRuntimeSettings = (value: unknown): value is VnRuntimeSettings => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const runtime = value as Record<string, unknown>;
  return (
    (runtime.skillCheckDice === undefined ||
      isVnDiceMode(runtime.skillCheckDice)) &&
    (runtime.defaultEntryScenarioId === undefined ||
      (typeof runtime.defaultEntryScenarioId === "string" &&
        runtime.defaultEntryScenarioId.trim().length > 0))
  );
};

const isQuestStageContent = (value: unknown): value is QuestStageContent => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const stage = value as Record<string, unknown>;
  return (
    typeof stage.stage === "number" &&
    Number.isFinite(stage.stage) &&
    Number.isInteger(stage.stage) &&
    stage.stage >= 1 &&
    typeof stage.title === "string" &&
    stage.title.trim().length > 0 &&
    typeof stage.objectiveHint === "string" &&
    stage.objectiveHint.trim().length > 0 &&
    (stage.objectivePointIds === undefined ||
      (Array.isArray(stage.objectivePointIds) &&
        stage.objectivePointIds.every(
          (pointId) => typeof pointId === "string",
        )))
  );
};

const isQuestCatalogEntry = (value: unknown): value is QuestCatalogEntry => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const entry = value as Record<string, unknown>;
  return (
    typeof entry.id === "string" &&
    entry.id.trim().length > 0 &&
    typeof entry.title === "string" &&
    entry.title.trim().length > 0 &&
    Array.isArray(entry.stages) &&
    entry.stages.length > 0 &&
    entry.stages.every((stage) => isQuestStageContent(stage))
  );
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
  if (!value || typeof value !== "object") {
    return false;
  }

  const condition = value as Record<string, unknown>;
  if (condition.type === "flag_is") {
    return (
      typeof condition.key === "string" && typeof condition.value === "boolean"
    );
  }
  if (condition.type === "var_gte" || condition.type === "var_lte") {
    return (
      typeof condition.key === "string" && typeof condition.value === "number"
    );
  }
  if (condition.type === "has_item") {
    return typeof condition.itemId === "string";
  }
  if (condition.type === "has_evidence") {
    return typeof condition.evidenceId === "string";
  }
  if (condition.type === "quest_stage_gte") {
    return (
      typeof condition.questId === "string" &&
      typeof condition.stage === "number"
    );
  }
  if (condition.type === "relationship_gte") {
    return (
      typeof condition.characterId === "string" &&
      typeof condition.value === "number"
    );
  }
  if (condition.type === "unlock_group_has") {
    return typeof condition.groupId === "string";
  }
  if (condition.type === "point_state_is") {
    return isMapPointState(condition.state);
  }
  if (condition.type === "logic_and" || condition.type === "logic_or") {
    return (
      Array.isArray(condition.conditions) &&
      condition.conditions.every((entry) => isMapCondition(entry))
    );
  }
  if (condition.type === "logic_not") {
    return isMapCondition(condition.condition);
  }

  return false;
};

const isMapAction = (value: unknown): value is MapAction => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const action = value as Record<string, unknown>;
  if (action.type === "start_scenario") {
    return typeof action.scenarioId === "string";
  }
  if (action.type === "travel_to") {
    return typeof action.locationId === "string";
  }
  if (action.type === "set_flag") {
    return typeof action.key === "string" && typeof action.value === "boolean";
  }
  if (action.type === "unlock_group") {
    return typeof action.groupId === "string";
  }
  if (action.type === "set_quest_stage") {
    return (
      typeof action.questId === "string" && typeof action.stage === "number"
    );
  }
  if (action.type === "grant_evidence") {
    return typeof action.evidenceId === "string";
  }
  if (action.type === "grant_xp") {
    return typeof action.amount === "number";
  }
  if (action.type === "change_relationship") {
    return (
      typeof action.characterId === "string" && typeof action.delta === "number"
    );
  }
  if (action.type === "track_event") {
    return typeof action.eventName === "string";
  }

  return false;
};

const isMapBinding = (value: unknown): value is MapBinding => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const binding = value as Record<string, unknown>;
  if (
    typeof binding.id !== "string" ||
    !isMapBindingTrigger(binding.trigger) ||
    typeof binding.label !== "string" ||
    typeof binding.priority !== "number" ||
    !Number.isFinite(binding.priority) ||
    !isMapBindingIntent(binding.intent)
  ) {
    return false;
  }

  if (!Array.isArray(binding.actions) || binding.actions.length === 0) {
    return false;
  }

  if (!binding.actions.every((entry) => isMapAction(entry))) {
    return false;
  }

  if (
    binding.conditions !== undefined &&
    (!Array.isArray(binding.conditions) ||
      !binding.conditions.every((entry) => isMapCondition(entry)))
  ) {
    return false;
  }

  return true;
};

const isMapRegion = (value: unknown): value is MapRegion => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const region = value as Record<string, unknown>;
  return (
    typeof region.id === "string" &&
    typeof region.name === "string" &&
    typeof region.geoCenterLat === "number" &&
    Number.isFinite(region.geoCenterLat) &&
    typeof region.geoCenterLng === "number" &&
    Number.isFinite(region.geoCenterLng) &&
    typeof region.zoom === "number" &&
    Number.isFinite(region.zoom)
  );
};

const isMapPoint = (value: unknown): value is MapPoint => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const point = value as Record<string, unknown>;
  return (
    typeof point.id === "string" &&
    typeof point.title === "string" &&
    typeof point.regionId === "string" &&
    typeof point.lat === "number" &&
    Number.isFinite(point.lat) &&
    typeof point.lng === "number" &&
    Number.isFinite(point.lng) &&
    (point.description === undefined ||
      typeof point.description === "string") &&
    (point.image === undefined || typeof point.image === "string") &&
    typeof point.locationId === "string" &&
    (point.defaultState === undefined ||
      isMapPointDefaultState(point.defaultState)) &&
    (point.unlockGroup === undefined ||
      typeof point.unlockGroup === "string") &&
    (point.isHiddenInitially === undefined ||
      typeof point.isHiddenInitially === "boolean") &&
    Array.isArray(point.bindings) &&
    point.bindings.every((entry) => isMapBinding(entry))
  );
};

const parseMapSnapshot = (
  payloadMap: unknown,
  schemaVersion: number,
  scenarios: VnScenario[],
): MapSnapshot | undefined => {
  if (payloadMap === undefined) {
    if (schemaVersion >= 3) {
      throw new SenderError(
        "payloadJson.map is required for schemaVersion >= 3",
      );
    }
    return undefined;
  }

  const mapPayload = asRecord(payloadMap, "payloadJson.map");
  if (typeof mapPayload.defaultRegionId !== "string") {
    throw new SenderError("payloadJson.map.defaultRegionId must be a string");
  }

  const rawRegions = Array.isArray(mapPayload.regions)
    ? mapPayload.regions
    : null;
  if (!rawRegions || !rawRegions.every((entry) => isMapRegion(entry))) {
    throw new SenderError("payloadJson.map.regions has invalid shape");
  }
  if (rawRegions.length === 0) {
    throw new SenderError("payloadJson.map.regions must not be empty");
  }

  const rawPoints = Array.isArray(mapPayload.points) ? mapPayload.points : null;
  if (!rawPoints || !rawPoints.every((entry) => isMapPoint(entry))) {
    throw new SenderError("payloadJson.map.points has invalid shape");
  }

  const regionIds = new Set<string>();
  for (const region of rawRegions) {
    if (regionIds.has(region.id)) {
      throw new SenderError(
        `payloadJson.map.regions contains duplicate id ${region.id}`,
      );
    }
    regionIds.add(region.id);
  }

  if (!regionIds.has(mapPayload.defaultRegionId)) {
    throw new SenderError(
      "payloadJson.map.defaultRegionId must reference an existing region",
    );
  }

  const scenarioIds = new Set(scenarios.map((scenario) => scenario.id));
  const pointIds = new Set<string>();
  const bindingIds = new Set<string>();

  for (const point of rawPoints) {
    if (pointIds.has(point.id)) {
      throw new SenderError(
        `payloadJson.map.points contains duplicate id ${point.id}`,
      );
    }
    pointIds.add(point.id);

    if (!regionIds.has(point.regionId)) {
      throw new SenderError(
        `payloadJson.map.points regionId is unknown for point ${point.id}`,
      );
    }

    for (const binding of point.bindings) {
      if (bindingIds.has(binding.id)) {
        throw new SenderError(
          `payloadJson.map.bindings contains duplicate id ${binding.id}`,
        );
      }
      bindingIds.add(binding.id);

      for (const action of binding.actions) {
        if (
          action.type === "start_scenario" &&
          !scenarioIds.has(action.scenarioId)
        ) {
          throw new SenderError(
            `payloadJson.map binding ${binding.id} references unknown scenario ${action.scenarioId}`,
          );
        }
      }
    }
  }

  return {
    defaultRegionId: mapPayload.defaultRegionId,
    regions: rawRegions,
    points: rawPoints,
  };
};

const parseQuestCatalog = (
  payloadQuestCatalog: unknown,
  schemaVersion: number,
): QuestCatalogEntry[] | undefined => {
  if (payloadQuestCatalog === undefined) {
    if (schemaVersion >= 4) {
      throw new SenderError(
        "payloadJson.questCatalog is required for schemaVersion >= 4",
      );
    }
    return undefined;
  }

  if (!Array.isArray(payloadQuestCatalog)) {
    throw new SenderError("payloadJson.questCatalog has invalid shape");
  }
  if (!payloadQuestCatalog.every((entry) => isQuestCatalogEntry(entry))) {
    throw new SenderError("payloadJson.questCatalog has invalid shape");
  }

  const questIds = new Set<string>();
  for (const quest of payloadQuestCatalog) {
    if (questIds.has(quest.id)) {
      throw new SenderError(
        `payloadJson.questCatalog contains duplicate id ${quest.id}`,
      );
    }
    questIds.add(quest.id);

    const stageNumbers = new Set<number>();
    for (const stage of quest.stages) {
      if (stageNumbers.has(stage.stage)) {
        throw new SenderError(
          `payloadJson.questCatalog quest ${quest.id} contains duplicate stage ${stage.stage}`,
        );
      }
      stageNumbers.add(stage.stage);
    }
  }

  return payloadQuestCatalog as QuestCatalogEntry[];
};

export const parseSnapshotPayload = (payloadJson: string): VnSnapshot => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(payloadJson);
  } catch (_error) {
    throw new SenderError("payloadJson must be valid JSON");
  }

  const payload = asRecord(parsed, "payloadJson");
  const schemaVersion = asNumber(
    payload.schemaVersion,
    "payloadJson.schemaVersion",
  );

  if (
    !Array.isArray(payload.scenarios) ||
    !payload.scenarios.every((entry) => isScenario(entry))
  ) {
    throw new SenderError("payloadJson.scenarios has invalid shape");
  }

  if (
    !Array.isArray(payload.nodes) ||
    !payload.nodes.every((entry) => isNode(entry))
  ) {
    throw new SenderError("payloadJson.nodes has invalid shape");
  }

  if (
    payload.vnRuntime !== undefined &&
    !isVnRuntimeSettings(payload.vnRuntime)
  ) {
    throw new SenderError("payloadJson.vnRuntime has invalid shape");
  }
  const vnRuntime =
    payload.vnRuntime === undefined ? undefined : payload.vnRuntime;
  const map = parseMapSnapshot(payload.map, schemaVersion, payload.scenarios);
  const questCatalog = parseQuestCatalog(payload.questCatalog, schemaVersion);

  if (payload.mindPalace === undefined) {
    if (schemaVersion >= 2) {
      throw new SenderError(
        "payloadJson.mindPalace is required for schemaVersion >= 2",
      );
    }

    return {
      schemaVersion,
      scenarios: payload.scenarios,
      nodes: payload.nodes,
      vnRuntime,
      map,
      questCatalog,
      mindPalace: {
        cases: [],
        facts: [],
        hypotheses: [],
      },
    };
  }

  const mindPalace = asRecord(payload.mindPalace, "payloadJson.mindPalace");
  const cases = Array.isArray(mindPalace.cases) ? mindPalace.cases : null;
  const facts = Array.isArray(mindPalace.facts) ? mindPalace.facts : null;
  const hypotheses = Array.isArray(mindPalace.hypotheses)
    ? mindPalace.hypotheses
    : null;

  if (!cases || !cases.every((entry) => isMindCaseContent(entry))) {
    throw new SenderError("payloadJson.mindPalace.cases has invalid shape");
  }
  if (!facts || !facts.every((entry) => isMindFactContent(entry))) {
    throw new SenderError("payloadJson.mindPalace.facts has invalid shape");
  }
  if (
    !hypotheses ||
    !hypotheses.every((entry) => isMindHypothesisContent(entry))
  ) {
    throw new SenderError(
      "payloadJson.mindPalace.hypotheses has invalid shape",
    );
  }

  return {
    schemaVersion,
    scenarios: payload.scenarios,
    nodes: payload.nodes,
    vnRuntime,
    map,
    questCatalog,
    mindPalace: {
      cases,
      facts,
      hypotheses,
    },
  };
};

export const identityKey = (identity: { toHexString(): string }): string =>
  identity.toHexString();

export const createFlagKey = (
  player: { toHexString(): string },
  key: string,
): string => `${identityKey(player)}::${key}`;

export const createVarKey = (
  player: { toHexString(): string },
  key: string,
): string => `${identityKey(player)}::${key}`;

export const createSessionKey = (
  player: { toHexString(): string },
  scenarioId: string,
): string => `${identityKey(player)}::${scenarioId}`;

export const createInventoryKey = (
  player: { toHexString(): string },
  itemId: string,
): string => `${identityKey(player)}::${itemId}`;

export const createQuestKey = (
  player: { toHexString(): string },
  questId: string,
): string => `${identityKey(player)}::${questId}`;

export const createEvidenceKey = (
  player: { toHexString(): string },
  evidenceId: string,
): string => `${identityKey(player)}::${evidenceId}`;

export const createRelationshipKey = (
  player: { toHexString(): string },
  characterId: string,
): string => `${identityKey(player)}::${characterId}`;

export const createUnlockGroupKey = (
  player: { toHexString(): string },
  groupId: string,
): string => `${identityKey(player)}::${groupId}`;

export const createPlayerMindCaseKey = (
  player: { toHexString(): string },
  caseId: string,
): string => `${identityKey(player)}::case::${caseId}`;

export const createPlayerMindFactKey = (
  player: { toHexString(): string },
  caseId: string,
  factId: string,
): string => `${identityKey(player)}::fact::${caseId}::${factId}`;

export const createPlayerMindHypothesisKey = (
  player: { toHexString(): string },
  caseId: string,
  hypothesisId: string,
): string => `${identityKey(player)}::hypothesis::${caseId}::${hypothesisId}`;

export const createHypothesisFocusFlagKey = (
  caseId: string,
  hypothesisId: string,
): string => `mind_focus::${caseId}::${hypothesisId}`;

export const createSkillCheckResultKey = (
  player: { toHexString(): string },
  scenarioId: string,
  nodeId: string,
  checkId: string,
): string =>
  `${identityKey(player)}::check::${scenarioId}::${nodeId}::${checkId}`;

// Deterministic hash seed for VN skill checks.
const hashDeterministicSeed = (
  timestamp: unknown,
  identity: { toHexString(): string },
  checkId: string,
): number => {
  const seed = `${String(timestamp)}::${identity.toHexString()}::${checkId}`;

  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }

  return hash >>> 0;
};

export const rollSkillDie = (
  timestamp: unknown,
  identity: { toHexString(): string },
  checkId: string,
  diceMode: VnDiceMode,
): number => {
  const hash = hashDeterministicSeed(timestamp, identity, checkId);
  const sides = diceMode === "d10" ? 10 : 20;
  return (hash % sides) + 1;
};

export const rollD20 = (
  timestamp: unknown,
  identity: { toHexString(): string },
  checkId: string,
): number => rollSkillDie(timestamp, identity, checkId, "d20");

export const ensurePlayerProfile = (ctx: any): void => {
  const profile = ctx.db.playerProfile.playerId.find(ctx.sender);
  if (!profile) {
    ctx.db.playerProfile.insert({
      playerId: ctx.sender,
      nickname: undefined,
      createdAt: ctx.timestamp,
      updatedAt: ctx.timestamp,
    });
  }

  const location = ctx.db.playerLocation.playerId.find(ctx.sender);
  if (!location) {
    ctx.db.playerLocation.insert({
      playerId: ctx.sender,
      locationId: "loc_intro",
      updatedAt: ctx.timestamp,
    });
  }
};

export const setNickname = (ctx: any, nickname: string): void => {
  const trimmed = nickname.trim();
  const profile = ctx.db.playerProfile.playerId.find(ctx.sender);
  if (!profile) {
    ctx.db.playerProfile.insert({
      playerId: ctx.sender,
      nickname: trimmed.length > 0 ? trimmed : undefined,
      createdAt: ctx.timestamp,
      updatedAt: ctx.timestamp,
    });
    return;
  }

  ctx.db.playerProfile.playerId.update({
    ...profile,
    nickname: trimmed.length > 0 ? trimmed : undefined,
    updatedAt: ctx.timestamp,
  });
};

export const getFlag = (ctx: any, key: string): boolean => {
  const row = ctx.db.playerFlag.flagId.find(createFlagKey(ctx.sender, key));
  return row?.value ?? false;
};

export const upsertFlag = (ctx: any, key: string, value: boolean): void => {
  assertNonEmpty(key, "key");
  ensurePlayerProfile(ctx);

  const flagId = createFlagKey(ctx.sender, key);
  const existing = ctx.db.playerFlag.flagId.find(flagId);
  if (existing) {
    ctx.db.playerFlag.flagId.update({
      ...existing,
      value,
      updatedAt: ctx.timestamp,
    });
    return;
  }

  ctx.db.playerFlag.insert({
    flagId,
    playerId: ctx.sender,
    key,
    value,
    updatedAt: ctx.timestamp,
  });
};

export const getVar = (ctx: any, key: string): number => {
  const row = ctx.db.playerVar.varId.find(createVarKey(ctx.sender, key));
  return row?.floatValue ?? 0;
};

export const upsertVar = (ctx: any, key: string, floatValue: number): void => {
  assertNonEmpty(key, "key");
  if (!Number.isFinite(floatValue)) {
    throw new SenderError("floatValue must be a finite number");
  }

  ensurePlayerProfile(ctx);

  const varId = createVarKey(ctx.sender, key);
  const existing = ctx.db.playerVar.varId.find(varId);
  if (existing) {
    ctx.db.playerVar.varId.update({
      ...existing,
      floatValue,
      updatedAt: ctx.timestamp,
    });
    return;
  }

  ctx.db.playerVar.insert({
    varId,
    playerId: ctx.sender,
    key,
    floatValue,
    updatedAt: ctx.timestamp,
  });
};

export const addToVar = (ctx: any, key: string, delta: number): void => {
  const current = getVar(ctx, key);
  upsertVar(ctx, key, current + delta);
};

export const upsertLocation = (ctx: any, locationId: string): void => {
  assertNonEmpty(locationId, "locationId");
  ensurePlayerProfile(ctx);

  const existing = ctx.db.playerLocation.playerId.find(ctx.sender);
  if (existing) {
    ctx.db.playerLocation.playerId.update({
      ...existing,
      locationId,
      updatedAt: ctx.timestamp,
    });
    return;
  }

  ctx.db.playerLocation.insert({
    playerId: ctx.sender,
    locationId,
    updatedAt: ctx.timestamp,
  });
};

export const emitTelemetry = (
  ctx: any,
  eventName: string,
  tags: Record<string, unknown> = {},
  value?: number,
): void => {
  assertNonEmpty(eventName, "eventName");
  ctx.db.telemetryEvent.insert({
    eventId: 0n,
    playerId: ctx.sender,
    eventName,
    tagsJson: JSON.stringify(tags),
    value,
    createdAt: ctx.timestamp,
  });
};

export const ensureIdempotent = (
  ctx: any,
  requestId: string,
  operation: string,
): void => {
  assertNonEmpty(requestId, "requestId");
  assertNonEmpty(operation, "operation");

  const idempotencyKey = `${identityKey(ctx.sender)}::${requestId}`;
  const existing = ctx.db.idempotencyLog.idempotencyKey.find(idempotencyKey);
  if (existing) {
    throw new SenderError(`Duplicate request for ${operation}`);
  }

  ctx.db.idempotencyLog.insert({
    idempotencyKey,
    playerId: ctx.sender,
    requestId,
    operation,
    createdAt: ctx.timestamp,
    expiresAt: new Timestamp(
      ctx.timestamp.microsSinceUnixEpoch + IDEMPOTENCY_TTL_MICROS,
    ),
  });
};

export const getActiveSnapshot = (
  ctx: any,
): { activeVersion: any; snapshot: VnSnapshot } => {
  const activeVersion = [...ctx.db.contentVersion.iter()].find(
    (row: any) => row.isActive,
  );
  if (!activeVersion) {
    throw new SenderError("No active content version");
  }

  const snapshotRow = ctx.db.contentSnapshot.checksum.find(
    activeVersion.checksum,
  );
  if (!snapshotRow) {
    throw new SenderError("Active content snapshot is missing");
  }

  return {
    activeVersion,
    snapshot: parseSnapshotPayload(snapshotRow.payloadJson),
  };
};

export const getScenario = (
  snapshot: VnSnapshot,
  scenarioId: string,
): VnScenario => {
  const scenario = snapshot.scenarios.find((entry) => entry.id === scenarioId);
  if (!scenario) {
    throw new SenderError(`Unknown scenario: ${scenarioId}`);
  }
  return scenario;
};

export const resolveDiceMode = (
  snapshot: VnSnapshot,
  scenarioId: string,
): VnDiceMode => {
  const scenario = snapshot.scenarios.find((entry) => entry.id === scenarioId);
  return (
    scenario?.skillCheckDice ?? snapshot.vnRuntime?.skillCheckDice ?? "d20"
  );
};

export const getNode = (snapshot: VnSnapshot, nodeId: string): VnNode => {
  const node = snapshot.nodes.find((entry) => entry.id === nodeId);
  if (!node) {
    throw new SenderError(`Unknown node: ${nodeId}`);
  }
  return node;
};

export const getMindPalace = (snapshot: VnSnapshot): MindPalaceSnapshot => ({
  cases: snapshot.mindPalace?.cases ?? [],
  facts: snapshot.mindPalace?.facts ?? [],
  hypotheses: snapshot.mindPalace?.hypotheses ?? [],
});

export const areConditionsSatisfied = (
  ctx: any,
  conditions: VnCondition[] | undefined,
): boolean => {
  if (!conditions || conditions.length === 0) {
    return true;
  }

  return conditions.every((condition) => {
    if (condition.type === "flag_equals") {
      return getFlag(ctx, condition.key) === condition.value;
    }
    if (condition.type === "var_gte") {
      return getVar(ctx, condition.key) >= condition.value;
    }
    if (condition.type === "var_lte") {
      return getVar(ctx, condition.key) <= condition.value;
    }
    if (condition.type === "has_evidence") {
      const evidenceKey = createEvidenceKey(ctx.sender, condition.evidenceId);
      return !!ctx.db.playerEvidence.evidenceKey.find(evidenceKey);
    }
    if (condition.type === "quest_stage_gte") {
      const questKey = createQuestKey(ctx.sender, condition.questId);
      const row = ctx.db.playerQuest.questKey.find(questKey);
      return row ? row.stage >= condition.stage : false;
    }
    if (condition.type === "relationship_gte") {
      const relKey = createRelationshipKey(ctx.sender, condition.characterId);
      const row = ctx.db.playerRelationship.relationshipKey.find(relKey);
      return row ? row.value >= condition.value : false;
    }
    if (condition.type === "has_item") {
      const inventoryKey = createInventoryKey(ctx.sender, condition.itemId);
      const row = ctx.db.playerInventory.inventoryKey.find(inventoryKey);
      return row ? row.quantity > 0 : false;
    }
    return false;
  });
};

export const isChoiceAllowed = (
  ctx: any,
  conditions: VnCondition[] | undefined,
): boolean => areConditionsSatisfied(ctx, conditions);

export const isNodeEntryAllowed = (
  ctx: any,
  node: Pick<VnNode, "preconditions">,
): boolean => areConditionsSatisfied(ctx, node.preconditions);

export const ensureMindCaseActive = (ctx: any, caseId: string): any => {
  assertNonEmpty(caseId, "caseId");

  const caseRow = ctx.db.mindCase.caseId.find(caseId);
  if (!caseRow || !caseRow.isActive) {
    throw new SenderError(`Unknown or inactive mind case: ${caseId}`);
  }

  return caseRow;
};

export const ensureMindFactForCase = (
  ctx: any,
  caseId: string,
  factId: string,
): any => {
  assertNonEmpty(factId, "factId");
  const fact = ctx.db.mindFact.factId.find(factId);
  if (!fact || fact.caseId !== caseId) {
    throw new SenderError(`Unknown fact ${factId} for case ${caseId}`);
  }

  return fact;
};

export const ensureMindHypothesisForCase = (
  ctx: any,
  caseId: string,
  hypothesisId: string,
): any => {
  assertNonEmpty(hypothesisId, "hypothesisId");
  const hypothesis = ctx.db.mindHypothesis.hypothesisId.find(hypothesisId);
  if (!hypothesis || hypothesis.caseId !== caseId) {
    throw new SenderError(
      `Unknown hypothesis ${hypothesisId} for case ${caseId}`,
    );
  }

  return hypothesis;
};

const ensurePlayerMindCaseRow = (ctx: any, caseId: string): any => {
  const playerCaseKey = createPlayerMindCaseKey(ctx.sender, caseId);
  const existing = ctx.db.playerMindCase.playerCaseKey.find(playerCaseKey);

  if (existing) {
    return existing;
  }

  const created = {
    playerCaseKey,
    playerId: ctx.sender,
    caseId,
    status: "in_progress",
    startedAt: ctx.timestamp,
    completedAt: undefined,
    updatedAt: ctx.timestamp,
  };
  ctx.db.playerMindCase.insert(created);
  return created;
};

const parseRequiredFactIds = (requiredFactIdsJson: string): string[] => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(requiredFactIdsJson);
  } catch (_error) {
    throw new SenderError("requiredFactIdsJson must be valid JSON");
  }

  return asStringArray(parsed, "requiredFactIdsJson");
};

const parseRequiredVars = (requiredVarsJson: string): MindRequiredVar[] => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(requiredVarsJson);
  } catch (_error) {
    throw new SenderError("requiredVarsJson must be valid JSON");
  }

  if (
    !Array.isArray(parsed) ||
    !parsed.every((entry) => isMindRequiredVar(entry))
  ) {
    throw new SenderError(
      "requiredVarsJson must be an array of {key, op, value}",
    );
  }

  return parsed;
};

const parseRewardEffects = (rewardEffectsJson: string): VnEffect[] => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rewardEffectsJson);
  } catch (_error) {
    throw new SenderError("rewardEffectsJson must be valid JSON");
  }

  if (!Array.isArray(parsed) || !parsed.every((effect) => isVnEffect(effect))) {
    throw new SenderError(
      "rewardEffectsJson must be an array of valid effects",
    );
  }

  return parsed;
};

export const discoverFactInternal = (
  ctx: any,
  caseId: string,
  factId: string,
  source: { sourceType: string; sourceId: string },
): boolean => {
  ensurePlayerProfile(ctx);
  ensureMindCaseActive(ctx, caseId);
  ensureMindFactForCase(ctx, caseId, factId);

  const playerCase = ensurePlayerMindCaseRow(ctx, caseId);
  if (playerCase.status !== "in_progress") {
    ctx.db.playerMindCase.playerCaseKey.update({
      ...playerCase,
      status: "in_progress",
      completedAt: undefined,
      updatedAt: ctx.timestamp,
    });
  }

  const playerFactKey = createPlayerMindFactKey(ctx.sender, caseId, factId);
  const existing = ctx.db.playerMindFact.playerFactKey.find(playerFactKey);
  if (existing) {
    return false;
  }

  ctx.db.playerMindFact.insert({
    playerFactKey,
    playerId: ctx.sender,
    caseId,
    factId,
    discoveredAt: ctx.timestamp,
  });

  emitTelemetry(ctx, "mind_fact_discovered", {
    caseId,
    factId,
    sourceType: source.sourceType,
    sourceId: source.sourceId,
  });

  return true;
};

const doesVarConditionPass = (
  ctx: any,
  requiredVar: MindRequiredVar,
): boolean => {
  const current = getVar(ctx, requiredVar.key);

  if (requiredVar.op === "gte") {
    return current >= requiredVar.value;
  }
  if (requiredVar.op === "lte") {
    return current <= requiredVar.value;
  }

  return current === requiredVar.value;
};

export const getHypothesisReadiness = (
  ctx: any,
  caseId: string,
  hypothesisRow: any,
): HypothesisReadiness => {
  const requiredFacts = parseRequiredFactIds(hypothesisRow.requiredFactIdsJson);
  const requiredVars = parseRequiredVars(hypothesisRow.requiredVarsJson);
  const rewardEffects = parseRewardEffects(hypothesisRow.rewardEffectsJson);

  const discoveredFacts = new Set<string>();
  for (const row of ctx.db.playerMindFact.iter()) {
    if (row.playerId.toHexString() !== ctx.sender.toHexString()) {
      continue;
    }
    if (row.caseId !== caseId) {
      continue;
    }
    discoveredFacts.add(row.factId);
  }

  const missingFacts = requiredFacts.filter(
    (requiredFactId) => !discoveredFacts.has(requiredFactId),
  );
  const failedVarConditions = requiredVars.filter(
    (requiredVar) => !doesVarConditionPass(ctx, requiredVar),
  );

  return {
    requiredFacts,
    requiredVars,
    rewardEffects,
    missingFacts,
    failedVarConditions,
    ready: missingFacts.length === 0 && failedVarConditions.length === 0,
  };
};

const maybeCompleteMindCase = (ctx: any, caseId: string): boolean => {
  const hypothesisRows = [...ctx.db.mindHypothesis.iter()].filter(
    (row) => row.caseId === caseId,
  );
  if (hypothesisRows.length === 0) {
    return false;
  }

  const validated = new Set<string>();
  for (const row of ctx.db.playerMindHypothesis.iter()) {
    if (row.playerId.toHexString() !== ctx.sender.toHexString()) {
      continue;
    }
    if (row.caseId !== caseId) {
      continue;
    }
    if (row.status === "validated") {
      validated.add(row.hypothesisId);
    }
  }

  const allValidated = hypothesisRows.every((row) =>
    validated.has(row.hypothesisId),
  );
  if (!allValidated) {
    return false;
  }

  const playerCaseKey = createPlayerMindCaseKey(ctx.sender, caseId);
  const caseRow = ctx.db.playerMindCase.playerCaseKey.find(playerCaseKey);
  if (!caseRow) {
    return false;
  }

  if (caseRow.status === "completed") {
    return false;
  }

  ctx.db.playerMindCase.playerCaseKey.update({
    ...caseRow,
    status: "completed",
    completedAt: ctx.timestamp,
    updatedAt: ctx.timestamp,
  });

  emitTelemetry(ctx, "mind_case_completed", {
    caseId,
  });

  return true;
};

export const validateHypothesisInternal = (
  ctx: any,
  caseId: string,
  hypothesisId: string,
): { caseCompleted: boolean } => {
  ensurePlayerProfile(ctx);
  ensureMindCaseActive(ctx, caseId);
  const hypothesis = ensureMindHypothesisForCase(ctx, caseId, hypothesisId);
  ensurePlayerMindCaseRow(ctx, caseId);

  const readiness = getHypothesisReadiness(ctx, caseId, hypothesis);
  if (!readiness.ready) {
    throw new SenderError("Hypothesis requirements are not satisfied");
  }

  const playerHypothesisKey = createPlayerMindHypothesisKey(
    ctx.sender,
    caseId,
    hypothesisId,
  );
  const existing =
    ctx.db.playerMindHypothesis.playerHypothesisKey.find(playerHypothesisKey);
  if (existing?.status === "validated") {
    throw new SenderError("Hypothesis already validated");
  }

  const nextRow = {
    playerHypothesisKey,
    playerId: ctx.sender,
    caseId,
    hypothesisId,
    status: "validated",
    validatedAt: ctx.timestamp,
    updatedAt: ctx.timestamp,
  };

  if (existing) {
    ctx.db.playerMindHypothesis.playerHypothesisKey.update({
      ...existing,
      ...nextRow,
    });
  } else {
    ctx.db.playerMindHypothesis.insert(nextRow);
  }

  applyEffects(ctx, readiness.rewardEffects);

  emitTelemetry(ctx, "mind_hypothesis_validated", {
    caseId,
    hypothesisId,
  });

  return {
    caseCompleted: maybeCompleteMindCase(ctx, caseId),
  };
};

export const applyEffects = (
  ctx: any,
  effects: VnEffect[] | undefined,
  source?: { sourceType: string; sourceId: string },
): void => {
  if (!effects || effects.length === 0) {
    return;
  }

  for (const effect of effects) {
    if (effect.type === "set_flag") {
      upsertFlag(ctx, effect.key, effect.value);
      continue;
    }
    if (effect.type === "set_var") {
      upsertVar(ctx, effect.key, effect.value);
      continue;
    }
    if (effect.type === "add_var") {
      addToVar(ctx, effect.key, effect.value);
      continue;
    }
    if (effect.type === "travel_to") {
      upsertLocation(ctx, effect.locationId);
      continue;
    }
    if (effect.type === "track_event") {
      emitTelemetry(ctx, effect.eventName, effect.tags ?? {}, effect.value);
      continue;
    }
    if (effect.type === "discover_fact") {
      discoverFactInternal(ctx, effect.caseId, effect.factId, {
        sourceType: source?.sourceType ?? "vn_effect",
        sourceId: source?.sourceId ?? `${effect.caseId}::${effect.factId}`,
      });
      continue;
    }

    // New effects
    if (effect.type === "grant_xp") {
      addToVar(ctx, "xp_total", effect.amount);
      continue;
    }

    if (effect.type === "set_quest_stage") {
      const questKey = createQuestKey(ctx.sender, effect.questId);
      const existing = ctx.db.playerQuest.questKey.find(questKey);
      if (existing) {
        if (effect.stage > existing.stage) {
          ctx.db.playerQuest.questKey.update({
            ...existing,
            stage: effect.stage,
            updatedAt: ctx.timestamp,
          });
        }
      } else {
        ctx.db.playerQuest.insert({
          questKey,
          playerId: ctx.sender,
          questId: effect.questId,
          stage: effect.stage,
          updatedAt: ctx.timestamp,
        });
      }
      continue;
    }

    if (effect.type === "change_relationship") {
      const relKey = createRelationshipKey(ctx.sender, effect.characterId);
      const existing = ctx.db.playerRelationship.relationshipKey.find(relKey);
      if (existing) {
        ctx.db.playerRelationship.relationshipKey.update({
          ...existing,
          value: existing.value + effect.delta,
          updatedAt: ctx.timestamp,
        });
      } else {
        ctx.db.playerRelationship.insert({
          relationshipKey: relKey,
          playerId: ctx.sender,
          characterId: effect.characterId,
          value: effect.delta,
          updatedAt: ctx.timestamp,
        });
      }
      continue;
    }

    if (effect.type === "unlock_group") {
      const unlockKey = createUnlockGroupKey(ctx.sender, effect.groupId);
      if (!ctx.db.playerUnlockGroup.unlockKey.find(unlockKey)) {
        ctx.db.playerUnlockGroup.insert({
          unlockKey,
          playerId: ctx.sender,
          groupId: effect.groupId,
          unlockedAt: ctx.timestamp,
        });
      }
      continue;
    }

    if (effect.type === "grant_evidence") {
      const evidenceKey = createEvidenceKey(ctx.sender, effect.evidenceId);
      if (!ctx.db.playerEvidence.evidenceKey.find(evidenceKey)) {
        ctx.db.playerEvidence.insert({
          evidenceKey,
          playerId: ctx.sender,
          evidenceId: effect.evidenceId,
          discoveredAt: ctx.timestamp,
        });
      }
      continue;
    }

    if (effect.type === "add_heat") {
      addToVar(ctx, "heat", effect.amount);
      continue;
    }

    if (effect.type === "add_tension") {
      addToVar(ctx, "tension", effect.amount);
      continue;
    }

    if (effect.type === "grant_influence") {
      addToVar(ctx, "influence_points", effect.amount);
      continue;
    }
  }
};

export const syncMindPalaceContentTables = (
  ctx: any,
  snapshot: VnSnapshot,
): void => {
  const mindPalace = getMindPalace(snapshot);

  for (const row of ctx.db.mindCase.iter()) {
    if (row.isActive) {
      ctx.db.mindCase.caseId.update({
        ...row,
        isActive: false,
        updatedAt: ctx.timestamp,
      });
    }
  }

  const staleFactIds = [...ctx.db.mindFact.iter()].map((row) => row.factId);
  for (const factId of staleFactIds) {
    ctx.db.mindFact.factId.delete(factId);
  }

  const staleHypothesisIds = [...ctx.db.mindHypothesis.iter()].map(
    (row) => row.hypothesisId,
  );
  for (const hypothesisId of staleHypothesisIds) {
    ctx.db.mindHypothesis.hypothesisId.delete(hypothesisId);
  }

  for (const caseDef of mindPalace.cases) {
    const existing = ctx.db.mindCase.caseId.find(caseDef.id);
    if (existing) {
      ctx.db.mindCase.caseId.update({
        ...existing,
        title: caseDef.title,
        schemaVersion: snapshot.schemaVersion,
        isActive: true,
        updatedAt: ctx.timestamp,
      });
    } else {
      ctx.db.mindCase.insert({
        caseId: caseDef.id,
        title: caseDef.title,
        schemaVersion: snapshot.schemaVersion,
        isActive: true,
        createdAt: ctx.timestamp,
        updatedAt: ctx.timestamp,
      });
    }
  }

  for (const factDef of mindPalace.facts) {
    ctx.db.mindFact.insert({
      factId: factDef.id,
      caseId: factDef.caseId,
      sourceType: factDef.sourceType,
      sourceId: factDef.sourceId,
      text: factDef.text,
      tagsJson: JSON.stringify(factDef.tags ?? {}),
      createdAt: ctx.timestamp,
    });
  }

  for (const hypothesisDef of mindPalace.hypotheses) {
    ctx.db.mindHypothesis.insert({
      hypothesisId: hypothesisDef.id,
      caseId: hypothesisDef.caseId,
      key: hypothesisDef.key,
      text: hypothesisDef.text,
      requiredFactIdsJson: JSON.stringify(hypothesisDef.requiredFactIds),
      requiredVarsJson: JSON.stringify(hypothesisDef.requiredVars),
      rewardEffectsJson: JSON.stringify(hypothesisDef.rewardEffects),
      createdAt: ctx.timestamp,
      updatedAt: ctx.timestamp,
    });
  }
};

export const resetForSchemaMigration = (ctx: any): void => {
  const contentVersions = [...ctx.db.contentVersion.iter()];
  for (const version of contentVersions) {
    ctx.db.contentVersion.version.delete(version.version);
  }

  const snapshots = [...ctx.db.contentSnapshot.iter()];
  for (const snapshot of snapshots) {
    ctx.db.contentSnapshot.checksum.delete(snapshot.checksum);
  }

  const sessions = [...ctx.db.vnSession.iter()];
  for (const session of sessions) {
    ctx.db.vnSession.sessionKey.delete(session.sessionKey);
  }

  const flags = [...ctx.db.playerFlag.iter()];
  for (const flag of flags) {
    ctx.db.playerFlag.flagId.delete(flag.flagId);
  }

  const vars = [...ctx.db.playerVar.iter()];
  for (const variable of vars) {
    ctx.db.playerVar.varId.delete(variable.varId);
  }

  const mindCases = [...ctx.db.mindCase.iter()];
  for (const caseRow of mindCases) {
    ctx.db.mindCase.caseId.delete(caseRow.caseId);
  }

  const mindFacts = [...ctx.db.mindFact.iter()];
  for (const fact of mindFacts) {
    ctx.db.mindFact.factId.delete(fact.factId);
  }

  const mindHypotheses = [...ctx.db.mindHypothesis.iter()];
  for (const hypothesis of mindHypotheses) {
    ctx.db.mindHypothesis.hypothesisId.delete(hypothesis.hypothesisId);
  }

  const playerMindCases = [...ctx.db.playerMindCase.iter()];
  for (const caseRow of playerMindCases) {
    ctx.db.playerMindCase.playerCaseKey.delete(caseRow.playerCaseKey);
  }

  const playerMindFacts = [...ctx.db.playerMindFact.iter()];
  for (const factRow of playerMindFacts) {
    ctx.db.playerMindFact.playerFactKey.delete(factRow.playerFactKey);
  }

  const playerMindHypotheses = [...ctx.db.playerMindHypothesis.iter()];
  for (const hypothesisRow of playerMindHypotheses) {
    ctx.db.playerMindHypothesis.playerHypothesisKey.delete(
      hypothesisRow.playerHypothesisKey,
    );
  }
};

export const deactivateContentVersions = (ctx: any): void => {
  const rows = [...ctx.db.contentVersion.iter()];
  for (const row of rows) {
    if (!row.isActive) {
      continue;
    }
    ctx.db.contentVersion.version.update({
      ...row,
      isActive: false,
      publishedAt: ctx.timestamp,
    });
  }
};

export const parseRequiredFactIdsJson = (
  requiredFactIdsJson: string,
): string[] => parseRequiredFactIds(requiredFactIdsJson);

export const parseRequiredVarsJson = (
  requiredVarsJson: string,
): MindRequiredVar[] => parseRequiredVars(requiredVarsJson);

export const parseRewardEffectsJson = (rewardEffectsJson: string): VnEffect[] =>
  parseRewardEffects(rewardEffectsJson);

export const parseTagsJsonObject = (
  tagsJson: string,
  fieldName: string,
): Record<string, unknown> => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(tagsJson);
  } catch (_error) {
    throw new SenderError(`${fieldName} must be valid JSON`);
  }

  return asRecord(parsed, fieldName);
};

export const parseBoolean = (value: unknown, fieldName: string): boolean =>
  asBoolean(value, fieldName);

export const parseNumber = (value: unknown, fieldName: string): number =>
  asNumber(value, fieldName);
