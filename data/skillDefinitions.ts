import {
  INNER_VOICE_IDS,
  type InnerVoiceId,
  type SkillVoiceId,
} from "./innerVoiceContract";

export type SkillProgressionRole = "method" | "compatibility";

export interface SkillDefinition {
  id: SkillVoiceId;
  canonicalId?: string;
  patronVoice: InnerVoiceId;
  label: string;
  labelRu: string;
  descriptionRu: string;
  progressionRole: SkillProgressionRole;
  archetype?: string;
}

export interface PatronVoiceInfluence {
  voiceId: InnerVoiceId;
  skillIds: readonly SkillVoiceId[];
  voiceRank: number;
  skillAverage: number;
  strongestSkill: number;
  recentUse: number;
  influence: number;
}

export interface PatronVoiceInfluenceInput {
  voiceRanks?: Partial<Record<InnerVoiceId, number>>;
  skillXp?: Partial<Record<SkillVoiceId, number>>;
  skillLevels?: Partial<Record<SkillVoiceId, number>>;
  recentSkillUse?: Partial<Record<SkillVoiceId, number>>;
}

export interface PatronVoiceInfluenceWeights {
  voiceRank?: number;
  skillAverage?: number;
  strongestSkill?: number;
  recentUse?: number;
}

const DEFAULT_INFLUENCE_WEIGHTS = {
  voiceRank: 1,
  skillAverage: 0.35,
  strongestSkill: 0.15,
  recentUse: 0.2,
} as const satisfies Required<PatronVoiceInfluenceWeights>;

const nonNegativeNumber = (value: number | undefined): number =>
  typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0;

const normalizeSkillXpPracticeValue = (value: number | undefined): number =>
  Math.min(8, nonNegativeNumber(value) / 100);

const hasOwnSkillXp = (
  skillXp: Partial<Record<SkillVoiceId, number>> | undefined,
  skillId: SkillVoiceId,
): boolean => Object.prototype.hasOwnProperty.call(skillXp ?? {}, skillId);

const average = (values: readonly number[]): number =>
  values.length === 0
    ? 0
    : values.reduce((sum, value) => sum + value, 0) / values.length;

export const SKILL_IDS_BY_PATRON_VOICE = {
  inner_analyst: ["attr_logic", "attr_intellect", "attr_encyclopedia"],
  inner_leader: ["attr_authority", "attr_composure", "attr_psyche"],
  inner_guide: ["attr_empathy", "attr_social", "attr_intuition"],
  inner_manipulator: ["attr_charisma", "attr_deception", "attr_shadow"],
  inner_cynic: ["attr_perception", "attr_forensics", "attr_intrusion"],
  inner_adapter: ["attr_agility", "attr_stealth", "attr_endurance"],
  inner_hermit: ["attr_tradition", "attr_poetics", "attr_physical"],
  inner_exile: ["attr_occultism", "attr_spirit", "attr_imagination"],
} as const satisfies Record<InnerVoiceId, readonly SkillVoiceId[]>;

