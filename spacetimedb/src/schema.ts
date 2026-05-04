import { schema, table, t } from "spacetimedb/server";
import {
  idempotencyCleanupSchedule,
  telemetryAggregateSchedule,
  telemetryCleanupSchedule,
} from "./procedures/maintenance";
import {
  AI_REQUEST_STATUS_PENDING,
  AI_REQUEST_STATUS_PROCESSING,
} from "./reducers/aiQueue";
import { ensureAllowlistedWorker } from "./reducers/helpers";
import { senderOf, type ReducerContextLike } from "./reducers/helpers/context";

export const playerProfile = table(
  {
    name: "player_profile",
    public: false,
    indexes: [
      {
        accessor: "player_profile_nickname",
        algorithm: "btree",
        columns: ["nickname"],
      },
    ],
  },
  {
    playerId: t.identity().primaryKey(),
    nickname: t.string().optional(),
    createdAt: t.timestamp(),
    updatedAt: t.timestamp(),
  },
);

export const playerFlag = table(
  {
    name: "player_flag",
    public: false,
    indexes: [
      {
        accessor: "player_flag_player_id",
        algorithm: "btree",
        columns: ["playerId"],
      },
      {
        accessor: "player_flag_key",
        algorithm: "btree",
        columns: ["key"],
      },
    ],
  },
  {
    flagId: t.string().primaryKey(),
    playerId: t.identity(),
    key: t.string(),
    value: t.bool(),
    updatedAt: t.timestamp(),
  },
);

export const playerVar = table(
  {
    name: "player_var",
    public: false,
    indexes: [
      {
        accessor: "player_var_player_id",
        algorithm: "btree",
        columns: ["playerId"],
      },
      {
        accessor: "player_var_key",
        algorithm: "btree",
        columns: ["key"],
      },
    ],
  },
  {
    varId: t.string().primaryKey(),
    playerId: t.identity(),
    key: t.string(),
    floatValue: t.f64(),
    updatedAt: t.timestamp(),
  },
);

export const playerLocation = table(
  {
    name: "player_location",
    public: false,
  },
  {
    playerId: t.identity().primaryKey(),
    locationId: t.string(),
    updatedAt: t.timestamp(),
  },
);

export const playerInventory = table(
  {
    name: "player_inventory",
    public: false,
    indexes: [
      {
        accessor: "player_inventory_player_id",
        algorithm: "btree",
        columns: ["playerId"],
      },
      {
        accessor: "player_inventory_item_id",
        algorithm: "btree",
        columns: ["itemId"],
      },
    ],
  },
  {
    inventoryKey: t.string().primaryKey(),
    playerId: t.identity(),
    itemId: t.string(),
    quantity: t.u32(),
    updatedAt: t.timestamp(),
  },
);

export const vnSession = table(
  {
    name: "vn_session",
    public: false,
    indexes: [
      {
        accessor: "vn_session_player_id",
        algorithm: "btree",
        columns: ["playerId"],
      },
      {
        accessor: "vn_session_scenario_id",
        algorithm: "btree",
        columns: ["scenarioId"],
      },
    ],
  },
  {
    sessionKey: t.string().primaryKey(),
    playerId: t.identity(),
    scenarioId: t.string(),
    nodeId: t.string(),
    updatedAt: t.timestamp(),
    completedAt: t.timestamp().optional(),
  },
);

export const vnSkillCheckResult = table(
  {
    name: "vn_skill_check_result",
    public: false,
    indexes: [
      {
        accessor: "vn_skill_check_result_player_id",
        algorithm: "btree",
        columns: ["playerId"],
      },
      {
        accessor: "vn_skill_check_result_scenario_id",
        algorithm: "btree",
        columns: ["scenarioId"],
      },
      {
        accessor: "vn_skill_check_result_check_id",
        algorithm: "btree",
        columns: ["checkId"],
      },
    ],
  },
  {
    resultKey: t.string().primaryKey(),
    playerId: t.identity(),
    scenarioId: t.string(),
    nodeId: t.string(),
    checkId: t.string(),
    roll: t.u32(),
    voiceLevel: t.u32(),
    difficulty: t.u32(),
    baseDifficulty: t.u32(),
    fortuneSpent: t.u32(),
    passed: t.bool(),
    nextNodeId: t.string().optional(),
    breakdownJson: t.string().optional(),
    difficultyBreakdownJson: t.string().optional(),
    outcomeGrade: t.string().optional(),
    createdAt: t.timestamp(),
  },
);

export const contentVersion = table(
  {
    name: "content_version",
    public: true,
    indexes: [
      {
        accessor: "content_version_checksum",
        algorithm: "btree",
        columns: ["checksum"],
      },
      {
        accessor: "content_version_is_active",
        algorithm: "btree",
        columns: ["isActive"],
      },
    ],
  },
  {
    version: t.string().primaryKey(),
    checksum: t.string(),
    schemaVersion: t.u32(),
    publishedAt: t.timestamp(),
    isActive: t.bool(),
  },
);

export const contentSnapshot = table(
  {
    name: "content_snapshot",
    public: true,
  },
  {
    checksum: t.string().primaryKey(),
    payloadJson: t.string(),
    createdAt: t.timestamp(),
  },
);

