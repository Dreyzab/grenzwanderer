type TestRow = Record<string, any>;
type KeySelector = string | ((row: TestRow) => unknown);

export interface TestIdentity {
  toHexString(): string;
}

export interface TestTimestamp {
  microsSinceUnixEpoch: bigint;
}

export interface TestIndex<Row = TestRow> {
  find(key: unknown): Row | undefined;
  filter(key: unknown): Row[];
  update(row: Row): void;
  delete(key: unknown): void;
}

export interface TestTable<Row = TestRow> {
  insert(row: Row): Row;
  iter(): IterableIterator<Row>;
  rows(): Row[];
  count(): number;
  clear(): void;
  [indexName: string]: any;
}

const keyToString = (value: unknown): string => {
  if (Array.isArray(value)) {
    return JSON.stringify(value.map(keyToString));
  }
  if (
    value &&
    typeof value === "object" &&
    "toHexString" in value &&
    typeof value.toHexString === "function"
  ) {
    return value.toHexString();
  }
  if (typeof value === "bigint") {
    return value.toString();
  }
  return String(value);
};

const selectKey = (selector: KeySelector, row: TestRow): unknown =>
  typeof selector === "function" ? selector(row) : row[selector];

const keyParts = (value: unknown): string[] =>
  Array.isArray(value) ? value.map(keyToString) : [keyToString(value)];

const keyMatches = (
  actual: unknown,
  expected: unknown,
  allowPrefix: boolean,
): boolean => {
  const actualParts = keyParts(actual);
  const expectedParts = keyParts(expected);
  if (expectedParts.length > actualParts.length) {
    return false;
  }
  if (!allowPrefix && actualParts.length !== expectedParts.length) {
    return false;
  }
  return expectedParts.every((part, index) => actualParts[index] === part);
};

export const createTestIdentity = (hex = "player-test"): TestIdentity => ({
  toHexString: () => hex,
});

export const createTestTimestamp = (
  microsSinceUnixEpoch = 1_000_000n,
): TestTimestamp => ({
  microsSinceUnixEpoch,
});

export const createTestTable = (
  primaryIndexName: string,
  primarySelector: KeySelector,
  secondaryIndexes: Record<string, KeySelector> = {},
): TestTable => {
  const data: TestRow[] = [];
  const table: TestTable = {
    insert(row: TestRow): TestRow {
      data.push(row);
      return row;
    },
    iter(): IterableIterator<TestRow> {
      return data.slice()[Symbol.iterator]();
    },
    rows(): TestRow[] {
      return data;
    },
    count(): number {
      return data.length;
    },
    clear(): void {
      data.length = 0;
    },
  };

  const createIndex = (selector: KeySelector): TestIndex => ({
    find(key: unknown): TestRow | undefined {
      return data.find((row) =>
        keyMatches(selectKey(selector, row), key, false),
      );
    },
    filter(key: unknown): TestRow[] {
      return data.filter((row) =>
        keyMatches(selectKey(selector, row), key, true),
      );
    },
    update(row: TestRow): void {
      const expected = keyToString(selectKey(selector, row));
      const index = data.findIndex(
        (candidate) => keyToString(selectKey(selector, candidate)) === expected,
      );
      if (index >= 0) {
        data[index] = row;
        return;
      }
      data.push(row);
    },
    delete(key: unknown): void {
      const expected = keyToString(key);
      for (let index = data.length - 1; index >= 0; index -= 1) {
        if (keyToString(selectKey(selector, data[index])) === expected) {
          data.splice(index, 1);
        }
      }
    },
  });

  table[primaryIndexName] = createIndex(primarySelector);
  for (const [indexName, selector] of Object.entries(secondaryIndexes)) {
    table[indexName] = createIndex(selector);
  }

  return table;
};

export const playerKey = (player: TestIdentity, suffix: string): string =>
  `${player.toHexString()}::${suffix}`;

