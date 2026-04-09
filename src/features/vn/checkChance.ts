import type { VnDiceMode, VnSnapshot } from "./types";
import { resolveKarmaDifficultyDelta } from "../../shared/game/narrativeResources";

export type SkillCheckChanceTone = "confident" | "risky" | "critical";

export interface SkillCheckChanceInput {
  diceMode: VnDiceMode;
  difficulty: number;
  voiceLevel: number;
}

export interface EffectiveDifficultyInput {
  baseDifficulty: number;
  karmaSensitive?: boolean;
  karma: number;
  fortuneMod: number;
  fortuneSpend?: number;
}

export const resolveSkillCheckDiceMode = (
  snapshot: VnSnapshot,
  scenarioId: string,
): VnDiceMode =>
  snapshot.scenarios.find((entry) => entry.id === scenarioId)?.skillCheckDice ??
  snapshot.vnRuntime?.skillCheckDice ??
  "d20";

export const calculateSkillCheckSuccessPercent = ({
  diceMode,
  difficulty,
  voiceLevel,
}: SkillCheckChanceInput): number => {
  const sides = diceMode === "d10" ? 10 : 20;
  const threshold = difficulty - Math.floor(voiceLevel);

  if (threshold <= 1) {
    return 100;
  }
  if (threshold > sides) {
    return 0;
  }

  const successfulRolls = sides - threshold + 1;
  return Math.round((successfulRolls / sides) * 100);
};

export const resolveSkillCheckEffectiveDifficulty = ({
  baseDifficulty,
  karmaSensitive = false,
  karma,
  fortuneMod,
  fortuneSpend = 0,
}: EffectiveDifficultyInput): number =>
  Math.max(
    1,
    Math.trunc(baseDifficulty) +
      (karmaSensitive ? resolveKarmaDifficultyDelta(karma) : 0) +
      Math.trunc(fortuneMod) -
      Math.max(0, Math.min(2, Math.trunc(fortuneSpend))) * 2,
  );

export const getSkillCheckChanceTone = (
  percent: number,
): SkillCheckChanceTone => {
  if (percent >= 70) {
    return "confident";
  }
  if (percent >= 40) {
    return "risky";
  }
  return "critical";
};
