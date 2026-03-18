export type VnCondition =
  | { type: "flag_equals"; key: string; value: boolean }
  | { type: "var_gte"; key: string; value: number }
  | { type: "var_lte"; key: string; value: number }
  | { type: "has_evidence"; evidenceId: string }
  | { type: "quest_stage_gte"; questId: string; stage: number }
  | { type: "relationship_gte"; characterId: string; value: number }
  | { type: "has_item"; itemId: string }
  | { type: "favor_balance_gte"; npcId: string; value: number }
  | { type: "agency_standing_gte"; value: number }
  | { type: "rumor_state_is"; rumorId: string; status: RumorStateStatus }
  | { type: "career_rank_gte"; rankId: string }
  | { type: "voice_level_gte"; voiceId: string; value: number };

export type VnEffect =
  | { type: "set_flag"; key: string; value: boolean }
  | { type: "set_var"; key: string; value: number }
  | { type: "add_var"; key: string; value: number }
  | { type: "travel_to"; locationId: string }
  | {
      type: "open_command_mode";
      scenarioId: string;
      returnTab?: "map" | "vn";
    }
  | {
      type: "open_battle_mode";
      scenarioId: string;
      returnTab?: "map" | "vn";
    }
  | { type: "spawn_map_event"; templateId: string; ttlMinutes?: number }
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
  | {
      type: "change_favor_balance";
      npcId: string;
      delta: number;
      reason?: string;
    }
  | { type: "change_agency_standing"; delta: number; reason?: string }
  | {
      type: "change_faction_signal";
      factionId: string;
      delta: number;
      reason?: string;
    }
  | { type: "register_rumor"; rumorId: string }
  | {
      type: "verify_rumor";
      rumorId: string;
      verificationKind: RumorVerificationKind;
    }
  | {
      type: "record_service_criterion";
      criterionId: AgencyServiceCriterionId;
    }
  | { type: "grant_evidence"; evidenceId: string }
  | { type: "grant_item"; itemId: string; quantity: number }
  | { type: "add_heat"; amount: number }
  | { type: "add_tension"; amount: number }
  | { type: "grant_influence"; amount: number }
  | { type: "shift_awakening"; amount: number; exposureDelta?: number }
  | {
      type: "record_entity_observation";
      observationId: string;
      entityArchetypeId?: string;
      signatureIds?: string[];
    }
  | { type: "unlock_distortion_point"; pointId: string }
  | { type: "set_sight_mode"; mode: SightMode }
  | { type: "apply_rationalist_buffer"; amount: number }
  | { type: "tag_entity_signature"; signatureId: string };

export type VnDiceMode = "d20" | "d10";

export type VnCheckModifierSource =
  | "item"
  | "trait"
  | "voice_synergy"
  | "reputation"
  | "preparation";

export interface VnCheckModifier {
  source: VnCheckModifierSource;
  sourceId: string;
  delta: number;
  condition?: VnCondition;
}

export type VnOutcomeGrade =
  | "fail"
  | "success"
  | "critical"
  | "success_with_cost";

export type VnOutcomeModel = "binary" | "tiered";

export type VoicePresenceMode =
  | "text_variability"
  | "parliament"
  | "mechanical_voice";

export interface VnSkillCheckOutcomeBranch {
  nextNodeId?: string;
  effects?: VnEffect[];
}

export interface VnSkillCheckCostBranch extends VnSkillCheckOutcomeBranch {
  costEffects?: VnEffect[];
}

export interface VnSkillCheck {
  id: string;
  voiceId: string;
  difficulty: number;
  isPassive?: boolean;
  showChancePercent?: boolean;
  modifiers?: VnCheckModifier[];
  outcomeModel?: VnOutcomeModel;
  onSuccess?: VnSkillCheckOutcomeBranch;
  onFail?: VnSkillCheckOutcomeBranch;
  onCritical?: VnSkillCheckOutcomeBranch;
  onSuccessWithCost?: VnSkillCheckCostBranch;
}

