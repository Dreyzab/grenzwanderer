import { describe, expect, it } from "vitest";

import { INNER_VOICE_IDS, SKILL_VOICE_IDS } from "./innerVoiceContract";
import { PARLIAMENT_MODULES } from "./parliamentModules";
import { SKILL_DEFINITIONS, SKILL_IDS_BY_PATRON_VOICE } from "./skillDefinitions";
import {
  COMPATIBILITY_VOICE_IDS,
  CURRENT_CANON,
  METHOD_VOICE_DISPLAY_IDS,
} from "./currentCanon";

describe("CURRENT_CANON", () => {
  it("derives the 24 / 18 / 6 / 8 voice counts from runtime registries", () => {
    expect(CURRENT_CANON.runtimeSkillVoices).toEqual(SKILL_VOICE_IDS);
    expect(CURRENT_CANON.runtimeSkillVoices).toHaveLength(24);

    expect(CURRENT_CANON.methodVoiceDisplayIds).toEqual(
      METHOD_VOICE_DISPLAY_IDS,
    );
    expect(CURRENT_CANON.methodVoiceDisplayIds).toHaveLength(18);
    expect(
      CURRENT_CANON.methodVoiceDisplayIds.every(
        (skillId) => SKILL_DEFINITIONS[skillId].progressionRole === "method",
      ),
    ).toBe(true);

    expect(CURRENT_CANON.compatibilityVoiceIds).toEqual(
      COMPATIBILITY_VOICE_IDS,
    );
    expect(CURRENT_CANON.compatibilityVoiceIds).toHaveLength(6);
    expect(
      CURRENT_CANON.compatibilityVoiceIds.every(
        (skillId) =>
          SKILL_DEFINITIONS[skillId].progressionRole === "compatibility",
      ),
    ).toBe(true);

    expect(CURRENT_CANON.motiveFactions).toEqual(INNER_VOICE_IDS);
    expect(CURRENT_CANON.motiveFactions).toHaveLength(8);
  });

  it("keeps patron triples exhaustive and non-overlapping", () => {
    const patronSkillIds = Object.values(SKILL_IDS_BY_PATRON_VOICE).flat();

    for (const voiceId of INNER_VOICE_IDS) {
      expect(SKILL_IDS_BY_PATRON_VOICE[voiceId]).toHaveLength(3);
    }

    expect(new Set(patronSkillIds).size).toBe(SKILL_VOICE_IDS.length);
    expect([...patronSkillIds].sort()).toEqual([...SKILL_VOICE_IDS].sort());
    expect(CURRENT_CANON.patronTriples).toEqual(SKILL_IDS_BY_PATRON_VOICE);
  });

  it("derives origin presets and era status without promoting 1905", () => {
    expect(CURRENT_CANON.originPresets).toEqual(Object.keys(PARLIAMENT_MODULES));
    expect(CURRENT_CANON.era).toEqual({
      value: 1900,
      status: "operational-canon",
      retconCandidate: 1905,
      decision: "1905 requires a separate ADR before becoming runtime canon",
    });
  });

  it("marks aggregate compatibility voices as transitional core-display debt", () => {
    expect(
      CURRENT_CANON.voiceRows.filter(
        (row) => row.layer === "method" && row.status === "TRANSITIONAL",
      ),
    ).toEqual(
      COMPATIBILITY_VOICE_IDS.map((skillId) =>
        expect.objectContaining({
          id: skillId,
          progressionRole: "compatibility",
          status: "TRANSITIONAL",
        }),
      ),
    );
  });
});
