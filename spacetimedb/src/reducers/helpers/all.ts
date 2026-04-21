import { Timestamp } from "spacetimedb";
import { SenderError } from "spacetimedb/server";
import {
  LEGACY_REPUTATION_VAR_BY_FACTION_ID,
  isAllowedFactionId,
  isFactionDefinition,
  type FactionDefinition,
} from "../../../../data/factionContract";
import {
  hasMixedSpeakerPool,
  isInnerVoiceId,
  isSpeakerId,
  isSkillVoiceId,
  PSYCHE_VAR_KEYS,
  resolvePsycheVarKey,
  type PsycheAxis,
} from "../../../../data/innerVoiceContract";
import { getFactionIdValidationError } from "./factionSignalGuard";
import {
  getBattleCard,
  getBattleScenario,
  type BattleCardDefinition,
  type BattleCardEffect,
  type BattleCardEffectTarget,
  type BattleScenarioTemplate,
} from "./battle_catalog";
import {
  NARRATIVE_RESOURCE_DEFAULTS,
  RESOURCE_FORTUNE_MOD_VAR,
  RESOURCE_KARMA_VAR,
  isNarrativeResourceKey,
  normalizeNarrativeResourceValue,
  resolveKarmaBand as sharedResolveKarmaBand,
  resolveKarmaDifficultyDelta as sharedResolveKarmaDifficultyDelta,
  type NarrativeResourceKey,
  type VnAiMode,
} from "../../../../src/shared/game/narrativeResources";

const IDEMPOTENCY_TTL_MICROS = 86_400_000_000n;

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

export type VnConditionLeaf =
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
  | { type: "voice_level_gte"; voiceId: string; value: number }
  | { type: "spirit_state_is"; spiritId: string; state: string }
  | { type: "hypothesis_focus_is"; caseId: string; hypothesisId: string }
  | { type: "thought_state_is"; thoughtId: string; state: string }
  | { type: "has_controlled_spirit"; entityArchetypeId: string };

export type VnCondition =
  | VnConditionLeaf
  | { type: "logic_and"; conditions: VnCondition[] }
  | { type: "logic_or"; conditions: VnCondition[] }
  | { type: "logic_not"; condition: VnCondition };

export type VnEffect =
  | { type: "set_flag"; key: string; value: boolean }
  | { type: "set_var"; key: string; value: number }
  | { type: "add_var"; key: string; value: number }
  | { type: "travel_to"; locationId: string }
  | {
      type: "open_command_mode";
      scenarioId: string;
      returnTab?: CommandReturnTab;
    }
  | {
      type: "open_battle_mode";
      scenarioId: string;
      returnTab?: CommandReturnTab;
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
  | { type: "tag_entity_signature"; signatureId: string }
  | { type: "change_psyche_axis"; axis: PsycheAxis; delta: number }
  | { type: "subjugate_spirit"; spiritId: string }
  | { type: "destroy_spirit"; spiritId: string }
  | { type: "imprison_spirit"; spiritId: string; requiredItemId?: string }
  | { type: "release_spirit"; spiritId: string };

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
  karmaSensitive?: boolean;
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
  aiMode?: VnAiMode;
  providenceCost?: number;
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
  voicePresenceMode?: VoicePresenceMode;
  activeSpeakers?: string[];
  aiModeDefault?: VnAiMode;
  providenceCostDefault?: number;
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
  releaseProfile?: "default" | "karlsruhe_event";
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
  factions?: FactionDefinition[];
  npcIdentities: NpcRuntimeIdentity[];
  services: NpcServiceDefinition[];
  rumors: RumorTemplate[];
  careerRanks: CareerRankDefinition[];
}

export type MapPointState = "locked" | "discovered" | "visited" | "completed";
export type MapPointDefaultState = "locked" | "discovered";
export type MapPointCategory = "HUB" | "PUBLIC" | "SHADOW" | "EPHEMERAL";
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
      returnTab?: CommandReturnTab;
    }
  | {
      type: "open_battle_mode";
      scenarioId: string;
      returnTab?: CommandReturnTab;
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

export type CommandReturnTab = "map" | "vn";
export type CommandPhase =
  | "briefing"
  | "orders"
  | "resolving"
  | "result"
  | "closed";
export type CommandMemberAvailability = "available" | "locked";
export type BattleReturnTab = CommandReturnTab | "dev";
export type BattleSourceTab = BattleReturnTab;
export type BattlePhase = "player_turn" | "enemy_turn" | "result" | "closed";
export type BattleResultType = "victory" | "defeat";
export type BattleSide = "player" | "enemy";
export type BattleZone = "deck" | "hand" | "discard";

interface CommandActorTemplate {
  actorId: string;
  label: string;
  role: string;
  notes?: string;
  sortOrder: number;
  trustCharacterId?: string;
  alwaysAvailable?: boolean;
  unlockFlag?: string;
  minimumRelationship?: {
    characterId: string;
    value: number;
  };
}

interface CommandOrderTemplate {
  id: string;
  actorId: string;
  label: string;
  description: string;
  effectPreview: string;
  resultTitle: string;
  resultSummary: string;
  effects: VnEffect[];
}

interface CommandScenarioTemplate {
  id: string;
  title: string;
  briefing: string;
  actors: readonly CommandActorTemplate[];
  orders: readonly CommandOrderTemplate[];
}

export interface CommandActorPresentation {
  actorId: string;
  label: string;
  role: string;
  availability: CommandMemberAvailability;
  trust: number;
  notes?: string;
  sortOrder: number;
}

export interface CommandOrderPresentation {
  id: string;
  actorId: string;
  label: string;
  description: string;
  effectPreview: string;
  disabled: boolean;
  disabledReason?: string;
}

const COMMAND_SCENARIOS: readonly CommandScenarioTemplate[] = [
  {
    id: "agency_evening_briefing",
    title: "Agency Evening Briefing",
    briefing:
      "The bureau has three leads that can be pursued before dawn. You only have time to commit one operative package before the city shutters its archives and telegraph offices.",
    actors: [
      {
        actorId: "inspector",
        label: "Inspector",
        role: "Field Lead",
        notes: "Always available to execute direct surveillance orders.",
        sortOrder: 0,
        alwaysAvailable: true,
      },
      {
        actorId: "npc_anna_mahler",
        label: "Anna Mahler",
        role: "Informant",
        notes:
          "Unlocks once Anna has been met or her trust has started to move.",
        sortOrder: 1,
        trustCharacterId: "npc_anna_mahler",
        unlockFlag: "met_anna_intro",
        minimumRelationship: {
          characterId: "npc_anna_mahler",
          value: 1,
        },
      },
      {
        actorId: "npc_archivist_otto",
        label: "Archivist Otto",
        role: "Records Specialist",
        notes: "Requires a standing connection to the Rathaus archives.",
        sortOrder: 2,
        trustCharacterId: "npc_archivist_otto",
        unlockFlag: "archive_pass_granted",
        minimumRelationship: {
          characterId: "npc_archivist_otto",
          value: 1,
        },
      },
    ],
    orders: [
      {
        id: "deploy_inspector_watch",
        actorId: "inspector",
        label: "Deploy Night Watch",
        description:
          "Place the inspector on a fixed surveillance route near the station quarter.",
        effectPreview:
          "Reveal a fresh investigative angle and bank experience.",
        resultTitle: "Night Watch Assigned",
        resultSummary:
          "The inspector locks down the station quarter and marks suspicious traffic before dawn.",
        effects: [
          { type: "set_flag", key: "command_watch_assigned", value: true },
          { type: "grant_xp", amount: 5 },
        ],
      },
      {
        id: "request_anna_network",
        actorId: "npc_anna_mahler",
        label: "Tap Anna's Network",
        description:
          "Ask Anna to circulate questions through her café and messenger routes.",
        effectPreview: "Gain a rumor lead and deepen Anna's trust.",
        resultTitle: "Anna Activates Her Network",
        resultSummary:
          "Anna puts her quiet channels to work and sends back a tighter rumor net before first light.",
        effects: [
          { type: "set_flag", key: "command_anna_network_ready", value: true },
          { type: "register_rumor", rumorId: "rumor_bank_rail_yard" },
          {
            type: "record_service_criterion",
            criterionId: "preserved_source_network",
          },
          {
            type: "change_relationship",
            characterId: "npc_anna_mahler",
            delta: 1,
          },
        ],
      },
      {
        id: "pull_archive_packet",
        actorId: "npc_archivist_otto",
        label: "Pull Archive Packet",
        description:
          "Have Otto prepare registry extracts and compare sealed filing movements.",
        effectPreview:
          "Prepare an archive packet and reduce later search friction.",
        resultTitle: "Archive Packet Prepared",
        resultSummary:
          "Otto assembles a precise packet of municipal records and flags anomalies for the next sweep.",
        effects: [
          {
            type: "set_flag",
            key: "command_archive_packet_ready",
            value: true,
          },
          { type: "grant_xp", amount: 3 },
        ],
      },
    ],
  },
];

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
  point: MapPoint;
  ttlMinutes?: number;
}

export interface MapQrCodeRegistryEntry {
  codeId: string;
  codeHash: string;
  redeemPolicy: QrRedeemPolicy;
  contentClass?: QrContentClass;
  policyTier?: QrPolicyTier;
  conditions?: MapCondition[];
  effects: VnEffect[];
  requiresFlagsAll?: string[];
  requiresBriefingBypass?: boolean;
}

export interface MapTestDefaults {
  defaultEventTtlMinutes?: number;
}