export const contentTranslation = table(
  {
    name: "content_translation",
    public: true,
    indexes: [
      {
        accessor: "content_translation_key",
        algorithm: "btree",
        columns: ["key"],
      },
      {
        accessor: "content_translation_lang",
        algorithm: "btree",
        columns: ["lang"],
      },
      {
        accessor: "content_translation_lang_key",
        algorithm: "btree",
        columns: ["lang", "key"],
      },
    ],
  },
  {
    translationId: t.string().primaryKey(),
    key: t.string(),
    lang: t.string(),
    text: t.string(),
    updatedAt: t.timestamp(),
  },
);

export const adminIdentity = table(
  {
    name: "admin_identity",
  },
  {
    identity: t.identity().primaryKey(),
    grantedAt: t.timestamp(),
    grantedBy: t.identity().optional(),
  },
);

export const workerAllowlist = table(
  {
    name: "worker_allowlist",
  },
  {
    identity: t.identity().primaryKey(),
    grantedAt: t.timestamp(),
    grantedBy: t.identity(),
  },
);

export const idempotencyLog = table(
  {
    name: "idempotency_log",
    public: false,
    indexes: [
      {
        accessor: "idempotency_log_player_id",
        algorithm: "btree",
        columns: ["playerId"],
      },
      {
        accessor: "idempotency_log_expires_at",
        algorithm: "btree",
        columns: ["expiresAt"],
      },
    ],
  },
  {
    idempotencyKey: t.string().primaryKey(),
    playerId: t.identity(),
    requestId: t.string(),
    operation: t.string(),
    createdAt: t.timestamp(),
    expiresAt: t.timestamp(),
  },
);

export const telemetryEvent = table(
  {
    name: "telemetry_event",
    public: false,
    indexes: [
      {
        accessor: "telemetry_event_event_name",
        algorithm: "btree",
        columns: ["eventName"],
      },
      {
        accessor: "telemetry_event_created_at",
        algorithm: "btree",
        columns: ["createdAt"],
      },
    ],
  },
  {
    eventId: t.u64().primaryKey().autoInc(),
    playerId: t.identity().optional(),
    eventName: t.string(),
    tagsJson: t.string(),
    value: t.f64().optional(),
    createdAt: t.timestamp(),
  },
);

export const telemetryAggregate = table(
  {
    name: "telemetry_aggregate",
    public: false,
    indexes: [
      {
        accessor: "telemetry_aggregate_bucket_start",
        algorithm: "btree",
        columns: ["bucketStart"],
      },
      {
        accessor: "telemetry_aggregate_event_name",
        algorithm: "btree",
        columns: ["eventName"],
      },
    ],
  },
  {
    aggregateKey: t.string().primaryKey(),
    bucketStart: t.timestamp(),
    eventName: t.string(),
    tagsHash: t.string(),
    count: t.u64(),
    sumValue: t.f64(),
    updatedAt: t.timestamp(),
  },
);

export const aiRequest = table(
  {
    name: "ai_request",
    public: false,
    indexes: [
      {
        accessor: "ai_request_player_id",
        algorithm: "btree",
        columns: ["playerId"],
      },
      {
        accessor: "ai_request_request_id",
        algorithm: "btree",
        columns: ["requestId"],
      },
      {
        accessor: "ai_request_status",
        algorithm: "btree",
        columns: ["status"],
      },
      {
        accessor: "ai_request_kind_status_created_at",
        algorithm: "btree",
        columns: ["kind", "status", "createdAt"],
      },
      {
        accessor: "ai_request_claim_token",
        algorithm: "btree",
        columns: ["claimToken"],
      },
      {
        accessor: "ai_request_claimed_by_status",
        algorithm: "btree",
        columns: ["claimedBy", "status"],
      },
    ],
  },
  {
    id: t.u64().primaryKey().autoInc(),
    playerId: t.identity(),
    requestId: t.string(),
    kind: t.string(),
    payloadJson: t.string(),
    status: t.string(),
    responseJson: t.string().optional(),
    error: t.string().optional(),
    attemptCount: t.u32(),
    claimedBy: t.identity().optional(),
    claimToken: t.string().optional(),
    claimedAt: t.timestamp().optional(),
    leaseExpiresAt: t.timestamp().optional(),
    nextRetryAt: t.timestamp().optional(),
    createdAt: t.timestamp(),
    updatedAt: t.timestamp(),
  },
);

export const workerIdentity = table(
  {
    name: "worker_identity",
    public: false,
  },
  {
    identity: t.identity().primaryKey(),
  },
);

export const mindCase = table(
  {
    name: "mind_case",
    public: true,
    indexes: [
      {
        accessor: "mind_case_is_active",
        algorithm: "btree",
        columns: ["isActive"],
      },
      {
        accessor: "mind_case_schema_version",
        algorithm: "btree",
        columns: ["schemaVersion"],
      },
    ],
  },
  {
    caseId: t.string().primaryKey(),
    title: t.string(),
    schemaVersion: t.u32(),
    isActive: t.bool(),
    createdAt: t.timestamp(),
    updatedAt: t.timestamp(),
  },
);

export const mindFact = table(
  {
    name: "mind_fact",
    public: true,
    indexes: [
      {
        accessor: "mind_fact_case_id",
        algorithm: "btree",
        columns: ["caseId"],
      },
      {
        accessor: "mind_fact_source_type",
        algorithm: "btree",
        columns: ["sourceType"],
      },
      {
        accessor: "mind_fact_source_id",
        algorithm: "btree",
        columns: ["sourceId"],
      },
    ],
  },
  {
    factId: t.string().primaryKey(),
    caseId: t.string(),
    sourceType: t.string(),
    sourceId: t.string(),
    text: t.string(),
    tagsJson: t.string(),
    createdAt: t.timestamp(),
  },
);

