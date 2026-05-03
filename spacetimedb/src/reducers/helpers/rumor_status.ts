export type { RumorStateStatus } from "../../../../src/shared/vn-contract";

import type { RumorStateStatus } from "../../../../src/shared/vn-contract";

// Legacy status emitted by older content/data. Treat as "logged" everywhere.
const LEGACY_RUMOR_STATUS_ALIASES: Record<string, RumorStateStatus> = {
  registered: "logged",
};

export const normalizeRumorStatus = (
  value: unknown,
): RumorStateStatus | null => {
  if (typeof value !== "string") {
    return null;
  }
  const alias = LEGACY_RUMOR_STATUS_ALIASES[value];
  if (alias) {
    return alias;
  }
  if (
    value === "registered" ||
    value === "heard" ||
    value === "logged" ||
    value === "pursuing" ||
    value === "verified" ||
    value === "spent" ||
    value === "burned"
  ) {
    return value;
  }
  return null;
};

export const isRumorStatusInput = (value: unknown): boolean =>
  normalizeRumorStatus(value) !== null;
