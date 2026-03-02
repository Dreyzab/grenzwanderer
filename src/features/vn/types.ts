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

export interface MapRegionSnapshot {
  id: string;
  name: string;
  geoCenterLat: number;
  geoCenterLng: number;
  zoom: number;
}

export interface MapPointSnapshot {
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
  regions: MapRegionSnapshot[];
  points: MapPointSnapshot[];
}

export interface VnSnapshot {
  schemaVersion: number;
  scenarios: VnScenario[];
  nodes: VnNode[];
  vnRuntime?: VnRuntimeSettings;
  mindPalace?: MindPalaceSnapshot;
  map?: MapSnapshot;
}
