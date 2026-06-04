export const MAP_CODE_RETRY_COOLDOWN_MICROS = 60n * 1_000_000n;

const timestampMicros = (value: unknown): bigint => {
  if (
    value &&
    typeof value === "object" &&
    "microsSinceUnixEpoch" in (value as Record<string, unknown>)
  ) {
    const micros = (value as { microsSinceUnixEpoch?: unknown })
      .microsSinceUnixEpoch;
    if (typeof micros === "bigint") {
      return micros;
    }
    if (typeof micros === "number" && Number.isFinite(micros)) {
      return BigInt(Math.trunc(micros));
    }
    if (typeof micros === "string" && micros.trim().length > 0) {
      return BigInt(micros);
    }
  }
  return 0n;
};

const iterateRedeemRowsByCodeResultForSender = (
  ctx: any,
  codeId: string,
  result: string,
): Iterable<any> =>
  ctx.db.playerRedeemedCode.player_redeemed_code_player_code_result.filter([
    ctx.sender,
    codeId,
    result,
  ]);

export const hasPriorSuccessfulRedeem = (ctx: any, codeId: string): boolean => {
  for (const result of ["applied", "queued_after_briefing"]) {
    for (const _row of iterateRedeemRowsByCodeResultForSender(
      ctx,
      codeId,
      result,
    )) {
      return true;
    }
  }
  return false;
};

export const hasRecentRejectedRedeem = (
  ctx: any,
  codeId: string,
  nowMicros: bigint,
): boolean => {
  for (const result of [
    "blocked_flags",
    "location_required",
    "outside_geofence",
  ]) {
    for (const row of iterateRedeemRowsByCodeResultForSender(
      ctx,
      codeId,
      result,
    )) {
      if (
        timestampMicros(row.redeemedAt) + MAP_CODE_RETRY_COOLDOWN_MICROS >
        nowMicros
      ) {
        return true;
      }
    }
  }
  return false;
};
