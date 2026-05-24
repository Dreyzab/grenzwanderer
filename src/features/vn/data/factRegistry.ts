/**
 * Universal registry of interactive token metadata.
 *
 * Every `[fact:DisplayText:payload]` token in canon content
 * should have a matching entry here so the tutorial toast,
 * journal tab, and any future UI can look up display info
 * without hard-coding strings across components.
 */

export type FactCategory = "person" | "location" | "object" | "event";

export interface FactDefinition {
  /** Canonical key matching the token payload, e.g. "case01/zum_goldenen_adler" */
  factKey: string;
  category: FactCategory;
  displayName: string;
  shortDescription: string;
  /** Cosmetic XP shown in the acquisition toast (not persisted). */
  xpReward: number;
}

export const FACT_REGISTRY: Record<string, FactDefinition> = {
  "case01/zum_goldenen_adler": {
    factKey: "case01/zum_goldenen_adler",
    category: "location",
    displayName: "Zum Eber",
    shortDescription:
      "Гостиница во Фрайбурге, где Мастер забронировал для вас комнату. Старое здание с богатой историей.",
    xpReward: 5,
  },
  "case01/master": {
    factKey: "case01/master",
    category: "person",
    displayName: "Master",
    shortDescription:
      "The unknown sender who signs the letter and steers the case from afar.",
    xpReward: 5,
  },
};

export const lookupFact = (payload: string): FactDefinition | null =>
  FACT_REGISTRY[payload.trim()] ?? null;
