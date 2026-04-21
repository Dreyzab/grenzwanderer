import { describe, expect, it } from "vitest";

import {
  buildCanonicalVoicePromptBrief,
  buildParliamentPromptStack,
  canonicalSkillVoiceIdFor,
  canonicalizeSpeakerIds,
  getCanonicalVoiceLabel,
  getCanonicalVoicePromptProfile,
} from "./voiceBridge";

describe("voiceBridge", () => {
  it("maps legacy runtime ids onto canonical parliament voices", () => {
    expect(canonicalSkillVoiceIdFor("attr_intellect")).toBe("logic");
    expect(canonicalSkillVoiceIdFor("attr_social")).toBe("charisma");
    expect(canonicalSkillVoiceIdFor("attr_spirit")).toBe("occultism");
    expect(canonicalSkillVoiceIdFor("attr_perception")).toBe("perception");
  });

  it("keeps canonical labels and lore profiles for first-wave voices", () => {
    expect(getCanonicalVoiceLabel("attr_intellect")).toBe("Logic");
    expect(getCanonicalVoiceLabel("attr_social")).toBe("Charisma");
    expect(getCanonicalVoiceLabel("attr_spirit")).toBe("Occultism");

    expect(getCanonicalVoicePromptProfile("logic")?.speechPattern).toBe(
      "dry and procedural",
    );
    expect(getCanonicalVoicePromptProfile("charisma")?.vocabulary).toBe(
      "social and flattering",
    );
    expect(getCanonicalVoicePromptProfile("occultism")?.emotionalRange).toBe(
      "measured wonder to obsessive dread",
    );
  });

  it("builds prompt-facing briefs for the primary voice and parliament stack", () => {
    expect(buildCanonicalVoicePromptBrief("attr_social")).toContain(
      'motto "Make them enjoy telling you what hurts them."',
    );
    expect(buildCanonicalVoicePromptBrief("attr_intellect")).toContain(
      "roles contradiction scan, timeline reconstruction, evidence validation",
    );

    expect(
      canonicalizeSpeakerIds(["attr_social", "attr_logic", "attr_social"]),
    ).toEqual(["charisma", "logic"]);
    expect(
      buildParliamentPromptStack(["attr_social", "attr_logic", "attr_spirit"]),
    ).toContain("Occultism: ritual cadence");
  });
});