export const createReducerTestDb = () => ({
  playerProfile: createTestTable("playerId", "playerId"),
  playerLocation: createTestTable("playerId", "playerId"),
  adminIdentity: createTestTable("identity", "identity"),
  workerAllowlist: createTestTable("identity", "identity"),
  workerIdentity: createTestTable("identity", "identity"),
  vnSession: createTestTable("sessionKey", "sessionKey", {
    vn_session_player_id: "playerId",
  }),
  vnSkillCheckResult: createTestTable("resultKey", "resultKey", {
    vn_skill_check_result_player_id: "playerId",
  }),
  playerFlag: createTestTable("flagId", "flagId", {
    player_flag_player_id: "playerId",
  }),
  playerVar: createTestTable("varId", "varId", {
    player_var_player_id: "playerId",
  }),
  playerEvidence: createTestTable("evidenceKey", "evidenceKey", {
    player_evidence_player_id: "playerId",
  }),
  playerQuest: createTestTable("questKey", "questKey", {
    player_quest_player_id: "playerId",
  }),
  playerInventory: createTestTable("inventoryKey", "inventoryKey", {
    player_inventory_player_id: "playerId",
  }),
  playerRelationship: createTestTable("relationshipKey", "relationshipKey", {
    player_relationship_player_id: "playerId",
  }),
  playerUnlockGroup: createTestTable("unlockKey", "unlockKey", {
    player_unlock_group_player_id: "playerId",
  }),
  playerAgencyCareer: createTestTable("playerId", "playerId"),
  playerMapEvent: createTestTable("eventId", "eventId", {
    player_map_event_player_id: "playerId",
  }),
  playerNpcState: createTestTable("npcStateKey", "npcStateKey", {
    player_npc_state_player_id: "playerId",
  }),
  playerNpcFavor: createTestTable("favorKey", "favorKey", {
    player_npc_favor_player_id: "playerId",
  }),
  playerFavorLedger: createTestTable("ledgerEntryKey", "ledgerEntryKey", {
    player_favor_ledger_player_id: "playerId",
  }),
  playerFactionSignal: createTestTable("signalKey", "signalKey", {
    player_faction_signal_player_id: "playerId",
  }),
  playerRumorState: createTestTable("rumorStateKey", "rumorStateKey", {
    player_rumor_state_player_id: "playerId",
  }),
  playerServiceCriterion: createTestTable("criterionKey", "criterionKey"),
  telemetryEvent: createTestTable("eventId", (_row) => Symbol()),
  aiRequest: createTestTable("id", "id", {
    ai_request_player_id: "playerId",
    ai_request_kind_status_created_at: (row) => [
      row.kind,
      row.status,
      row.createdAt,
    ],
  }),
  contentVersion: createTestTable("version", "version", {
    content_version_checksum: "checksum",
    content_version_is_active: "isActive",
  }),
  contentSnapshot: createTestTable("checksum", "checksum"),
  caseVersion: createTestTable("caseVersionKey", "caseVersionKey", {
    case_version_case_id: "caseId",
  }),
  caseEventLog: createTestTable("eventId", (_row) => Symbol()),
  questInstance: createTestTable("questInstanceKey", "questInstanceKey", {
    quest_instance_player_id: "playerId",
    quest_instance_instance_id: "instanceId",
    quest_instance_archetype_id: "archetypeId",
  }),
  mindCase: createTestTable("caseId", "caseId"),
  mindFact: createTestTable("factId", "factId"),
  mindHypothesis: createTestTable("hypothesisId", "hypothesisId", {
    mind_hypothesis_case_id: "caseId",
  }),
  playerMindCase: createTestTable("playerCaseKey", "playerCaseKey", {
    player_mind_case_player_id: "playerId",
  }),
  playerMindFact: createTestTable("playerFactKey", "playerFactKey", {
    player_mind_fact_player_id: "playerId",
  }),
  playerMindHypothesis: createTestTable(
    "playerHypothesisKey",
    "playerHypothesisKey",
    {
      player_mind_hypothesis_player_id: "playerId",
    },
  ),
  playerRedeemedCode: createTestTable("redemptionId", "redemptionId", {
    player_redeemed_code_player_id: "playerId",
    player_redeemed_code_player_code_result: (row) => [
      row.playerId,
      row.codeId,
      row.result,
    ],
  }),
  playerTriggerFire: createTestTable("fireKey", "fireKey", {
    player_trigger_fire_player_id: "playerId",
    player_trigger_fire_player_rule: (row) => [row.playerId, row.ruleId],
  }),
  commandSession: createTestTable("sessionKey", "sessionKey"),
  commandPartyMember: createTestTable("memberKey", "memberKey", {
    command_party_member_player_id: "playerId",
    command_party_member_session_key: "sessionKey",
  }),
  commandOrderHistory: createTestTable("historyKey", "historyKey", {
    command_order_history_player_id: "playerId",
    command_order_history_session_key: "sessionKey",
  }),
  battleSession: createTestTable("sessionKey", "sessionKey"),
  battleCombatant: createTestTable("combatantKey", "combatantKey", {
    battle_combatant_player_id: "playerId",
    battle_combatant_session_key: "sessionKey",
  }),
  battleCardInstance: createTestTable("cardInstanceKey", "cardInstanceKey", {
    battle_card_instance_player_id: "playerId",
    battle_card_instance_session_key: "sessionKey",
  }),
  battleHistory: createTestTable("historyKey", "historyKey", {
    battle_history_player_id: "playerId",
    battle_history_session_key: "sessionKey",
  }),
  idempotencyLog: createTestTable("idempotencyKey", "idempotencyKey"),
  playerEquipment: createTestTable("equipmentKey", "equipmentKey", {
    player_equipment_player_id: "playerId",
  }),
});