export const mindHypothesis = table(
  {
    name: "mind_hypothesis",
    public: true,
    indexes: [
      {
        accessor: "mind_hypothesis_case_id",
        algorithm: "btree",
        columns: ["caseId"],
      },
      {
        accessor: "mind_hypothesis_key",
        algorithm: "btree",
        columns: ["key"],
      },
    ],
  },
  {
    hypothesisId: t.string().primaryKey(),
    caseId: t.string(),
    key: t.string(),
    text: t.string(),
    requiredFactIdsJson: t.string(),
    requiredVarsJson: t.string(),
    rewardEffectsJson: t.string(),
    createdAt: t.timestamp(),
    updatedAt: t.timestamp(),
  },
);

export const playerMindCase = table(
  {
    name: "player_mind_case",
    public: false,
    indexes: [
      {
        accessor: "player_mind_case_player_id",
        algorithm: "btree",
        columns: ["playerId"],
      },
      {
        accessor: "player_mind_case_case_id",
        algorithm: "btree",
        columns: ["caseId"],
      },
      {
        accessor: "player_mind_case_status",
        algorithm: "btree",
        columns: ["status"],
      },
    ],
  },
  {
    playerCaseKey: t.string().primaryKey(),
    playerId: t.identity(),
    caseId: t.string(),
    status: t.string(),
    startedAt: t.timestamp(),
    completedAt: t.timestamp().optional(),
    updatedAt: t.timestamp(),
  },
);

export const playerMindFact = table(
  {
    name: "player_mind_fact",
    public: false,
    indexes: [
      {
        accessor: "player_mind_fact_player_id",
        algorithm: "btree",
        columns: ["playerId"],
      },
      {
        accessor: "player_mind_fact_case_id",
        algorithm: "btree",
        columns: ["caseId"],
      },
      {
        accessor: "player_mind_fact_fact_id",
        algorithm: "btree",
        columns: ["factId"],
      },
    ],
  },
  {
    playerFactKey: t.string().primaryKey(),
    playerId: t.identity(),
    caseId: t.string(),
    factId: t.string(),
    discoveredAt: t.timestamp(),
  },
);

export const playerMindHypothesis = table(
  {
    name: "player_mind_hypothesis",
    public: false,
    indexes: [
      {
        accessor: "player_mind_hypothesis_player_id",
        algorithm: "btree",
        columns: ["playerId"],
      },
      {
        accessor: "player_mind_hypothesis_case_id",
        algorithm: "btree",
        columns: ["caseId"],
      },
      {
        accessor: "player_mind_hypothesis_hypothesis_id",
        algorithm: "btree",
        columns: ["hypothesisId"],
      },
      {
        accessor: "player_mind_hypothesis_status",
        algorithm: "btree",
        columns: ["status"],
      },
    ],
  },
  {
    playerHypothesisKey: t.string().primaryKey(),
    playerId: t.identity(),
    caseId: t.string(),
    hypothesisId: t.string(),
    status: t.string(),
    validatedAt: t.timestamp().optional(),
    updatedAt: t.timestamp(),
  },
);

export const playerQuest = table(
  {
    name: "player_quest",
    public: false,
    indexes: [
      {
        accessor: "player_quest_player_id",
        algorithm: "btree",
        columns: ["playerId"],
      },
      {
        accessor: "player_quest_quest_id",
        algorithm: "btree",
        columns: ["questId"],
      },
    ],
  },
  {
    questKey: t.string().primaryKey(),
    playerId: t.identity(),
    questId: t.string(),
    stage: t.u32(),
    updatedAt: t.timestamp(),
  },
);

export const playerEvidence = table(
  {
    name: "player_evidence",
    public: false,
    indexes: [
      {
        accessor: "player_evidence_player_id",
        algorithm: "btree",
        columns: ["playerId"],
      },
      {
        accessor: "player_evidence_evidence_id",
        algorithm: "btree",
        columns: ["evidenceId"],
      },
    ],
  },
  {
    evidenceKey: t.string().primaryKey(),
    playerId: t.identity(),
    evidenceId: t.string(),
    discoveredAt: t.timestamp(),
  },
);

export const playerRelationship = table(
  {
    name: "player_relationship",
    public: false,
    indexes: [
      {
        accessor: "player_relationship_player_id",
        algorithm: "btree",
        columns: ["playerId"],
      },
      {
        accessor: "player_relationship_character_id",
        algorithm: "btree",
        columns: ["characterId"],
      },
    ],
  },
  {
    relationshipKey: t.string().primaryKey(),
    playerId: t.identity(),
    characterId: t.string(),
    value: t.f64(),
    updatedAt: t.timestamp(),
  },
);

export const playerNpcState = table(
  {
    name: "player_npc_state",
    public: false,
    indexes: [
      {
        accessor: "player_npc_state_player_id",
        algorithm: "btree",
        columns: ["playerId"],
      },
      {
        accessor: "player_npc_state_npc_id",
        algorithm: "btree",
        columns: ["npcId"],
      },
    ],
  },
  {
    npcStateKey: t.string().primaryKey(),
    playerId: t.identity(),
    npcId: t.string(),
    trustScore: t.f64(),
    availabilityState: t.string(),
    lastMeaningfulContactAt: t.timestamp().optional(),
    updatedAt: t.timestamp(),
  },
);

