import { identityKey } from "./map_keys";

export const createVarKey = (
  player: { toHexString(): string },
  key: string,
): string => `${identityKey(player)}::${key}`;

export const createSessionKey = (
  player: { toHexString(): string },
  scenarioId: string,
): string => `${identityKey(player)}::${scenarioId}`;

export const createInventoryKey = (
  player: { toHexString(): string },
  itemId: string,
): string => `${identityKey(player)}::${itemId}`;

export const createQuestKey = (
  player: { toHexString(): string },
  questId: string,
): string => `${identityKey(player)}::${questId}`;

export const createEvidenceKey = (
  player: { toHexString(): string },
  evidenceId: string,
): string => `${identityKey(player)}::${evidenceId}`;

export const createNpcFavorKey = (
  player: { toHexString(): string },
  npcId: string,
): string => `${identityKey(player)}::favor::${npcId}`;

export const createFavorLedgerKey = (
  player: { toHexString(): string },
  favorId: string,
): string => `${identityKey(player)}::favor_ledger::${favorId}`;

export const createFactionSignalKey = (
  player: { toHexString(): string },
  factionId: string,
): string => `${identityKey(player)}::faction::${factionId}`;

export const createRumorStateKey = (
  player: { toHexString(): string },
  rumorId: string,
): string => `${identityKey(player)}::rumor::${rumorId}`;

export const createUnlockGroupKey = (
  player: { toHexString(): string },
  groupId: string,
): string => `${identityKey(player)}::${groupId}`;

export const createRedeemedCodeKey = (
  player: { toHexString(): string },
  requestId: string,
): string => `${identityKey(player)}::redeem::${requestId}`;

export const createPlayerMindCaseKey = (
  player: { toHexString(): string },
  caseId: string,
): string => `${identityKey(player)}::case::${caseId}`;

export const createPlayerMindFactKey = (
  player: { toHexString(): string },
  caseId: string,
  factId: string,
): string => `${identityKey(player)}::fact::${caseId}::${factId}`;

export const createPlayerMindHypothesisKey = (
  player: { toHexString(): string },
  caseId: string,
  hypothesisId: string,
): string => `${identityKey(player)}::hypothesis::${caseId}::${hypothesisId}`;

export const createHypothesisFocusFlagKey = (
  caseId: string,
  hypothesisId: string,
): string => `mind_focus::${caseId}::${hypothesisId}`;

export const createSkillCheckResultKey = (
  player: { toHexString(): string },
  scenarioId: string,
  nodeId: string,
  checkId: string,
): string =>
  `${identityKey(player)}::check::${scenarioId}::${nodeId}::${checkId}`;

export const createBattleSessionKey = (player: {
  toHexString(): string;
}): string => `${identityKey(player)}::battle`;

export const createBattleCombatantKey = (
  player: { toHexString(): string },
  combatantId: string,
): string => `${identityKey(player)}::battle::combatant::${combatantId}`;

export const createBattleCardInstanceKey = (
  player: { toHexString(): string },
  instanceId: string,
): string => `${identityKey(player)}::battle::card::${instanceId}`;

export const createBattleHistoryKey = (
  player: { toHexString(): string },
  timestampMicros: bigint,
  ordinal: number,
): string =>
  `${identityKey(player)}::battle::history::${timestampMicros.toString()}::${ordinal}`;
