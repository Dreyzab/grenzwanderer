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
  clear(): void;
  [indexName: string]: any;
}

const keyToString = (value: unknown): string => {
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
    clear(): void {
      data.length = 0;
    },
  };

  const createIndex = (selector: KeySelector): TestIndex => ({
    find(key: unknown): TestRow | undefined {
      const expected = keyToString(key);
      return data.find(
        (row) => keyToString(selectKey(selector, row)) === expected,
      );
    },
    filter(key: unknown): TestRow[] {
      const expected = keyToString(key);
      return data.filter(
        (row) => keyToString(selectKey(selector, row)) === expected,
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
  vnSession: createTestTable("sessionKey", "sessionKey"),
  vnSkillCheckResult: createTestTable("resultKey", "resultKey"),
  playerFlag: createTestTable("flagId", "flagId"),
  playerVar: createTestTable("varId", "varId"),
  playerEvidence: createTestTable("evidenceKey", "evidenceKey"),
  playerQuest: createTestTable("questKey", "questKey"),
  playerInventory: createTestTable("inventoryKey", "inventoryKey"),
  playerRelationship: createTestTable("relationshipKey", "relationshipKey"),
  playerUnlockGroup: createTestTable("unlockKey", "unlockKey"),
  playerAgencyCareer: createTestTable("playerId", "playerId"),
  playerMapEvent: createTestTable("eventId", "eventId", {
    player_map_event_player_id: "playerId",
  }),
  playerNpcState: createTestTable("npcStateKey", "npcStateKey"),
  playerNpcFavor: createTestTable("favorKey", "favorKey"),
  playerFactionSignal: createTestTable("signalKey", "signalKey"),
  playerRumorState: createTestTable("rumorStateKey", "rumorStateKey"),
  playerServiceCriterion: createTestTable("criterionKey", "criterionKey"),
  telemetryEvent: createTestTable("eventId", (_row) => Symbol()),
  contentVersion: createTestTable("version", "version"),
  contentSnapshot: createTestTable("checksum", "checksum"),
  mindCase: createTestTable("caseId", "caseId"),
  mindFact: createTestTable("factId", "factId"),
  mindHypothesis: createTestTable("hypothesisId", "hypothesisId"),
  playerMindCase: createTestTable("playerCaseKey", "playerCaseKey"),
  playerMindFact: createTestTable("playerFactKey", "playerFactKey"),
  playerMindHypothesis: createTestTable(
    "playerHypothesisKey",
    "playerHypothesisKey",
  ),
  playerRedeemedCode: createTestTable("redemptionId", "redemptionId"),
  commandSession: createTestTable("sessionKey", "sessionKey"),
  commandPartyMember: createTestTable("memberKey", "memberKey", {
    command_party_member_player_id: "playerId",
  }),
  commandOrderHistory: createTestTable("historyKey", "historyKey", {
    command_order_history_player_id: "playerId",
    command_order_history_session_key: "sessionKey",
  }),
  battleSession: createTestTable("sessionKey", "sessionKey"),
  battleCombatant: createTestTable("combatantKey", "combatantKey", {
    battle_combatant_player_id: "playerId",
  }),
  battleCardInstance: createTestTable("cardInstanceKey", "cardInstanceKey", {
    battle_card_instance_player_id: "playerId",
  }),
  battleHistory: createTestTable("historyKey", "historyKey", {
    battle_history_player_id: "playerId",
  }),
  idempotencyLog: createTestTable("idempotencyKey", "idempotencyKey"),
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