export interface VnChoice {
  id: string;
  text: string;
  nextNodeId: string;
  choiceType?: "action" | "inquiry" | "flavor";
  visibleIfAll?: VnCondition[];
  visibleIfAny?: VnCondition[];
  requireAll?: VnCondition[];
  requireAny?: VnCondition[];
  /** Legacy alias for requireAll. Kept for backward compatibility. */
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

export type MysticAwakeningBand =
  | "suppressed"
  | "fractured"
  | "open"
  | "pierced";

export type SightMode = "rational" | "sensitive" | "ether";
export type NpcAvailabilityState =
  | "available"
  | "hidden"
  | "wounded"
  | "arrested"
  | "drunk"
  | "watching"
  | "on_the_run";
export type FactionSignalTrend = "rising" | "stable" | "falling";
export type RumorStateStatus = "registered" | "verified";
export type RumorVerificationKind =
  | "evidence"
  | "fact"
  | "service_unlock"
  | "map_unlock";
export type AgencyServiceCriterionId =
  | "verified_rumor_chain"
  | "preserved_source_network"
  | "clean_closure";
export type NpcRosterTier = "archetype" | "functional" | "major";
export type NpcServiceRole =
  | "information"
  | "archives"
  | "social_introduction"
  | "political_cover"
  | "transport";

export type MysticObservationKind =
  | "sighting"
  | "trace"
  | "echo"
  | "sample"
  | "theory";

export interface MysticEntityArchetype {
  id: string;
  label: string;
  veilLevel: number;
  signatures: string[];
  habitats: string[];
  temperament: string;
  witnessValue: number;
  rationalCoverStories: string[];
  allowedManifestations: string[];
}

export interface MysticObservationDefinition {
  id: string;
  kind: MysticObservationKind;
  title: string;
  text: string;
  entityArchetypeId?: string;
  signatureIds?: string[];
  rationalInterpretation?: string;
  unlockedByDefault?: boolean;
}

export interface MysticSnapshot {
  entityArchetypes: MysticEntityArchetype[];
  observations: MysticObservationDefinition[];
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

export interface NpcRuntimeIdentity {
  id: string;
  displayName: string;
  factionId: string;
  publicRole: string;
  rosterTier: NpcRosterTier;
  portraitUrl?: string;
  introFlag?: string;
  homePointId?: string;
  workPointId?: string;
  serviceIds?: string[];
}

export interface NpcServiceDefinition {
  id: string;
  npcId: string;
  role: NpcServiceRole;
  label: string;
  baseAccess: string;
  unlockFlag?: string;
  costNote?: string;
  qualityNote?: string;
  consequenceNote?: string;
}

export interface RumorTemplate {
  id: string;
  title: string;
  caseId: string;
  leadPointId?: string;
  sourceNpcId?: string;
  verifiesOn: RumorVerificationKind[];
  careerCriterionOnVerify?: AgencyServiceCriterionId;
}

export interface CareerRankDefinition {
  id: string;
  label: string;
  order: number;
  standingRequired: number;
  qualifyingCaseId?: string;
  serviceCriteriaNeeded: number;
  privileges: string[];
}

export interface SocialCatalogSnapshot {
  npcIdentities: NpcRuntimeIdentity[];
  services: NpcServiceDefinition[];
  rumors: RumorTemplate[];
  careerRanks: CareerRankDefinition[];
}

export type MapPointState = "locked" | "discovered" | "visited" | "completed";
export type MapPointDefaultState = "locked" | "discovered";
export type MapPointCategory =
  | "HUB"
  | "PUBLIC"
  | "SHADOW"
  | "EPHEMERAL"
  | "OCCULT";
export type MapBindingTrigger =
  | "card_primary"
  | "card_secondary"
  | "map_pin"
  | "auto";
export type MapBindingIntent = "objective" | "interaction" | "travel";
export type QrRedeemPolicy = "once_per_player" | "repeatable";
export type QrContentClass =
  | "full_scene"
  | "micro_event"
  | "evidence_fragment"
  | "repeatable_situation"
  | "social_node";
export type QrPolicyTier = "static" | "once_per_player" | "timeboxed_otp";

export type MapCondition =
  | { type: "flag_is"; key: string; value: boolean }
  | { type: "var_gte"; key: string; value: number }
  | { type: "var_lte"; key: string; value: number }
  | { type: "has_item"; itemId: string }
  | { type: "has_evidence"; evidenceId: string }
  | { type: "quest_stage_gte"; questId: string; stage: number }
  | { type: "relationship_gte"; characterId: string; value: number }
  | { type: "favor_balance_gte"; npcId: string; value: number }
  | { type: "agency_standing_gte"; value: number }
  | { type: "rumor_state_is"; rumorId: string; status: RumorStateStatus }
  | { type: "career_rank_gte"; rankId: string }
  | { type: "unlock_group_has"; groupId: string }
  | { type: "point_state_is"; state: MapPointState }
  | { type: "logic_and"; conditions: MapCondition[] }
  | { type: "logic_or"; conditions: MapCondition[] }
  | { type: "logic_not"; condition: MapCondition }
  | { type: "geofence_within"; lat: number; lng: number; radiusMeters: number };

export type MapAction =
  | { type: "start_scenario"; scenarioId: string }
  | { type: "travel_to"; locationId: string }
  | {
      type: "open_command_mode";
      scenarioId: string;
      returnTab?: "map" | "vn";
    }
  | {
      type: "open_battle_mode";
      scenarioId: string;
      returnTab?: "map" | "vn";
    }
  | { type: "spawn_map_event"; templateId: string; ttlMinutes?: number }
  | { type: "set_flag"; key: string; value: boolean }
  | { type: "unlock_group"; groupId: string }
  | { type: "set_quest_stage"; questId: string; stage: number }
  | { type: "grant_evidence"; evidenceId: string }
  | { type: "grant_xp"; amount: number }
  | { type: "change_relationship"; characterId: string; delta: number }
  | {
      type: "change_favor_balance";
      npcId: string;
      delta: number;
      reason?: string;
    }
  | { type: "change_agency_standing"; delta: number; reason?: string }
  | {
      type: "change_faction_signal";
      factionId: string;
      delta: number;
      reason?: string;
    }
  | { type: "register_rumor"; rumorId: string }
  | {
      type: "verify_rumor";
      rumorId: string;
      verificationKind: RumorVerificationKind;
    }
  | {
      type: "record_service_criterion";
      criterionId: AgencyServiceCriterionId;
    }
  | {
      type: "track_event";
      eventName: string;
      tags?: Record<string, unknown>;
      value?: number;
    }
  | { type: "shift_awakening"; amount: number; exposureDelta?: number }
  | {
      type: "record_entity_observation";
      observationId: string;
      entityArchetypeId?: string;
      signatureIds?: string[];
    }
  | { type: "unlock_distortion_point"; pointId: string }
  | { type: "set_sight_mode"; mode: SightMode }
  | { type: "apply_rationalist_buffer"; amount: number }
  | { type: "tag_entity_signature"; signatureId: string };

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
  category: MapPointCategory;
  description?: string;
  image?: string;
  locationId: string;
  defaultState?: MapPointDefaultState;
  unlockGroup?: string;
  isHiddenInitially?: boolean;
  visibilityModes?: SightMode[];
  distortionWindow?: {
    minAwakening?: number;
    maxAwakening?: number;
  };
  revealConditions?: MapCondition[];
  entitySignature?: string;
  rumorHookId?: string;
  bindings: MapBinding[];
}

export interface MapShadowRoute {
  id: string;
  regionId: string;
  pointIds: string[];
  color?: string;
  revealFlagsAll?: string[];
}

export interface MapEventTemplate {
  id: string;
  point: MapPointSnapshot;
  ttlMinutes?: number;
}

export interface MapQrCodeRegistryEntry {
  codeId: string;
  codeHash: string;
  redeemPolicy: QrRedeemPolicy;
  contentClass?: QrContentClass;
  policyTier?: QrPolicyTier;
  effects: VnEffect[];
  requiresFlagsAll?: string[];
  requiresBriefingBypass?: boolean;
}

export interface MapTestDefaults {
  defaultEventTtlMinutes?: number;
}

export interface MapSnapshot {
  defaultRegionId: string;
  regions: MapRegionSnapshot[];
  points: MapPointSnapshot[];
  shadowRoutes?: MapShadowRoute[];
  qrCodeRegistry?: MapQrCodeRegistryEntry[];
  mapEventTemplates?: MapEventTemplate[];
  testDefaults?: MapTestDefaults;
}

export interface VnSnapshot {
  schemaVersion: number;
  scenarios: VnScenario[];
  nodes: VnNode[];
  vnRuntime?: VnRuntimeSettings;
  mindPalace?: MindPalaceSnapshot;
  mysticism?: MysticSnapshot;
  map?: MapSnapshot;
  questCatalog?: QuestCatalogEntry[];
  socialCatalog?: SocialCatalogSnapshot;
}
