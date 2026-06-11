import { describe, expect, it } from "vitest";

import {
  isInnerVoiceId,
  isSkillVoiceId,
} from "./innerVoiceContract";
import {
  getParliamentModule,
  getVoiceSkin,
  PARLIAMENT_MODULES,
} from "./parliamentModules";

describe("parliamentModules", () => {
  it("resolves origin presets and track-preset aliases", () => {
    expect(getParliamentModule("witch")?.presetId).toBe("witch");
    expect(getParliamentModule("journalist_cityroom")?.presetId).toBe(
      "journalist",
    );
    expect(getParliamentModule("nope")).toBeNull();
    expect(getParliamentModule(undefined)).toBeNull();
  });

  it("skins a witch method and motive voice onto real canonical ids", () => {
    expect(getVoiceSkin("witch", "attr_composure")?.label).toBe("[ФАСАД]");
    expect(getVoiceSkin("witch", "attr_poetics")?.label).toBe("[ЭСТЕТИКА]");
    expect(getVoiceSkin("witch", "inner_leader")?.label).toBe("[ТРАДИЦИЯ]");
    expect(getVoiceSkin("witch", "inner_cynic")?.label).toBe("[СУВЕРЕННОСТЬ]");
    expect(getVoiceSkin("witch", "inner_exile")?.label).toBe("[ЧАРЫ]");
    expect(getVoiceSkin("witch", "inner_hermit")?.label).toBe("[СТЫД]");
  });

  it("skins detective methods and motives onto real canonical ids", () => {
    expect(getVoiceSkin("detective", "attr_forensics")?.label).toBe(
      "[РЕКОНСТРУКЦИЯ]",
    );
    expect(getVoiceSkin("detective", "inner_analyst")?.label).toBe("[МЕТОД]");
    expect(getVoiceSkin("detective", "inner_cynic")?.label).toBe("[СКЕПСИС]");
    expect(getVoiceSkin("detective", "inner_exile")?.label).toBe("[ИЗНАНКА]");
  });

  it("skins veteran methods and motives onto real canonical ids", () => {
    expect(getVoiceSkin("veteran", "attr_endurance")?.label).toBe(
      "[ФАНТОМНАЯ БОЛЬ]",
    );
    expect(getVoiceSkin("veteran", "inner_leader")?.label).toBe("[УСТАВ]");
    expect(getVoiceSkin("veteran", "inner_exile")?.label).toBe(
      "[ВЫЖИВАЛЬЩИК]",
    );
    expect(getVoiceSkin("veteran", "inner_manipulator")?.label).toBe("[ТЕНЬ]");
  });

  it("returns null for voices the preset does not skin", () => {
    expect(getVoiceSkin("witch", "attr_authority")).toBeNull();
    expect(getVoiceSkin("detective", "attr_composure")).toBeNull();
  });

  it("honors two-layer purity across every module", () => {
    for (const mod of Object.values(PARLIAMENT_MODULES)) {
      for (const skin of mod.methodSkins) {
        // method skins must target a skill (attr_*) voice
        expect(isSkillVoiceId(skin.targetId)).toBe(true);
        expect(isInnerVoiceId(skin.targetId)).toBe(false);
      }
      for (const skin of mod.motiveSkins) {
        // motive skins must target an inner_* faction
        expect(isInnerVoiceId(skin.targetId)).toBe(true);
        expect(isSkillVoiceId(skin.targetId)).toBe(false);
      }
    }
  });

  it("references only valid inner_* ids in doctrines and emphasis", () => {
    for (const mod of Object.values(PARLIAMENT_MODULES)) {
      for (const voiceId of Object.keys(mod.emphasis)) {
        expect(isInnerVoiceId(voiceId)).toBe(true);
      }
      for (const doctrine of mod.doctrines) {
        expect(isInnerVoiceId(doctrine.amplifies)).toBe(true);
        expect(isInnerVoiceId(doctrine.mutes)).toBe(true);
        expect(["x", "y", "approach"]).toContain(doctrine.axisShift.axis);
      }
    }
  });

  it("keeps each module's emphasis to a focused 1-2 loud factions", () => {
    for (const mod of Object.values(PARLIAMENT_MODULES)) {
      expect(Object.keys(mod.emphasis).length).toBeLessThanOrEqual(2);
    }
  });
});
