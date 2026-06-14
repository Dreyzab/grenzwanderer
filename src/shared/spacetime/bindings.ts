import {
  REMOTE_MODULE as GENERATED_REMOTE_MODULE,
  __DbConnectionBuilder,
  __DbConnectionImpl,
  __makeQueryBuilder,
  __SubscriptionBuilderImpl,
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
  CaseVersion,
  ContentRating,
  ContentTranslation,
  ContentVersion,
  DialogueRating,
  FeedbackAnalysisReport,
  FeedbackAnalysisSource,
  PlayerAgencyCareer,
  PlayerEvidence,
  PlayerFactionSignal,
  PlayerFavorLedger,
  PlayerFlag,
  PlayerInventory,
  PlayerEquipment,
  PlayerLocation,
  PlayerMapEvent,
  PlayerMindCase,
  PlayerMindFact,
  PlayerMindHypothesis,
  PlayerNpcFavor,
  PlayerNpcState,
  PlayerProfile,
  PlayerQuest,
  QuestInstance,
  PlayerRedeemedCode,
  PlayerRelationship,
  PlayerRumorState,
  PlayerSpiritState,
  PlayerUnlockGroup,
  PlayerVar,
  VnSession,
  VnSkillCheckResult,
} from "../../module_bindings/types";
const queryTables = __makeQueryBuilder({
  tables: GENERATED_REMOTE_MODULE.tables,
});

type AppRemoteModule = typeof GENERATED_REMOTE_MODULE;
type BaseDbConnection = __DbConnectionImpl<AppRemoteModule>;
type BaseDbView = BaseDbConnection["db"];

type ViewDbAliases = {
  myPlayerProfile: BaseDbView["my_player_profile"];
  myPlayerFlags: BaseDbView["my_player_flags"];
  myPlayerVars: BaseDbView["my_player_vars"];
  myPlayerLocation: BaseDbView["my_player_location"];
  myPlayerInventory: BaseDbView["my_player_inventory"];
  myPlayerEquipment: BaseDbView["my_player_equipment"];
  myVnSessions: BaseDbView["my_vn_sessions"];
  myVnSkillResults: BaseDbView["my_vn_skill_results"];
  myAiRequests: BaseDbView["my_ai_requests"];
  myContentRatings: BaseDbView["my_content_ratings"];
  myDialogueRatings: BaseDbView["my_dialogue_ratings"];
  myAdminIdentity: BaseDbView["my_admin_identity"];
  feedbackReports: BaseDbView["feedback_reports"];
  feedbackReportSources: BaseDbView["feedback_report_sources"];
  workerAiRequests: BaseDbView["worker_ai_requests"];
  /** Alias for public `content_translation` table (no server view; avoids full-table view materialization on publish). */
  contentTranslations: BaseDbView["contentTranslation"];
  caseVersion: BaseDbView["caseVersion"];
  myMindCases: BaseDbView["my_mind_cases"];
  myMindFacts: BaseDbView["my_mind_facts"];
  myMindHypotheses: BaseDbView["my_mind_hypotheses"];
  myQuests: BaseDbView["my_quests"];
  myQuestInstances: BaseDbView["my_quest_instances"];
  myEvidence: BaseDbView["my_evidence"];
  myRelationships: BaseDbView["my_relationships"];
  myNpcState: BaseDbView["my_npc_state"];
  myNpcFavors: BaseDbView["my_npc_favors"];
  myFavorLedger: BaseDbView["my_favor_ledger"];
  myFactionSignals: BaseDbView["my_faction_signals"];
  myAgencyCareer: BaseDbView["my_agency_career"];
  myRumorState: BaseDbView["my_rumor_state"];
  myBattleSessions: BaseDbView["my_battle_sessions"];
  myBattleCombatants: BaseDbView["my_battle_combatants"];
  myBattleCards: BaseDbView["my_battle_cards"];
  myBattleHistory: BaseDbView["my_battle_history"];
  myCommandSessions: BaseDbView["my_command_sessions"];
  myCommandParty: BaseDbView["my_command_party"];
  myCommandHistory: BaseDbView["my_command_history"];
  myUnlockGroups: BaseDbView["my_unlock_groups"];
  myMapEvents: BaseDbView["my_map_events"];
  myRedeemedCodes: BaseDbView["my_redeemed_codes"];
  mySpiritState: BaseDbView["my_spirit_state"];
};

