import { SenderError } from "spacetimedb/server";

import {
  isSkillVoiceId,
  type SkillVoiceId,
} from "../../../../data/innerVoiceContract";
import type { VnOutcomeGrade } from "../../../../src/shared/vn-contract";
import {
  SKILL_CHECK_FAILURE_XP,
  SKILL_CHECK_SUCCESS_XP,
} from "../../../../src/shared/game/skillProgression";
import {
  SKILL_CORE_BY_ID,
  coreXpVarKeyFor,
  resolveSkillXpAwardWithMultiplier,
} from "../../../../src/shared/game/characterProgression";
import {
  addToVar,
  addSkillXp,
  getVars,
  resolveActiveOriginId,
} from "./player_progression";

export interface SkillXpAward {
  skillId: SkillVoiceId;
  amount: number;
  totalXp: number;
}

export const normalizeSkillXpGrantAmount = (amount: number): number => {
  if (!Number.isFinite(amount)) {
    throw new SenderError("skill XP amount must be a finite number");
  }

  const normalizedAmount = Math.trunc(amount);
  if (normalizedAmount <= 0) {
    throw new SenderError("skill XP amount must be positive");
  }

  return normalizedAmount;
};

export const grantSkillXpInternal = (
  ctx: any,
  skillId: string,
  amount: number,
): SkillXpAward => {
  if (!isSkillVoiceId(skillId)) {
    throw new SenderError(`Unknown skill id for XP grant: ${skillId}`);
  }

  const normalizedAmount = normalizeSkillXpGrantAmount(amount);
  const awardedAmount = resolveSkillXpAwardWithMultiplier(
    getVars(ctx),
    skillId,
    normalizedAmount,
    resolveActiveOriginId(ctx),
  );
  addToVar(ctx, coreXpVarKeyFor(SKILL_CORE_BY_ID[skillId]), normalizedAmount);
  return {
    skillId,
    amount: awardedAmount,
    totalXp: addSkillXp(ctx, skillId, awardedAmount),
  };
};

export const resolveSkillCheckPracticeXp = (
  outcomeGrade: VnOutcomeGrade,
): number =>
  outcomeGrade === "fail" ? SKILL_CHECK_FAILURE_XP : SKILL_CHECK_SUCCESS_XP;

export const awardSkillCheckPracticeXp = (
  ctx: any,
  input: {
    activeChoice: boolean;
    voiceId: string;
    outcomeGrade: VnOutcomeGrade;
  },
): SkillXpAward | null => {
  if (!input.activeChoice || !isSkillVoiceId(input.voiceId)) {
    return null;
  }

  return grantSkillXpInternal(
    ctx,
    input.voiceId,
    resolveSkillCheckPracticeXp(input.outcomeGrade),
  );
};