export const playerNpcFavor = table(
  {
    name: "player_npc_favor",
    public: false,
    indexes: [
      {
        accessor: "player_npc_favor_player_id",
        algorithm: "btree",
        columns: ["playerId"],
      },
      {
        accessor: "player_npc_favor_npc_id",
        algorithm: "btree",
        columns: ["npcId"],
      },
    ],
  },
  {
    favorKey: t.string().primaryKey(),
    playerId: t.identity(),
    npcId: t.string(),
    // Denormalized summary of player_favor_ledger for fast favor_balance_gte gating.
    // Authoritative source for individual obligations is player_favor_ledger.
    balance: t.i32(),
    lastReason: t.string().optional(),
    updatedAt: t.timestamp(),
  },
);

// Per-spec favor obligation entries. Signed `weight` carries direction:
// positive = NPC owes player, negative = player owes NPC.
// Aggregated into player_npc_favor.balance by reducer-side recordFavorInternal.
export const playerFavorLedger = table(
  {
    name: "player_favor_ledger",
    public: false,
    indexes: [
      {
        accessor: "player_favor_ledger_player_id",
        algorithm: "btree",
        columns: ["playerId"],
      },
      {
        accessor: "player_favor_ledger_npc_id",
        algorithm: "btree",
        columns: ["npcId"],
      },
      {
        accessor: "player_favor_ledger_favor_id",
        algorithm: "btree",
        columns: ["favorId"],
      },
      {
        accessor: "player_favor_ledger_status",
        algorithm: "btree",
        columns: ["status"],
      },
    ],
  },
  {
    ledgerEntryKey: t.string().primaryKey(),
    playerId: t.identity(),
    // Stable favor id within (playerId, favorId) — used by content/effects to refer to the obligation.
    favorId: t.string(),
    npcId: t.string(),
    // information | access | cover | introduction | protection (per spec table)
    favorType: t.string(),
    // Signed magnitude. Sign carries direction; magnitude is the obligation weight.
    weight: t.i32(),
    sourceCaseId: t.string().optional(),
    sourceRumorId: t.string().optional(),
    note: t.string().optional(),
    // open | spent | released | burned
    status: t.string(),
    createdAt: t.timestamp(),
    expiresAt: t.timestamp().optional(),
    resolvedAt: t.timestamp().optional(),
    updatedAt: t.timestamp(),
  },
);

export const playerFactionSignal = table(
  {
    name: "player_faction_signal",
    public: false,
    indexes: [
      {
        accessor: "player_faction_signal_player_id",
        algorithm: "btree",
        columns: ["playerId"],
      },
      {
        accessor: "player_faction_signal_faction_id",
        algorithm: "btree",
        columns: ["factionId"],
      },
    ],
  },
  {
    signalKey: t.string().primaryKey(),
    playerId: t.identity(),
    factionId: t.string(),
    value: t.f64(),
    trend: t.string(),
    updatedAt: t.timestamp(),
  },
);

export const playerAgencyCareer = table(
  {
    name: "player_agency_career",
    public: false,
    indexes: [
      {
        accessor: "player_agency_career_rank_id",
        algorithm: "btree",
        columns: ["rankId"],
      },
    ],
  },
  {
    playerId: t.identity().primaryKey(),
    standingScore: t.f64(),
    standingTrend: t.string(),
    rankId: t.string(),
    qualifyingCaseId: t.string().optional(),
    rumorCriterionComplete: t.bool(),
    sourceCriterionComplete: t.bool(),
    cleanClosureCriterionComplete: t.bool(),
    updatedAt: t.timestamp(),
    promotedAt: t.timestamp().optional(),
  },
);

export const playerRumorState = table(
  {
    name: "player_rumor_state",
    public: false,
    indexes: [
      {
        accessor: "player_rumor_state_player_id",
        algorithm: "btree",
        columns: ["playerId"],
      },
      {
        accessor: "player_rumor_state_rumor_id",
        algorithm: "btree",
        columns: ["rumorId"],
      },
      {
        accessor: "player_rumor_state_status",
        algorithm: "btree",
        columns: ["status"],
      },
      {
        accessor: "player_rumor_state_case_id",
        algorithm: "btree",
        columns: ["caseId"],
      },
    ],
  },
  {
    rumorStateKey: t.string().primaryKey(),
    playerId: t.identity(),
    rumorId: t.string(),
    // heard | logged | pursuing | verified | spent | burned
    // Legacy "registered" is accepted as an alias for "logged" by evaluate(rumor_state_is).
    status: t.string(),
    // Per-spec linkedLeadId: optional spawned lead / map event id (usually playerMapEvent.eventId).
    leadPointId: t.string().optional(),
    sourceNpcId: t.string().optional(),
    caseId: t.string(),
    verificationKind: t.string().optional(),
    verifiedAt: t.timestamp().optional(),
    updatedAt: t.timestamp(),
    // Appended columns (must stay after legacy fields for maincloud auto-migration).
    // contact | faction | briefing | witness | environment (per spec sourceType)
    sourceType: t.string().optional().default(undefined),
    factionKey: t.string().optional().default(undefined),
    subject: t.string().optional().default(undefined),
    locationHint: t.string().optional().default(undefined),
    credibility: t.f64().optional().default(undefined),
    heatRisk: t.f64().optional().default(undefined),
    resolvedCaseId: t.string().optional().default(undefined),
    discoveredAt: t.timestamp().optional().default(undefined),
    expiresAt: t.timestamp().optional().default(undefined),
  },
);