const viewDbAliases: Readonly<Record<keyof ViewDbAliases, keyof BaseDbView>> = {
  myPlayerProfile: "my_player_profile",
  myPlayerFlags: "my_player_flags",
  myPlayerVars: "my_player_vars",
  myPlayerLocation: "my_player_location",
  myPlayerInventory: "my_player_inventory",
  myPlayerEquipment: "my_player_equipment",
  myVnSessions: "my_vn_sessions",
  myVnSkillResults: "my_vn_skill_results",
  myAiRequests: "my_ai_requests",
  myContentRatings: "my_content_ratings",
  myDialogueRatings: "my_dialogue_ratings",
  myAdminIdentity: "my_admin_identity",
  feedbackReports: "feedback_reports",
  feedbackReportSources: "feedback_report_sources",
  workerAiRequests: "worker_ai_requests",
  contentTranslations: "contentTranslation",
  caseVersion: "caseVersion",
  myMindCases: "my_mind_cases",
  myMindFacts: "my_mind_facts",
  myMindHypotheses: "my_mind_hypotheses",
  myQuests: "my_quests",
  myQuestInstances: "my_quest_instances",
  myEvidence: "my_evidence",
  myRelationships: "my_relationships",
  myNpcState: "my_npc_state",
  myNpcFavors: "my_npc_favors",
  myFavorLedger: "my_favor_ledger",
  myFactionSignals: "my_faction_signals",
  myAgencyCareer: "my_agency_career",
  myRumorState: "my_rumor_state",
  myBattleSessions: "my_battle_sessions",
  myBattleCombatants: "my_battle_combatants",
  myBattleCards: "my_battle_cards",
  myBattleHistory: "my_battle_history",
  myCommandSessions: "my_command_sessions",
  myCommandParty: "my_command_party",
  myCommandHistory: "my_command_history",
  myUnlockGroups: "my_unlock_groups",
  myMapEvents: "my_map_events",
  myRedeemedCodes: "my_redeemed_codes",
  mySpiritState: "my_spirit_state",
};

type LegacyDbAliases = {
  playerProfile: BaseDbView["my_player_profile"];
  playerFlag: BaseDbView["my_player_flags"];
  playerVar: BaseDbView["my_player_vars"];
  playerLocation: BaseDbView["my_player_location"];
  playerInventory: BaseDbView["my_player_inventory"];
  playerEquipment: BaseDbView["my_player_equipment"];
  vnSession: BaseDbView["my_vn_sessions"];
  vnSkillCheckResult: BaseDbView["my_vn_skill_results"];
  aiRequest: BaseDbView["my_ai_requests"];
  playerMindCase: BaseDbView["my_mind_cases"];
  playerMindFact: BaseDbView["my_mind_facts"];
  playerMindHypothesis: BaseDbView["my_mind_hypotheses"];
  playerQuest: BaseDbView["my_quests"];
  questInstance: BaseDbView["my_quest_instances"];
  playerEvidence: BaseDbView["my_evidence"];
  playerRelationship: BaseDbView["my_relationships"];
  playerNpcState: BaseDbView["my_npc_state"];
  playerNpcFavor: BaseDbView["my_npc_favors"];
  playerFavorLedger: BaseDbView["my_favor_ledger"];
  playerFactionSignal: BaseDbView["my_faction_signals"];
  playerAgencyCareer: BaseDbView["my_agency_career"];
  playerRumorState: BaseDbView["my_rumor_state"];
  battleSession: BaseDbView["my_battle_sessions"];
  battleCombatant: BaseDbView["my_battle_combatants"];
  battleCardInstance: BaseDbView["my_battle_cards"];
  battleHistory: BaseDbView["my_battle_history"];
  commandSession: BaseDbView["my_command_sessions"];
  commandPartyMember: BaseDbView["my_command_party"];
  commandOrderHistory: BaseDbView["my_command_history"];
  playerUnlockGroup: BaseDbView["my_unlock_groups"];
  playerMapEvent: BaseDbView["my_map_events"];
  playerRedeemedCode: BaseDbView["my_redeemed_codes"];
  playerSpiritState: BaseDbView["my_spirit_state"];
};

const legacyDbAliases: Readonly<
  Record<keyof LegacyDbAliases, keyof BaseDbView>