export interface MapSnapshot {
  defaultRegionId: string;
  regions: MapRegion[];
  points: MapPoint[];
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

const isVoicePresenceMode = (value: unknown): value is VoicePresenceMode =>
  value === "text_variability" ||
  value === "parliament" ||
  value === "mechanical_voice";

const isVnCondition = (value: unknown): value is VnCondition => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const condition = value as Record<string, unknown>;
  if (condition.type === "logic_and" || condition.type === "logic_or") {
    return (
      Array.isArray(condition.conditions) &&
      condition.conditions.length > 0 &&
      condition.conditions.every((entry) => isVnCondition(entry))
    );
  }
  if (condition.type === "logic_not") {
    return isVnCondition(condition.condition);
  }
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
  if (condition.type === "favor_balance_gte") {
    return (
      typeof condition.npcId === "string" && typeof condition.value === "number"
    );
  }
  if (condition.type === "agency_standing_gte") {
    return typeof condition.value === "number";
  }
  if (condition.type === "rumor_state_is") {
    return (
      typeof condition.rumorId === "string" &&
      (condition.status === "registered" || condition.status === "verified")
    );
  }
  if (condition.type === "career_rank_gte") {
    return typeof condition.rankId === "string";
  }
  if (condition.type === "voice_level_gte") {
    return (
      typeof condition.voiceId === "string" &&
      isSkillVoiceId(condition.voiceId) &&
      typeof condition.value === "number"
    );
  }
  if (condition.type === "spirit_state_is") {
    return (
      typeof condition.spiritId === "string" &&
      (condition.state === "hostile" ||
        condition.state === "imprisoned" ||
        condition.state === "controlled" ||
        condition.state === "destroyed")
    );
  }
  if (condition.type === "has_controlled_spirit") {
    return typeof condition.entityArchetypeId === "string";
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
  if (effect.type === "open_command_mode") {
    return (
      typeof effect.scenarioId === "string" &&
      (effect.returnTab === undefined ||
        effect.returnTab === "map" ||
        effect.returnTab === "vn")
    );
  }
  if (effect.type === "open_battle_mode") {
    return (
      typeof effect.scenarioId === "string" &&
      (effect.returnTab === undefined ||
        effect.returnTab === "map" ||
        effect.returnTab === "vn")
    );
  }
  if (effect.type === "spawn_map_event") {
    return (
      typeof effect.templateId === "string" &&
      (effect.ttlMinutes === undefined || typeof effect.ttlMinutes === "number")
    );
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
  if (effect.type === "change_favor_balance") {
    return (
      typeof effect.npcId === "string" &&
      typeof effect.delta === "number" &&
      (effect.reason === undefined || typeof effect.reason === "string")
    );
  }
  if (effect.type === "change_agency_standing") {
    return (
      typeof effect.delta === "number" &&
      (effect.reason === undefined || typeof effect.reason === "string")
    );
  }
  if (effect.type === "change_faction_signal") {
    return (
      typeof effect.factionId === "string" &&
      typeof effect.delta === "number" &&
      (effect.reason === undefined || typeof effect.reason === "string")
    );
  }
  if (effect.type === "register_rumor") {
    return typeof effect.rumorId === "string";
  }
  if (effect.type === "verify_rumor") {
    return (
      typeof effect.rumorId === "string" &&
      (effect.verificationKind === "evidence" ||
        effect.verificationKind === "fact" ||
        effect.verificationKind === "service_unlock" ||
        effect.verificationKind === "map_unlock")
    );
  }
  if (effect.type === "record_service_criterion") {
    return (
      effect.criterionId === "verified_rumor_chain" ||
      effect.criterionId === "preserved_source_network" ||
      effect.criterionId === "clean_closure"
    );
  }
  if (effect.type === "grant_evidence") {
    return typeof effect.evidenceId === "string";
  }
  if (effect.type === "grant_item") {
    return (
      typeof effect.itemId === "string" && typeof effect.quantity === "number"
    );
  }
  if (
    effect.type === "add_heat" ||
    effect.type === "add_tension" ||
    effect.type === "grant_influence"
  ) {
    return typeof effect.amount === "number";
  }
  if (effect.type === "shift_awakening") {
    return (
      typeof effect.amount === "number" &&
      (effect.exposureDelta === undefined ||
        typeof effect.exposureDelta === "number")
    );
  }
  if (effect.type === "record_entity_observation") {
    return (
      typeof effect.observationId === "string" &&
      (effect.entityArchetypeId === undefined ||
        typeof effect.entityArchetypeId === "string") &&
      (effect.signatureIds === undefined ||
        (Array.isArray(effect.signatureIds) &&
          effect.signatureIds.every((entry) => typeof entry === "string")))
    );
  }
  if (effect.type === "unlock_distortion_point") {
    return typeof effect.pointId === "string";
  }
  if (effect.type === "set_sight_mode") {
    return (
      effect.mode === "rational" ||
      effect.mode === "sensitive" ||
      effect.mode === "ether"
    );
  }
  if (effect.type === "apply_rationalist_buffer") {
    return typeof effect.amount === "number";
  }
  if (effect.type === "tag_entity_signature") {
    return typeof effect.signatureId === "string";
  }
  if (effect.type === "change_psyche_axis") {
    return (
      (effect.axis === "x" ||
        effect.axis === "y" ||
        effect.axis === "approach") &&
      typeof effect.delta === "number"
    );
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
  const isModifierSource = (source: unknown): boolean =>
    source === "item" ||
    source === "trait" ||
    source === "voice_synergy" ||
    source === "reputation" ||
    source === "preparation";
  const isOutcomeModel = (model: unknown): boolean =>
    model === "binary" || model === "tiered";
  const isOutcomeBranch = (branch: unknown): boolean => {
    if (branch === undefined) {
      return true;
    }
    if (!branch || typeof branch !== "object") {
      return false;
    }

    const candidate = branch as Record<string, unknown>;
    return (
      (candidate.nextNodeId === undefined ||
        typeof candidate.nextNodeId === "string") &&
      (candidate.effects === undefined ||
        (Array.isArray(candidate.effects) &&
          candidate.effects.every((entry: unknown) => isVnEffect(entry))))
    );
  };
  const isCostBranch = (branch: unknown): boolean =>
    isOutcomeBranch(branch) &&
    (!branch ||
      (() => {
        const candidate = branch as Record<string, unknown>;
        return (
          candidate.costEffects === undefined ||
          (Array.isArray(candidate.costEffects) &&
            candidate.costEffects.every((entry: unknown) => isVnEffect(entry)))
        );
      })());
  return (
    typeof check.id === "string" &&
    typeof check.voiceId === "string" &&
    isSkillVoiceId(check.voiceId) &&
    typeof check.difficulty === "number" &&
    (check.isPassive === undefined || typeof check.isPassive === "boolean") &&
    (check.showChancePercent === undefined ||
      typeof check.showChancePercent === "boolean") &&
    (check.modifiers === undefined ||
      (Array.isArray(check.modifiers) &&
        check.modifiers.every(
          (modifier) =>
            !!modifier &&
            typeof modifier === "object" &&
            isModifierSource((modifier as Record<string, unknown>).source) &&
            typeof (modifier as Record<string, unknown>).sourceId ===
              "string" &&
            typeof (modifier as Record<string, unknown>).delta === "number" &&
            ((modifier as Record<string, unknown>).condition === undefined ||
              isVnCondition((modifier as Record<string, unknown>).condition)),
        ))) &&
    (check.outcomeModel === undefined || isOutcomeModel(check.outcomeModel)) &&
    isOutcomeBranch(check.onSuccess) &&
    isOutcomeBranch(check.onFail) &&
    isOutcomeBranch(check.onCritical) &&
    isCostBranch(check.onSuccessWithCost)
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
    choice.visibleIfAll !== undefined &&
    (!Array.isArray(choice.visibleIfAll) ||
      !choice.visibleIfAll.every((entry) => isVnCondition(entry)))
  ) {
    return false;
  }

  if (
    choice.visibleIfAny !== undefined &&
    (!Array.isArray(choice.visibleIfAny) ||
      !choice.visibleIfAny.every((entry) => isVnCondition(entry)))
  ) {
    return false;
  }

  if (
    choice.requireAll !== undefined &&
    (!Array.isArray(choice.requireAll) ||
      !choice.requireAll.every((entry) => isVnCondition(entry)))
  ) {
    return false;
  }

  if (
    choice.requireAny !== undefined &&
    (!Array.isArray(choice.requireAny) ||
      !choice.requireAny.every((entry) => isVnCondition(entry)))
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
  if (
    choice.innerVoiceHints !== undefined &&
    (!Array.isArray(choice.innerVoiceHints) ||
      !choice.innerVoiceHints.every(
        (entry) =>
          !!entry &&
          typeof entry === "object" &&
          typeof (entry as Record<string, unknown>).voiceId === "string" &&
          isInnerVoiceId(
            (entry as Record<string, unknown>).voiceId as string,
          ) &&
          (((entry as Record<string, unknown>).stance as unknown) ===
            "supports" ||
            ((entry as Record<string, unknown>).stance as unknown) ===
              "opposes") &&
          typeof (entry as Record<string, unknown>).text === "string",
      ))
  ) {
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
    (node.backgroundUrl === undefined ||
      typeof node.backgroundUrl === "string") &&
    (node.characterId === undefined || typeof node.characterId === "string") &&
    (node.voicePresenceMode === undefined ||
      isVoicePresenceMode(node.voicePresenceMode)) &&
    (node.activeSpeakers === undefined ||
      (Array.isArray(node.activeSpeakers) &&
        node.activeSpeakers.every(
          (entry) => typeof entry === "string" && isSpeakerId(entry),
        ) &&
        !hasMixedSpeakerPool(node.activeSpeakers))) &&
    (node.terminal === undefined || typeof node.terminal === "boolean") &&
    Array.isArray(node.choices) &&
    node.choices.every((entry) => isChoice(entry)) &&
    (node.onEnter === undefined ||
      (Array.isArray(node.onEnter) &&
        node.onEnter.every((entry) => isVnEffect(entry)))) &&
    (node.preconditions === undefined ||
      (Array.isArray(node.preconditions) &&
        node.preconditions.every((entry) => isVnCondition(entry)))) &&
    (node.passiveChecks === undefined ||
      (Array.isArray(node.passiveChecks) &&
        node.passiveChecks.every((entry) => isSkillCheck(entry))))
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
        runtime.defaultEntryScenarioId.trim().length > 0)) &&
    (runtime.releaseProfile === undefined ||
      runtime.releaseProfile === "default" ||
      runtime.releaseProfile === "karlsruhe_event")
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
  if (condition.type === "favor_balance_gte") {
    return (
      typeof condition.npcId === "string" && typeof condition.value === "number"
    );
  }
  if (condition.type === "agency_standing_gte") {
    return typeof condition.value === "number";
  }
  if (condition.type === "rumor_state_is") {
    return (
      typeof condition.rumorId === "string" &&
      (condition.status === "registered" || condition.status === "verified")
    );
  }
  if (condition.type === "career_rank_gte") {
    return typeof condition.rankId === "string";
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
  if (condition.type === "geofence_within") {
    return (
      typeof condition.lat === "number" &&
      typeof condition.lng === "number" &&
      typeof condition.radiusMeters === "number"
    );
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
  if (action.type === "open_command_mode") {
    return (
      typeof action.scenarioId === "string" &&
      (action.returnTab === undefined ||
        action.returnTab === "map" ||
        action.returnTab === "vn")
    );
  }
  if (action.type === "open_battle_mode") {
    return (
      typeof action.scenarioId === "string" &&
      (action.returnTab === undefined ||
        action.returnTab === "map" ||
        action.returnTab === "vn")
    );
  }
  if (action.type === "spawn_map_event") {
    return (
      typeof action.templateId === "string" &&
      (action.ttlMinutes === undefined || typeof action.ttlMinutes === "number")
    );
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
  if (action.type === "change_favor_balance") {
    return (
      typeof action.npcId === "string" &&
      typeof action.delta === "number" &&
      (action.reason === undefined || typeof action.reason === "string")
    );
  }
  if (action.type === "change_agency_standing") {
    return (
      typeof action.delta === "number" &&
      (action.reason === undefined || typeof action.reason === "string")
    );
  }
  if (action.type === "change_faction_signal") {
    return (
      typeof action.factionId === "string" &&
      typeof action.delta === "number" &&
      (action.reason === undefined || typeof action.reason === "string")
    );
  }
  if (action.type === "register_rumor") {
    return typeof action.rumorId === "string";
  }
  if (action.type === "verify_rumor") {
    return (
      typeof action.rumorId === "string" &&
      (action.verificationKind === "evidence" ||
        action.verificationKind === "fact" ||
        action.verificationKind === "service_unlock" ||
        action.verificationKind === "map_unlock")
    );
  }
  if (action.type === "record_service_criterion") {
    return (
      action.criterionId === "verified_rumor_chain" ||
      action.criterionId === "preserved_source_network" ||
      action.criterionId === "clean_closure"
    );
  }
  if (action.type === "track_event") {
    return typeof action.eventName === "string";
  }
  if (action.type === "shift_awakening") {
    return (
      typeof action.amount === "number" &&
      (action.exposureDelta === undefined ||
        typeof action.exposureDelta === "number")
    );
  }
  if (action.type === "record_entity_observation") {
    return (
      typeof action.observationId === "string" &&
      (action.entityArchetypeId === undefined ||
        typeof action.entityArchetypeId === "string") &&
      (action.signatureIds === undefined ||
        (Array.isArray(action.signatureIds) &&
          action.signatureIds.every((entry) => typeof entry === "string")))
    );
  }
  if (action.type === "unlock_distortion_point") {
    return typeof action.pointId === "string";
  }
  if (action.type === "set_sight_mode") {
    return (
      action.mode === "rational" ||
      action.mode === "sensitive" ||
      action.mode === "ether"
    );
  }
  if (action.type === "apply_rationalist_buffer") {
    return typeof action.amount === "number";
  }
  if (action.type === "tag_entity_signature") {
    return typeof action.signatureId === "string";
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

const isDistortionWindow = (value: unknown): boolean =>
  value === undefined ||
  (typeof value === "object" &&
    value !== null &&
    ((value as { minAwakening?: unknown }).minAwakening === undefined ||
      typeof (value as { minAwakening?: unknown }).minAwakening === "number") &&
    ((value as { maxAwakening?: unknown }).maxAwakening === undefined ||
      typeof (value as { maxAwakening?: unknown }).maxAwakening === "number"));

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
    isMapPointCategory(point.category) &&
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
    (point.visibilityModes === undefined ||
      (Array.isArray(point.visibilityModes) &&
        point.visibilityModes.every(
          (entry) =>
            entry === "rational" || entry === "sensitive" || entry === "ether",
        ))) &&
    isDistortionWindow(point.distortionWindow) &&
    (point.revealConditions === undefined ||
      (Array.isArray(point.revealConditions) &&
        point.revealConditions.every((entry) => isMapCondition(entry)))) &&
    (point.entitySignature === undefined ||
      typeof point.entitySignature === "string") &&
    (point.rumorHookId === undefined ||
      typeof point.rumorHookId === "string") &&
    Array.isArray(point.bindings) &&
    point.bindings.every((entry) => isMapBinding(entry))
  );
};

const isMapShadowRoute = (value: unknown): value is MapShadowRoute => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const route = value as Record<string, unknown>;
  return (
    typeof route.id === "string" &&
    typeof route.regionId === "string" &&
    Array.isArray(route.pointIds) &&
    route.pointIds.every((pointId) => typeof pointId === "string") &&
    (route.color === undefined || typeof route.color === "string") &&
    (route.revealFlagsAll === undefined ||
      (Array.isArray(route.revealFlagsAll) &&
        route.revealFlagsAll.every((flag) => typeof flag === "string")))
  );
};

const isMapEventTemplate = (value: unknown): value is MapEventTemplate => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const template = value as Record<string, unknown>;
  return (
    typeof template.id === "string" &&
    isMapPoint(template.point) &&
    (template.ttlMinutes === undefined ||
      typeof template.ttlMinutes === "number")
  );
};

const isMapQrCodeRegistryEntry = (
  value: unknown,
): value is MapQrCodeRegistryEntry => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const entry = value as Record<string, unknown>;
  return (
    typeof entry.codeId === "string" &&
    typeof entry.codeHash === "string" &&
    /^[a-f0-9]{64}$/.test(entry.codeHash) &&
    isQrRedeemPolicy(entry.redeemPolicy) &&
    (entry.contentClass === undefined ||
      entry.contentClass === "full_scene" ||
      entry.contentClass === "micro_event" ||
      entry.contentClass === "evidence_fragment" ||
      entry.contentClass === "repeatable_situation" ||
      entry.contentClass === "social_node") &&
    (entry.policyTier === undefined ||
      entry.policyTier === "static" ||
      entry.policyTier === "once_per_player" ||
      entry.policyTier === "timeboxed_otp") &&
    (entry.conditions === undefined ||
      (Array.isArray(entry.conditions) &&
        entry.conditions.every((condition) => isMapCondition(condition)))) &&
    Array.isArray(entry.effects) &&
    entry.effects.every((effect) => isVnEffect(effect)) &&
    (entry.requiresFlagsAll === undefined ||
      (Array.isArray(entry.requiresFlagsAll) &&
        entry.requiresFlagsAll.every((flag) => typeof flag === "string"))) &&
    (entry.requiresBriefingBypass === undefined ||
      typeof entry.requiresBriefingBypass === "boolean")
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
  const parsedPoints: MapPoint[] = [];

  for (const rawPoint of rawPoints) {
    const category =
      rawPoint.category ??
      (schemaVersion >= 6 ? undefined : ("PUBLIC" as const));
    if (!isMapPointCategory(category)) {
      throw new SenderError("payloadJson.map.points has invalid shape");
    }

    const point: MapPoint = {
      ...rawPoint,
      category,
    };
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

    parsedPoints.push(point);
  }

  let shadowRoutes: MapShadowRoute[] | undefined;
  if (mapPayload.shadowRoutes !== undefined) {
    if (
      !Array.isArray(mapPayload.shadowRoutes) ||
      !mapPayload.shadowRoutes.every((entry) => isMapShadowRoute(entry))
    ) {
      throw new SenderError("payloadJson.map.shadowRoutes has invalid shape");
    }

    const routeIds = new Set<string>();
    shadowRoutes = [];
    for (const route of mapPayload.shadowRoutes) {
      if (routeIds.has(route.id)) {
        throw new SenderError(
          `payloadJson.map.shadowRoutes contains duplicate id ${route.id}`,
        );
      }
      if (!regionIds.has(route.regionId)) {
        throw new SenderError(
          `payloadJson.map.shadowRoutes regionId is unknown for route ${route.id}`,
        );
      }
      if (
        route.pointIds.length < 2 ||
        route.pointIds.some((pointId) => !pointIds.has(pointId))
      ) {
        throw new SenderError(
          `payloadJson.map.shadowRoutes pointIds are invalid for route ${route.id}`,
        );
      }
      routeIds.add(route.id);
      shadowRoutes.push(route);
    }
  }

  let qrCodeRegistry: MapQrCodeRegistryEntry[] | undefined;
  if (mapPayload.qrCodeRegistry !== undefined) {
    if (
      !Array.isArray(mapPayload.qrCodeRegistry) ||
      !mapPayload.qrCodeRegistry.every((entry) =>
        isMapQrCodeRegistryEntry(entry),
      )
    ) {
      throw new SenderError("payloadJson.map.qrCodeRegistry has invalid shape");
    }

    const codeIds = new Set<string>();
    qrCodeRegistry = [];
    for (const entry of mapPayload.qrCodeRegistry) {
      if (codeIds.has(entry.codeId)) {
        throw new SenderError(
          `payloadJson.map.qrCodeRegistry contains duplicate codeId ${entry.codeId}`,
        );
      }
      codeIds.add(entry.codeId);
      qrCodeRegistry.push(entry);
    }
  }

  let mapEventTemplates: MapEventTemplate[] | undefined;
  if (mapPayload.mapEventTemplates !== undefined) {
    if (
      !Array.isArray(mapPayload.mapEventTemplates) ||
      !mapPayload.mapEventTemplates.every((entry) => isMapEventTemplate(entry))
    ) {
      throw new SenderError(
        "payloadJson.map.mapEventTemplates has invalid shape",
      );
    }

    const templateIds = new Set<string>();
    const templatePointIds = new Set<string>();
    mapEventTemplates = [];
    for (const template of mapPayload.mapEventTemplates) {
      if (templateIds.has(template.id)) {
        throw new SenderError(
          `payloadJson.map.mapEventTemplates contains duplicate id ${template.id}`,
        );
      }
      if (
        templatePointIds.has(template.point.id) ||
        pointIds.has(template.point.id)
      ) {
        throw new SenderError(
          `payloadJson.map.mapEventTemplates point id is duplicated for template ${template.id}`,
        );
      }
      if (
        template.point.category !== "EPHEMERAL" ||
        !regionIds.has(template.point.regionId)
      ) {
        throw new SenderError(
          `payloadJson.map.mapEventTemplates point is invalid for template ${template.id}`,
        );
      }

      for (const binding of template.point.bindings) {
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
              `payloadJson.map event template binding ${binding.id} references unknown scenario ${action.scenarioId}`,
            );
          }
        }
      }

      templateIds.add(template.id);
      templatePointIds.add(template.point.id);
      mapEventTemplates.push(template);
    }
  }

  let testDefaults: MapTestDefaults | undefined;
  if (mapPayload.testDefaults !== undefined) {
    if (
      !mapPayload.testDefaults ||
      typeof mapPayload.testDefaults !== "object"
    ) {
      throw new SenderError("payloadJson.map.testDefaults has invalid shape");
    }

    const defaults = mapPayload.testDefaults as Record<string, unknown>;
    if (
      defaults.defaultEventTtlMinutes !== undefined &&
      (typeof defaults.defaultEventTtlMinutes !== "number" ||
        !Number.isFinite(defaults.defaultEventTtlMinutes))
    ) {
      throw new SenderError("payloadJson.map.testDefaults has invalid shape");
    }

    testDefaults = {
      defaultEventTtlMinutes: defaults.defaultEventTtlMinutes as
        | number
        | undefined,
    };
  }

  return {
    defaultRegionId: mapPayload.defaultRegionId,
    regions: rawRegions,
    points: parsedPoints,
    shadowRoutes,
    qrCodeRegistry,
    mapEventTemplates,
    testDefaults,
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

const parseSocialCatalog = (
  payloadSocialCatalog: unknown,
  schemaVersion: number,
): SocialCatalogSnapshot | undefined => {
  if (payloadSocialCatalog === undefined) {
    return undefined;
  }

  const catalog = asRecord(payloadSocialCatalog, "payloadJson.socialCatalog");
  const factions = Array.isArray(catalog.factions) ? catalog.factions : null;
  const npcIdentities = Array.isArray(catalog.npcIdentities)
    ? catalog.npcIdentities
    : null;
  const services = Array.isArray(catalog.services) ? catalog.services : null;
  const rumors = Array.isArray(catalog.rumors) ? catalog.rumors : null;
  const careerRanks = Array.isArray(catalog.careerRanks)
    ? catalog.careerRanks
    : null;

  if (
    !npcIdentities ||
    !services ||
    !rumors ||
    !careerRanks ||
    (schemaVersion >= 7 && !factions)
  ) {
    throw new SenderError("payloadJson.socialCatalog has invalid shape");
  }

  const parsedFactions =
    factions === null
      ? undefined
      : factions.map((entry, index) => {
          if (!isFactionDefinition(entry)) {
            throw new SenderError(
              `payloadJson.socialCatalog.factions[${index}] has invalid shape`,
            );
          }
          return entry;
        });

  const parsedNpcIdentities: NpcRuntimeIdentity[] = npcIdentities.map(
    (entry, index) => {
      const record = asRecord(
        entry,
        `payloadJson.socialCatalog.npcIdentities[${index}]`,
      );
      const rosterTier = record.rosterTier;
      if (
        rosterTier !== "archetype" &&
        rosterTier !== "functional" &&
        rosterTier !== "major"
      ) {
        throw new SenderError("payloadJson.socialCatalog has invalid shape");
      }
      if (!isAllowedFactionId(record.factionId)) {
        throw new SenderError("payloadJson.socialCatalog has invalid shape");
      }

      return {
        id: String(record.id ?? ""),
        displayName: String(record.displayName ?? ""),
        factionId: String(record.factionId ?? ""),
        publicRole: String(record.publicRole ?? ""),
        rosterTier,
        portraitUrl:
          record.portraitUrl === undefined
            ? undefined
            : String(record.portraitUrl),
        introFlag:
          record.introFlag === undefined ? undefined : String(record.introFlag),
        homePointId:
          record.homePointId === undefined
            ? undefined
            : String(record.homePointId),
        workPointId:
          record.workPointId === undefined
            ? undefined
            : String(record.workPointId),
        serviceIds:
          record.serviceIds === undefined
            ? undefined
            : asStringArray(
                record.serviceIds,
                `payloadJson.socialCatalog.npcIdentities[${index}].serviceIds`,
              ),
      };
    },
  );

  const parsedServices: NpcServiceDefinition[] = services.map(
    (entry, index) => {
      const record = asRecord(
        entry,
        `payloadJson.socialCatalog.services[${index}]`,
      );
      const role = record.role;
      if (
        role !== "information" &&
        role !== "archives" &&
        role !== "social_introduction" &&
        role !== "political_cover" &&
        role !== "transport"
      ) {
        throw new SenderError("payloadJson.socialCatalog has invalid shape");
      }

      return {
        id: String(record.id ?? ""),
        npcId: String(record.npcId ?? ""),
        role,
        label: String(record.label ?? ""),
        baseAccess: String(record.baseAccess ?? ""),
        unlockFlag:
          record.unlockFlag === undefined
            ? undefined
            : String(record.unlockFlag),
        costNote:
          record.costNote === undefined ? undefined : String(record.costNote),
        qualityNote:
          record.qualityNote === undefined
            ? undefined
            : String(record.qualityNote),
        consequenceNote:
          record.consequenceNote === undefined
            ? undefined
            : String(record.consequenceNote),
      };
    },
  );

  const parsedRumors: RumorTemplate[] = rumors.map((entry, index) => {
    const record = asRecord(
      entry,
      `payloadJson.socialCatalog.rumors[${index}]`,
    );
    const verifiesOn = asStringArray(
      record.verifiesOn,
      `payloadJson.socialCatalog.rumors[${index}].verifiesOn`,
    );
    if (
      !verifiesOn.every(
        (value) =>
          value === "evidence" ||
          value === "fact" ||
          value === "service_unlock" ||
          value === "map_unlock",
      )
    ) {
      throw new SenderError("payloadJson.socialCatalog has invalid shape");
    }

    const careerCriterionOnVerify = record.careerCriterionOnVerify;
    if (
      careerCriterionOnVerify !== undefined &&
      careerCriterionOnVerify !== "verified_rumor_chain" &&
      careerCriterionOnVerify !== "preserved_source_network" &&
      careerCriterionOnVerify !== "clean_closure"
    ) {
      throw new SenderError("payloadJson.socialCatalog has invalid shape");
    }

    return {
      id: String(record.id ?? ""),
      title: String(record.title ?? ""),
      caseId: String(record.caseId ?? ""),
      leadPointId:
        record.leadPointId === undefined
          ? undefined
          : String(record.leadPointId),
      sourceNpcId:
        record.sourceNpcId === undefined
          ? undefined
          : String(record.sourceNpcId),
      verifiesOn: verifiesOn as RumorVerificationKind[],
      careerCriterionOnVerify: careerCriterionOnVerify as
        | AgencyServiceCriterionId
        | undefined,
    };
  });

  const parsedCareerRanks: CareerRankDefinition[] = careerRanks.map(
    (entry, index) => {
      const record = asRecord(
        entry,
        `payloadJson.socialCatalog.careerRanks[${index}]`,
      );
      return {
        id: String(record.id ?? ""),
        label: String(record.label ?? ""),
        order: asNumber(
          record.order,
          `payloadJson.socialCatalog.careerRanks[${index}].order`,
        ),
        standingRequired: asNumber(
          record.standingRequired,
          `payloadJson.socialCatalog.careerRanks[${index}].standingRequired`,
        ),
        qualifyingCaseId:
          record.qualifyingCaseId === undefined
            ? undefined
            : String(record.qualifyingCaseId),
        serviceCriteriaNeeded: asNumber(
          record.serviceCriteriaNeeded,
          `payloadJson.socialCatalog.careerRanks[${index}].serviceCriteriaNeeded`,
        ),
        privileges: asStringArray(
          record.privileges,
          `payloadJson.socialCatalog.careerRanks[${index}].privileges`,
        ),
      };
    },
  );

  const assertUniqueIds = (
    entries: ReadonlyArray<{ id: string }>,
    fieldName: string,
  ): void => {
    const ids = new Set<string>();
    for (const entry of entries) {
      if (entry.id.trim().length === 0 || ids.has(entry.id)) {
        throw new SenderError(`${fieldName} has invalid shape`);
      }
      ids.add(entry.id);
    }
  };

  assertUniqueIds(
    parsedNpcIdentities,
    "payloadJson.socialCatalog.npcIdentities",
  );
  assertUniqueIds(parsedServices, "payloadJson.socialCatalog.services");
  assertUniqueIds(parsedRumors, "payloadJson.socialCatalog.rumors");
  assertUniqueIds(parsedCareerRanks, "payloadJson.socialCatalog.careerRanks");

  return {
    factions: parsedFactions,
    npcIdentities: parsedNpcIdentities,
    services: parsedServices,
    rumors: parsedRumors,
    careerRanks: parsedCareerRanks,
  };
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
  const socialCatalog = parseSocialCatalog(
    payload.socialCatalog,
    schemaVersion,
  );

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
      socialCatalog,
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
    socialCatalog,
    mindPalace: {
      cases,
      facts,
      hypotheses,
    },
  };
};

export const identityKey = (identity: { toHexString(): string }): string =>
  identity.toHexString();

export const hasAnyAdminIdentity = (ctx: any): boolean => {
  for (const _row of ctx.db.adminIdentity.iter()) {
    return true;
  }
  return false;
};

export const hasAdminIdentity = (
  ctx: any,
  identity: { toHexString(): string } = ctx.sender,
): boolean => Boolean(ctx.db.adminIdentity.identity.find(identity));

export const ensureAdminIdentity = (ctx: any, action: string): void => {
  assertNonEmpty(action, "action");
  if (!hasAdminIdentity(ctx)) {
    throw new SenderError(`Only an admin identity can ${action}`);
  }
};

export const ensureAllowlistedWorker = (
  ctx: any,
  action: string,
  identity: { toHexString(): string } = ctx.sender,
): void => {
  assertNonEmpty(action, "action");
  if (!ctx.db.workerAllowlist.identity.find(identity)) {
    throw new SenderError(`Only an allowlisted worker can ${action}`);
  }
};

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

export const createCommandSessionKey = (player: {
  toHexString(): string;
}): string => `${identityKey(player)}::command`;

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

export const createNpcStateKey = (
  player: { toHexString(): string },
  npcId: string,
): string => `${identityKey(player)}::npc::${npcId}`;

export const createNpcFavorKey = (
  player: { toHexString(): string },
  npcId: string,
): string => `${identityKey(player)}::favor::${npcId}`;

export const createFactionSignalKey = (
  player: { toHexString(): string },
  factionId: string,
): string => `${identityKey(player)}::faction::${factionId}`;

export const createRumorStateKey = (
  player: { toHexString(): string },
  rumorId: string,
): string => `${identityKey(player)}::rumor::${rumorId}`;

export const createCommandPartyMemberKey = (
  player: { toHexString(): string },
  actorId: string,
): string => `${identityKey(player)}::command::member::${actorId}`;

export const createUnlockGroupKey = (
  player: { toHexString(): string },
  groupId: string,
): string => `${identityKey(player)}::${groupId}`;

export const createMapEventKey = (
  player: { toHexString(): string },
  templateId: string,
  timestampMicros: bigint,
  attempt: number,
): string =>
  `${identityKey(player)}::event::${templateId}::${timestampMicros.toString()}::${attempt}`;

export const createRedeemedCodeKey = (
  player: { toHexString(): string },
  requestId: string,
): string => `${identityKey(player)}::redeem::${requestId}`;

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

export const createCommandHistoryKey = (
  player: { toHexString(): string },
  orderId: string,
  timestampMicros: bigint,
): string =>
  `${identityKey(player)}::command::history::${orderId}::${timestampMicros.toString()}`;

export const createBattleSessionKey = (player: {
  toHexString(): string;
}): string => `${identityKey(player)}::battle`;

export const createBattleCombatantKey = (
  player: { toHexString(): string },
  combatantId: string,
): string => `${identityKey(player)}::battle::combatant::${combatantId}`;

export const createBattleCardInstanceKey = (
  player: { toHexString(): string },
  instanceId: string,
): string => `${identityKey(player)}::battle::card::${instanceId}`;

export const createBattleHistoryKey = (
  player: { toHexString(): string },
  timestampMicros: bigint,
  ordinal: number,
): string =>
  `${identityKey(player)}::battle::history::${timestampMicros.toString()}::${ordinal}`;

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
  ensurePlayerProfileForPlayer(ctx, ctx.sender);
};

export const ensurePlayerProfileForPlayer = (
  ctx: any,
  playerId: { toHexString(): string },
): void => {
  const profile = ctx.db.playerProfile.playerId.find(playerId);
  if (!profile) {
    ctx.db.playerProfile.insert({
      playerId,
      nickname: undefined,
      createdAt: ctx.timestamp,
      updatedAt: ctx.timestamp,
    });
  }

  const location = ctx.db.playerLocation.playerId.find(playerId);
  if (!location) {
    ctx.db.playerLocation.insert({
      playerId,
      locationId: "loc_intro",
      updatedAt: ctx.timestamp,
    });
  }
};

const normalizePlayerVarValue = (key: string, floatValue: number): number => {
  if (PSYCHE_VAR_KEYS.includes(key as any)) {
    return clampNumber(floatValue, -100, 100);
  }
  if (isNarrativeResourceKey(key)) {
    return normalizeNarrativeResourceValue(key, floatValue);
  }
  return floatValue;
};

export const getVarForPlayer = (
  ctx: any,
  playerId: { toHexString(): string },
  key: string,
): number => {
  const row = ctx.db.playerVar.varId.find(createVarKey(playerId, key));
  return row?.floatValue ?? 0;
};

export const upsertVarForPlayer = (
  ctx: any,
  playerId: { toHexString(): string },
  key: string,
  floatValue: number,
): void => {
  assertNonEmpty(key, "key");
  if (!Number.isFinite(floatValue)) {
    throw new SenderError("floatValue must be a finite number");
  }

  ensurePlayerProfileForPlayer(ctx, playerId);
  const normalizedFloatValue = normalizePlayerVarValue(key, floatValue);

  const varId = createVarKey(playerId, key);
  const existing = ctx.db.playerVar.varId.find(varId);
  if (existing) {
    ctx.db.playerVar.varId.update({
      ...existing,
      floatValue: normalizedFloatValue,
      updatedAt: ctx.timestamp,
    });
    return;
  }

  ctx.db.playerVar.insert({
    varId,
    playerId,
    key,
    floatValue: normalizedFloatValue,
    updatedAt: ctx.timestamp,
  });
};

export const addToVarForPlayer = (
  ctx: any,
  playerId: { toHexString(): string },
  key: string,
  delta: number,
): void => {
  const current = getVarForPlayer(ctx, playerId, key);
  upsertVarForPlayer(ctx, playerId, key, current + delta);
};

export const ensureNarrativeResourcesForPlayer = (
  ctx: any,
  playerId: { toHexString(): string },
): void => {
  ensurePlayerProfileForPlayer(ctx, playerId);

  for (const [key, defaultValue] of Object.entries(NARRATIVE_RESOURCE_DEFAULTS)) {
    if (!ctx.db.playerVar.varId.find(createVarKey(playerId, key))) {
      upsertVarForPlayer(ctx, playerId, key, defaultValue);
    }
  }
};

export const ensureNarrativeResources = (ctx: any): void => {
  ensureNarrativeResourcesForPlayer(ctx, ctx.sender);
};

export const resolveKarmaBand = (value: number) => sharedResolveKarmaBand(value);

export const resolveKarmaDifficultyDelta = (value: number) =>
  sharedResolveKarmaDifficultyDelta(value);

const isRowOwnedBySender = (
  row: { playerId: { toHexString(): string } },
  senderHex: string,
): boolean => row.playerId.toHexString() === senderHex;

const hasAnyRowsForSender = <
  TRow extends { playerId: { toHexString(): string } },
>(
  rows: Iterable<TRow>,
  senderHex: string,
): boolean => {
  for (const row of rows) {
    if (isRowOwnedBySender(row, senderHex)) {
      return true;
    }
  }
  return false;
};

export const hasPlayerGameplayProgress = (ctx: any): boolean => {
  const senderHex = ctx.sender.toHexString();

  if (hasAnyRowsForSender(ctx.db.vnSession.iter(), senderHex)) {
    return true;
  }
  if (hasAnyRowsForSender(ctx.db.vnSkillCheckResult.iter(), senderHex)) {
    return true;
  }
  if (hasAnyRowsForSender(ctx.db.playerFlag.iter(), senderHex)) {
    return true;
  }
  if (hasAnyRowsForSender(ctx.db.playerVar.iter(), senderHex)) {
    return true;
  }
  if (hasAnyRowsForSender(ctx.db.playerInventory.iter(), senderHex)) {
    return true;
  }
  if (hasAnyRowsForSender(ctx.db.playerEvidence.iter(), senderHex)) {
    return true;
  }
  if (hasAnyRowsForSender(ctx.db.playerQuest.iter(), senderHex)) {
    return true;
  }
  if (hasAnyRowsForSender(ctx.db.playerRelationship.iter(), senderHex)) {
    return true;
  }
  if (hasAnyRowsForSender(ctx.db.playerNpcState.iter(), senderHex)) {
    return true;
  }
  if (hasAnyRowsForSender(ctx.db.playerNpcFavor.iter(), senderHex)) {
    return true;
  }
  if (hasAnyRowsForSender(ctx.db.playerFactionSignal.iter(), senderHex)) {
    return true;
  }
  if (hasAnyRowsForSender(ctx.db.playerAgencyCareer.iter(), senderHex)) {
    return true;
  }
  if (hasAnyRowsForSender(ctx.db.playerRumorState.iter(), senderHex)) {
    return true;
  }
  if (hasAnyRowsForSender(ctx.db.playerUnlockGroup.iter(), senderHex)) {
    return true;
  }
  if (hasAnyRowsForSender(ctx.db.playerMapEvent.iter(), senderHex)) {
    return true;
  }
  if (hasAnyRowsForSender(ctx.db.playerMindCase.iter(), senderHex)) {
    return true;
  }
  if (hasAnyRowsForSender(ctx.db.playerMindFact.iter(), senderHex)) {
    return true;
  }
  if (hasAnyRowsForSender(ctx.db.playerMindHypothesis.iter(), senderHex)) {
    return true;
  }
  if (hasAnyRowsForSender(ctx.db.playerRedeemedCode.iter(), senderHex)) {
    return true;
  }

  const location = ctx.db.playerLocation.playerId.find(ctx.sender);
  return Boolean(location && location.locationId !== "loc_intro");
};

export const resetPlayerGameplayState = (ctx: any): void => {
  const senderHex = ctx.sender.toHexString();

  for (const row of [...ctx.db.vnSession.iter()]) {
    if (isRowOwnedBySender(row, senderHex)) {
      ctx.db.vnSession.sessionKey.delete(row.sessionKey);
    }
  }

  for (const row of [...ctx.db.vnSkillCheckResult.iter()]) {
    if (isRowOwnedBySender(row, senderHex)) {
      ctx.db.vnSkillCheckResult.resultKey.delete(row.resultKey);
    }
  }

  for (const row of [...ctx.db.playerFlag.iter()]) {
    if (isRowOwnedBySender(row, senderHex)) {
      ctx.db.playerFlag.flagId.delete(row.flagId);
    }
  }

  for (const row of [...ctx.db.playerVar.iter()]) {
    if (isRowOwnedBySender(row, senderHex)) {
      ctx.db.playerVar.varId.delete(row.varId);
    }
  }

  for (const row of [...ctx.db.playerInventory.iter()]) {
    if (isRowOwnedBySender(row, senderHex)) {
      ctx.db.playerInventory.inventoryKey.delete(row.inventoryKey);
    }
  }

  for (const row of [...ctx.db.playerEvidence.iter()]) {
    if (isRowOwnedBySender(row, senderHex)) {
      ctx.db.playerEvidence.evidenceKey.delete(row.evidenceKey);
    }
  }

  for (const row of [...ctx.db.playerQuest.iter()]) {
    if (isRowOwnedBySender(row, senderHex)) {
      ctx.db.playerQuest.questKey.delete(row.questKey);
    }
  }

  for (const row of [...ctx.db.playerRelationship.iter()]) {
    if (isRowOwnedBySender(row, senderHex)) {
      ctx.db.playerRelationship.relationshipKey.delete(row.relationshipKey);
    }
  }

  for (const row of [...ctx.db.playerNpcState.iter()]) {
    if (isRowOwnedBySender(row, senderHex)) {
      ctx.db.playerNpcState.npcStateKey.delete(row.npcStateKey);
    }
  }

  for (const row of [...ctx.db.playerNpcFavor.iter()]) {
    if (isRowOwnedBySender(row, senderHex)) {
      ctx.db.playerNpcFavor.favorKey.delete(row.favorKey);
    }
  }

  for (const row of [...ctx.db.playerFactionSignal.iter()]) {
    if (isRowOwnedBySender(row, senderHex)) {
      ctx.db.playerFactionSignal.signalKey.delete(row.signalKey);
    }
  }

  for (const row of [...ctx.db.playerAgencyCareer.iter()]) {
    if (isRowOwnedBySender(row, senderHex)) {
      ctx.db.playerAgencyCareer.playerId.delete(row.playerId);
    }
  }

  for (const row of [...ctx.db.playerRumorState.iter()]) {
    if (isRowOwnedBySender(row, senderHex)) {
      ctx.db.playerRumorState.rumorStateKey.delete(row.rumorStateKey);
    }
  }

  for (const row of [...ctx.db.playerUnlockGroup.iter()]) {
    if (isRowOwnedBySender(row, senderHex)) {
      ctx.db.playerUnlockGroup.unlockKey.delete(row.unlockKey);
    }
  }

  for (const row of [...ctx.db.playerMapEvent.iter()]) {
    if (isRowOwnedBySender(row, senderHex)) {
      ctx.db.playerMapEvent.eventId.delete(row.eventId);
    }
  }

  for (const row of [...ctx.db.playerMindCase.iter()]) {
    if (isRowOwnedBySender(row, senderHex)) {
      ctx.db.playerMindCase.playerCaseKey.delete(row.playerCaseKey);
    }
  }

  for (const row of [...ctx.db.playerMindFact.iter()]) {
    if (isRowOwnedBySender(row, senderHex)) {
      ctx.db.playerMindFact.playerFactKey.delete(row.playerFactKey);
    }
  }

  for (const row of [...ctx.db.playerMindHypothesis.iter()]) {
    if (isRowOwnedBySender(row, senderHex)) {
      ctx.db.playerMindHypothesis.playerHypothesisKey.delete(
        row.playerHypothesisKey,
      );
    }
  }

  for (const row of [...ctx.db.playerRedeemedCode.iter()]) {
    if (isRowOwnedBySender(row, senderHex)) {
      ctx.db.playerRedeemedCode.redemptionId.delete(row.redemptionId);
    }
  }

  upsertLocation(ctx, "loc_intro");
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
  return getVarForPlayer(ctx, ctx.sender, key);
};

export const upsertVar = (ctx: any, key: string, floatValue: number): void => {
  upsertVarForPlayer(ctx, ctx.sender, key, floatValue);
};

export const addToVar = (ctx: any, key: string, delta: number): void => {
  addToVarForPlayer(ctx, ctx.sender, key, delta);
};

const DEFAULT_NPC_AVAILABILITY: NpcAvailabilityState = "available";
const DEFAULT_CAREER_RANKS: CareerRankDefinition[] = [
  {
    id: "trainee",
    label: "Стажёр",
    order: 0,
    standingRequired: -100,
    serviceCriteriaNeeded: 0,
    privileges: ["agency_briefing_access"],
  },
  {
    id: "junior_detective",
    label: "Младший детектив",
    order: 1,
    standingRequired: 15,
    qualifyingCaseId: "quest_banker",
    serviceCriteriaNeeded: 2,
    privileges: ["agency_caseboard_access", "field_warrant_support"],
  },
  {
    id: "agency_detective",
    label: "Детектив агентства",
    order: 2,
    standingRequired: 35,
    serviceCriteriaNeeded: 2,
    privileges: ["briefing_priority", "wider_archive_access"],
  },
  {
    id: "senior_detective",
    label: "Старший детектив",
    order: 3,
    standingRequired: 55,
    serviceCriteriaNeeded: 2,
    privileges: ["agency_cover", "contact_network_priority"],
  },
  {
    id: "lead_investigator",
    label: "Ведущий следователь",
    order: 4,
    standingRequired: 75,
    serviceCriteriaNeeded: 2,
    privileges: ["citywide_priority_access", "special_assignment_lead"],
  },
];

const FACTION_SIGNAL_VAR_BY_ID: Record<string, string> =
  LEGACY_REPUTATION_VAR_BY_FACTION_ID;

const resolveTrend = (delta: number): FactionSignalTrend => {
  if (delta > 0) {
    return "rising";
  }
  if (delta < 0) {
    return "falling";
  }
  return "stable";
};

const clampTrustScore = (value: number): number =>
  clampNumber(value, -100, 100);

const clampStandingScore = (value: number): number =>
  clampNumber(value, -100, 100);

const getLegacyRelationshipValue = (ctx: any, characterId: string): number => {
  const row = ctx.db.playerRelationship.relationshipKey.find(
    createRelationshipKey(ctx.sender, characterId),
  );
  return row ? row.value : 0;
};

const upsertLegacyRelationshipProjection = (
  ctx: any,
  characterId: string,
  value: number,
): void => {
  const relationshipKey = createRelationshipKey(ctx.sender, characterId);
  const existing =
    ctx.db.playerRelationship.relationshipKey.find(relationshipKey);
  if (existing) {
    ctx.db.playerRelationship.relationshipKey.update({
      ...existing,
      value,
      updatedAt: ctx.timestamp,
    });
    return;
  }

  ctx.db.playerRelationship.insert({
    relationshipKey,
    playerId: ctx.sender,
    characterId,
    value,
    updatedAt: ctx.timestamp,
  });
};

const tryGetActiveSocialCatalog = (
  ctx: any,
): SocialCatalogSnapshot | undefined => {
  try {
    return getActiveSnapshot(ctx).snapshot.socialCatalog;
  } catch (_error) {
    return undefined;
  }
};

const getCareerRankDefinitions = (ctx: any): CareerRankDefinition[] => {
  const catalogRanks = tryGetActiveSocialCatalog(ctx)?.careerRanks;
  const ranks =
    catalogRanks && catalogRanks.length > 0
      ? catalogRanks
      : DEFAULT_CAREER_RANKS;
  return [...ranks].sort((left, right) => left.order - right.order);
};

const getRumorTemplate = (
  ctx: any,
  rumorId: string,
): RumorTemplate | undefined =>
  tryGetActiveSocialCatalog(ctx)?.rumors.find((entry) => entry.id === rumorId);

export const getRelationshipValue = (ctx: any, characterId: string): number => {
  const row = ctx.db.playerNpcState.npcStateKey.find(
    createNpcStateKey(ctx.sender, characterId),
  );
  return row ? row.trustScore : getLegacyRelationshipValue(ctx, characterId);
};

export const changeRelationshipTrust = (
  ctx: any,
  characterId: string,
  delta: number,
): number => {
  assertNonEmpty(characterId, "characterId");
  ensurePlayerProfile(ctx);

  const npcStateKey = createNpcStateKey(ctx.sender, characterId);
  const existing = ctx.db.playerNpcState.npcStateKey.find(npcStateKey);
  const currentValue = existing
    ? existing.trustScore
    : getLegacyRelationshipValue(ctx, characterId);
  const nextValue = clampTrustScore(currentValue + delta);

  if (existing) {
    ctx.db.playerNpcState.npcStateKey.update({
      ...existing,
      trustScore: nextValue,
      availabilityState: existing.availabilityState || DEFAULT_NPC_AVAILABILITY,
      lastMeaningfulContactAt: ctx.timestamp,
      updatedAt: ctx.timestamp,
    });
  } else {
    ctx.db.playerNpcState.insert({
      npcStateKey,
      playerId: ctx.sender,
      npcId: characterId,
      trustScore: nextValue,
      availabilityState: DEFAULT_NPC_AVAILABILITY,
      lastMeaningfulContactAt: ctx.timestamp,
      updatedAt: ctx.timestamp,
    });
  }

  upsertLegacyRelationshipProjection(ctx, characterId, nextValue);
  return nextValue;
};

export const getFavorBalance = (ctx: any, npcId: string): number => {
  const row = ctx.db.playerNpcFavor.favorKey.find(
    createNpcFavorKey(ctx.sender, npcId),
  );
  return row ? row.balance : 0;
};

export const changeFavorBalanceInternal = (
  ctx: any,
  npcId: string,
  delta: number,
  reason?: string,
): number => {
  assertNonEmpty(npcId, "npcId");
  ensurePlayerProfile(ctx);

  const favorKey = createNpcFavorKey(ctx.sender, npcId);
  const existing = ctx.db.playerNpcFavor.favorKey.find(favorKey);
  const nextValue = (existing ? existing.balance : 0) + Math.trunc(delta);

  if (existing) {
    ctx.db.playerNpcFavor.favorKey.update({
      ...existing,
      balance: nextValue,
      lastReason: reason ?? existing.lastReason,
      updatedAt: ctx.timestamp,
    });
  } else {
    ctx.db.playerNpcFavor.insert({
      favorKey,
      playerId: ctx.sender,
      npcId,
      balance: nextValue,
      lastReason: reason,
      updatedAt: ctx.timestamp,
    });
  }

  return nextValue;
};

export const getFactionSignalValue = (ctx: any, factionId: string): number => {
  if (!isAllowedFactionId(factionId)) {
    return 0;
  }

  const row = ctx.db.playerFactionSignal.signalKey.find(
    createFactionSignalKey(ctx.sender, factionId),
  );
  if (row) {
    return row.value;
  }

  const mirrorVarKey = FACTION_SIGNAL_VAR_BY_ID[factionId];
  return mirrorVarKey ? getVar(ctx, mirrorVarKey) : 0;
};

export const changeFactionSignalInternal = (
  ctx: any,
  factionId: string,
  delta: number,
  reason?: string,
): number => {
  assertNonEmpty(factionId, "factionId");
  const factionIdError = getFactionIdValidationError(factionId);
  if (factionIdError) {
    throw new SenderError(factionIdError);
  }
  ensurePlayerProfile(ctx);

  const signalKey = createFactionSignalKey(ctx.sender, factionId);
  const existing = ctx.db.playerFactionSignal.signalKey.find(signalKey);
  const nextValue = clampNumber(
    getFactionSignalValue(ctx, factionId) + delta,
    -100,
    100,
  );
  const trend = resolveTrend(delta);

  if (existing) {
    ctx.db.playerFactionSignal.signalKey.update({
      ...existing,
      value: nextValue,
      trend,
      updatedAt: ctx.timestamp,
    });
  } else {
    ctx.db.playerFactionSignal.insert({
      signalKey,
      playerId: ctx.sender,
      factionId,
      value: nextValue,
      trend,
      updatedAt: ctx.timestamp,
    });
  }

  const mirrorVarKey = FACTION_SIGNAL_VAR_BY_ID[factionId];
  if (mirrorVarKey) {
    upsertVar(ctx, mirrorVarKey, nextValue);
  }

  return nextValue;
};

const countCompletedServiceCriteria = (row: {
  rumorCriterionComplete: boolean;
  sourceCriterionComplete: boolean;
  cleanClosureCriterionComplete: boolean;
}): number =>
  Number(row.rumorCriterionComplete) +
  Number(row.sourceCriterionComplete) +
  Number(row.cleanClosureCriterionComplete);

export const ensureAgencyCareerRow = (ctx: any) => {
  ensurePlayerProfile(ctx);

  const existing = ctx.db.playerAgencyCareer.playerId.find(ctx.sender);
  if (existing) {
    return existing;
  }

  const initialRank = getCareerRankDefinitions(ctx)[0]?.id ?? "trainee";
  const row = {
    playerId: ctx.sender,
    standingScore: 0,
    standingTrend: "stable",
    rankId: initialRank,
    qualifyingCaseId: undefined,
    rumorCriterionComplete: false,
    sourceCriterionComplete: false,
    cleanClosureCriterionComplete: false,
    updatedAt: ctx.timestamp,
    promotedAt: undefined,
  };
  ctx.db.playerAgencyCareer.insert(row);
  return row;
};

export const getAgencyStandingScore = (ctx: any): number =>
  ensureAgencyCareerRow(ctx).standingScore;

export const getCareerRankOrder = (ctx: any, rankId: string): number => {
  const definition = getCareerRankDefinitions(ctx).find(
    (entry) => entry.id === rankId,
  );
  return definition?.order ?? -1;
};

const promoteAgencyCareerIfEligible = (ctx: any): void => {
  let current = ensureAgencyCareerRow(ctx);
  const ranks = getCareerRankDefinitions(ctx);

  while (true) {
    const currentRank = ranks.find((entry) => entry.id === current.rankId);
    const nextRank = ranks.find(
      (entry) => entry.order === (currentRank?.order ?? -1) + 1,
    );
    if (!nextRank) {
      return;
    }

    const hasStanding = current.standingScore >= nextRank.standingRequired;
    const hasQualifyingCase =
      !nextRank.qualifyingCaseId ||
      current.qualifyingCaseId === nextRank.qualifyingCaseId;
    const hasCriteria =
      countCompletedServiceCriteria(current) >= nextRank.serviceCriteriaNeeded;

    if (!hasStanding || !hasQualifyingCase || !hasCriteria) {
      return;
    }

    current = {
      ...current,
      rankId: nextRank.id,
      promotedAt: ctx.timestamp,
      updatedAt: ctx.timestamp,
    };
    ctx.db.playerAgencyCareer.playerId.update(current);
  }
};

export const syncAgencyCareerQualifyingCase = (
  ctx: any,
  questId: string,
  stage: number,
): void => {
  if (questId !== "quest_banker" || stage < 3) {
    return;
  }

  const current = ensureAgencyCareerRow(ctx);
  ctx.db.playerAgencyCareer.playerId.update({
    ...current,
    qualifyingCaseId: questId,
    updatedAt: ctx.timestamp,
  });
  promoteAgencyCareerIfEligible(ctx);
};

export const changeAgencyStandingInternal = (
  ctx: any,
  delta: number,
  reason?: string,
): number => {
  const current = ensureAgencyCareerRow(ctx);
  const nextValue = clampStandingScore(current.standingScore + delta);
  const nextRow = {
    ...current,
    standingScore: nextValue,
    standingTrend: resolveTrend(delta),
    updatedAt: ctx.timestamp,
  };
  ctx.db.playerAgencyCareer.playerId.update(nextRow);
  promoteAgencyCareerIfEligible(ctx);
  return nextValue;
};

export const recordServiceCriterionInternal = (
  ctx: any,
  criterionId: AgencyServiceCriterionId,
): void => {
  const current = ensureAgencyCareerRow(ctx);
  const nextRow = {
    ...current,
    rumorCriterionComplete:
      criterionId === "verified_rumor_chain"
        ? true
        : current.rumorCriterionComplete,
    sourceCriterionComplete:
      criterionId === "preserved_source_network"
        ? true
        : current.sourceCriterionComplete,
    cleanClosureCriterionComplete:
      criterionId === "clean_closure"
        ? true
        : current.cleanClosureCriterionComplete,
    updatedAt: ctx.timestamp,
  };
  ctx.db.playerAgencyCareer.playerId.update(nextRow);
  promoteAgencyCareerIfEligible(ctx);
};

export const getRumorStatus = (
  ctx: any,
  rumorId: string,
): RumorStateStatus | null => {
  const row = ctx.db.playerRumorState.rumorStateKey.find(
    createRumorStateKey(ctx.sender, rumorId),
  );
  return row ? (row.status as RumorStateStatus) : null;
};

export const registerRumorInternal = (ctx: any, rumorId: string): void => {
  assertNonEmpty(rumorId, "rumorId");
  ensurePlayerProfile(ctx);

  const rumorKey = createRumorStateKey(ctx.sender, rumorId);
  const existing = ctx.db.playerRumorState.rumorStateKey.find(rumorKey);
  const template = getRumorTemplate(ctx, rumorId);
  const nextRow = {
    rumorStateKey: rumorKey,
    playerId: ctx.sender,
    rumorId,
    status: existing?.status ?? "registered",
    leadPointId: existing?.leadPointId ?? template?.leadPointId,
    sourceNpcId: existing?.sourceNpcId ?? template?.sourceNpcId,
    caseId: existing?.caseId ?? template?.caseId ?? "case_banker_theft",
    verificationKind: existing?.verificationKind,
    verifiedAt: existing?.verifiedAt,
    updatedAt: ctx.timestamp,
  };

  if (existing) {
    ctx.db.playerRumorState.rumorStateKey.update({
      ...existing,
      ...nextRow,
    });
  } else {
    ctx.db.playerRumorState.insert(nextRow);
  }
};

export const verifyRumorInternal = (
  ctx: any,
  rumorId: string,
  verificationKind: RumorVerificationKind,
): void => {
  assertNonEmpty(rumorId, "rumorId");
  ensurePlayerProfile(ctx);

  const template = getRumorTemplate(ctx, rumorId);
  if (template && !template.verifiesOn.includes(verificationKind)) {
    throw new SenderError(
      `Rumor ${rumorId} cannot be verified via ${verificationKind}`,
    );
  }

  registerRumorInternal(ctx, rumorId);
  const rumorKey = createRumorStateKey(ctx.sender, rumorId);
  const existing = ctx.db.playerRumorState.rumorStateKey.find(rumorKey);
  if (!existing) {
    throw new SenderError(`Rumor ${rumorId} could not be registered`);
  }

  ctx.db.playerRumorState.rumorStateKey.update({
    ...existing,
    status: "verified",
    verificationKind,
    verifiedAt: ctx.timestamp,
    updatedAt: ctx.timestamp,
  });

  if (template?.careerCriterionOnVerify) {
    recordServiceCriterionInternal(ctx, template.careerCriterionOnVerify);
  }
};

const MYSTIC_AWAKENING_VAR = "mystic_awakening";
const MYSTIC_EXPOSURE_VAR = "mystic_exposure";
const MYSTIC_RATIONALIST_BUFFER_VAR = "mystic_rationalist_buffer";
const MYSTIC_SIGHT_MODE_VAR = "mystic_sight_mode_tier";

const clampNumber = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const sightModeTier = (mode: SightMode): number => {
  if (mode === "ether") {
    return 2;
  }
  if (mode === "sensitive") {
    return 1;
  }
  return 0;
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

const evaluateVnCondition = (
  ctx: any,
  condition: VnCondition,
): boolean => {
  if (condition.type === "logic_and") {
    return condition.conditions.every((entry) => evaluateVnCondition(ctx, entry));
  }
  if (condition.type === "logic_or") {
    return condition.conditions.some((entry) => evaluateVnCondition(ctx, entry));
  }
  if (condition.type === "logic_not") {
    return !evaluateVnCondition(ctx, condition.condition);
  }

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
    return getRelationshipValue(ctx, condition.characterId) >= condition.value;
  }
  if (condition.type === "has_item") {
    const inventoryKey = createInventoryKey(ctx.sender, condition.itemId);
    const row = ctx.db.playerInventory.inventoryKey.find(inventoryKey);
    return row ? row.quantity > 0 : false;
  }
  if (condition.type === "favor_balance_gte") {
    return getFavorBalance(ctx, condition.npcId) >= condition.value;
  }
  if (condition.type === "agency_standing_gte") {
    return getAgencyStandingScore(ctx) >= condition.value;
  }
  if (condition.type === "rumor_state_is") {
    return getRumorStatus(ctx, condition.rumorId) === condition.status;
  }
  if (condition.type === "hypothesis_focus_is") {
    return getFlag(
      ctx,
      createHypothesisFocusFlagKey(condition.caseId, condition.hypothesisId),
    );
  }
  if (condition.type === "thought_state_is") {
    if (condition.state === "internalized") {
      return getFlag(ctx, `mind_internalized::${condition.thoughtId}`);
    }
    if (condition.state === "researching") {
      return getFlag(ctx, `mind_researching::${condition.thoughtId}`);
    }
    return getFlag(ctx, `mind_unlocked::${condition.thoughtId}`);
  }
  if (condition.type === "career_rank_gte") {
    const currentRankOrder = getCareerRankOrder(
      ctx,
      ensureAgencyCareerRow(ctx).rankId,
    );
    return currentRankOrder >= getCareerRankOrder(ctx, condition.rankId);
  }
  if (condition.type === "voice_level_gte") {
    return Math.floor(getVar(ctx, condition.voiceId)) >= condition.value;
  }
  if (condition.type === "spirit_state_is") {
    return getFlag(ctx, `spirit_state_${condition.spiritId}::${condition.state}`);
  }

  return false;
};

export const areConditionsSatisfied = (
  ctx: any,
  conditions: VnCondition[] | undefined,
): boolean => {
  if (!conditions || conditions.length === 0) {
    return true;
  }

  return conditions.every((condition) => evaluateVnCondition(ctx, condition));
};

const areAnyConditionsSatisfied = (
  ctx: any,
  conditions: VnCondition[] | undefined,
): boolean => {
  if (!conditions || conditions.length === 0) {
    return true;
  }

  return conditions.some((condition) => evaluateVnCondition(ctx, condition));
};

const resolveRequireAll = (
  choice: Pick<VnChoice, "requireAll" | "conditions">,
): VnCondition[] | undefined => choice.requireAll ?? choice.conditions;

export const isChoiceVisible = (
  ctx: any,
  choice: Pick<VnChoice, "visibleIfAll" | "visibleIfAny">,
): boolean =>
  areConditionsSatisfied(ctx, choice.visibleIfAll) &&
  areAnyConditionsSatisfied(ctx, choice.visibleIfAny);

export const isChoiceEnabled = (
  ctx: any,
  choice: Pick<VnChoice, "requireAll" | "requireAny" | "conditions">,
): boolean =>
  areConditionsSatisfied(ctx, resolveRequireAll(choice)) &&
  areAnyConditionsSatisfied(ctx, choice.requireAny);

export const isChoiceAllowed = (
  ctx: any,
  choice: Pick<
    VnChoice,
    "visibleIfAll" | "visibleIfAny" | "requireAll" | "requireAny" | "conditions"
  >,
): boolean => isChoiceVisible(ctx, choice) && isChoiceEnabled(ctx, choice);

export const arePassiveChecksResolved = (
  ctx: any,
  scenarioId: string,
  nodeId: string,
  checks: VnSkillCheck[] | undefined,
): boolean => {
  if (!checks || checks.length === 0) {
    return true;
  }

  return checks.every((check) => {
    const resultKey = createSkillCheckResultKey(
      ctx.sender,
      scenarioId,
      nodeId,
      check.id,
    );
    return Boolean(ctx.db.vnSkillCheckResult.resultKey.find(resultKey));
  });
};

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

const getCommandScenario = (scenarioId: string): CommandScenarioTemplate => {
  const scenario = COMMAND_SCENARIOS.find((entry) => entry.id === scenarioId);
  if (!scenario) {
    throw new SenderError(`Unknown command scenario ${scenarioId}`);
  }
  return scenario;
};

const isCommandActorUnlocked = (
  ctx: any,
  actor: CommandActorTemplate,
): boolean => {
  if (actor.alwaysAvailable) {
    return true;
  }

  if (actor.unlockFlag && getFlag(ctx, actor.unlockFlag)) {
    return true;
  }

  if (actor.minimumRelationship) {
    return (
      getRelationshipValue(ctx, actor.minimumRelationship.characterId) >=
      actor.minimumRelationship.value
    );
  }

  return false;
};

const buildCommandActorPresentation = (
  ctx: any,
  actor: CommandActorTemplate,
): CommandActorPresentation => {
  const trust = actor.trustCharacterId
    ? getRelationshipValue(ctx, actor.trustCharacterId)
    : 0;
  const availability = isCommandActorUnlocked(ctx, actor)
    ? "available"
    : "locked";

  return {
    actorId: actor.actorId,
    label: actor.label,
    role: actor.role,
    availability,
    trust,
    notes:
      availability === "available"
        ? actor.notes
        : (actor.notes ?? "This operative has not been unlocked yet."),
    sortOrder: actor.sortOrder,
  };
};

const buildCommandOrderPresentation = (
  ctx: any,
  scenario: CommandScenarioTemplate,
): CommandOrderPresentation[] => {
  const actors = new Map(
    scenario.actors.map((actor) => [
      actor.actorId,
      buildCommandActorPresentation(ctx, actor),
    ]),
  );

  return scenario.orders.map((order) => {
    const actor = actors.get(order.actorId);
    const isAvailable = actor?.availability === "available";
    return {
      id: order.id,
      actorId: order.actorId,
      label: order.label,
      description: order.description,
      effectPreview: order.effectPreview,
      disabled: !isAvailable,
      disabledReason: isAvailable
        ? undefined
        : `${actor?.label ?? order.actorId} is not ready for assignment.`,
    };
  });
};

const replaceCommandPartyMembers = (
  ctx: any,
  sessionKey: string,
  actors: readonly CommandActorPresentation[],
): void => {
  for (const row of ctx.db.commandPartyMember.iter()) {
    if (
      row.sessionKey === sessionKey &&
      identityKey(row.playerId) === identityKey(ctx.sender)
    ) {
      ctx.db.commandPartyMember.memberKey.delete(row.memberKey);
    }
  }

  for (const actor of actors) {
    ctx.db.commandPartyMember.insert({
      memberKey: createCommandPartyMemberKey(ctx.sender, actor.actorId),
      sessionKey,
      playerId: ctx.sender,
      actorId: actor.actorId,
      label: actor.label,
      role: actor.role,
      availability: actor.availability,
      trust: actor.trust,
      notes: actor.notes,
      sortOrder: actor.sortOrder,
      updatedAt: ctx.timestamp,
    });
  }
};

export const openCommandModeInternal = (
  ctx: any,
  scenarioId: string,
  options: {
    returnTab?: CommandReturnTab;
    sourceTab?: CommandReturnTab;
  } = {},
): void => {
  ensurePlayerProfile(ctx);

  const scenario = getCommandScenario(scenarioId);
  const actors = scenario.actors
    .map((actor) => buildCommandActorPresentation(ctx, actor))
    .sort((left, right) => left.sortOrder - right.sortOrder);
  const orders = buildCommandOrderPresentation(ctx, scenario);
  const sessionKey = createCommandSessionKey(ctx.sender);
  const existing = ctx.db.commandSession.sessionKey.find(sessionKey);

  const nextRow = {
    sessionKey,
    playerId: ctx.sender,
    scenarioId,
    sourceTab: options.sourceTab ?? "map",
    returnTab: options.returnTab ?? options.sourceTab ?? "map",
    phase: "orders" as CommandPhase,
    status: "active",
    title: scenario.title,
    briefing: scenario.briefing,
    ordersJson: JSON.stringify(orders),
    selectedOrderId: undefined,
    resultTitle: undefined,
    resultSummary: undefined,
    createdAt: existing?.createdAt ?? ctx.timestamp,
    updatedAt: ctx.timestamp,
    resolvedAt: undefined,
    closedAt: undefined,
  };

  if (existing) {
    ctx.db.commandSession.sessionKey.update({
      ...existing,
      ...nextRow,
    });
  } else {
    ctx.db.commandSession.insert(nextRow);
  }

  replaceCommandPartyMembers(ctx, sessionKey, actors);

  emitTelemetry(ctx, "command_mode_opened", {
    scenarioId,
    sourceTab: nextRow.sourceTab,
    returnTab: nextRow.returnTab,
  });
};

const getActiveCommandSession = (ctx: any): any => {
  const session = ctx.db.commandSession.sessionKey.find(
    createCommandSessionKey(ctx.sender),
  );
  if (!session || session.status === "closed") {
    throw new SenderError("No active command session");
  }
  return session;
};

export const issueCommandInternal = (ctx: any, orderId: string): any => {
  const session = getActiveCommandSession(ctx);
  if (session.phase !== "orders" && session.phase !== "briefing") {
    throw new SenderError("Command session is not ready for new orders");
  }

  const scenario = getCommandScenario(session.scenarioId);
  const availableOrders = buildCommandOrderPresentation(ctx, scenario);
  const selected = availableOrders.find((entry) => entry.id === orderId);
  if (!selected) {
    throw new SenderError(`Unknown command order ${orderId}`);
  }
  if (selected.disabled) {
    throw new SenderError(selected.disabledReason ?? "Command order is locked");
  }

  ctx.db.commandSession.sessionKey.update({
    ...session,
    phase: "resolving",
    selectedOrderId: orderId,
    resultTitle: undefined,
    resultSummary: undefined,
    updatedAt: ctx.timestamp,
    closedAt: undefined,
  });

  emitTelemetry(ctx, "command_order_issued", {
    scenarioId: session.scenarioId,
    orderId,
    actorId: selected.actorId,
  });

  return selected;
};

export const resolveCommandInternal = (ctx: any): void => {
  const session = getActiveCommandSession(ctx);
  if (session.phase !== "resolving" || !session.selectedOrderId) {
    throw new SenderError("No command order is awaiting resolution");
  }

  const scenario = getCommandScenario(session.scenarioId);
  const order = scenario.orders.find(
    (entry) => entry.id === session.selectedOrderId,
  );
  if (!order) {
    throw new SenderError(`Unknown command order ${session.selectedOrderId}`);
  }

  applyEffects(ctx, order.effects, {
    sourceType: "command_order",
    sourceId: `${scenario.id}::${order.id}`,
  });

  ctx.db.commandOrderHistory.insert({
    historyKey: createCommandHistoryKey(
      ctx.sender,
      order.id,
      ctx.timestamp.microsSinceUnixEpoch,
    ),
    sessionKey: session.sessionKey,
    playerId: ctx.sender,
    scenarioId: scenario.id,
    orderId: order.id,
    actorId: order.actorId,
    title: order.resultTitle,
    summary: order.resultSummary,
    createdAt: ctx.timestamp,
  });

  const refreshedOrders = buildCommandOrderPresentation(ctx, scenario);
  const refreshedActors = scenario.actors
    .map((actor) => buildCommandActorPresentation(ctx, actor))
    .sort((left, right) => left.sortOrder - right.sortOrder);
  replaceCommandPartyMembers(ctx, session.sessionKey, refreshedActors);

  ctx.db.commandSession.sessionKey.update({
    ...session,
    phase: "result",
    status: "resolved",
    ordersJson: JSON.stringify(refreshedOrders),
    resultTitle: order.resultTitle,
    resultSummary: order.resultSummary,
    updatedAt: ctx.timestamp,
    resolvedAt: ctx.timestamp,
  });

  emitTelemetry(ctx, "command_order_resolved", {
    scenarioId: scenario.id,
    orderId: order.id,
    actorId: order.actorId,
  });
};

export const closeCommandModeInternal = (ctx: any): void => {
  const session = getActiveCommandSession(ctx);

  ctx.db.commandSession.sessionKey.update({
    ...session,
    phase: "closed",
    status: "closed",
    updatedAt: ctx.timestamp,
    closedAt: ctx.timestamp,
  });

  emitTelemetry(ctx, "command_mode_closed", {
    scenarioId: session.scenarioId,
    returnTab: session.returnTab,
  });
};

interface BattleStatusState {
  statusId: string;
  label: string;
  amount: number;
  durationTurns: number;
}

interface BattleCombatantState {
  combatantId: string;
  side: BattleSide;
  slotIndex: number;
  label: string;
  subtitle?: string;
  portraitUrl?: string;
  resolve: number;
  maxResolve: number;
  ap: number;
  maxAp: number;
  block: number;
  nextIntentCardId?: string;
  nextIntentLabel?: string;
  nextIntentSummary?: string;
  initiative?: number;
  statuses: BattleStatusState[];
  targetRulesJson?: string;
  resourceExtrasJson?: string;
}

interface BattleCardInstanceState {
  instanceId: string;
  ownerCombatantId: string;
  cardId: string;
  zone: BattleZone;
  zoneOrder: number;
}

const getBattleScenarioInternal = (
  scenarioId: string,
): BattleScenarioTemplate => {
  try {
    return getBattleScenario(scenarioId);
  } catch (error) {
    throw new SenderError(
      error instanceof Error ? error.message : String(error),
    );
  }
};

const getBattleCardInternal = (cardId: string): BattleCardDefinition => {
  try {
    return getBattleCard(cardId);
  } catch (error) {
    throw new SenderError(
      error instanceof Error ? error.message : String(error),
    );
  }
};

const extractSourceScenarioId = (source?: {
  sourceType: string;
  sourceId: string;
}): string | undefined => {
  if (!source || !source.sourceType.startsWith("vn_")) {
    return undefined;
  }

  const [scenarioId] = source.sourceId.split("::");
  return scenarioId && scenarioId.trim().length > 0 ? scenarioId : undefined;
};

const parseBattleStatuses = (
  value: string | undefined,
): BattleStatusState[] => {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((entry): entry is BattleStatusState => {
      if (!entry || typeof entry !== "object") {
        return false;
      }
      const status = entry as Record<string, unknown>;
      return (
        typeof status.statusId === "string" &&
        typeof status.label === "string" &&
        typeof status.amount === "number" &&
        typeof status.durationTurns === "number"
      );
    });
  } catch (_error) {
    return [];
  }
};

