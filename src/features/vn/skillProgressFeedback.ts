import {
  isSkillVoiceId,
  type SkillVoiceId,
} from "../../../data/innerVoiceContract";
import { SKILL_DEFINITIONS } from "../../../data/skillDefinitions";
import {
  SKILL_CHECK_FAILURE_XP,
  SKILL_CHECK_SUCCESS_XP,
  normalizeSkillXpValue,
  resolveSkillRank,
  resolveSkillXpFromVars,
  type SkillProgressFeedback,
} from "../../shared/game/skillProgression";
import type {
  AwaitingSkillChoice,
  SkillCheckResultLike,
} from "./vnScreenTypes";

const isFailOutcome = (outcomeGrade: unknown): boolean =>
  outcomeGrade === "fail";

export const resolvePracticeXpForSkillResult = (
  matchedResult: Pick<SkillCheckResultLike, "outcomeGrade" | "passed">,
): number =>
  isFailOutcome(matchedResult.outcomeGrade) || !matchedResult.passed
    ? SKILL_CHECK_FAILURE_XP
    : SKILL_CHECK_SUCCESS_XP;

export const buildSkillProgressFeedback = ({
  pending,
  matchedResult,
  vars,
  baselineXp,
}: {
  pending: Pick<AwaitingSkillChoice, "voiceId" | "voiceLabel">;
  matchedResult: Pick<SkillCheckResultLike, "outcomeGrade" | "passed">;
  vars: Readonly<Record<string, number>>;
  baselineXp?: number;
}): SkillProgressFeedback | null => {
  if (!isSkillVoiceId(pending.voiceId)) {
    return null;
  }

  const skillId: SkillVoiceId = pending.voiceId;
  const totalBefore = normalizeSkillXpValue(
    baselineXp ?? resolveSkillXpFromVars(vars, skillId),
  );
  const xpAwarded = resolvePracticeXpForSkillResult(matchedResult);
  const totalXp = normalizeSkillXpValue(totalBefore + xpAwarded);
  const rankBefore = resolveSkillRank(totalBefore);
  const rankAfter = resolveSkillRank(totalXp);

  return {
    skillId,
    skillLabel: SKILL_DEFINITIONS[skillId]?.label ?? pending.voiceLabel,
    xpAwarded,
    xpGained: Math.max(0, totalXp - totalBefore),
    totalXp,
    rankBefore,
    rankAfter,
    rankUp: rankAfter.rankIndex > rankBefore.rankIndex,
  };
};

export const formatSkillProgressStatus = (
  feedback: SkillProgressFeedback,
): string => {
  const xpText =
    feedback.xpGained > 0
      ? `+${feedback.xpGained} XP`
      : `+0 XP (cap reached)`;

  if (feedback.rankUp) {
    return `Rank up: ${feedback.skillLabel} ${feedback.rankBefore.rank} -> ${feedback.rankAfter.rank} (${xpText})`;
  }

  return `${feedback.skillLabel} practice ${xpText} | ${feedback.rankAfter.rank} ${feedback.rankAfter.progress}/${feedback.rankAfter.progressMax}`;
};
