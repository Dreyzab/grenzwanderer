import {
  REMOTE_MODULE as GENERATED_REMOTE_MODULE,
  __DbConnectionBuilder,
  __DbConnectionImpl,
  __makeQueryBuilder,
  __schema,
  __SubscriptionBuilderImpl,
  __table,
  reducers as generatedReducers,
} from "../../module_bindings";
import type {
  DbConnectionConfig as __DbConnectionConfig,
  ErrorContextInterface as __ErrorContextInterface,
  EventContextInterface as __EventContextInterface,
  ReducerEventContextInterface as __ReducerEventContextInterface,
  SubscriptionEventContextInterface as __SubscriptionEventContextInterface,
  SubscriptionHandleImpl as __SubscriptionHandleImpl,
} from "spacetimedb";
import type {
  AiRequest,
  BattleCardInstance,
  BattleCombatant,
  BattleHistory,
  BattleSession,
  CommandOrderHistory,
  CommandPartyMember,
  CommandSession,
  PlayerAgencyCareer,
  PlayerEvidence,
  PlayerFactionSignal,
  PlayerFlag,
  PlayerInventory,
  PlayerLocation,
  PlayerMapEvent,
  PlayerMindCase,
  PlayerMindFact,
  PlayerMindHypothesis,
  PlayerNpcFavor,
  PlayerNpcState,
  PlayerProfile,
  PlayerQuest,
  PlayerRedeemedCode,
  PlayerRelationship,
  PlayerRumorState,
  PlayerUnlockGroup,
  PlayerVar,
  VnSession,
  VnSkillCheckResult,
} from "../../module_bindings/types";
import AiRequestRow from "./generated_row_schemas/ai_request_table";
import BattleCardInstanceRow from "./generated_row_schemas/battle_card_instance_table";
import BattleCombatantRow from "./generated_row_schemas/battle_combatant_table";
import BattleHistoryRow from "./generated_row_schemas/battle_history_table";
import BattleSessionRow from "./generated_row_schemas/battle_session_table";
import CommandOrderHistoryRow from "./generated_row_schemas/command_order_history_table";
import CommandPartyMemberRow from "./generated_row_schemas/command_party_member_table";
import CommandSessionRow from "./generated_row_schemas/command_session_table";
import PlayerAgencyCareerRow from "./generated_row_schemas/player_agency_career_table";
import PlayerEvidenceRow from "./generated_row_schemas/player_evidence_table";
import PlayerFactionSignalRow from "./generated_row_schemas/player_faction_signal_table";
import PlayerFlagRow from "./generated_row_schemas/player_flag_table";
import PlayerInventoryRow from "./generated_row_schemas/player_inventory_table";
import PlayerLocationRow from "./generated_row_schemas/player_location_table";
import PlayerMapEventRow from "./generated_row_schemas/player_map_event_table";
import PlayerMindCaseRow from "./generated_row_schemas/player_mind_case_table";
import PlayerMindFactRow from "./generated_row_schemas/player_mind_fact_table";
import PlayerMindHypothesisRow from "./generated_row_schemas/player_mind_hypothesis_table";
import PlayerNpcFavorRow from "./generated_row_schemas/player_npc_favor_table";
import PlayerNpcStateRow from "./generated_row_schemas/player_npc_state_table";
import PlayerProfileRow from "./generated_row_schemas/player_profile_table";
import PlayerQuestRow from "./generated_row_schemas/player_quest_table";
import PlayerRedeemedCodeRow from "./generated_row_schemas/player_redeemed_code_table";
import PlayerRelationshipRow from "./generated_row_schemas/player_relationship_table";
import PlayerRumorStateRow from "./generated_row_schemas/player_rumor_state_table";
import PlayerUnlockGroupRow from "./generated_row_schemas/player_unlock_group_table";
import PlayerVarRow from "./generated_row_schemas/player_var_table";
import VnSessionRow from "./generated_row_schemas/vn_session_table";
import VnSkillCheckResultRow from "./generated_row_schemas/vn_skill_check_result_table";

