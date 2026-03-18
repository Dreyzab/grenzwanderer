import { DbConnection } from "../src/shared/spacetime/bindings";

const CARD_PRIORITY = new Map<string, number>([
  ["Press the Advantage", 0],
  ["Expose the Pattern", 1],
  ["Pointed Question", 2],
  ["Reframe the Narrative", 3],
  ["Steady Stance", 4],
  ["Center Yourself", 5],
]);

const asNumber = (value: number | bigint): number =>
  typeof value === "bigint" ? Number(value) : value;

const toTimestampMicros = (value: unknown): number => {
  if (
    value &&
    typeof value === "object" &&
    "microsSinceUnixEpoch" in value &&
    typeof (value as { microsSinceUnixEpoch?: unknown })
      .microsSinceUnixEpoch !== "undefined"
  ) {
    const micros = (value as { microsSinceUnixEpoch: number | bigint })
      .microsSinceUnixEpoch;
    return asNumber(micros);
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "bigint") {
    return Number(value);
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const rowPlayerHex = (row: { playerId: { toHexString(): string } }): string =>
  row.playerId.toHexString();

export const getPlayerVarValue = (
  conn: DbConnection,
  playerHex: string,
  key: string,
): number => {
  const row = [...conn.db.playerVar.iter()].find(
    (entry) => rowPlayerHex(entry) === playerHex && entry.key === key,
  );

  return row ? Number(row.floatValue) : 0;
};

export const getPlayerFlagValue = (
  conn: DbConnection,
  playerHex: string,
  key: string,
): boolean =>
  [...conn.db.playerFlag.iter()].some(
    (entry) =>
      rowPlayerHex(entry) === playerHex && entry.key === key && entry.value,
  );

export const getLatestBattleSession = (
  conn: DbConnection,
  playerHex: string,
): any | null => {
  const sessions = [...conn.db.battleSession.iter()]
    .filter((entry) => rowPlayerHex(entry) === playerHex)
    .sort(
      (left, right) =>
        toTimestampMicros(right.updatedAt) - toTimestampMicros(left.updatedAt),
    );

  return sessions[0] ?? null;
};

export const getCurrentBattleSession = (
  conn: DbConnection,
  playerHex: string,
): any | null => {
  const session = getLatestBattleSession(conn, playerHex);
  if (!session || session.status === "closed") {
    return null;
  }
  return session;
};

export const getBattleCombatant = (
  conn: DbConnection,
  playerHex: string,
  sessionKey: string,
  side: "player" | "enemy",
): any => {
  const combatant = [...conn.db.battleCombatant.iter()].find(
    (entry) =>
      rowPlayerHex(entry) === playerHex &&
      entry.sessionKey === sessionKey &&
      entry.side === side,
  );

  if (!combatant) {
    throw new Error(`Missing battle combatant for side '${side}'`);
  }

  return combatant;
};

const getHandCards = (
  conn: DbConnection,
  playerHex: string,
  sessionKey: string,
): any[] =>
  [...conn.db.battleCardInstance.iter()]
    .filter(
      (entry) =>
        rowPlayerHex(entry) === playerHex &&
        entry.sessionKey === sessionKey &&
        entry.zone === "hand",
    )
    .sort(
      (left, right) =>
        Number(left.zoneOrder) - Number(right.zoneOrder) ||
        left.instanceId.localeCompare(right.instanceId),
    );

const selectBestPlayableHandCard = (
  conn: DbConnection,
  playerHex: string,
  sessionKey: string,
): any | null => {
  const player = getBattleCombatant(conn, playerHex, sessionKey, "player");
  const playable = getHandCards(conn, playerHex, sessionKey).filter(
    (entry) => entry.isPlayable && Number(entry.costAp) <= Number(player.ap),
  );

  if (playable.length === 0) {
    return null;
  }

  return playable.sort((left, right) => {
    const leftPriority =
      CARD_PRIORITY.get(left.label) ?? Number.MAX_SAFE_INTEGER;
    const rightPriority =
      CARD_PRIORITY.get(right.label) ?? Number.MAX_SAFE_INTEGER;

    return (
      leftPriority - rightPriority ||
      Number(right.costAp) - Number(left.costAp) ||
      Number(left.zoneOrder) - Number(right.zoneOrder)
    );
  })[0]!;
};

export const closeBattleIfOpen = async (
  conn: DbConnection,
  playerHex: string,
  nextRequestId: (suffix: string) => string,
): Promise<void> => {
  const session = getCurrentBattleSession(conn, playerHex);
  if (!session) {
    return;
  }

  await conn.reducers.closeBattleMode({
    requestId: nextRequestId("close_battle_cleanup"),
  });
};

export const playOutBattle = async (
  conn: DbConnection,
  playerHex: string,
  nextRequestId: (suffix: string) => string,
  expectedResult: "victory" | "defeat" = "victory",
): Promise<any> => {
  for (let safety = 0; safety < 8; safety += 1) {
    const session = getCurrentBattleSession(conn, playerHex);
    if (!session) {
      throw new Error("Expected an active battle session");
    }

    if (session.status === "resolved") {
      if (session.resultType !== expectedResult) {
        throw new Error(
          `Battle resolved as '${session.resultType}', expected '${expectedResult}'`,
        );
      }
      return session;
    }

    if (session.phase !== "player_turn") {
      throw new Error(
        `Unexpected battle phase '${session.phase}' during smoke resolution`,
      );
    }

    for (let actions = 0; actions < 6; actions += 1) {
      const freshSession = getCurrentBattleSession(conn, playerHex);
      if (!freshSession) {
        throw new Error("Battle session disappeared mid-resolution");
      }

      if (freshSession.status === "resolved") {
        if (freshSession.resultType !== expectedResult) {
          throw new Error(
            `Battle resolved as '${freshSession.resultType}', expected '${expectedResult}'`,
          );
        }
        return freshSession;
      }

      const nextCard = selectBestPlayableHandCard(
        conn,
        playerHex,
        freshSession.sessionKey,
      );
      if (!nextCard) {
        break;
      }

      await conn.reducers.playBattleCard({
        requestId: nextRequestId(`play_${nextCard.cardId}`),
        instanceId: nextCard.instanceId,
      });
    }

    const afterPlays = getCurrentBattleSession(conn, playerHex);
    if (!afterPlays) {
      throw new Error("Battle session disappeared after card plays");
    }

    if (afterPlays.status === "resolved") {
      if (afterPlays.resultType !== expectedResult) {
        throw new Error(
          `Battle resolved as '${afterPlays.resultType}', expected '${expectedResult}'`,
        );
      }
      return afterPlays;
    }

    await conn.reducers.endBattleTurn({
      requestId: nextRequestId(`end_turn_${safety + 1}`),
    });
  }

  throw new Error("Battle did not resolve within the expected safety window");
};