export const createReducerTestContext = (
  overrides: {
    sender?: TestIdentity;
    timestamp?: TestTimestamp;
    db?: ReturnType<typeof createReducerTestDb>;
  } = {},
) => ({
  sender: overrides.sender ?? createTestIdentity(),
  timestamp: overrides.timestamp ?? createTestTimestamp(),
  db: overrides.db ?? createReducerTestDb(),
});

export const insertFlag = (
  ctx: ReturnType<typeof createReducerTestContext>,
  key: string,
  value: boolean,
): void => {
  ctx.db.playerFlag.insert({
    flagId: playerKey(ctx.sender, key),
    playerId: ctx.sender,
    key,
    value,
    updatedAt: ctx.timestamp,
  });
};

export const insertVar = (
  ctx: ReturnType<typeof createReducerTestContext>,
  key: string,
  floatValue: number,
): void => {
  ctx.db.playerVar.insert({
    varId: playerKey(ctx.sender, key),
    playerId: ctx.sender,
    key,
    floatValue,
    updatedAt: ctx.timestamp,
  });
};

export const insertEvidence = (
  ctx: ReturnType<typeof createReducerTestContext>,
  evidenceId: string,
): void => {
  ctx.db.playerEvidence.insert({
    evidenceKey: playerKey(ctx.sender, evidenceId),
    playerId: ctx.sender,
    evidenceId,
    discoveredAt: ctx.timestamp,
  });
};

export const insertQuest = (
  ctx: ReturnType<typeof createReducerTestContext>,
  questId: string,
  stage: number,
): void => {
  ctx.db.playerQuest.insert({
    questKey: playerKey(ctx.sender, questId),
    playerId: ctx.sender,
    questId,
    stage,
    updatedAt: ctx.timestamp,
  });
};

export const insertInventory = (
  ctx: ReturnType<typeof createReducerTestContext>,
  itemId: string,
  quantity: number,
): void => {
  ctx.db.playerInventory.insert({
    inventoryKey: playerKey(ctx.sender, itemId),
    playerId: ctx.sender,
    itemId,
    quantity,
    updatedAt: ctx.timestamp,
  });
};

export const createMapEventSnapshot = (
  overrides: Record<string, any> = {},
) => ({
  schemaVersion: 7,
  scenarios: [],
  nodes: [],
  map: {
    defaultRegionId: "region-test",
    regions: [
      {
        id: "region-test",
        name: "Test Region",
        geoCenterLat: 47.99,
        geoCenterLng: 7.85,
        zoom: 13,
      },
    ],
    points: [],
    mapEventTemplates: [
      {
        id: "template-a",
        title: "Template A",
        ttlMinutes: 30,
        point: {
          id: "event-point-a",
          title: "Event Point A",
          regionId: "region-test",
          lat: 47.99,
          lng: 7.85,
          category: "EPHEMERAL",
          locationId: "loc-event-a",
          bindings: [],
        },
      },
    ],
    testDefaults: { defaultEventTtlMinutes: 20 },
    ...overrides,
  },
});