const toSnakeCase = (value: string): string =>
  value
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .toLowerCase();

const viewTablesSchema = __schema({
  myPlayerProfile: __table({ name: "my_player_profile" }, PlayerProfileRow),
  myPlayerFlags: __table({ name: "my_player_flags" }, PlayerFlagRow),
  myPlayerVars: __table({ name: "my_player_vars" }, PlayerVarRow),
  myPlayerLocation: __table({ name: "my_player_location" }, PlayerLocationRow),
  myPlayerInventory: __table(
    { name: "my_player_inventory" },
    PlayerInventoryRow,
  ),
  myVnSessions: __table({ name: "my_vn_sessions" }, VnSessionRow),
  myVnSkillResults: __table(
    { name: "my_vn_skill_results" },
    VnSkillCheckResultRow,
  ),
  myAiRequests: __table({ name: "my_ai_requests" }, AiRequestRow),
  workerAiRequests: __table({ name: "worker_ai_requests" }, AiRequestRow),
  myMindCases: __table({ name: "my_mind_cases" }, PlayerMindCaseRow),
  myMindFacts: __table({ name: "my_mind_facts" }, PlayerMindFactRow),
  myMindHypotheses: __table(
    { name: "my_mind_hypotheses" },
    PlayerMindHypothesisRow,
  ),
  myQuests: __table({ name: "my_quests" }, PlayerQuestRow),
  myEvidence: __table({ name: "my_evidence" }, PlayerEvidenceRow),
  myRelationships: __table({ name: "my_relationships" }, PlayerRelationshipRow),
  myNpcState: __table({ name: "my_npc_state" }, PlayerNpcStateRow),
  myNpcFavors: __table({ name: "my_npc_favors" }, PlayerNpcFavorRow),
  myFactionSignals: __table(
    { name: "my_faction_signals" },
    PlayerFactionSignalRow,
  ),
  myAgencyCareer: __table({ name: "my_agency_career" }, PlayerAgencyCareerRow),
  myRumorState: __table({ name: "my_rumor_state" }, PlayerRumorStateRow),
  myBattleSessions: __table({ name: "my_battle_sessions" }, BattleSessionRow),
  myBattleCombatants: __table(
    { name: "my_battle_combatants" },
    BattleCombatantRow,
  ),
  myBattleCards: __table({ name: "my_battle_cards" }, BattleCardInstanceRow),
  myBattleHistory: __table({ name: "my_battle_history" }, BattleHistoryRow),
  myCommandSessions: __table(
    { name: "my_command_sessions" },
    CommandSessionRow,
  ),
  myCommandParty: __table({ name: "my_command_party" }, CommandPartyMemberRow),
  myCommandHistory: __table(
    { name: "my_command_history" },
    CommandOrderHistoryRow,
  ),
  myUnlockGroups: __table({ name: "my_unlock_groups" }, PlayerUnlockGroupRow),
  myMapEvents: __table({ name: "my_map_events" }, PlayerMapEventRow),
  myRedeemedCodes: __table(
    { name: "my_redeemed_codes" },
    PlayerRedeemedCodeRow,
  ),
});

const APP_REMOTE_MODULE = {
  ...GENERATED_REMOTE_MODULE,
  tables: {
    ...GENERATED_REMOTE_MODULE.tables,
    ...viewTablesSchema.schemaType.tables,
  },
} as const;

for (const [key, table] of Object.entries(APP_REMOTE_MODULE.tables)) {
  (table as { sourceName?: string }).sourceName ??= toSnakeCase(key);
}

const queryTables = __makeQueryBuilder({
  tables: APP_REMOTE_MODULE.tables,
});

type AppRemoteModule = typeof APP_REMOTE_MODULE;
type BaseDbConnection = __DbConnectionImpl<AppRemoteModule>;
type BaseDbView = BaseDbConnection["db"];