const nextBattleIntentCard = (
  scenario: BattleScenarioTemplate,
  cursor: number,
): BattleCardDefinition | null => {
  if (scenario.enemy.intentSequence.length === 0) {
    return null;
  }

  return getBattleCardInternal(
    scenario.enemy.intentSequence[
      cursor % scenario.enemy.intentSequence.length
    ]!,
  );
};

const setEnemyIntentPreview = (
  enemy: BattleCombatantState,
  scenario: BattleScenarioTemplate,
  cursor: number,
): void => {
  const nextIntent = nextBattleIntentCard(scenario, cursor);
  enemy.nextIntentCardId = nextIntent?.id;
  enemy.nextIntentLabel = nextIntent?.label;
  enemy.nextIntentSummary = nextIntent?.effectPreview;
};

const compareBattleZoneOrder = (
  left: BattleCardInstanceState,
  right: BattleCardInstanceState,
): number =>
  left.zoneOrder - right.zoneOrder ||
  left.instanceId.localeCompare(right.instanceId);

const normalizeBattleCardZones = (
  cards: BattleCardInstanceState[],
): BattleCardInstanceState[] => {
  for (const zone of ["deck", "hand", "discard"] as BattleZone[]) {
    const zoneCards = cards
      .filter((entry) => entry.zone === zone)
      .sort(compareBattleZoneOrder);
    zoneCards.forEach((entry, index) => {
      entry.zoneOrder = index;
    });
  }
  return cards;
};

