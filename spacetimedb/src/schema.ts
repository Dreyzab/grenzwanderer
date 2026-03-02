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
  playerUnlockGroup,
});

export default spacetimedb;