export const battleSession = table(
  {
    name: "battle_session",
    public: false,
    indexes: [
      {
        accessor: "battle_session_player_id",
        algorithm: "btree",
        columns: ["playerId"],
      },
      {
        accessor: "battle_session_scenario_id",
        algorithm: "btree",
        columns: ["scenarioId"],
      },
      {
        accessor: "battle_session_status",
        algorithm: "btree",
        columns: ["status"],
      },
    ],
  },
  {
    sessionKey: t.string().primaryKey(),
    playerId: t.identity(),
    scenarioId: t.string(),
    sourceTab: t.string(),
    returnTab: t.string(),
    sourceContextId: t.string().optional(),
    sourceScenarioId: t.string().optional(),
    phase: t.string(),
    status: t.string(),
    turnCount: t.u32(),
    drawPerTurn: t.u32(),
    enemyIntentCursor: t.u32(),
    title: t.string(),
    briefing: t.string(),
    resolveLabel: t.string(),
    apLabel: t.string(),
    blockLabel: t.string(),
    backgroundUrl: t.string().optional(),
    resultType: t.string().optional(),
    resultTitle: t.string().optional(),
    resultSummary: t.string().optional(),
    createdAt: t.timestamp(),
    updatedAt: t.timestamp(),
    resolvedAt: t.timestamp().optional(),
    closedAt: t.timestamp().optional(),
  },
);

export const battleCombatant = table(
  {
    name: "battle_combatant",
    public: false,
    indexes: [
      {
        accessor: "battle_combatant_player_id",
        algorithm: "btree",
        columns: ["playerId"],
      },
      {
        accessor: "battle_combatant_session_key",
        algorithm: "btree",
        columns: ["sessionKey"],
      },
      {
        accessor: "battle_combatant_side",
        algorithm: "btree",
        columns: ["side"],
      },
    ],
  },
  {
    combatantKey: t.string().primaryKey(),
    sessionKey: t.string(),
    playerId: t.identity(),
    combatantId: t.string(),
    side: t.string(),
    slotIndex: t.u32(),
    label: t.string(),
    subtitle: t.string().optional(),
    portraitUrl: t.string().optional(),
    resolve: t.f64(),
    maxResolve: t.f64(),
    ap: t.f64(),
    maxAp: t.f64(),
    block: t.f64(),
    nextIntentCardId: t.string().optional(),
    nextIntentLabel: t.string().optional(),
    nextIntentSummary: t.string().optional(),
    initiative: t.f64().optional(),
    statusesJson: t.string(),
    targetRulesJson: t.string().optional(),
    resourceExtrasJson: t.string().optional(),
    updatedAt: t.timestamp(),
  },
);

export const battleCardInstance = table(
  {
    name: "battle_card_instance",
    public: false,
    indexes: [
      {
        accessor: "battle_card_instance_player_id",
        algorithm: "btree",
        columns: ["playerId"],
      },
      {
        accessor: "battle_card_instance_session_key",
        algorithm: "btree",
        columns: ["sessionKey"],
      },
      {
        accessor: "battle_card_instance_zone",
        algorithm: "btree",
        columns: ["zone"],
      },
    ],
  },
  {
    cardInstanceKey: t.string().primaryKey(),
    sessionKey: t.string(),
    playerId: t.identity(),
    instanceId: t.string(),
    ownerCombatantId: t.string(),
    cardId: t.string(),
    label: t.string(),
    description: t.string(),
    effectPreview: t.string(),
    artUrl: t.string().optional(),
    tagsJson: t.string().optional(),
    costAp: t.f64(),
    zone: t.string(),
    zoneOrder: t.u32(),
    isPlayable: t.bool(),
    playableReason: t.string().optional(),
    targetRule: t.string().optional(),
    updatedAt: t.timestamp(),
  },
);

export const battleHistory = table(
  {
    name: "battle_history",
    public: false,
    indexes: [
      {
        accessor: "battle_history_player_id",
        algorithm: "btree",
        columns: ["playerId"],
      },
      {
        accessor: "battle_history_session_key",
        algorithm: "btree",
        columns: ["sessionKey"],
      },
      {
        accessor: "battle_history_turn_count",
        algorithm: "btree",
        columns: ["turnCount"],
      },
    ],
  },
  {
    historyKey: t.string().primaryKey(),
    sessionKey: t.string(),
    playerId: t.identity(),
    turnCount: t.u32(),
    entryType: t.string(),
    message: t.string(),
    createdAt: t.timestamp(),
  },
);

export const commandSession = table(
  {
    name: "command_session",
    public: false,
    indexes: [
      {
        accessor: "command_session_player_id",
        algorithm: "btree",
        columns: ["playerId"],
      },
      {
        accessor: "command_session_scenario_id",
        algorithm: "btree",
        columns: ["scenarioId"],
      },
      {
        accessor: "command_session_status",
        algorithm: "btree",
        columns: ["status"],
      },
    ],
  },
  {
    sessionKey: t.string().primaryKey(),
    playerId: t.identity(),
    scenarioId: t.string(),
    sourceTab: t.string(),
    returnTab: t.string(),
    phase: t.string(),
    status: t.string(),
    title: t.string(),
    briefing: t.string(),
    ordersJson: t.string(),
    selectedOrderId: t.string().optional(),
    resultTitle: t.string().optional(),
    resultSummary: t.string().optional(),
    createdAt: t.timestamp(),
    updatedAt: t.timestamp(),
    resolvedAt: t.timestamp().optional(),
    closedAt: t.timestamp().optional(),
  },
);