> = {
  playerProfile: "my_player_profile",
  playerFlag: "my_player_flags",
  playerVar: "my_player_vars",
  playerLocation: "my_player_location",
  playerInventory: "my_player_inventory",
  playerEquipment: "my_player_equipment",
  vnSession: "my_vn_sessions",
  vnSkillCheckResult: "my_vn_skill_results",
  aiRequest: "my_ai_requests",
  playerMindCase: "my_mind_cases",
  playerMindFact: "my_mind_facts",
  playerMindHypothesis: "my_mind_hypotheses",
  playerQuest: "my_quests",
  questInstance: "my_quest_instances",
  playerEvidence: "my_evidence",
  playerRelationship: "my_relationships",
  playerNpcState: "my_npc_state",
  playerNpcFavor: "my_npc_favors",
  playerFavorLedger: "my_favor_ledger",
  playerFactionSignal: "my_faction_signals",
  playerAgencyCareer: "my_agency_career",
  playerRumorState: "my_rumor_state",
  battleSession: "my_battle_sessions",
  battleCombatant: "my_battle_combatants",
  battleCardInstance: "my_battle_cards",
  battleHistory: "my_battle_history",
  commandSession: "my_command_sessions",
  commandPartyMember: "my_command_party",
  commandOrderHistory: "my_command_history",
  playerUnlockGroup: "my_unlock_groups",
  playerMapEvent: "my_map_events",
  playerRedeemedCode: "my_redeemed_codes",
  playerSpiritState: "my_spirit_state",
};

export const tables = {
  caseVersion: queryTables.caseVersion,
  contentTranslation: queryTables.contentTranslation,
  contentTranslations: queryTables.contentTranslation,
  contentVersion: queryTables.contentVersion,
  myPlayerProfile: queryTables.my_player_profile,
  myPlayerFlags: queryTables.my_player_flags,
  myPlayerVars: queryTables.my_player_vars,
  myPlayerLocation: queryTables.my_player_location,
  myPlayerInventory: queryTables.my_player_inventory,
  myPlayerEquipment: queryTables.my_player_equipment,
  myVnSessions: queryTables.my_vn_sessions,
  myVnSkillResults: queryTables.my_vn_skill_results,
  myAiRequests: queryTables.my_ai_requests,
  myContentRatings: queryTables.my_content_ratings,
  myDialogueRatings: queryTables.my_dialogue_ratings,
  myAdminIdentity: queryTables.my_admin_identity,
  feedbackReports: queryTables.feedback_reports,
  feedbackReportSources: queryTables.feedback_report_sources,
  workerAiRequests: queryTables.worker_ai_requests,
  myMindCases: queryTables.my_mind_cases,
  myMindFacts: queryTables.my_mind_facts,
  myMindHypotheses: queryTables.my_mind_hypotheses,
  myQuests: queryTables.my_quests,
  myQuestInstances: queryTables.my_quest_instances,
  myEvidence: queryTables.my_evidence,
  myRelationships: queryTables.my_relationships,
  myNpcState: queryTables.my_npc_state,
  myNpcFavors: queryTables.my_npc_favors,
  myFavorLedger: queryTables.my_favor_ledger,
  myFactionSignals: queryTables.my_faction_signals,
  myAgencyCareer: queryTables.my_agency_career,
  myRumorState: queryTables.my_rumor_state,
  myBattleSessions: queryTables.my_battle_sessions,
  myBattleCombatants: queryTables.my_battle_combatants,
  myBattleCards: queryTables.my_battle_cards,
  myBattleHistory: queryTables.my_battle_history,
  myCommandSessions: queryTables.my_command_sessions,
  myCommandParty: queryTables.my_command_party,
  myCommandHistory: queryTables.my_command_history,
  myUnlockGroups: queryTables.my_unlock_groups,
  myMapEvents: queryTables.my_map_events,
  myRedeemedCodes: queryTables.my_redeemed_codes,
  mySpiritState: queryTables.my_spirit_state,
} as const;