export const SKILL_DEFINITIONS = {
  attr_logic: {
    id: "attr_logic",
    canonicalId: "logic",
    patronVoice: "inner_analyst",
    label: "Logic",
    labelRu: "Логика",
    descriptionRu:
      "Рациональное мышление, поиск противоречий и выстраивание цепочек.",
    progressionRole: "method",
    archetype: "dry/procedural, technical/evidentiary",
  },
  attr_intellect: {
    id: "attr_intellect",
    canonicalId: "logic",
    patronVoice: "inner_analyst",
    label: "Intellect",
    labelRu: "Интеллект",
    descriptionRu:
      "Широта умственных способностей, способность усваивать сложную информацию.",
    progressionRole: "compatibility",
    archetype: "dry/procedural, technical/evidentiary",
  },
  attr_encyclopedia: {
    id: "attr_encyclopedia",
    canonicalId: "encyclopedia",
    patronVoice: "inner_analyst",
    label: "Encyclopedia",
    labelRu: "Энциклопедия",
    descriptionRu: "Обширные фоновые знания, эрудиция и память на факты.",
    progressionRole: "method",
  },
  attr_authority: {
    id: "attr_authority",
    patronVoice: "inner_leader",
    label: "Authority",
    labelRu: "Авторитет",
    descriptionRu:
      "Способность подчинять своей воле, внушать страх и вызывать уважение.",
    progressionRole: "method",
  },
  attr_composure: {
    id: "attr_composure",
    patronVoice: "inner_leader",
    label: "Composure",
    labelRu: "Самообладание",
    descriptionRu:
      "Способность сохранять хладнокровие и скрывать эмоции в стрессе.",
    progressionRole: "method",
  },
  attr_psyche: {
    id: "attr_psyche",
    patronVoice: "inner_leader",
    label: "Psyche",
    labelRu: "Психика",
    descriptionRu:
      "Ментальная броня, сила воли и сопротивляемость давлению.",
    progressionRole: "compatibility",
  },
  attr_empathy: {
    id: "attr_empathy",
    patronVoice: "inner_guide",
    label: "Empathy",
    labelRu: "Эмпатия",
    descriptionRu: "Интуитивное понимание чужих чувств и скрытых мотивов.",
    progressionRole: "method",
  },
  attr_social: {
    id: "attr_social",
    canonicalId: "charisma",
    patronVoice: "inner_guide",
    label: "Social",
    labelRu: "Социальность",
    descriptionRu: "Понимание негласных общественных правил и норм.",
    progressionRole: "compatibility",
    archetype: "warm/adaptive, social/flattering",
  },
  attr_intuition: {
    id: "attr_intuition",
    patronVoice: "inner_guide",
    label: "Intuition",
    labelRu: "Интуиция",
    descriptionRu:
      "Шестое чувство, предчувствие опасности и подсознательные озарения.",
    progressionRole: "method",
  },
  attr_charisma: {
    id: "attr_charisma",
    canonicalId: "charisma",
    patronVoice: "inner_manipulator",
    label: "Charisma",
    labelRu: "Харизма",
    descriptionRu: "Обаяние, умение располагать к себе и обольщать.",
    progressionRole: "method",
    archetype: "warm/adaptive, social/flattering",
  },
  attr_deception: {
    id: "attr_deception",
    canonicalId: "deception",
    patronVoice: "inner_manipulator",
    label: "Deception",
    labelRu: "Обман",
    descriptionRu: "Умение лгать, блефовать и распознавать чужую ложь.",
    progressionRole: "method",
  },
  attr_shadow: {
    id: "attr_shadow",
    patronVoice: "inner_manipulator",
    label: "Shadow",
    labelRu: "Тень",
    descriptionRu:
      "Связь с криминальным миром, понимание темной стороны общества.",
    progressionRole: "compatibility",
  },
  attr_perception: {
    id: "attr_perception",
    canonicalId: "perception",
    patronVoice: "inner_cynic",
    label: "Perception",
    labelRu: "Восприятие",
    descriptionRu:
      "Внимательность к мельчайшим деталям окружения, острота зрения и слуха.",
    progressionRole: "method",
  },
  attr_forensics: {
    id: "attr_forensics",
    patronVoice: "inner_cynic",
    label: "Forensics",
    labelRu: "Криминалистика",
    descriptionRu:
      "Аналитический подход к уликам, осмотр мест преступлений.",
    progressionRole: "method",
  },
  attr_intrusion: {
    id: "attr_intrusion",
    patronVoice: "inner_cynic",
    label: "Intrusion",
    labelRu: "Взлом",
    descriptionRu: "Навыки проникновения: отмычки, обход систем безопасности.",
    progressionRole: "method",
  },
  attr_agility: {
    id: "attr_agility",
    patronVoice: "inner_adapter",
    label: "Agility",
    labelRu: "Ловкость",
    descriptionRu: "Скорость реакции, гибкость и координация движений.",
    progressionRole: "method",
  },
  attr_stealth: {
    id: "attr_stealth",
    patronVoice: "inner_adapter",
    label: "Stealth",
    labelRu: "Скрытность",
    descriptionRu:
      "Умение передвигаться бесшумно, прятаться и оставаться незамеченным.",
    progressionRole: "method",
  },
  attr_endurance: {
    id: "attr_endurance",
    patronVoice: "inner_adapter",
    label: "Endurance",
    labelRu: "Выносливость",
    descriptionRu:
      "Физическая стойкость, способность переносить боль и лишения.",
    progressionRole: "method",
  },
  attr_tradition: {
    id: "attr_tradition",
    patronVoice: "inner_hermit",
    label: "Tradition",
    labelRu: "Традиции",
    descriptionRu:
      "Знание обычаев, законов и приверженность старому укладу.",
    progressionRole: "method",
  },
  attr_poetics: {
    id: "attr_poetics",
    patronVoice: "inner_hermit",
    label: "Poetics",
    labelRu: "Поэтика",
    descriptionRu:
      "Чувство прекрасного, понимание искусства, метафор и смыслов.",
    progressionRole: "method",
  },
  attr_physical: {
    id: "attr_physical",
    patronVoice: "inner_hermit",
    label: "Physical",
    labelRu: "Физиология",
    descriptionRu:
      "Грубая физическая сила, телесная аскеза и здоровье организма.",
    progressionRole: "compatibility",
  },
  attr_occultism: {
    id: "attr_occultism",
    canonicalId: "occultism",
    patronVoice: "inner_exile",
    label: "Occultism",
    labelRu: "Оккультизм",
    descriptionRu: "Знание эзотерики, ритуалов, расшифровка символов.",
    progressionRole: "method",
    archetype: "ritual cadence, symbolic/esoteric",
  },
  attr_spirit: {
    id: "attr_spirit",
    canonicalId: "occultism",
    patronVoice: "inner_exile",
    label: "Spirit",
    labelRu: "Дух",
    descriptionRu:
      "Духовная связь, вера, мистическое чутье и контакт с потусторонним.",
    progressionRole: "compatibility",
    archetype: "ritual cadence, symbolic/esoteric",
  },
  attr_imagination: {
    id: "attr_imagination",
    patronVoice: "inner_exile",
    label: "Imagination",
    labelRu: "Воображение",
    descriptionRu:
      "Творческое мышление, способность визуализировать скрытое.",
    progressionRole: "method",
  },
} as const satisfies Record<SkillVoiceId, SkillDefinition>;