export const commandPartyMember = table(
  {
    name: "command_party_member",
    public: false,
    indexes: [
      {
        accessor: "command_party_member_player_id",
        algorithm: "btree",
        columns: ["playerId"],
      },
      {
        accessor: "command_party_member_session_key",
        algorithm: "btree",
        columns: ["sessionKey"],
      },
      {
        accessor: "command_party_member_actor_id",
        algorithm: "btree",
        columns: ["actorId"],
      },
    ],
  },
  {
    memberKey: t.string().primaryKey(),
    sessionKey: t.string(),
    playerId: t.identity(),
    actorId: t.string(),
    label: t.string(),
    role: t.string(),
    availability: t.string(),
    trust: t.f64(),
    notes: t.string().optional(),
    sortOrder: t.u32(),
    updatedAt: t.timestamp(),
  },
);

export const commandOrderHistory = table(
  {
    name: "command_order_history",
    public: false,
    indexes: [
      {
        accessor: "command_order_history_player_id",
        algorithm: "btree",
        columns: ["playerId"],
      },
      {
        accessor: "command_order_history_session_key",
        algorithm: "btree",
        columns: ["sessionKey"],
      },
      {
        accessor: "command_order_history_scenario_id",
        algorithm: "btree",
        columns: ["scenarioId"],
      },
    ],
  },
  {
    historyKey: t.string().primaryKey(),
    sessionKey: t.string(),
    playerId: t.identity(),
    scenarioId: t.string(),
    orderId: t.string(),
    actorId: t.string(),
    title: t.string(),
    summary: t.string(),
    createdAt: t.timestamp(),
  },
);

export const playerUnlockGroup = table(
  {
    name: "player_unlock_group",
    public: false,
    indexes: [
      {
        accessor: "player_unlock_group_player_id",
        algorithm: "btree",
        columns: ["playerId"],
      },
      {
        accessor: "player_unlock_group_group_id",
        algorithm: "btree",
        columns: ["groupId"],
      },
    ],
  },
  {
    unlockKey: t.string().primaryKey(),
    playerId: t.identity(),
    groupId: t.string(),
    unlockedAt: t.timestamp(),
  },
);

export const playerMapEvent = table(
  {
    name: "player_map_event",
    public: false,
    indexes: [
      {
        accessor: "player_map_event_player_id",
        algorithm: "btree",
        columns: ["playerId"],
      },
      {
        accessor: "player_map_event_template_id",
        algorithm: "btree",
        columns: ["templateId"],
      },
      {
        accessor: "player_map_event_status",
        algorithm: "btree",
        columns: ["status"],
      },
      {
        accessor: "player_map_event_expires_at",
        algorithm: "btree",
        columns: ["expiresAt"],
      },
      {
        accessor: "player_map_event_player_status_expires",
        algorithm: "btree",
        columns: ["playerId", "status", "expiresAt"],
      },
    ],
  },
  {
    eventId: t.string().primaryKey(),
    playerId: t.identity(),
    templateId: t.string(),
    snapshotChecksum: t.string(),
    payloadJson: t.string(),
    sourceLocationId: t.string(),
    status: t.string(),
    spawnedAt: t.timestamp(),
    expiresAt: t.timestamp(),
    resolvedAt: t.timestamp().optional(),
  },
);

export const playerRedeemedCode = table(
  {
    name: "player_redeemed_code",
    public: false,
    indexes: [
      {
        accessor: "player_redeemed_code_player_id",
        algorithm: "btree",
        columns: ["playerId"],
      },
      {
        accessor: "player_redeemed_code_code_id",
        algorithm: "btree",
        columns: ["codeId"],
      },
      {
        accessor: "player_redeemed_code_request_id",
        algorithm: "btree",
        columns: ["requestId"],
      },
      {
        accessor: "player_redeemed_code_player_code_result",
        algorithm: "btree",
        columns: ["playerId", "codeId", "result"],
      },
      {
        accessor: "player_redeemed_code_player_code_result_redeemed_at",
        algorithm: "btree",
        columns: ["playerId", "codeId", "result", "redeemedAt"],
      },
    ],
  },
  {
    redemptionId: t.string().primaryKey(),
    playerId: t.identity(),
    codeId: t.string(),
    requestId: t.string(),
    redeemedAt: t.timestamp(),
    result: t.string(),
    attemptedFromLat: t.f64().optional(),
    attemptedFromLng: t.f64().optional(),
  },
);

export const playerSpiritState = table(
  {
    name: "player_spirit_state",
    public: false,
    indexes: [
      {
        accessor: "player_spirit_state_player_id",
        algorithm: "btree",
        columns: ["playerId"],
      },
      {
        accessor: "player_spirit_state_spirit_id",
        algorithm: "btree",
        columns: ["spiritId"],
      },
      {
        accessor: "player_spirit_state_state",
        algorithm: "btree",
        columns: ["state"],
      },
    ],
  },
  {
    spiritStateKey: t.string().primaryKey(),
    playerId: t.identity(),
    spiritId: t.string(),
    state: t.string(),
    method: t.string().optional(),
    imprisonmentItemId: t.string().optional(),
    capturedAt: t.timestamp().optional(),
    updatedAt: t.timestamp(),
  },
);

