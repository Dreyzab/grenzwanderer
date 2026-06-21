/**
 * Runtime resolver for NPC Knowledge (ADR_008). The authored `knows:` matrix is
 * compiled to `knowledgeMatrix.generated.ts` by `content:character:bridge`; here
 * we evaluate each Fact's condition against the current game state to answer
 * "what does THIS character know right now" — the npcMemory the reaction payload
 * carries. Knowledge is derived, never stored, and never propagates between NPCs.
 */
import { KNOWLEDGE_MATRIX } from "./knowledgeMatrix.generated";

export interface KnowledgeState {
  activeFlags: ReadonlySet<string>;
  /** Current story phase, when available. Omitted at call sites that lack it. */
  phase?: string;
}

// Ordering for `phase <op> <phase>` comparisons. Mirrors the char_*.md `phase:`
// values; an unknown phase fails the comparison closed.
const PHASE_ORDER = [
  "onboarding",
  "arrival",
  "investigation",
  "bank",
  "resolution",
] as const;

const compareOrdinals = (op: string, a: number, b: number): boolean => {
  switch (op) {
    case ">=":
      return a >= b;
    case ">":
      return a > b;
    case "<=":
      return a <= b;
    case "<":
      return a < b;
    case "==":
      return a === b;
    default:
      return false;
  }
};

const PHASE_CONDITION = /^phase\s*(>=|>|<=|<|==)\s*([a-z][a-z0-9_]*)$/i;

/**
 * Evaluates one `knows:` condition (grammar per ADR_008) against the state.
 * Fails closed on anything unrecognized — the bridge already lints grammar.
 */
export const knowledgeConditionHolds = (
  condition: string,
  state: KnowledgeState,
): boolean => {
  const c = condition.trim();
  if (c === "always") {
    return true;
  }
  if (c === "never") {
    return false;
  }
  if (c.startsWith("flag:")) {
    return state.activeFlags.has(c.slice("flag:".length));
  }
  const phaseMatch = c.match(PHASE_CONDITION);
  if (phaseMatch) {
    if (state.phase === undefined) {
      return false;
    }
    const current = PHASE_ORDER.indexOf(state.phase as never);
    const target = PHASE_ORDER.indexOf(phaseMatch[2] as never);
    if (current < 0 || target < 0) {
      return false;
    }
    return compareOrdinals(phaseMatch[1], current, target);
  }
  return false;
};

/** Facts the given character currently holds, for the reaction payload's npcMemory. */
export const knownFactsForCharacter = (
  characterId: string,
  state: KnowledgeState,
): string[] =>
  (KNOWLEDGE_MATRIX[characterId] ?? [])
    .filter((entry) => knowledgeConditionHolds(entry.condition, state))
    .map((entry) => entry.fact);