export const reducers = {
  advanceQuest: generatedReducers.advanceQuest,
  advanceQuestInstance: generatedReducers.advanceQuestInstance,
  beginKarlsruheEventEntry: generatedReducers.beginKarlsruheEventEntry,
  beginFreiburgOrigin: generatedReducers.beginFreiburgOrigin,
  buyItem: generatedReducers.buyItem,
  changeAgencyStanding: generatedReducers.changeAgencyStanding,
  changeFactionSignal: generatedReducers.changeFactionSignal,
  changeFavorBalance: generatedReducers.changeFavorBalance,
  changeRelationship: generatedReducers.changeRelationship,
  closeBattleMode: generatedReducers.closeBattleMode,
  closeCommandMode: generatedReducers.closeCommandMode,
  commitMapDiscovery: generatedReducers.commitMapDiscovery,
  deleteContentRating: generatedReducers.deleteContentRating,
  deleteDialogueRating: generatedReducers.deleteDialogueRating,
  discoverFact: generatedReducers.discoverFact,
  endBattleTurn: generatedReducers.endBattleTurn,
  enqueueAiRequest: generatedReducers.enqueueAiRequest,
  enqueueProvidenceDialogue: generatedReducers.enqueueProvidenceDialogue,
  equipItem: generatedReducers.equipItem,
  grantEvidence: generatedReducers.grantEvidence,
  grantItem: generatedReducers.grantItem,
  grantXp: generatedReducers.grantXp,
  issueCommand: generatedReducers.issueCommand,
  mapInteract: generatedReducers.mapInteract,
  openBattleMode: generatedReducers.openBattleMode,
  openCommandMode: generatedReducers.openCommandMode,
  performSkillCheck: generatedReducers.performSkillCheck,
  playBattleCard: generatedReducers.playBattleCard,
  recordChoice: generatedReducers.recordChoice,
  recordServiceCriterion: generatedReducers.recordServiceCriterion,
  redeemMapCode: generatedReducers.redeemMapCode,
  registerRumor: generatedReducers.registerRumor,
  resolveCommand: generatedReducers.resolveCommand,
  setFlag: generatedReducers.setFlag,
  setHypothesisFocus: generatedReducers.setHypothesisFocus,
  setNickname: generatedReducers.setNickname,
  setQuestStage: generatedReducers.setQuestStage,
  setVar: generatedReducers.setVar,
  startMindCase: generatedReducers.startMindCase,
  startScenario: generatedReducers.startScenario,
  trackEvent: generatedReducers.trackEvent,
  travelTo: generatedReducers.travelTo,
  unequipItem: generatedReducers.unequipItem,
  unlockGroup: generatedReducers.unlockGroup,
  updateTranslations: generatedReducers.updateTranslations,
  upsertContentRating: generatedReducers.upsertContentRating,
  upsertDialogueRating: generatedReducers.upsertDialogueRating,
  runFeedbackAnalysis: generatedReducers.runFeedbackAnalysis,
  reanalyzeFeedbackReport: generatedReducers.reanalyzeFeedbackReport,
  markFeedbackReportReviewed: generatedReducers.markFeedbackReportReviewed,
  saveFeedbackReportNote: generatedReducers.saveFeedbackReportNote,
  assertHypothesis: generatedReducers.assertHypothesis,
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
  declare readonly db: BaseDbView & ViewDbAliases & LegacyDbAliases;

  constructor(config: __DbConnectionConfig<AppRemoteModule>) {
    super(config);

    const dbRecord = this.db as Record<string, unknown>;
    for (const [aliasName, sourceName] of Object.entries(
      viewDbAliases,
    ) as Array<[keyof ViewDbAliases, keyof BaseDbView]>) {
      dbRecord[aliasName] ??= dbRecord[sourceName as string];
    }
    for (const [legacyName, nextName] of Object.entries(
      legacyDbAliases,
    ) as Array<[keyof LegacyDbAliases, keyof BaseDbView]>) {
      dbRecord[legacyName] ??= dbRecord[nextName as string];
    }
  }

  static builder = (): DbConnectionBuilder =>
    new DbConnectionBuilder(
      GENERATED_REMOTE_MODULE,
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
  CaseVersion,
  ContentRating,
  ContentTranslation,
  ContentVersion,
  DialogueRating,
  FeedbackAnalysisReport,
  FeedbackAnalysisSource,
  PlayerAgencyCareer,
  PlayerEvidence,
  PlayerFactionSignal,
  PlayerFavorLedger,
  PlayerFlag,
  PlayerInventory,
  PlayerEquipment,
  PlayerLocation,
  PlayerMapEvent,
  PlayerMindCase,
  PlayerMindFact,
  PlayerMindHypothesis,
  PlayerNpcFavor,
  PlayerNpcState,
  PlayerProfile,
  PlayerQuest,
  QuestInstance,
  PlayerRedeemedCode,
  PlayerRelationship,
  PlayerRumorState,
  PlayerSpiritState,
  PlayerUnlockGroup,
  PlayerVar,
  VnSession,
  VnSkillCheckResult,
};
