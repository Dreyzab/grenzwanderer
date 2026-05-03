import type {
  MindRequiredVar,
  VnEffect,
} from "../../../../src/shared/vn-contract";

export type {
  AgencyServiceCriterionId,
  CareerRankDefinition,
  FactionSignalTrend,
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
  MindCaseContent,
  MindFactContent,
  MindHypothesisContent,
  MindPalaceSnapshot,
  MindRequiredVar,
  MindVarOperator,
  NpcAvailabilityState,
  NpcRosterTier,
  NpcRuntimeIdentity,
  NpcServiceDefinition,
  NpcServiceRole,
  QrContentClass,
  QrPolicyTier,
  QrRedeemPolicy,
  RumorStateStatus,
  RumorTemplate,
  RumorVerificationKind,
  SocialCatalogSnapshot,
  VnCheckModifier,
  VnCheckModifierSource,
  VnChoice,
  VnCondition,
  VnDiceMode,
  VnEffect,
  VnNode,
  VnOutcomeGrade,
  VnOutcomeModel,
  VnRuntimeSettings,
  VnScenario,
  VnScenarioCompletionRoute,
  VnSkillCheck,
  VnSkillCheckCostBranch,
  VnSkillCheckOutcomeBranch,
  VnSnapshot,
  VoicePresenceMode,
} from "../../../../src/shared/vn-contract";

export type {
  CommandActorPresentation,
  CommandMemberAvailability,
  CommandOrderPresentation,
} from "./command_scenarios";

export type {
  BattlePhase,
  BattleResultType,
  BattleReturnTab,
  BattleSide,
  BattleSourceTab,
  BattleZone,
} from "./battle_runtime";

export type {
  MapPointSnapshot as MapPoint,
  MapRegionSnapshot as MapRegion,
} from "../../../../src/shared/vn-contract";

export type CommandReturnTab = "map" | "vn";
export type CommandPhase =
  | "briefing"
  | "orders"
  | "resolving"
  | "result"
  | "closed";

export interface HypothesisReadiness {
  requiredFacts: string[];
  requiredVars: MindRequiredVar[];
  rewardEffects: VnEffect[];
  missingFacts: string[];
  failedVarConditions: MindRequiredVar[];
  ready: boolean;
}