const spacetimedb = schema({
  playerProfile,
  playerFlag,
  playerVar,
  playerLocation,
  playerInventory,
  vnSession,
  vnSkillCheckResult,
  contentVersion,
  contentSnapshot,
  contentTranslation,
  adminIdentity,
  workerAllowlist,
  idempotencyLog,
  telemetryEvent,
  telemetryAggregate,
  aiRequest,
  workerIdentity,
  mindCase,
  mindFact,
  mindHypothesis,
  playerMindCase,
  playerMindFact,
  playerMindHypothesis,
  idempotencyCleanupSchedule,
  telemetryAggregateSchedule,
  telemetryCleanupSchedule,
  playerQuest,
  playerEvidence,
  playerRelationship,
  playerNpcState,
  playerNpcFavor,
  playerFavorLedger,
  playerFactionSignal,
  playerAgencyCareer,
  playerRumorState,
  battleSession,
  battleCombatant,
  battleCardInstance,
  battleHistory,
  commandSession,
  commandPartyMember,
  commandOrderHistory,
  playerUnlockGroup,
  playerMapEvent,
  playerRedeemedCode,
  playerSpiritState,
});

const rowsFromIndex = (
  tableView: any,
  indexAccessorName: string,
  value: unknown,
) => {
  const index = tableView[indexAccessorName];
  if (typeof index.find === "function") {
    const row = index.find(value);
    return row ? [row] : [];
  }

  return Array.from(index.filter(value));
};

const selfScopedByPlayerId = (
  ctx: ReducerContextLike,
  accessorName: string,
  playerIdIndexAccessorName: string,
) =>
  rowsFromIndex(ctx.db[accessorName], playerIdIndexAccessorName, senderOf(ctx));

const ensureRegisteredWorkerView = (ctx: ReducerContextLike): void => {
  const sender = senderOf(ctx) as { toHexString(): string };
  ensureAllowlistedWorker(ctx, "read worker ai requests", sender);
  if (!ctx.db.workerIdentity.identity.find(sender)) {
    throw new Error("Only a registered worker can read worker ai requests");
  }
};

export const my_player_profile = spacetimedb.view(
  { name: "my_player_profile", public: true },
  t.array(playerProfile.rowType),
  (ctx) => selfScopedByPlayerId(ctx, "playerProfile", "playerId"),
);

export const my_player_flags = spacetimedb.view(
  { name: "my_player_flags", public: true },
  t.array(playerFlag.rowType),
  (ctx) => selfScopedByPlayerId(ctx, "playerFlag", "player_flag_player_id"),
);

export const my_player_vars = spacetimedb.view(
  { name: "my_player_vars", public: true },
  t.array(playerVar.rowType),
  (ctx) => selfScopedByPlayerId(ctx, "playerVar", "player_var_player_id"),
);

export const my_player_location = spacetimedb.view(
  { name: "my_player_location", public: true },
  t.array(playerLocation.rowType),
  (ctx) => selfScopedByPlayerId(ctx, "playerLocation", "playerId"),
);

export const my_player_inventory = spacetimedb.view(
  { name: "my_player_inventory", public: true },
  t.array(playerInventory.rowType),
  (ctx) =>
    selfScopedByPlayerId(ctx, "playerInventory", "player_inventory_player_id"),
);

export const my_vn_sessions = spacetimedb.view(
  { name: "my_vn_sessions", public: true },
  t.array(vnSession.rowType),
  (ctx) => selfScopedByPlayerId(ctx, "vnSession", "vn_session_player_id"),
);

export const my_vn_skill_results = spacetimedb.view(
  { name: "my_vn_skill_results", public: true },
  t.array(vnSkillCheckResult.rowType),
  (ctx) =>
    selfScopedByPlayerId(
      ctx,
      "vnSkillCheckResult",
      "vn_skill_check_result_player_id",
    ),
);

export const my_ai_requests = spacetimedb.view(
  { name: "my_ai_requests", public: true },
  t.array(aiRequest.rowType),
  (ctx) => selfScopedByPlayerId(ctx, "aiRequest", "ai_request_player_id"),
);

export const worker_ai_requests = spacetimedb.view(
  { name: "worker_ai_requests", public: true },
  t.array(aiRequest.rowType),
  (ctx) => {
    ensureRegisteredWorkerView(ctx);
    return [
      ...rowsFromIndex(
        ctx.db.aiRequest,
        "ai_request_status",
        AI_REQUEST_STATUS_PENDING,
      ),
      ...rowsFromIndex(ctx.db.aiRequest, "ai_request_claimed_by_status", [
        senderOf(ctx),
        AI_REQUEST_STATUS_PROCESSING,
      ]),
    ];
  },
);

export const content_translations = spacetimedb.view(
  { name: "content_translations", public: true },
  t.array(contentTranslation.rowType),
  (ctx) => Array.from(ctx.db.contentTranslation.iter()),
);

export const my_mind_cases = spacetimedb.view(
  { name: "my_mind_cases", public: true },
  t.array(playerMindCase.rowType),
  (ctx) =>
    selfScopedByPlayerId(ctx, "playerMindCase", "player_mind_case_player_id"),
);

export const my_mind_facts = spacetimedb.view(
  { name: "my_mind_facts", public: true },
  t.array(playerMindFact.rowType),
  (ctx) =>
    selfScopedByPlayerId(ctx, "playerMindFact", "player_mind_fact_player_id"),
);

export const my_mind_hypotheses = spacetimedb.view(
  { name: "my_mind_hypotheses", public: true },
  t.array(playerMindHypothesis.rowType),
  (ctx) =>
    selfScopedByPlayerId(
      ctx,
      "playerMindHypothesis",
      "player_mind_hypothesis_player_id",
    ),
);

