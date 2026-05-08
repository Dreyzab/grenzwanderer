import { describe, expect, it } from "vitest";

import { SKILL_VOICE_IDS } from "../../../data/innerVoiceContract";
import { resolveSkillRank } from "./skillProgression";
import {
  SKILL_PERK_RANKS,
  getNextSkillRankPerk,
  getSkillRankPerks,
  getUnlockedSkillRankPerks,
} from "./skillPerks";

describe("skillPerks", () => {
  it("provides B/A/S/SS perk slots for every method voice", () => {
    for (const skillId of SKILL_VOICE_IDS) {
      const perks = getSkillRankPerks(skillId);

      expect(perks.map((perk) => perk.rank)).toEqual(SKILL_PERK_RANKS);
      expect(perks).toHaveLength(4);
      expect(perks.every((perk) => perk.skillId === skillId)).toBe(true);
    }
  });

  it("splits unlocked and next perks from the current rank", () => {
    const rankState = resolveSkillRank(515);
    const unlocked = getUnlockedSkillRankPerks("attr_deception", rankState);
    const next = getNextSkillRankPerk("attr_deception", rankState);

    expect(unlocked.map((perk) => perk.rank)).toEqual(["B", "A"]);
    expect(next?.rank).toBe("S");
    expect(next?.title).toBe("S Signature Method");
  });

  it("returns no next perk at SS mastery", () => {
    expect(getNextSkillRankPerk("attr_logic", resolveSkillRank(800))).toBeNull();
  });
});
