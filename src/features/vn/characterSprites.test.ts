import { describe, expect, it } from "vitest";
import {
  CASE01_CASEFILE_SPRITE_CHARACTER_IDS,
  CASE01_PRIMARY_SPRITE_CHARACTER_IDS,
  CASE01_VISIBLE_SPRITE_CHARACTER_IDS,
  CHARACTER_SPRITE_PLANS,
  ELEONORA_SPRITE_EMOTIONS,
  VN_SPRITE_EMOTIONS,
  getCharacterSpritePlan,
  getRequiredCharacterSpriteAssets,
  resolveCharacterSpriteLayerPath,
} from "./characterSprites";

describe("character sprite production catalog", () => {
  it("keeps the shared emotion enum stable and unique", () => {
    expect(new Set(VN_SPRITE_EMOTIONS).size).toBe(VN_SPRITE_EMOTIONS.length);
    expect(VN_SPRITE_EMOTIONS).toEqual([
      "neutral",
      "warm",
      "tense",
      "suspicious",
      "hurt",
      "commanding",
      "dangerous",
    ]);
  });

  it("registers the first Case 01 sprite batch", () => {
    expect(CHARACTER_SPRITE_PLANS.map((plan) => plan.characterId)).toEqual([
      ...CASE01_VISIBLE_SPRITE_CHARACTER_IDS,
    ]);

    for (const characterId of CASE01_VISIBLE_SPRITE_CHARACTER_IDS) {
      const plan = getCharacterSpritePlan(characterId);
      expect(plan).toBeDefined();
      expect(plan?.sourceFraming).toBe("full_body");
      expect(plan?.backgroundPolicy).toBe("transparent");
      expect(plan?.runtimeLayout).toBe("split");
      expect(plan?.styleFamily).toBe(
        "painterly_semi_realistic_european_gothic_vn",
      );
      expect(plan?.scalePresets).toEqual(["far", "normal", "focus", "close"]);
      expect(plan?.identity.forbiddenDrift.length).toBeGreaterThan(0);
      expect(plan?.promptBrief).toContain("Full-body layered VN sprite");
    }

    expect([...CASE01_PRIMARY_SPRITE_CHARACTER_IDS]).toEqual([
      "npc_mother_hartmann",
      "npc_weber_dispatcher",
      "npc_sasha_hartmann_servant",
      "npc_felix_hartmann",
      "detective",
      "npc_bureau_master",
    ]);
    expect([...CASE01_CASEFILE_SPRITE_CHARACTER_IDS]).toEqual([
      "npc_heinrich_galdermann",
      "npc_albrecht_stoll",
      "npc_emil_roth",
      "npc_krebs_mugger",
      "npc_anton_weber",
      "npc_rudi_kempf",
      "npc_konrad_vossler",
    ]);
  });

  it("keeps the Architect absent from the renderable sprite roster", () => {
    expect(getCharacterSpritePlan("npc_architect")).toBeNull();
    expect(
      CHARACTER_SPRITE_PLANS.map((plan) => plan.characterId),
    ).not.toContain("npc_architect");
  });

  it("gives Eleonora her Witch-specific emotion set", () => {
    const eleonora = getCharacterSpritePlan("npc_mother_hartmann");

    expect(eleonora?.requiredEmotions).toEqual([
      ...VN_SPRITE_EMOTIONS,
      ...ELEONORA_SPRITE_EMOTIONS,
    ]);
    expect(eleonora?.specialOverlays).toContain("hunger_flush");
    expect(eleonora?.identity.forbiddenDrift).toContain("open monster design");
  });

  it("uses layer templates for facial animation instead of full redraws", () => {
    const lotte = getCharacterSpritePlan("npc_weber_dispatcher");
    expect(lotte).toBeDefined();
    if (!lotte) return;

    expect(resolveCharacterSpriteLayerPath(lotte, "body_base")).toBe(
      "/images/characters/sprites/lotte_weber/body/body_base.png",
    );
    expect(resolveCharacterSpriteLayerPath(lotte, "eyes", "warm")).toBe(
      "/images/characters/sprites/lotte_weber/face/eyes/warm.png",
    );
    expect(resolveCharacterSpriteLayerPath(lotte, "mouth", "suspicious")).toBe(
      "/images/characters/sprites/lotte_weber/face/mouth/suspicious.png",
    );
  });

  it("expands required sprite assets deterministically", () => {
    const sasha = getCharacterSpritePlan("npc_sasha_hartmann_servant");
    expect(sasha).toBeDefined();
    if (!sasha) return;

    const assets = getRequiredCharacterSpriteAssets(sasha);
    expect(assets[0]).toMatchObject({
      characterId: "npc_sasha_hartmann_servant",
      layerKind: "body_base",
      runtimePath:
        "/images/characters/sprites/sasha_hartmann_servant/body/body_base.png",
    });
    expect(
      assets.some(
        (asset) =>
          asset.layerKind === "overlay" && asset.overlay === "wrapped_hand",
      ),
    ).toBe(true);
    expect(new Set(assets.map((asset) => asset.runtimePath)).size).toBe(
      assets.length,
    );
  });

  it("models Galdermann and Stoll as distinct crime functions", () => {
    const galdermann = getCharacterSpritePlan("npc_heinrich_galdermann");
    const stoll = getCharacterSpritePlan("npc_albrecht_stoll");

    expect(galdermann?.identity.anchors).toContain(
      "crime through signatures, not tools",
    );
    expect(galdermann?.identity.forbiddenDrift).toContain("street thief");
    expect(stoll?.identity.anchors).toContain("discipline as danger");
    expect(stoll?.identity.forbiddenDrift).toContain(
      "generic soldier in parade uniform",
    );
  });
});