export const my_quests = spacetimedb.view(
  { name: "my_quests", public: true },
  t.array(playerQuest.rowType),
  (ctx) => selfScopedByPlayerId(ctx, "playerQuest", "player_quest_player_id"),
);

export const my_evidence = spacetimedb.view(
  { name: "my_evidence", public: true },
  t.array(playerEvidence.rowType),
  (ctx) =>
    selfScopedByPlayerId(ctx, "playerEvidence", "player_evidence_player_id"),
);

export const my_relationships = spacetimedb.view(
  { name: "my_relationships", public: true },
  t.array(playerRelationship.rowType),
  (ctx) =>
    selfScopedByPlayerId(
      ctx,
      "playerRelationship",
      "player_relationship_player_id",
    ),
);

export const my_npc_state = spacetimedb.view(
  { name: "my_npc_state", public: true },
  t.array(playerNpcState.rowType),
  (ctx) =>
    selfScopedByPlayerId(ctx, "playerNpcState", "player_npc_state_player_id"),
);

export const my_npc_favors = spacetimedb.view(
  { name: "my_npc_favors", public: true },
  t.array(playerNpcFavor.rowType),
  (ctx) =>
    selfScopedByPlayerId(ctx, "playerNpcFavor", "player_npc_favor_player_id"),
);

export const my_favor_ledger = spacetimedb.view(
  { name: "my_favor_ledger", public: true },
  t.array(playerFavorLedger.rowType),
  (ctx) =>
    selfScopedByPlayerId(
      ctx,
      "playerFavorLedger",
      "player_favor_ledger_player_id",
    ),
);

export const my_faction_signals = spacetimedb.view(
  { name: "my_faction_signals", public: true },
  t.array(playerFactionSignal.rowType),
  (ctx) =>
    selfScopedByPlayerId(
      ctx,
      "playerFactionSignal",
      "player_faction_signal_player_id",
    ),
);

export const my_agency_career = spacetimedb.view(
  { name: "my_agency_career", public: true },
  t.array(playerAgencyCareer.rowType),
  (ctx) => selfScopedByPlayerId(ctx, "playerAgencyCareer", "playerId"),
);

export const my_rumor_state = spacetimedb.view(
  { name: "my_rumor_state", public: true },
  t.array(playerRumorState.rowType),
  (ctx) =>
    selfScopedByPlayerId(
      ctx,
      "playerRumorState",
      "player_rumor_state_player_id",
    ),
);

export const my_battle_sessions = spacetimedb.view(
  { name: "my_battle_sessions", public: true },
  t.array(battleSession.rowType),
  (ctx) =>
    selfScopedByPlayerId(ctx, "battleSession", "battle_session_player_id"),
);

export const my_battle_combatants = spacetimedb.view(
  { name: "my_battle_combatants", public: true },
  t.array(battleCombatant.rowType),
  (ctx) =>
    selfScopedByPlayerId(ctx, "battleCombatant", "battle_combatant_player_id"),
);

export const my_battle_cards = spacetimedb.view(
  { name: "my_battle_cards", public: true },
  t.array(battleCardInstance.rowType),
  (ctx) =>
    selfScopedByPlayerId(
      ctx,
      "battleCardInstance",
      "battle_card_instance_player_id",
    ),
);

export const my_battle_history = spacetimedb.view(
  { name: "my_battle_history", public: true },
  t.array(battleHistory.rowType),
  (ctx) =>
    selfScopedByPlayerId(ctx, "battleHistory", "battle_history_player_id"),
);

export const my_command_sessions = spacetimedb.view(
  { name: "my_command_sessions", public: true },
  t.array(commandSession.rowType),
  (ctx) =>
    selfScopedByPlayerId(ctx, "commandSession", "command_session_player_id"),
);

export const my_command_party = spacetimedb.view(
  { name: "my_command_party", public: true },
  t.array(commandPartyMember.rowType),
  (ctx) =>
    selfScopedByPlayerId(
      ctx,
      "commandPartyMember",
      "command_party_member_player_id",
    ),
);

export const my_command_history = spacetimedb.view(
  { name: "my_command_history", public: true },
  t.array(commandOrderHistory.rowType),
  (ctx) =>
    selfScopedByPlayerId(
      ctx,
      "commandOrderHistory",
      "command_order_history_player_id",
    ),
);

export const my_unlock_groups = spacetimedb.view(
  { name: "my_unlock_groups", public: true },
  t.array(playerUnlockGroup.rowType),
  (ctx) =>
    selfScopedByPlayerId(
      ctx,
      "playerUnlockGroup",
      "player_unlock_group_player_id",
    ),
);

export const my_map_events = spacetimedb.view(
  { name: "my_map_events", public: true },
  t.array(playerMapEvent.rowType),
  (ctx) =>
    selfScopedByPlayerId(ctx, "playerMapEvent", "player_map_event_player_id"),
);

export const my_redeemed_codes = spacetimedb.view(
  { name: "my_redeemed_codes", public: true },
  t.array(playerRedeemedCode.rowType),
  (ctx) =>
    selfScopedByPlayerId(
      ctx,
      "playerRedeemedCode",
      "player_redeemed_code_player_id",
    ),
);

export const my_spirit_state = spacetimedb.view(
  { name: "my_spirit_state", public: true },
  t.array(playerSpiritState.rowType),
  (ctx) =>
    selfScopedByPlayerId(
      ctx,
      "playerSpiritState",
      "player_spirit_state_player_id",
    ),
);

export default spacetimedb;
