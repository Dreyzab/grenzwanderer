import {
  SKILL_VOICE_IDS,
  type SkillVoiceId,
} from "../../../data/innerVoiceContract";

export const SKILL_RANKS = ["F", "E", "D", "C", "B", "A", "S", "SS"] as const;

export type SkillRank = (typeof SKILL_RANKS)[number];

export interface SkillRankState {
  totalXp: number;
  rank: SkillRank;
  rankIndex: number;
  progress: number;
  progressMax: number;
  isMaxRank: boolean;
}

export interface SkillProgressFeedback {
  skillId: SkillVoiceId;
  skillLabel: string;
  xpAwarded: number;
  xpGained: number;
  totalXp: number;
  rankBefore: SkillRankState;
  rankAfter: SkillRankState;
  rankUp: boolean;
}

export type SkillXpVarKey = `skill_xp_${SkillVoiceId}`;

export const SKILL_XP_VAR_PREFIX = "skill_xp_";
export const SKILL_XP_PER_RANK = 100;
export const SKILL_RANK_THRESHOLDS = {
  F: 0,
  E: 100,
  D: 200,
  C: 300,
  B: 400,
  A: 500,
  S: 600,
  SS: 700,
} as const satisfies Record<SkillRank, number>;

export const SKILL_XP_CAP = SKILL_RANK_THRESHOLDS.SS + SKILL_XP_PER_RANK;
export const SKILL_CHECK_SUCCESS_XP = 25;
export const SKILL_CHECK_FAILURE_XP = 35;

const SKILL_RANK_INDEX_BY_RANK = new Map<SkillRank, number>(
  SKILL_RANKS.map((rank, index) => [rank, index]),
);

export const skillXpVarKeyFor = (skillId: SkillVoiceId): SkillXpVarKey =>
  `${SKILL_XP_VAR_PREFIX}${skillId}`;

export const SKILL_XP_VAR_KEYS = SKILL_VOICE_IDS.map(skillXpVarKeyFor);

const SKILL_XP_VAR_KEY_SET = new Set<string>(SKILL_XP_VAR_KEYS);

export const isSkillXpVarKey = (value: string): value is SkillXpVarKey =>
  SKILL_XP_VAR_KEY_SET.has(value);

export const isSkillRank = (value: string): value is SkillRank =>
  SKILL_RANK_INDEX_BY_RANK.has(value as SkillRank);

export const skillRankIndex = (rank: SkillRank): number =>
  SKILL_RANK_INDEX_BY_RANK.get(rank) ?? 0;

export const isSkillRankAtLeast = (
  actualRank: SkillRank,
  requiredRank: SkillRank,
): boolean => skillRankIndex(actualRank) >= skillRankIndex(requiredRank);

export const normalizeSkillXpValue = (totalXp: number): number => {
  if (!Number.isFinite(totalXp)) {
    return 0;
  }
  return Math.min(SKILL_XP_CAP, Math.max(0, Math.trunc(totalXp)));
};

export const resolveSkillRank = (totalXp: number): SkillRankState => {
  const normalizedTotalXp = normalizeSkillXpValue(totalXp);
  const cappedAtMax = normalizedTotalXp >= SKILL_XP_CAP;
  let rankIndex = 0;
  if (cappedAtMax) {
    rankIndex = SKILL_RANKS.length - 1;
  } else {
    for (let index = 0; index < SKILL_RANKS.length; index += 1) {
      if (normalizedTotalXp >= SKILL_RANK_THRESHOLDS[SKILL_RANKS[index]]) {
        rankIndex = index;
      }
    }
  }
  const rank = SKILL_RANKS[rankIndex];
  const rankStart = SKILL_RANK_THRESHOLDS[rank];
  const nextRank = SKILL_RANKS[rankIndex + 1];
  const progressMax = nextRank
    ? SKILL_RANK_THRESHOLDS[nextRank] - rankStart
    : SKILL_XP_CAP - rankStart;
  const progress = cappedAtMax ? progressMax : normalizedTotalXp - rankStart;

  return {
    totalXp: normalizedTotalXp,
    rank,
    rankIndex,
    progress,
    progressMax,
    isMaxRank: rankIndex === SKILL_RANKS.length - 1,
  };
};

export const normalizeSkillXpForInfluence = (totalXp: number): number =>
  normalizeSkillXpValue(totalXp) / SKILL_XP_PER_RANK;

export const resolveSkillXpFromVars = (
  vars: Readonly<Record<string, number>>,
  skillId: SkillVoiceId,
): number => {
  const xpKey = skillXpVarKeyFor(skillId);
  return vars[xpKey] !== undefined
    ? vars[xpKey]
    : (vars[skillId] ?? 0) * SKILL_XP_PER_RANK;
};

export const isSkillRankGateSatisfiedFromVars = (
  vars: Readonly<Record<string, number>>,
  skillId: SkillVoiceId,
  requiredRank: SkillRank,
): boolean =>
  isSkillRankAtLeast(
    resolveSkillRank(resolveSkillXpFromVars(vars, skillId)).rank,
    requiredRank,
  );