type LegacyDbAliases = {
  playerProfile: BaseDbView["myPlayerProfile"];
  playerFlag: BaseDbView["myPlayerFlags"];
  playerVar: BaseDbView["myPlayerVars"];
  playerLocation: BaseDbView["myPlayerLocation"];
  playerInventory: BaseDbView["myPlayerInventory"];
  vnSession: BaseDbView["myVnSessions"];
  vnSkillCheckResult: BaseDbView["myVnSkillResults"];
  aiRequest: BaseDbView["myAiRequests"];
  playerMindCase: BaseDbView["myMindCases"];
  playerMindFact: BaseDbView["myMindFacts"];
  playerMindHypothesis: BaseDbView["myMindHypotheses"];
  playerQuest: BaseDbView["myQuests"];
  playerEvidence: BaseDbView["myEvidence"];
  playerRelationship: BaseDbView["myRelationships"];
  playerNpcState: BaseDbView["myNpcState"];
  playerNpcFavor: BaseDbView["myNpcFavors"];
  playerFactionSignal: BaseDbView["myFactionSignals"];
  playerAgencyCareer: BaseDbView["myAgencyCareer"];
  playerRumorState: BaseDbView["myRumorState"];
  battleSession: BaseDbView["myBattleSessions"];
  battleCombatant: BaseDbView["myBattleCombatants"];
  battleCardInstance: BaseDbView["myBattleCards"];
  battleHistory: BaseDbView["myBattleHistory"];
  commandSession: BaseDbView["myCommandSessions"];
  commandPartyMember: BaseDbView["myCommandParty"];
  commandOrderHistory: BaseDbView["myCommandHistory"];
  playerUnlockGroup: BaseDbView["myUnlockGroups"];
  playerMapEvent: BaseDbView["myMapEvents"];
  playerRedeemedCode: BaseDbView["myRedeemedCodes"];
};

const legacyDbAliases: Readonly<
  Record<keyof LegacyDbAliases, keyof BaseDbView>
> = {
  playerProfile: "myPlayerProfile",
  playerFlag: "myPlayerFlags",
  playerVar: "myPlayerVars",
  playerLocation: "myPlayerLocation",
  playerInventory: "myPlayerInventory",
  vnSession: "myVnSessions",
  vnSkillCheckResult: "myVnSkillResults",
  aiRequest: "myAiRequests",
  playerMindCase: "myMindCases",
  playerMindFact: "myMindFacts",
  playerMindHypothesis: "myMindHypotheses",
  playerQuest: "myQuests",
  playerEvidence: "myEvidence",
  playerRelationship: "myRelationships",
  playerNpcState: "myNpcState",
  playerNpcFavor: "myNpcFavors",
  playerFactionSignal: "myFactionSignals",
  playerAgencyCareer: "myAgencyCareer",
  playerRumorState: "myRumorState",
  battleSession: "myBattleSessions",
  battleCombatant: "myBattleCombatants",
  battleCardInstance: "myBattleCards",
  battleHistory: "myBattleHistory",
  commandSession: "myCommandSessions",
  commandPartyMember: "myCommandParty",
  commandOrderHistory: "myCommandHistory",
  playerUnlockGroup: "myUnlockGroups",
  playerMapEvent: "myMapEvents",
  playerRedeemedCode: "myRedeemedCodes",
};

