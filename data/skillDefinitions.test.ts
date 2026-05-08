import { describe, expect, it } from "vitest";

import {
  INNER_VOICE_IDS,
  SKILL_VOICE_IDS,
  type InnerVoiceId,
  type SkillVoiceId,
} from "./innerVoiceContract";
import {
  getSkillDefinition,
  getSkillDefinitionsForPatronVoice,
  patronVoiceForSkill,
  rankPatronVoicesByInfluence,
  resolvePatronVoiceInfluence,
  SKILL_DEFINITIONS,
  SKILL_IDS_BY_PATRON_VOICE,
} from "./skillDefinitions";

const sorted = <T extends string>(entries: readonly T[]): T[] =>
  [...entries].sort((left, right) => left.localeCompare(right));

describe("skillDefinitions", () => {
  it("covers every runtime skill id exactly once", () => {
    expect(sorted(Object.keys(SKILL_DEFINITIONS) as SkillVoiceId[])).toEqual(
      sorted(SKILL_VOICE_IDS),
    );

    const groupedSkillIds = INNER_VOICE_IDS.flatMap(
      (voiceId) => SKILL_IDS_BY_PATRON_VOICE[voiceId],
    );
    expect(sorted(groupedSkillIds)).toEqual(sorted(SKILL_VOICE_IDS));
    expect(new Set(groupedSkillIds).size).toBe(SKILL_VOICE_IDS.length);
  });

  it("keeps the eight patron voices in a balanced three-skill grid", () => {
    for (const voiceId of INNER_VOICE_IDS) {
      const skillIds = SKILL_IDS_BY_PATRON_VOICE[voiceId];
      expect(skillIds).toHaveLength(3);
      expect(getSkillDefinitionsForPatronVoice(voiceId)).toHaveLength(3);

      for (const skillId of skillIds) {
        expect(SKILL_DEFINITIONS[skillId].patronVoice).toBe(voiceId);
        expect(patronVoiceForSkill(skillId)).toBe(voiceId);
      }
    }
  });

  it("exposes the intended high-level affinity mapping", () => {
    expect(patronVoiceForSkill("attr_logic")).toBe("inner_analyst");
    expect(patronVoiceForSkill("attr_deception")).toBe("inner_manipulator");
    expect(patronVoiceForSkill("attr_empathy")).toBe("inner_guide");
    expect(patronVoiceForSkill("attr_physical")).toBe("inner_hermit");
    expect(patronVoiceForSkill("attr_occultism")).toBe("inner_exile");
    expect(getSkillDefinition("unknown")).toBeNull();
  });

  it("separates practical method skills from compatibility variables", () => {
    expect(SKILL_DEFINITIONS.attr_deception.progressionRole).toBe("method");
    expect(SKILL_DEFINITIONS.attr_intellect.progressionRole).toBe(
      "compatibility",
    );
    expect(SKILL_DEFINITIONS.attr_social.canonicalId).toBe("charisma");
    expect(SKILL_DEFINITIONS.attr_spirit.canonicalId).toBe("occultism");
  });

  it("resolves patron voice influence from rank, skill practice, and recent use", () => {
    const influenceByVoice = resolvePatronVoiceInfluence({
      voiceRanks: {
        inner_manipulator: 2,
      },
      skillLevels: {
        attr_charisma: 1,
        attr_deception: 6,
        attr_shadow: 2,
        attr_logic: 4,
      },
      recentSkillUse: {
        attr_deception: 3,
      },
    });

    expect(influenceByVoice.inner_manipulator.voiceRank).toBe(2);
    expect(influenceByVoice.inner_manipulator.skillAverage).toBe(3);
    expect(influenceByVoice.inner_manipulator.strongestSkill).toBe(6);
    expect(influenceByVoice.inner_manipulator.recentUse).toBe(1);
    expect(influenceByVoice.inner_manipulator.influence).toBeCloseTo(4.15);

    expect(
      rankPatronVoicesByInfluence({}).map((entry) => entry.voiceId),
    ).toEqual(INNER_VOICE_IDS);
    expect(
      rankPatronVoicesByInfluence({
        skillLevels: { attr_occultism: 8 },
      })[0]?.voiceId,
    ).toBe("inner_exile" satisfies InnerVoiceId);
  });

  it("uses normalized skill XP when deriving patron influence", () => {
    const fromLegacyLevel = resolvePatronVoiceInfluence({
      skillLevels: { attr_perception: 4 },
    });
    const fromSkillXp = resolvePatronVoiceInfluence({
      skillXp: { attr_perception: 400 },
    });

    expect(fromSkillXp.inner_cynic.skillAverage).toBeCloseTo(
      fromLegacyLevel.inner_cynic.skillAverage,
    );
    expect(fromSkillXp.inner_cynic.strongestSkill).toBe(4);
    expect(fromSkillXp.inner_cynic.influence).toBeCloseTo(
      fromLegacyLevel.inner_cynic.influence,
    );
  });
});
