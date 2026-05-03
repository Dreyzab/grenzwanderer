import { SenderError } from "spacetimedb/server";
import {
  getBattleCard,
  getBattleScenario,
  type BattleCardDefinition,
  type BattleCardEffect,
  type BattleCardEffectTarget,
  type BattleScenarioTemplate,
} from "./battle_catalog";
import { applyEffects } from "./effects";
import {
  createBattleCardInstanceKey,
  createBattleCombatantKey,
  createBattleHistoryKey,
  createBattleSessionKey,
} from "./keys";
import { identityKey } from "./map_keys";
import { ensurePlayerProfile } from "./player_profile";
import { emitTelemetry } from "./telemetry";

export type BattleReturnTab = "map" | "vn" | "dev";
export type BattleSourceTab = BattleReturnTab;
export type BattlePhase = "player_turn" | "enemy_turn" | "result" | "closed";
export type BattleResultType = "victory" | "defeat";
export type BattleSide = "player" | "enemy";
export type BattleZone = "deck" | "hand" | "discard";

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