const listBattleCardsInZone = (
  cards: BattleCardInstanceState[],
  zone: BattleZone,
): BattleCardInstanceState[] =>
  cards.filter((entry) => entry.zone === zone).sort(compareBattleZoneOrder);

const drawBattleCards = (
  cards: BattleCardInstanceState[],
  amount: number,
): number => {
  let drawn = 0;
  for (let idx = 0; idx < amount; idx += 1) {
    let deckCards = listBattleCardsInZone(cards, "deck");
    if (deckCards.length === 0) {
      const discardCards = listBattleCardsInZone(cards, "discard");
      if (discardCards.length === 0) {
        break;
      }

      discardCards.forEach((entry) => {
        entry.zone = "deck";
      });
      normalizeBattleCardZones(cards);
      deckCards = listBattleCardsInZone(cards, "deck");
    }

    const nextCard = deckCards[0];
    if (!nextCard) {
      break;
    }

    nextCard.zone = "hand";
    drawn += 1;
    normalizeBattleCardZones(cards);
  }

  return drawn;
};

const moveBattleCardToDiscard = (
  cards: BattleCardInstanceState[],
  instanceId: string,
): void => {
  const card = cards.find((entry) => entry.instanceId === instanceId);
  if (!card) {
    throw new SenderError(`Unknown battle card instance ${instanceId}`);
  }

  card.zone = "discard";
  normalizeBattleCardZones(cards);
};

