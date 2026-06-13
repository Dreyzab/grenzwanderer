import { identityKey } from "./keys";
import type { TriggerRule } from "./types";
import type { TriggerRuntimeGates } from "./trigger_engine";

export const DEFAULT_TRIGGER_COOLDOWN_MINUTES = 1_440;
export const DEFAULT_TRIGGER_BUDGET_LIMIT = 1;

const MICROS_PER_MINUTE = 60_000_000n;
const MICROS_PER_DAY = 1_440n * MICROS_PER_MINUTE;

export const createTriggerFireKey = (
  player: { toHexString(): string },
  ruleId: string,
  dedupeKey: string,
): string => `${identityKey(player)}::${ruleId}::${dedupeKey}`;

export interface TriggerFireSource {
  eventName: string;
  idempotencyKey?: string;
}

export const recordTriggerFire = (
  ctx: any,
  rule: TriggerRule,
  source: TriggerFireSource,
): void => {
  const dedupeKey =
    source.idempotencyKey ??
    `${source.eventName}:${ctx.timestamp.microsSinceUnixEpoch.toString()}`;
  const fireKey = createTriggerFireKey(ctx.sender, rule.id, dedupeKey);
  if (ctx.db.playerTriggerFire.fireKey.find(fireKey)) {
    return;
  }

  ctx.db.playerTriggerFire.insert({
    fireKey,
    playerId: ctx.sender,
    ruleId: rule.id,
    eventName: source.eventName,
    cooldownGroup: rule.cooldownGroup,
    budgetKey: rule.budgetKey,
    idempotencyKey: dedupeKey,
    firedAt: ctx.timestamp,
  });
};

/**
 * Derives runtime gates from the player's fire history: rules already fired
 * (once-per-player), cooldown groups still hot, and per-day budget remainders.
 * Gates are computed once per event dispatch; rules sharing a cooldown group
 * within the same event all see the pre-event state.
 */
export const computeTriggerRuntimeGates = (
  ctx: any,
  rules: readonly TriggerRule[],
): TriggerRuntimeGates => {
  const fires = [
    ...ctx.db.playerTriggerFire.player_trigger_fire_player_id.filter(
      ctx.sender,
    ),
  ];
  const nowMicros = ctx.timestamp.microsSinceUnixEpoch as bigint;

  const cooldownWindowByGroup = new Map<string, bigint>();
  for (const rule of rules) {
    if (!rule.cooldownGroup) {
      continue;
    }
    const minutes = Math.max(
      1,
      Math.trunc(rule.cooldownMinutes ?? DEFAULT_TRIGGER_COOLDOWN_MINUTES),
    );
    const windowMicros = BigInt(minutes) * MICROS_PER_MINUTE;
    const previous = cooldownWindowByGroup.get(rule.cooldownGroup);
    if (previous === undefined || windowMicros > previous) {
      cooldownWindowByGroup.set(rule.cooldownGroup, windowMicros);
    }
  }

  const firedRuleIds = new Set<string>();
  const activeCooldownGroups = new Set<string>();
  const dailyFiresByBudgetKey = new Map<string, number>();
  for (const fire of fires) {
    firedRuleIds.add(fire.ruleId);

    const firedAtMicros = fire.firedAt.microsSinceUnixEpoch as bigint;
    if (fire.cooldownGroup) {
      const windowMicros = cooldownWindowByGroup.get(fire.cooldownGroup);
      if (
        windowMicros !== undefined &&
        firedAtMicros + windowMicros > nowMicros
      ) {
        activeCooldownGroups.add(fire.cooldownGroup);
      }
    }
    if (fire.budgetKey && nowMicros - firedAtMicros < MICROS_PER_DAY) {
      dailyFiresByBudgetKey.set(
        fire.budgetKey,
        (dailyFiresByBudgetKey.get(fire.budgetKey) ?? 0) + 1,
      );
    }
  }

  const remainingBudgets: Record<string, number> = {};
  for (const rule of rules) {
    if (!rule.budgetKey) {
      continue;
    }
    const limit = Math.max(
      0,
      Math.trunc(rule.budgetLimit ?? DEFAULT_TRIGGER_BUDGET_LIMIT),
    );
    const used = dailyFiresByBudgetKey.get(rule.budgetKey) ?? 0;
    const remaining = Math.max(0, limit - used);
    const previous = remainingBudgets[rule.budgetKey];
    remainingBudgets[rule.budgetKey] =
      previous === undefined ? remaining : Math.min(previous, remaining);
  }

  return { activeCooldownGroups, remainingBudgets, firedRuleIds };
};