export const tables = {
  contentSnapshot: queryTables.contentSnapshot,
  contentVersion: queryTables.contentVersion,
  mindCase: queryTables.mindCase,
  mindFact: queryTables.mindFact,
  mindHypothesis: queryTables.mindHypothesis,
  myPlayerProfile: queryTables.myPlayerProfile,
  myPlayerFlags: queryTables.myPlayerFlags,
  myPlayerVars: queryTables.myPlayerVars,
  myPlayerLocation: queryTables.myPlayerLocation,
  myPlayerInventory: queryTables.myPlayerInventory,
  myVnSessions: queryTables.myVnSessions,
  myVnSkillResults: queryTables.myVnSkillResults,
  myAiRequests: queryTables.myAiRequests,
  workerAiRequests: queryTables.workerAiRequests,
  myMindCases: queryTables.myMindCases,
  myMindFacts: queryTables.myMindFacts,
  myMindHypotheses: queryTables.myMindHypotheses,
  myQuests: queryTables.myQuests,
  myEvidence: queryTables.myEvidence,
  myRelationships: queryTables.myRelationships,
  myNpcState: queryTables.myNpcState,
  myNpcFavors: queryTables.myNpcFavors,
  myFactionSignals: queryTables.myFactionSignals,
  myAgencyCareer: queryTables.myAgencyCareer,
  myRumorState: queryTables.myRumorState,
  myBattleSessions: queryTables.myBattleSessions,
  myBattleCombatants: queryTables.myBattleCombatants,
  myBattleCards: queryTables.myBattleCards,
  myBattleHistory: queryTables.myBattleHistory,
  myCommandSessions: queryTables.myCommandSessions,
  myCommandParty: queryTables.myCommandParty,
  myCommandHistory: queryTables.myCommandHistory,
  myUnlockGroups: queryTables.myUnlockGroups,
  myMapEvents: queryTables.myMapEvents,
  myRedeemedCodes: queryTables.myRedeemedCodes,
  playerProfile: queryTables.myPlayerProfile,
  playerFlag: queryTables.myPlayerFlags,
  playerVar: queryTables.myPlayerVars,
  playerLocation: queryTables.myPlayerLocation,
  playerInventory: queryTables.myPlayerInventory,
  vnSession: queryTables.myVnSessions,
  vnSkillCheckResult: queryTables.myVnSkillResults,
  aiRequest: queryTables.myAiRequests,
  playerMindCase: queryTables.myMindCases,
  playerMindFact: queryTables.myMindFacts,
  playerMindHypothesis: queryTables.myMindHypotheses,
  playerQuest: queryTables.myQuests,
  playerEvidence: queryTables.myEvidence,
  playerRelationship: queryTables.myRelationships,
  playerNpcState: queryTables.myNpcState,
  playerNpcFavor: queryTables.myNpcFavors,
  playerFactionSignal: queryTables.myFactionSignals,
  playerAgencyCareer: queryTables.myAgencyCareer,
  playerRumorState: queryTables.myRumorState,
  battleSession: queryTables.myBattleSessions,
  battleCombatant: queryTables.myBattleCombatants,
  battleCardInstance: queryTables.myBattleCards,
  battleHistory: queryTables.myBattleHistory,
  commandSession: queryTables.myCommandSessions,
  commandPartyMember: queryTables.myCommandParty,
  commandOrderHistory: queryTables.myCommandHistory,
  playerUnlockGroup: queryTables.myUnlockGroups,
  playerMapEvent: queryTables.myMapEvents,
  playerRedeemedCode: queryTables.myRedeemedCodes,
} as const;