const createInitialBattleCards = (
  scenario: BattleScenarioTemplate,
): BattleCardInstanceState[] => {
  const cards = scenario.player.deck.map((cardId, index) => ({
    instanceId: `card_${index}`,
    ownerCombatantId: scenario.player.combatantId,
    cardId,
    zone: "deck" as BattleZone,
    zoneOrder: index,
  }));

  drawBattleCards(cards, scenario.player.openingHand);
  return normalizeBattleCardZones(cards);
};

const getBattleCombatantBySide = (
  combatants: readonly BattleCombatantState[],
  side: BattleSide,
): BattleCombatantState => {
  const combatant = combatants.find((entry) => entry.side === side);
  if (!combatant) {
    throw new SenderError(`Missing battle combatant for side ${side}`);
  }
  return combatant;
};

const applyBattleStatus = (
  target: BattleCombatantState,
  effect: Extract<BattleCardEffect, { type: "apply_status" }>,
): void => {
  const existing = target.statuses.find(
    (entry) => entry.statusId === effect.statusId,
  );
  if (existing) {
    existing.amount += effect.amount;
    existing.durationTurns = Math.max(
      existing.durationTurns,
      effect.durationTurns,
    );
    return;
  }

  target.statuses.push({
    statusId: effect.statusId,
    label: effect.label,
    amount: effect.amount,
    durationTurns: effect.durationTurns,
  });
};