export const getSkillDefinition = (
  skillId: string,
): SkillDefinition | null =>
  SKILL_DEFINITIONS[skillId as SkillVoiceId] ?? null;

export const getSkillDefinitionsForPatronVoice = (
  voiceId: InnerVoiceId,
): SkillDefinition[] =>
  SKILL_IDS_BY_PATRON_VOICE[voiceId].map(
    (skillId) => SKILL_DEFINITIONS[skillId],
  );

export const patronVoiceForSkill = (skillId: SkillVoiceId): InnerVoiceId =>
  SKILL_DEFINITIONS[skillId].patronVoice;

export const resolvePatronVoiceInfluence = (
  input: PatronVoiceInfluenceInput,
  weights: PatronVoiceInfluenceWeights = {},
): Record<InnerVoiceId, PatronVoiceInfluence> => {
  const resolvedWeights = { ...DEFAULT_INFLUENCE_WEIGHTS, ...weights };
  const influenceByVoice = {} as Record<InnerVoiceId, PatronVoiceInfluence>;

  for (const voiceId of INNER_VOICE_IDS) {
    const skillIds = SKILL_IDS_BY_PATRON_VOICE[voiceId];
    const skillLevels = skillIds.map((skillId) => {
      if (hasOwnSkillXp(input.skillXp, skillId)) {
        return normalizeSkillXpPracticeValue(input.skillXp?.[skillId]);
      }
      return nonNegativeNumber(input.skillLevels?.[skillId]);
    });
    const recentUses = skillIds.map((skillId) =>
      nonNegativeNumber(input.recentSkillUse?.[skillId]),
    );
    const voiceRank = nonNegativeNumber(input.voiceRanks?.[voiceId]);
    const skillAverage = average(skillLevels);
    const strongestSkill = Math.max(0, ...skillLevels);
    const recentUse = average(recentUses);
    const influence =
      voiceRank * resolvedWeights.voiceRank +
      skillAverage * resolvedWeights.skillAverage +
      strongestSkill * resolvedWeights.strongestSkill +
      recentUse * resolvedWeights.recentUse;

    influenceByVoice[voiceId] = {
      voiceId,
      skillIds,
      voiceRank,
      skillAverage,
      strongestSkill,
      recentUse,
      influence,
    };
  }

  return influenceByVoice;
};

export const rankPatronVoicesByInfluence = (
  input: PatronVoiceInfluenceInput,
  weights: PatronVoiceInfluenceWeights = {},
): PatronVoiceInfluence[] => {
  const influenceByVoice = resolvePatronVoiceInfluence(input, weights);
  const voiceOrder = new Map(
    INNER_VOICE_IDS.map((voiceId, index) => [voiceId, index]),
  );

  return [...Object.values(influenceByVoice)].sort(
    (left, right) =>
      right.influence - left.influence ||
      (voiceOrder.get(left.voiceId) ?? 0) -
        (voiceOrder.get(right.voiceId) ?? 0),
  );
};