export const reducers = {
  advanceQuest: generatedReducers.advanceQuest,
  beginFreiburgOrigin: generatedReducers.beginFreiburgOrigin,
  buyItem: generatedReducers.buyItem,
  changeAgencyStanding: generatedReducers.changeAgencyStanding,
  changeFactionSignal: generatedReducers.changeFactionSignal,
  changeFavorBalance: generatedReducers.changeFavorBalance,
  changeRelationship: generatedReducers.changeRelationship,
  closeBattleMode: generatedReducers.closeBattleMode,
  closeCommandMode: generatedReducers.closeCommandMode,
  discoverFact: generatedReducers.discoverFact,
  endBattleTurn: generatedReducers.endBattleTurn,
  enqueueAiRequest: generatedReducers.enqueueAiRequest,
  grantEvidence: generatedReducers.grantEvidence,
  grantItem: generatedReducers.grantItem,
  grantXp: generatedReducers.grantXp,
  heartbeatPresence: generatedReducers.heartbeatPresence,
  issueCommand: generatedReducers.issueCommand,
  joinAgency: generatedReducers.joinAgency,
  mapInteract: generatedReducers.mapInteract,
  openBattleMode: generatedReducers.openBattleMode,
  openCommandMode: generatedReducers.openCommandMode,
  performSkillCheck: generatedReducers.performSkillCheck,
  playBattleCard: generatedReducers.playBattleCard,
  purgeMindThought: generatedReducers.purgeMindThought,
  recordChoice: generatedReducers.recordChoice,
  recordServiceCriterion: generatedReducers.recordServiceCriterion,
  redeemMapCode: generatedReducers.redeemMapCode,
  registerRumor: generatedReducers.registerRumor,
  resolveCommand: generatedReducers.resolveCommand,
  restAndRecover: generatedReducers.restAndRecover,
  setFlag: generatedReducers.setFlag,
  setHypothesisFocus: generatedReducers.setHypothesisFocus,
  setNickname: generatedReducers.setNickname,
  setQuestStage: generatedReducers.setQuestStage,
  setVar: generatedReducers.setVar,
  startMindCase: generatedReducers.startMindCase,
  startMindThoughtResearch: generatedReducers.startMindThoughtResearch,
  startScenario: generatedReducers.startScenario,
  trackEvent: generatedReducers.trackEvent,
  travelTo: generatedReducers.travelTo,
  unlockGroup: generatedReducers.unlockGroup,
  validateHypothesis: generatedReducers.validateHypothesis,
  verifyRumor: generatedReducers.verifyRumor,
} as const;

export type EventContext = __EventContextInterface<AppRemoteModule>;
export type ReducerEventContext =
  __ReducerEventContextInterface<AppRemoteModule>;
export type SubscriptionEventContext =
  __SubscriptionEventContextInterface<AppRemoteModule>;
export type ErrorContext = __ErrorContextInterface<AppRemoteModule>;
export type SubscriptionHandle = __SubscriptionHandleImpl<AppRemoteModule>;

export class SubscriptionBuilder extends __SubscriptionBuilderImpl<AppRemoteModule> {}

export class DbConnection extends __DbConnectionImpl<AppRemoteModule> {
  declare readonly db: BaseDbView & LegacyDbAliases;

  constructor(config: __DbConnectionConfig<AppRemoteModule>) {
    super(config);

    const dbRecord = this.db as Record<string, unknown>;
    for (const [legacyName, nextName] of Object.entries(
      legacyDbAliases,
    ) as Array<[keyof LegacyDbAliases, keyof BaseDbView]>) {
      dbRecord[legacyName] ??= dbRecord[nextName as string];
    }
  }

  static builder = (): DbConnectionBuilder =>
    new DbConnectionBuilder(
      APP_REMOTE_MODULE,
      (config: __DbConnectionConfig<AppRemoteModule>) =>
        new DbConnection(config),
    );

  override subscriptionBuilder = (): SubscriptionBuilder =>
    new SubscriptionBuilder(this);
}

export class DbConnectionBuilder extends __DbConnectionBuilder<DbConnection> {}

export type {
  AiRequest,
  BattleCardInstance,
  BattleCombatant,
  BattleHistory,
  BattleSession,
  CommandOrderHistory,
  CommandPartyMember,
  CommandSession,
  PlayerAgencyCareer,
  PlayerEvidence,
  PlayerFactionSignal,
  PlayerFlag,
  PlayerInventory,
  PlayerLocation,
  PlayerMapEvent,
  PlayerMindCase,
  PlayerMindFact,
  PlayerMindHypothesis,
  PlayerNpcFavor,
  PlayerNpcState,
  PlayerProfile,
  PlayerQuest,
  PlayerRedeemedCode,
  PlayerRelationship,
  PlayerRumorState,
  PlayerUnlockGroup,
  PlayerVar,
  VnSession,
  VnSkillCheckResult,
};