const applyBattleDamage = (
  target: BattleCombatantState,
  amount: number,
): { absorbed: number; dealt: number } => {
  const absorbed = Math.min(target.block, amount);
  const dealt = Math.max(0, amount - absorbed);
  target.block = Math.max(0, target.block - absorbed);
  target.resolve = Math.max(0, target.resolve - dealt);
  return { absorbed, dealt };
};

const resolveBattleEffectTarget = (
  acting: BattleCombatantState,
  opposing: BattleCombatantState,
  target: BattleCardEffectTarget,
): BattleCombatantState => (target === "self" ? acting : opposing);

const applyBattleCardEffectsInternal = (
  acting: BattleCombatantState,
  opposing: BattleCombatantState,
  card: BattleCardDefinition,
  cards: BattleCardInstanceState[],
  labels: BattleScenarioTemplate["labels"],
  history: string[],
): void => {
  history.push(`${acting.label} plays ${card.label}.`);

  for (const effect of card.effects) {
    if (effect.type === "damage_resolve") {
      const target = resolveBattleEffectTarget(acting, opposing, effect.target);
      const { absorbed, dealt } = applyBattleDamage(target, effect.amount);
      if (absorbed > 0) {
        history.push(
          `${target.label} absorbs ${absorbed} ${labels.resolve.toLowerCase()} with ${labels.block.toLowerCase()}.`,
        );
      }
      if (dealt > 0) {
        history.push(
          `${target.label} loses ${dealt} ${labels.resolve.toLowerCase()}.`,
        );
      }
      continue;
    }

    if (effect.type === "gain_block") {
      const target = resolveBattleEffectTarget(acting, opposing, effect.target);
      target.block += effect.amount;
      history.push(
        `${target.label} gains ${effect.amount} ${labels.block.toLowerCase()}.`,
      );
      continue;
    }

    if (effect.type === "heal_resolve") {
      const target = resolveBattleEffectTarget(acting, opposing, effect.target);
      const healed = Math.min(
        effect.amount,
        Math.max(0, target.maxResolve - target.resolve),
      );
      target.resolve += healed;
      if (healed > 0) {
        history.push(
          `${target.label} recovers ${healed} ${labels.resolve.toLowerCase()}.`,
        );
      }
      continue;
    }

    if (effect.type === "draw_cards") {
      const drawn = drawBattleCards(cards, effect.amount);
      if (drawn > 0) {
        history.push(
          `${acting.label} draws ${drawn} card${drawn === 1 ? "" : "s"}.`,
        );
      }
      continue;
    }

    if (effect.type === "gain_ap") {
      acting.ap += effect.amount;
      history.push(
        `${acting.label} gains ${effect.amount} ${labels.ap.toLowerCase()}.`,
      );
      continue;
    }

    applyBattleStatus(
      resolveBattleEffectTarget(acting, opposing, effect.target),
      effect,
    );
    history.push(
      `${resolveBattleEffectTarget(acting, opposing, effect.target).label} gains ${effect.label}.`,
    );
  }
};

const replaceBattleCombatants = (
  ctx: any,
  sessionKey: string,
  combatants: readonly BattleCombatantState[],
): void => {
  for (const row of ctx.db.battleCombatant.iter()) {
    if (
      row.sessionKey === sessionKey &&
      identityKey(row.playerId) === identityKey(ctx.sender)
    ) {
      ctx.db.battleCombatant.combatantKey.delete(row.combatantKey);
    }
  }

  for (const combatant of combatants) {
    ctx.db.battleCombatant.insert({
      combatantKey: createBattleCombatantKey(ctx.sender, combatant.combatantId),
      sessionKey,
      playerId: ctx.sender,
      combatantId: combatant.combatantId,
      side: combatant.side,
      slotIndex: combatant.slotIndex,
      label: combatant.label,
      subtitle: combatant.subtitle,
      portraitUrl: combatant.portraitUrl,
      resolve: combatant.resolve,
      maxResolve: combatant.maxResolve,
      ap: combatant.ap,
      maxAp: combatant.maxAp,
      block: combatant.block,
      nextIntentCardId: combatant.nextIntentCardId,
      nextIntentLabel: combatant.nextIntentLabel,
      nextIntentSummary: combatant.nextIntentSummary,
      initiative: combatant.initiative,
      statusesJson: JSON.stringify(combatant.statuses),
      targetRulesJson: combatant.targetRulesJson,
      resourceExtrasJson: combatant.resourceExtrasJson,
      updatedAt: ctx.timestamp,
    });
  }
};

