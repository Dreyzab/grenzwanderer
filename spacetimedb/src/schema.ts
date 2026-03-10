import { schema, table, t } from "spacetimedb/server";
import {
  idempotencyCleanupSchedule,
  telemetryAggregateSchedule,
  telemetryCleanupSchedule,
} from "./procedures/maintenance";

export const playerProfile = table(
  {
    name: "player_profile",
    public: true,
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
    public: true,
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
    public: true,
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
    public: true,
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
    public: true,
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
    public: true,
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
    public: true,
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
    passed: t.bool(),
    nextNodeId: t.string().optional(),
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
    public: true,
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
    public: true,
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
    public: true,
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
    public: true,
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
    createdAt: t.timestamp(),
    updatedAt: t.timestamp(),
  },
);

export const workerIdentity = table(
  {
    name: "worker_identity",
    public: true,
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
    public: true,
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
    public: true,
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
    public: true,
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
    public: true,
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
    public: true,
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
    public: true,
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
    public: true,
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
    public: true,
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
    balance: t.i32(),
    lastReason: t.string().optional(),
    updatedAt: t.timestamp(),
  },
);

export const playerFactionSignal = table(
  {
    name: "player_faction_signal",
    public: true,
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
    public: true,
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
    public: true,
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
    status: t.string(),
    leadPointId: t.string().optional(),
    sourceNpcId: t.string().optional(),
    caseId: t.string(),
    verificationKind: t.string().optional(),
    verifiedAt: t.timestamp().optional(),
    updatedAt: t.timestamp(),
  },
);

export const battleSession = table(
  {
    name: "battle_session",
    public: true,
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
    public: true,
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
    public: true,
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
    public: true,
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
    public: true,
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
    public: true,
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
    public: true,
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
    public: true,
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
    public: true,
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
    public: true,
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
    ],
  },
  {
    redemptionId: t.string().primaryKey(),
    playerId: t.identity(),
    codeId: t.string(),
    requestId: t.string(),
    redeemedAt: t.timestamp(),
    result: t.string(),
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
});

export default spacetimedb;
