import { describe, expect, it } from "vitest";
import { CASE_01_POINTS } from "./data/case_01_points";
import {
  UNIVERSITY_NEOGOTHIC_PILOT_LOCATION_IDS,
  buildCase01CharacterSpriteManifest,
  buildCase01CharacterSpriteMissingReport,
  buildCase01VisualManifest,
  buildCase01VisualScaffoldOutput,
  buildCase01VisualVariants,
  buildCase01VnSceneBackgroundManifest,
  buildCase01VnSceneBackgroundMissingReport,
  resolveCase01RuntimeDistrict,
  resolveCase01VisualArchetype,
} from "./data/freiburg_visual_assets";

describe("freiburg visual asset scaffold", () => {
  it("resolves every Case 01 point to one runtime district and one visual archetype", () => {
    const manifest = buildCase01VisualManifest();

    expect(manifest).toHaveLength(CASE_01_POINTS.length);

    for (const point of CASE_01_POINTS) {
      const entry = manifest.find(
        (candidate) => candidate.locationId === point.locationId,
      );

      expect(entry).toBeDefined();
      expect(entry?.districtId).toBe(
        resolveCase01RuntimeDistrict(point.locationId),
      );
      expect(entry?.visualArchetype).toBe(
        resolveCase01VisualArchetype(point.locationId),
      );
    }
  });

  it("pins loc_hbf to rail_hub runtime and industrial_rail visuals", () => {
    expect(resolveCase01RuntimeDistrict("loc_hbf")).toBe("rail_hub");
    expect(resolveCase01VisualArchetype("loc_hbf")).toBe("industrial_rail");
  });

  it("marks loc_freiburg_estate as estate_noble and assigns a dedicated target basename", () => {
    const variants = buildCase01VisualVariants(buildCase01VisualManifest());
    const estateDefault = variants.find(
      (variant) =>
        variant.locationId === "loc_freiburg_estate" &&
        variant.variantId === "default",
    );

    expect(estateDefault?.visualArchetype).toBe("estate_noble");
    expect(estateDefault?.expectedBasename).toBe("loc_freiburg_estate");
    expect(estateDefault?.runtimeImagePath).toBe(
      "/images/locations/loc_student_house/loc_student_house.webp",
    );
    expect(estateDefault?.expectedImagePath).toContain(
      "images/locations/loc_freiburg_estate.webp",
    );
  });

  it("stays deterministic across repeated builds", () => {
    const first = buildCase01VisualScaffoldOutput();
    const second = buildCase01VisualScaffoldOutput();

    expect(second).toEqual(first);
  });

  it("keeps variant identity unique across locationId, variantId, and assetKind", () => {
    const variants = buildCase01VisualVariants(buildCase01VisualManifest());
    const identitySet = new Set(
      variants.map(
        (variant) =>
          `${variant.locationId}::${variant.variantId}::${variant.assetKind}`,
      ),
    );

    expect(identitySet.size).toBe(variants.length);
  });

  it("preserves runtime compatibility by leaving current map points image-backed", () => {
    expect(
      CASE_01_POINTS.every((point) => typeof point.image === "string"),
    ).toBe(true);
    expect(buildCase01VisualScaffoldOutput().parity.errors).toEqual([]);
  });

  it("keeps the university pilot on one shared visual family and master ref", () => {
    const manifest = buildCase01VisualManifest();
    const pilotEntries = UNIVERSITY_NEOGOTHIC_PILOT_LOCATION_IDS.map(
      (locationId) => manifest.find((entry) => entry.locationId === locationId),
    );

    expect(
      pilotEntries.every(
        (entry) => entry?.visualArchetype === "university_neogothic",
      ),
    ).toBe(true);
    expect(new Set(pilotEntries.map((entry) => entry?.masterRefId)).size).toBe(
      1,
    );
  });

  it("carries the bank investigation visual story into asset prompts", () => {
    const variants = buildCase01VisualVariants(buildCase01VisualManifest());
    const bankInvestigation = variants.find(
      (variant) =>
        variant.locationId === "loc_freiburg_bank" &&
        variant.variantId === "investigation",
    );
    const bankCrimeScene = variants.find(
      (variant) =>
        variant.locationId === "loc_freiburg_bank" &&
        variant.variantId === "crime_scene",
    );

    expect(bankInvestigation?.localVisualBrief?.summary).toContain(
      "postal lead",
    );
    expect(bankInvestigation?.localVisualBrief?.mustInclude).toContain(
      "closed postal car parked awkwardly near the entrance",
    );
    expect(bankInvestigation?.localVisualBrief?.mustAvoid).toContain(
      "opaque green gas cloud",
    );
    expect(bankInvestigation?.localVisualBrief?.mustAvoid).toContain(
      "visible clerks, witnesses, police officers, or character silhouettes",
    );
    expect(bankCrimeScene?.localVisualBrief?.continuityMotifs).toContain(
      "black-yellow postal twine",
    );
    expect(bankInvestigation?.promptSlots.s1).toBe(
      "Oil painting, broad expressive brushstrokes, visible canvas texture",
    );
    expect(bankInvestigation?.finalPrompt).toContain(
      "Masterpiece quality, Avoid: plastic textures",
    );
    expect(bankInvestigation?.finalPrompt).toContain(
      "Empty exterior scene, no people visible",
    );
  });

  it("scaffolds Witch-prologue VN scene backgrounds with structured art briefs", () => {
    const manifest = buildCase01VnSceneBackgroundManifest();

    expect(manifest.map((entry) => entry.expectedBasename)).toEqual([
      "bg_case01_baroness_study",
      "bg_case01_estate_approach",
      "bg_case01_estate_gates",
      "bg_case01_estate_vaults",
      "bg_case01_ghost_cellar",
      "bg_case01_hotel_bedroom",
      "bg_case01_night_alley",
    ]);
    expect(new Set(manifest.map((entry) => entry.sceneBackgroundId)).size).toBe(
      manifest.length,
    );

    for (const entry of manifest) {
      expect(entry.assetKind).toBe("vn_scene_background");
      expect(entry.expectedImagePath).toBe(
        `public/images/scenes/case01/${entry.expectedBasename}.webp`,
      );
      expect(entry.expectedMetaPath).toBe(
        `public/images/scenes/case01/${entry.expectedBasename}.meta.json`,
      );
      expect(entry.finalPrompt).toContain(
        "Oil painting, broad expressive brushstrokes",
      );
      expect(entry.finalPrompt).toContain("1905 Kaiser-era Germany");
      expect(entry.finalPrompt).toContain("Wide establishing shot");
      expect(entry.finalPrompt).toContain("no people visible");
      expect(entry.finalPrompt).toContain("Tone target:");
      expect(entry.finalPrompt).toContain("Style reference image:");
      expect(entry.finalPromptSha256).toMatch(/^[a-f0-9]{64}$/);
    }

    const ghostCellar = manifest.find(
      (entry) => entry.expectedBasename === "bg_case01_ghost_cellar",
    );
    expect(ghostCellar?.localVisualBrief.toneTarget).toBe("ambiguous_occult");
    expect(ghostCellar?.localVisualBrief.mustAvoid).toContain(
      "literal ghost figure",
    );
    expect(ghostCellar?.finalPrompt).toContain(
      "without confirming a literal supernatural figure",
    );
  });

  it("reports missing and stale VN scene background artifacts", () => {
    const [entry] = buildCase01VnSceneBackgroundManifest();

    expect(
      buildCase01VnSceneBackgroundMissingReport([entry], {
        existsSync: () => false,
        readFileSync: () => "",
      })[0]?.issues,
    ).toEqual(["missing_expected_image", "missing_expected_meta"]);

    expect(
      buildCase01VnSceneBackgroundMissingReport([entry], {
        existsSync: () => true,
        readFileSync: () =>
          JSON.stringify({
            finalPrompt: "stale",
            finalPromptSha256: "stale",
            toneTarget: "shadow_layer",
            styleReferenceImage: "/images/scenes/case01/stale.webp",
          }),
      })[0]?.issues,
    ).toEqual([
      "stale_expected_meta_prompt",
      "stale_expected_meta_prompt_hash",
      "stale_expected_meta_tone_target",
      "stale_expected_meta_style_reference",
    ]);
  });

  it("scaffolds the first full-body layered character sprite batch", () => {
    const manifest = buildCase01CharacterSpriteManifest();

    expect(manifest.map((entry) => entry.characterId)).toEqual([
      "detective",
      "npc_albrecht_stoll",
      "npc_anton_weber",
      "npc_bureau_master",
      "npc_emil_roth",
      "npc_felix_hartmann",
      "npc_heinrich_galdermann",
      "npc_konrad_vossler",
      "npc_krebs_mugger",
      "npc_mother_hartmann",
      "npc_rudi_kempf",
      "npc_sasha_hartmann_servant",
      "npc_weber_dispatcher",
    ]);

    for (const entry of manifest) {
      expect(entry.assetKind).toBe("character_sprite");
      expect(entry.runtimeLayout).toBe("split");
      expect(entry.sourceFraming).toBe("full_body");
      expect(entry.backgroundPolicy).toBe("transparent");
      expect(entry.expectedRootPath).toMatch(
        /^public\/images\/characters\/sprites\//,
      );
      expect(entry.expectedMetaPath).toBe(
        `${entry.expectedRootPath}/sprite.meta.json`,
      );
      expect(entry.layerTemplates.bodyBase).toMatch(/body\/body_base\.png$/);
      expect(entry.layerTemplates.eyesByEmotion).toContain("{emotion}");
      expect(entry.requiredEmotions).toContain("neutral");
      expect(entry.renderingRules).toContain(
        "Face rendering: clean readable faces with smooth tonal transitions and soft skin-plane color shifts; keep strong visible brush texture on clothing, hair, and outer silhouette rather than across facial features.",
      );
      expect(entry.promptBriefSha256).toMatch(/^[a-f0-9]{64}$/);
      expect(entry.identity.forbiddenDrift.length).toBeGreaterThan(0);
    }

    expect(
      manifest.find((entry) => entry.characterId === "npc_mother_hartmann")
        ?.requiredEmotions,
    ).toContain("hungry");
    expect(
      manifest.find((entry) => entry.characterId === "npc_weber_dispatcher")
        ?.portraitUrl,
    ).toBe("/Characters/lotte_weber_portrait.png");
  });

  it("reports missing character sprite layers and stale sprite metadata", () => {
    const [entry] = buildCase01CharacterSpriteManifest();
    const missing = buildCase01CharacterSpriteMissingReport(
      [entry],
      undefined,
      {
        existsSync: () => false,
        readFileSync: () => "",
      },
    );

    expect(
      missing.find((candidate) => candidate.layerKind === "manifest_meta"),
    ).toMatchObject({
      characterId: entry.characterId,
      issues: ["missing_sprite_meta"],
    });
    expect(
      missing.some(
        (candidate) =>
          candidate.layerKind === "body_base" &&
          candidate.issues.includes("missing_sprite_layer"),
      ),
    ).toBe(true);

    const stale = buildCase01CharacterSpriteMissingReport([entry], undefined, {
      existsSync: (absolutePath) => absolutePath.endsWith("sprite.meta.json"),
      readFileSync: () =>
        JSON.stringify({
          characterId: "wrong",
          promptBriefSha256: "stale",
        }),
    });
    expect(
      stale.find((candidate) => candidate.layerKind === "manifest_meta"),
    ).toMatchObject({
      characterId: entry.characterId,
      issues: [
        "stale_sprite_meta_character_id",
        "stale_sprite_meta_prompt_hash",
      ],
    });
  });
});