const replaceBattleCards = (
  ctx: any,
  sessionKey: string,
  cards: readonly BattleCardInstanceState[],
  player: BattleCombatantState,
  phase: BattlePhase,
): void => {
  for (const row of ctx.db.battleCardInstance.iter()) {
    if (
      row.sessionKey === sessionKey &&
      identityKey(row.playerId) === identityKey(ctx.sender)
    ) {
      ctx.db.battleCardInstance.cardInstanceKey.delete(row.cardInstanceKey);
    }
  }

  for (const card of cards) {
    const definition = getBattleCardInternal(card.cardId);
    const isPlayable =
      phase === "player_turn" &&
      card.zone === "hand" &&
      card.ownerCombatantId === player.combatantId &&
      player.ap >= definition.costAp;

    ctx.db.battleCardInstance.insert({
      cardInstanceKey: createBattleCardInstanceKey(ctx.sender, card.instanceId),
      sessionKey,
      playerId: ctx.sender,
      instanceId: card.instanceId,
      ownerCombatantId: card.ownerCombatantId,
      cardId: card.cardId,
      label: definition.label,
      description: definition.description,
      effectPreview: definition.effectPreview,
      artUrl: definition.artUrl,
      tagsJson: definition.tags ? JSON.stringify(definition.tags) : undefined,
      costAp: definition.costAp,
      zone: card.zone,
      zoneOrder: card.zoneOrder,
      isPlayable,
      playableReason:
        card.zone !== "hand"
          ? undefined
          : phase !== "player_turn"
            ? "Wait for your turn."
            : player.ap < definition.costAp
              ? `Requires ${definition.costAp} Pressure.`
              : undefined,
      targetRule: undefined,
      updatedAt: ctx.timestamp,
    });
  }
};

const appendBattleHistory = (
  ctx: any,
  sessionKey: string,
  turnCount: number,
  entryType: string,
  messages: readonly string[],
): void => {
  messages.forEach((message, index) => {
    ctx.db.battleHistory.insert({
      historyKey: createBattleHistoryKey(
        ctx.sender,
        ctx.timestamp.microsSinceUnixEpoch,
        index,
      ),
      sessionKey,
      playerId: ctx.sender,
      turnCount,
      entryType,
      message,
      createdAt: ctx.timestamp,
    });
  });
};

const clearBattleHistory = (ctx: any, sessionKey: string): void => {
  for (const row of ctx.db.battleHistory.iter()) {
    if (
      row.sessionKey === sessionKey &&
      identityKey(row.playerId) === identityKey(ctx.sender)
    ) {
      ctx.db.battleHistory.historyKey.delete(row.historyKey);
    }
  }
};

const getActiveBattleSession = (ctx: any): any => {
  const session = ctx.db.battleSession.sessionKey.find(
    createBattleSessionKey(ctx.sender),
  );
  if (!session || session.status === "closed") {
    throw new SenderError("No active battle session");
  }
  return session;
};

const readBattleCombatants = (
  ctx: any,
  sessionKey: string,
): BattleCombatantState[] =>
  [...ctx.db.battleCombatant.iter()]
    .filter(
      (row) =>
        row.sessionKey === sessionKey &&
        identityKey(row.playerId) === identityKey(ctx.sender),
    )
    .map((row) => ({
      combatantId: row.combatantId,
      side: (row.side === "enemy" ? "enemy" : "player") as BattleSide,
      slotIndex: Number(row.slotIndex),
      label: row.label,
      subtitle: row.subtitle,
      portraitUrl: row.portraitUrl,
      resolve: row.resolve,
      maxResolve: row.maxResolve,
      ap: row.ap,
      maxAp: row.maxAp,
      block: row.block,
      nextIntentCardId: row.nextIntentCardId,
      nextIntentLabel: row.nextIntentLabel,
      nextIntentSummary: row.nextIntentSummary,
      initiative: row.initiative,
      statuses: parseBattleStatuses(row.statusesJson),
      targetRulesJson: row.targetRulesJson,
      resourceExtrasJson: row.resourceExtrasJson,
    }))
    .sort((left, right) => left.slotIndex - right.slotIndex);

const readBattleCards = (
  ctx: any,
  sessionKey: string,
): BattleCardInstanceState[] =>
  normalizeBattleCardZones(
    [...ctx.db.battleCardInstance.iter()]
      .filter(
        (row) =>
          row.sessionKey === sessionKey &&
          identityKey(row.playerId) === identityKey(ctx.sender),
      )
      .map((row) => ({
        instanceId: row.instanceId,
        ownerCombatantId: row.ownerCombatantId,
        cardId: row.cardId,
        zone:
          row.zone === "hand"
            ? ("hand" as const)
            : row.zone === "discard"
              ? ("discard" as const)
              : ("deck" as const),
        zoneOrder: Number(row.zoneOrder),
      })),
  );

const resolveBattleOutcomeInternal = (
  ctx: any,
  session: any,
  scenario: BattleScenarioTemplate,
  player: BattleCombatantState,
  enemy: BattleCombatantState,
  cards: BattleCardInstanceState[],
  resultType: BattleResultType,
  extraHistory: readonly string[],
): void => {
  const outcome = scenario.outcomes[resultType];
  applyEffects(ctx, [...outcome.effects], {
    sourceType: "battle_outcome",
    sourceId: `${scenario.id}::${resultType}`,
  });

  replaceBattleCombatants(ctx, session.sessionKey, [player, enemy]);
  replaceBattleCards(ctx, session.sessionKey, cards, player, "result");
  appendBattleHistory(
    ctx,
    session.sessionKey,
    Number(session.turnCount),
    "result",
    [...extraHistory, outcome.title, outcome.summary],
  );

  ctx.db.battleSession.sessionKey.update({
    ...session,
    phase: "result",
    status: "resolved",
    resultType,
    resultTitle: outcome.title,
    resultSummary: outcome.summary,
    updatedAt: ctx.timestamp,
    resolvedAt: ctx.timestamp,
  });

  emitTelemetry(ctx, "battle_resolved", {
    scenarioId: scenario.id,
    resultType,
    returnTab: session.returnTab,
  });
};

export const openBattleModeInternal = (
  ctx: any,
  scenarioId: string,
  options: {
    returnTab?: BattleReturnTab;
    sourceTab?: BattleSourceTab;
    sourceContextId?: string;
    sourceScenarioId?: string;
  } = {},
): void => {
  ensurePlayerProfile(ctx);

  const scenario = getBattleScenarioInternal(scenarioId);
  const sessionKey = createBattleSessionKey(ctx.sender);
  const existing = ctx.db.battleSession.sessionKey.find(sessionKey);
  const cards = createInitialBattleCards(scenario);
  const player: BattleCombatantState = {
    combatantId: scenario.player.combatantId,
    side: "player",
    slotIndex: 0,
    label: scenario.player.label,
    subtitle: scenario.player.subtitle,
    portraitUrl: scenario.player.portraitUrl,
    resolve: scenario.player.startingResolve,
    maxResolve: scenario.player.startingResolve,
    ap: scenario.player.maxAp,
    maxAp: scenario.player.maxAp,
    block: 0,
    statuses: [],
  };
  const enemy: BattleCombatantState = {
    combatantId: scenario.enemy.combatantId,
    side: "enemy",
    slotIndex: 0,
    label: scenario.enemy.label,
    subtitle: scenario.enemy.subtitle,
    portraitUrl: scenario.enemy.portraitUrl,
    resolve: scenario.enemy.startingResolve,
    maxResolve: scenario.enemy.startingResolve,
    ap: 0,
    maxAp: 0,
    block: 0,
    statuses: [],
  };
  setEnemyIntentPreview(enemy, scenario, 0);

  const sourceTab = options.sourceTab ?? "map";
  const returnTab = options.returnTab ?? sourceTab;
  const nextSessionRow = {
    sessionKey,
    playerId: ctx.sender,
    scenarioId,
    sourceTab,
    returnTab,
    sourceContextId: options.sourceContextId,
    sourceScenarioId: options.sourceScenarioId,
    phase: "player_turn",
    status: "active",
    turnCount: 1,
    drawPerTurn: scenario.player.drawPerTurn,
    enemyIntentCursor: 0,
    title: scenario.title,
    briefing: scenario.briefing,
    resolveLabel: scenario.labels.resolve,
    apLabel: scenario.labels.ap,
    blockLabel: scenario.labels.block,
    backgroundUrl: scenario.backgroundUrl,
    resultType: undefined,
    resultTitle: undefined,
    resultSummary: undefined,
    createdAt: existing?.createdAt ?? ctx.timestamp,
    updatedAt: ctx.timestamp,
    resolvedAt: undefined,
    closedAt: undefined,
  };

  if (existing) {
    ctx.db.battleSession.sessionKey.update({
      ...existing,
      ...nextSessionRow,
    });
  } else {
    ctx.db.battleSession.insert(nextSessionRow);
  }

  replaceBattleCombatants(ctx, sessionKey, [player, enemy]);
  replaceBattleCards(ctx, sessionKey, cards, player, "player_turn");
  clearBattleHistory(ctx, sessionKey);
  appendBattleHistory(ctx, sessionKey, 1, "system", [
    `Battle opened: ${scenario.title}.`,
    `Opponent: ${enemy.label}.`,
  ]);

  emitTelemetry(ctx, "battle_mode_opened", {
    scenarioId,
    sourceTab,
    returnTab,
  });
};

export const playBattleCardInternal = (ctx: any, instanceId: string): void => {
  const session = getActiveBattleSession(ctx);
  if (session.phase !== "player_turn" || session.status !== "active") {
    throw new SenderError("Battle is not ready for player actions");
  }

  const scenario = getBattleScenarioInternal(session.scenarioId);
  const combatants = readBattleCombatants(ctx, session.sessionKey);
  const cards = readBattleCards(ctx, session.sessionKey);
  const player = getBattleCombatantBySide(combatants, "player");
  const enemy = getBattleCombatantBySide(combatants, "enemy");
  const cardState = cards.find(
    (entry) => entry.instanceId === instanceId && entry.zone === "hand",
  );

  if (!cardState) {
    throw new SenderError(`Battle card ${instanceId} is not available in hand`);
  }

  const card = getBattleCardInternal(cardState.cardId);
  if (player.ap < card.costAp) {
    throw new SenderError("Not enough AP to play this card");
  }

  player.ap -= card.costAp;
  const history: string[] = [];
  applyBattleCardEffectsInternal(
    player,
    enemy,
    card,
    cards,
    scenario.labels,
    history,
  );
  moveBattleCardToDiscard(cards, instanceId);

  if (enemy.resolve <= 0) {
    resolveBattleOutcomeInternal(
      ctx,
      session,
      scenario,
      player,
      enemy,
      cards,
      "victory",
      history,
    );
    return;
  }

  replaceBattleCombatants(ctx, session.sessionKey, [player, enemy]);
  replaceBattleCards(ctx, session.sessionKey, cards, player, "player_turn");
  appendBattleHistory(
    ctx,
    session.sessionKey,
    Number(session.turnCount),
    "player_action",
    history,
  );

  emitTelemetry(ctx, "battle_card_played", {
    scenarioId: scenario.id,
    cardId: card.id,
  });
};

export const endBattleTurnInternal = (ctx: any): void => {
  const session = getActiveBattleSession(ctx);
  if (session.phase !== "player_turn" || session.status !== "active") {
    throw new SenderError("Battle is not ready to end the turn");
  }

  const scenario = getBattleScenarioInternal(session.scenarioId);
  const combatants = readBattleCombatants(ctx, session.sessionKey);
  const cards = readBattleCards(ctx, session.sessionKey);
  const player = getBattleCombatantBySide(combatants, "player");
  const enemy = getBattleCombatantBySide(combatants, "enemy");
  const enemyCard = nextBattleIntentCard(
    scenario,
    Number(session.enemyIntentCursor),
  );

  const history: string[] = ["You concede the floor for a moment."];
  player.block = 0;

  if (enemyCard) {
    applyBattleCardEffectsInternal(
      enemy,
      player,
      enemyCard,
      cards,
      scenario.labels,
      history,
    );
  }

  const nextCursor = Number(session.enemyIntentCursor) + (enemyCard ? 1 : 0);

  if (player.resolve <= 0) {
    enemy.nextIntentCardId = undefined;
    enemy.nextIntentLabel = undefined;
    enemy.nextIntentSummary = undefined;
    resolveBattleOutcomeInternal(
      ctx,
      session,
      scenario,
      player,
      enemy,
      cards,
      "defeat",
      history,
    );
    return;
  }

  enemy.block = 0;
  player.ap = player.maxAp;
  const drawn = drawBattleCards(cards, Number(session.drawPerTurn));
  if (drawn > 0) {
    history.push(
      `You draw ${drawn} card${drawn === 1 ? "" : "s"} for the next exchange.`,
    );
  }

  setEnemyIntentPreview(enemy, scenario, nextCursor);

  ctx.db.battleSession.sessionKey.update({
    ...session,
    phase: "player_turn",
    status: "active",
    turnCount: Number(session.turnCount) + 1,
    enemyIntentCursor: nextCursor,
    updatedAt: ctx.timestamp,
  });

  replaceBattleCombatants(ctx, session.sessionKey, [player, enemy]);
  replaceBattleCards(ctx, session.sessionKey, cards, player, "player_turn");
  appendBattleHistory(
    ctx,
    session.sessionKey,
    Number(session.turnCount) + 1,
    "enemy_turn",
    history,
  );

  emitTelemetry(ctx, "battle_turn_ended", {
    scenarioId: scenario.id,
    turnCount: Number(session.turnCount) + 1,
  });
};

export const closeBattleModeInternal = (ctx: any): void => {
  const session = getActiveBattleSession(ctx);

  ctx.db.battleSession.sessionKey.update({
    ...session,
    phase: "closed",
    status: "closed",
    updatedAt: ctx.timestamp,
    closedAt: ctx.timestamp,
  });

  emitTelemetry(ctx, "battle_mode_closed", {
    scenarioId: session.scenarioId,
    returnTab: session.returnTab,
  });
};

const SPIRIT_VALID_STATES = [
  "hostile",
  "imprisoned",
  "controlled",
  "destroyed",
];

