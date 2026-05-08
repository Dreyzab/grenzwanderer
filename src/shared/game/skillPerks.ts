import {
  SKILL_VOICE_IDS,
  type SkillVoiceId,
} from "../../../data/innerVoiceContract";
import { SKILL_DEFINITIONS } from "../../../data/skillDefinitions";
import {
  isSkillRankAtLeast,
  type SkillRank,
  type SkillRankState,
} from "./skillProgression";

export type SkillPerkTag =
  | "passive_insight"
  | "expert_gate"
  | "patron_intervention"
  | "signature_mastery";

export interface SkillRankPerkDefinition {
  id: `${SkillVoiceId}_${SkillRank}_${SkillPerkTag}`;
  skillId: SkillVoiceId;
  rank: SkillRank;
  tag: SkillPerkTag;
  title: string;
  description: string;
}

export const SKILL_PERK_RANKS = ["B", "A", "S", "SS"] as const satisfies
  readonly SkillRank[];

const SKILL_PERK_TEMPLATES = {
  B: {
    tag: "passive_insight",
    title: "Reliable Read",
    description:
      "B-rank scenes can trust this method for passive observations and softer gates.",
  },
  A: {
    tag: "expert_gate",
    title: "Expert Leverage",
    description:
      "A-rank content can recognize this method as expert practice in authored checks.",
  },
  S: {
    tag: "patron_intervention",
    title: "Signature Method",
    description:
      "S-rank scenes can invite stronger patron voice interventions tied to this method.",
  },
  SS: {
    tag: "signature_mastery",
    title: "Paragon Method",
    description:
      "SS-rank content can treat this method as a defining specialty of the character.",
  },
} as const satisfies Record<
  (typeof SKILL_PERK_RANKS)[number],
  {
    tag: SkillPerkTag;
    title: string;
    description: string;
  }
>;

const buildSkillRankPerk = (
  skillId: SkillVoiceId,
  rank: (typeof SKILL_PERK_RANKS)[number],
): SkillRankPerkDefinition => {
  const template = SKILL_PERK_TEMPLATES[rank];
  const skillLabel = SKILL_DEFINITIONS[skillId].label;
  return {
    id: `${skillId}_${rank}_${template.tag}`,
    skillId,
    rank,
    tag: template.tag,
    title: `${rank} ${template.title}`,
    description: `${skillLabel}: ${template.description}`,
  };
};

export const SKILL_RANK_PERKS = SKILL_VOICE_IDS.reduce<
  Record<SkillVoiceId, SkillRankPerkDefinition[]>
>(
  (perksBySkill, skillId) => {
    perksBySkill[skillId] = SKILL_PERK_RANKS.map((rank) =>
      buildSkillRankPerk(skillId, rank),
    );
    return perksBySkill;
  },
  {} as Record<SkillVoiceId, SkillRankPerkDefinition[]>,
);

export const getSkillRankPerks = (
  skillId: SkillVoiceId,
): readonly SkillRankPerkDefinition[] => SKILL_RANK_PERKS[skillId];

export const getUnlockedSkillRankPerks = (
  skillId: SkillVoiceId,
  rankState: Pick<SkillRankState, "rank">,
): readonly SkillRankPerkDefinition[] =>
  getSkillRankPerks(skillId).filter((perk) =>
    isSkillRankAtLeast(rankState.rank, perk.rank),
  );

export const getNextSkillRankPerk = (
  skillId: SkillVoiceId,
  rankState: Pick<SkillRankState, "rank">,
): SkillRankPerkDefinition | null =>
  getSkillRankPerks(skillId).find(
    (perk) => !isSkillRankAtLeast(rankState.rank, perk.rank),
  ) ?? null;