const upsertSpiritStateInternal = (
  ctx: any,
  spiritId: string,
  state: string,
  method?: string,
  imprisonmentItemId?: string,
): void => {
  const key = `${identityKey(ctx.sender)}::spirit::${spiritId}`;
  const existing = ctx.db.playerSpiritState.spiritStateKey.find(key);

  if (existing) {
    ctx.db.playerSpiritState.spiritStateKey.update({
      ...existing,
      state,
      method: method ?? existing.method,
      imprisonmentItemId: imprisonmentItemId ?? existing.imprisonmentItemId,
      capturedAt: state !== "hostile" ? ctx.timestamp : existing.capturedAt,
      updatedAt: ctx.timestamp,
    });
  } else {
    ctx.db.playerSpiritState.insert({
      spiritStateKey: key,
      playerId: ctx.sender,
      spiritId,
      state,
      method,
      imprisonmentItemId,
      capturedAt: state !== "hostile" ? ctx.timestamp : undefined,
      updatedAt: ctx.timestamp,
    });
  }

  const statePrefix = `spirit_state_${spiritId}`;
  for (const s of SPIRIT_VALID_STATES) {
    upsertFlag(ctx, `${statePrefix}::${s}`, s === state);
  }
  if (method) {
    const methodPrefix = `spirit_method_${spiritId}`;
    const validMethods = ["dialogue", "battle", "ritual"];
    for (const m of validMethods) {
      upsertFlag(ctx, `${methodPrefix}::${m}`, m === method);
    }
  }

  emitTelemetry(ctx, `spirit_state_changed`, { spiritId, state, method });
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
    const sourceTab =
      source?.sourceType && source.sourceType.startsWith("vn_") ? "vn" : "map";

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
    if (effect.type === "open_command_mode") {
      openCommandModeInternal(ctx, effect.scenarioId, {
        returnTab: effect.returnTab,
        sourceTab,
      });
      continue;
    }
    if (effect.type === "open_battle_mode") {
      openBattleModeInternal(ctx, effect.scenarioId, {
        returnTab: effect.returnTab,
        sourceTab,
        sourceContextId: source?.sourceId,
        sourceScenarioId: extractSourceScenarioId(source),
      });
      continue;
    }
    if (effect.type === "spawn_map_event") {
      spawnMapEventInternal(ctx, effect.templateId, {
        ttlMinutes: effect.ttlMinutes,
      });
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
    if (effect.type === "shift_awakening") {
      const currentAwakening = getVar(ctx, MYSTIC_AWAKENING_VAR);
      const currentBuffer = Math.max(
        0,
        getVar(ctx, MYSTIC_RATIONALIST_BUFFER_VAR),
      );
      const dampening =
        effect.amount > 0 ? Math.min(effect.amount, currentBuffer) : 0;
      const nextAwakening = clampNumber(
        currentAwakening + effect.amount - dampening,
        0,
        100,
      );
      upsertVar(ctx, MYSTIC_AWAKENING_VAR, nextAwakening);
      if (dampening > 0) {
        upsertVar(
          ctx,
          MYSTIC_RATIONALIST_BUFFER_VAR,
          currentBuffer - dampening,
        );
      }
      if (effect.exposureDelta !== undefined) {
        upsertVar(
          ctx,
          MYSTIC_EXPOSURE_VAR,
          Math.max(0, getVar(ctx, MYSTIC_EXPOSURE_VAR) + effect.exposureDelta),
        );
      }
      continue;
    }
    if (effect.type === "record_entity_observation") {
      upsertFlag(ctx, `mystic_obs_${effect.observationId}`, true);
      if (effect.entityArchetypeId) {
        upsertFlag(ctx, `mystic_entity_${effect.entityArchetypeId}`, true);
      }
      for (const signatureId of effect.signatureIds ?? []) {
        upsertFlag(ctx, `mystic_signature_${signatureId}`, true);
      }
      continue;
    }
    if (effect.type === "unlock_distortion_point") {
      upsertFlag(ctx, `mystic_distortion_${effect.pointId}`, true);
      continue;
    }
    if (effect.type === "set_sight_mode") {
      upsertVar(ctx, MYSTIC_SIGHT_MODE_VAR, sightModeTier(effect.mode));
      continue;
    }
    if (effect.type === "apply_rationalist_buffer") {
      const nextBuffer = Math.max(
        0,
        getVar(ctx, MYSTIC_RATIONALIST_BUFFER_VAR) + effect.amount,
      );
      upsertVar(ctx, MYSTIC_RATIONALIST_BUFFER_VAR, nextBuffer);
      continue;
    }
    if (effect.type === "tag_entity_signature") {
      upsertFlag(ctx, `mystic_signature_${effect.signatureId}`, true);
      continue;
    }
    if (effect.type === "change_psyche_axis") {
      addToVar(ctx, resolvePsycheVarKey(effect.axis), effect.delta);
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
      let appliedStage = existing?.stage ?? 0;
      if (existing) {
        if (effect.stage > existing.stage) {
          ctx.db.playerQuest.questKey.update({
            ...existing,
            stage: effect.stage,
            updatedAt: ctx.timestamp,
          });
          appliedStage = effect.stage;
        }
      } else {
        ctx.db.playerQuest.insert({
          questKey,
          playerId: ctx.sender,
          questId: effect.questId,
          stage: effect.stage,
          updatedAt: ctx.timestamp,
        });
        appliedStage = effect.stage;
      }
      syncAgencyCareerQualifyingCase(ctx, effect.questId, appliedStage);
      continue;
    }

    if (effect.type === "change_relationship") {
      changeRelationshipTrust(ctx, effect.characterId, effect.delta);
      continue;
    }

    if (effect.type === "change_favor_balance") {
      changeFavorBalanceInternal(
        ctx,
        effect.npcId,
        effect.delta,
        effect.reason,
      );
      continue;
    }

    if (effect.type === "change_agency_standing") {
      changeAgencyStandingInternal(ctx, effect.delta, effect.reason);
      continue;
    }

    if (effect.type === "change_faction_signal") {
      changeFactionSignalInternal(
        ctx,
        effect.factionId,
        effect.delta,
        effect.reason,
      );
      continue;
    }

    if (effect.type === "register_rumor") {
      registerRumorInternal(ctx, effect.rumorId);
      continue;
    }

    if (effect.type === "verify_rumor") {
      verifyRumorInternal(ctx, effect.rumorId, effect.verificationKind);
      continue;
    }

    if (effect.type === "record_service_criterion") {
      recordServiceCriterionInternal(ctx, effect.criterionId);
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

    if (effect.type === "grant_item") {
      const inventoryKey = createInventoryKey(ctx.sender, effect.itemId);
      const existing = ctx.db.playerInventory.inventoryKey.find(inventoryKey);
      if (existing) {
        ctx.db.playerInventory.inventoryKey.update({
          ...existing,
          quantity: existing.quantity + effect.quantity,
          updatedAt: ctx.timestamp,
        });
      } else {
        ctx.db.playerInventory.insert({
          inventoryKey,
          playerId: ctx.sender,
          itemId: effect.itemId,
          quantity: effect.quantity,
          updatedAt: ctx.timestamp,
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

    if (effect.type === "subjugate_spirit") {
      upsertSpiritStateInternal(ctx, effect.spiritId, "controlled", "dialogue");
      continue;
    }

    if (effect.type === "destroy_spirit") {
      upsertSpiritStateInternal(ctx, effect.spiritId, "destroyed");
      continue;
    }

    if (effect.type === "imprison_spirit") {
      upsertSpiritStateInternal(
        ctx,
        effect.spiritId,
        "imprisoned",
        "ritual",
        effect.requiredItemId,
      );
      continue;
    }

    if (effect.type === "release_spirit") {
      upsertSpiritStateInternal(ctx, effect.spiritId, "hostile");
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

const MAP_EVENT_STATUS_ACTIVE = "active";
const MAP_EVENT_STATUS_EXPIRED = "expired";
const MAP_EVENT_STATUS_RESOLVED = "resolved";

const isExpiredAt = (timestamp: Timestamp, now: Timestamp): boolean =>
  timestamp.microsSinceUnixEpoch <= now.microsSinceUnixEpoch;

export const parseStoredMapEventPayload = (
  payloadJson: string,
): { point: MapPoint } => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(payloadJson);
  } catch (_error) {
    throw new SenderError("map event payloadJson must be valid JSON");
  }

  const payload = asRecord(parsed, "map event payloadJson");
  if (!isMapPoint(payload.point) || payload.point.category !== "EPHEMERAL") {
    throw new SenderError("map event payloadJson has invalid shape");
  }

  return {
    point: payload.point,
  };
};

const resolveMapEventTemplate = (
  snapshot: VnSnapshot,
  templateId: string,
): MapEventTemplate => {
  const template = snapshot.map?.mapEventTemplates?.find(
    (entry) => entry.id === templateId,
  );
  if (!template) {
    throw new SenderError(`Unknown map event template: ${templateId}`);
  }

  return template;
};

const resolveMapEventTtlMinutes = (
  snapshot: VnSnapshot,
  template: MapEventTemplate,
  ttlMinutes?: number,
): number => {
  const resolved =
    ttlMinutes ??
    template.ttlMinutes ??
    snapshot.map?.testDefaults?.defaultEventTtlMinutes ??
    15;

  if (!Number.isFinite(resolved) || resolved <= 0) {
    throw new SenderError("map event ttlMinutes must be a positive number");
  }

  return resolved;
};

export const cleanupExpiredMapEvents = (ctx: any): void => {
  const playerEvents =
    ctx.db.playerMapEvent.player_map_event_player_id.filter(ctx.sender);
  for (const row of playerEvents) {
    if (row.status !== MAP_EVENT_STATUS_ACTIVE) {
      continue;
    }
    if (!isExpiredAt(row.expiresAt, ctx.timestamp)) {
      continue;
    }

    ctx.db.playerMapEvent.eventId.update({
      ...row,
      status: MAP_EVENT_STATUS_EXPIRED,
      resolvedAt: undefined,
    });
  }
};

export const listPlayerMapEvents = (ctx: any): any[] =>
  [...ctx.db.playerMapEvent.player_map_event_player_id.filter(ctx.sender)];

export const getPlayerActiveMapEventByEventId = (
  ctx: any,
  eventId: string,
): any | null => {
  const row = ctx.db.playerMapEvent.eventId.find(eventId);
  if (!row || row.playerId.toHexString() !== ctx.sender.toHexString()) {
    return null;
  }
  if (row.status !== MAP_EVENT_STATUS_ACTIVE) {
    return null;
  }
  if (isExpiredAt(row.expiresAt, ctx.timestamp)) {
    return null;
  }
  return row;
};

export const markMapEventResolved = (ctx: any, eventId: string): void => {
  const existing = ctx.db.playerMapEvent.eventId.find(eventId);
  if (
    !existing ||
    existing.playerId.toHexString() !== ctx.sender.toHexString()
  ) {
    return;
  }
  if (existing.status !== MAP_EVENT_STATUS_ACTIVE) {
    return;
  }

  ctx.db.playerMapEvent.eventId.update({
    ...existing,
    status: MAP_EVENT_STATUS_RESOLVED,
    resolvedAt: ctx.timestamp,
  });
};

export const spawnMapEventInternal = (
  ctx: any,
  templateId: string,
  options?: {
    ttlMinutes?: number;
    sourceLocationId?: string;
    snapshot?: VnSnapshot;
    snapshotChecksum?: string;
    skipCleanup?: boolean;
  },
): any => {
  ensurePlayerProfile(ctx);
  if (!options?.skipCleanup) {
    cleanupExpiredMapEvents(ctx);
  }

  const activeSnapshot =
    options?.snapshot && options?.snapshotChecksum
      ? {
          snapshot: options.snapshot,
          activeVersion: { checksum: options.snapshotChecksum },
        }
      : getActiveSnapshot(ctx);
  const template = resolveMapEventTemplate(activeSnapshot.snapshot, templateId);

  const existingActive = listPlayerMapEvents(ctx).find(
    (row) =>
      row.templateId === templateId &&
      row.status === MAP_EVENT_STATUS_ACTIVE &&
      !isExpiredAt(row.expiresAt, ctx.timestamp),
  );
  if (existingActive) {
    return existingActive;
  }

  const ttlMinutes = resolveMapEventTtlMinutes(
    activeSnapshot.snapshot,
    template,
    options?.ttlMinutes,
  );
  const ttlMicros = BigInt(Math.round(ttlMinutes * 60 * 1_000_000));
  let attempt = 0;
  let eventId = createMapEventKey(
    ctx.sender,
    templateId,
    ctx.timestamp.microsSinceUnixEpoch,
    attempt,
  );
  while (ctx.db.playerMapEvent.eventId.find(eventId)) {
    attempt += 1;
    eventId = createMapEventKey(
      ctx.sender,
      templateId,
      ctx.timestamp.microsSinceUnixEpoch,
      attempt,
    );
  }

  const row = {
    eventId,
    playerId: ctx.sender,
    templateId,
    snapshotChecksum: activeSnapshot.activeVersion.checksum,
    payloadJson: JSON.stringify({ point: template.point }),
    sourceLocationId: options?.sourceLocationId ?? template.point.locationId,
    status: MAP_EVENT_STATUS_ACTIVE,
    spawnedAt: ctx.timestamp,
    expiresAt: new Timestamp(ctx.timestamp.microsSinceUnixEpoch + ttlMicros),
    resolvedAt: undefined,
  };
  ctx.db.playerMapEvent.insert(row);
  emitTelemetry(ctx, "map_event_spawned", {
    templateId,
    eventId,
    sourceLocationId: row.sourceLocationId,
    snapshotChecksum: row.snapshotChecksum,
  });

  return row;
};

const rightRotate = (value: number, amount: number): number =>
  (value >>> amount) | (value << (32 - amount));

export const sha256Hex = (input: string): string => {
  const normalized = unescape(encodeURIComponent(input));
  const bytes = Array.from(normalized, (char) => char.charCodeAt(0));
  const bitLength = bytes.length * 8;

  bytes.push(0x80);
  while (bytes.length % 64 !== 56) {
    bytes.push(0);
  }

  const upper = Math.floor(bitLength / 0x100000000);
  const lower = bitLength >>> 0;
  for (const shift of [24, 16, 8, 0]) {
    bytes.push((upper >>> shift) & 0xff);
  }
  for (const shift of [24, 16, 8, 0]) {
    bytes.push((lower >>> shift) & 0xff);
  }

  const words = new Array<number>(64);
  const hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c,
    0x1f83d9ab, 0x5be0cd19,
  ];
  const primes = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
    0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
    0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
    0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
    0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
    0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  for (let offset = 0; offset < bytes.length; offset += 64) {
    for (let index = 0; index < 16; index += 1) {
      const base = offset + index * 4;
      words[index] =
        (bytes[base] << 24) |
        (bytes[base + 1] << 16) |
        (bytes[base + 2] << 8) |
        bytes[base + 3];
    }
    for (let index = 16; index < 64; index += 1) {
      const s0 =
        rightRotate(words[index - 15], 7) ^
        rightRotate(words[index - 15], 18) ^
        (words[index - 15] >>> 3);
      const s1 =
        rightRotate(words[index - 2], 17) ^
        rightRotate(words[index - 2], 19) ^
        (words[index - 2] >>> 10);
      words[index] =
        (((words[index - 16] + s0) | 0) + ((words[index - 7] + s1) | 0)) | 0;
    }

    let [a, b, c, d, e, f, g, h] = hash;
    for (let index = 0; index < 64; index += 1) {
      const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 =
        (((((h + s1) | 0) + ch) | 0) + ((primes[index] + words[index]) | 0)) |
        0;
      const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    hash[0] = (hash[0] + a) | 0;
    hash[1] = (hash[1] + b) | 0;
    hash[2] = (hash[2] + c) | 0;
    hash[3] = (hash[3] + d) | 0;
    hash[4] = (hash[4] + e) | 0;
    hash[5] = (hash[5] + f) | 0;
    hash[6] = (hash[6] + g) | 0;
    hash[7] = (hash[7] + h) | 0;
  }

  return hash
    .map((value) => (value >>> 0).toString(16).padStart(8, "0"))
    .join("");
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
