import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { repoRoot } from "../content-authoring-contract";
import { CASE_01_POINTS, type Case01PointSource } from "./case_01_points";
import { GENERATED_STATIC_FREIBURG_CASE01_POINTS } from "../../src/features/map/data/generated-static-points";
import {
  CHARACTER_SPRITE_PLANS,
  getRequiredCharacterSpriteAssets,
  type CharacterSpriteLayerKind,
  type CharacterSpritePlan,
} from "../../src/features/vn/characterSprites";

export type FreiburgRuntimeDistrict =
  | "altstadt"
  | "wiehre"
  | "rail_hub"
  | "schneckenvorstadt"
  | "stuhlinger";

export type FreiburgVisualArchetype =
  | "civic_gothic"
  | "university_neogothic"
  | "industrial_rail"
  | "canal_tavern"
  | "estate_noble";

export type VisualAssetKind = "exterior" | "interior";
export type VisualStateId =
  | "default"
  | "investigation"
  | "memory"
  | "crime_scene";
export type VnSceneToneTarget =
  | "daily_surface+pressure_layer"
  | "pressure_layer"
  | "shadow_layer"
  | "ambiguous_occult"
  | "fail_forward_cost"
  | "daily_surface+earned_darkness";

export interface FreiburgVisualMasterRef {
  id: string;
  visualArchetype: FreiburgVisualArchetype;
  assetKind: "exterior";
  label: string;
  description: string;
}

export interface Case01VisualManifestEntry {
  locationId: string;
  districtId: FreiburgRuntimeDistrict;
  visualArchetype: FreiburgVisualArchetype;
  assetKind: "exterior";
  masterRefId: string;
  defaultVariantId: "default";
  interiorPresetId?: string;
  stateVariantIds?: VisualStateId[];
}

export interface Case01VisualVariantStub {
  locationId: string;
  districtId: FreiburgRuntimeDistrict;
  visualArchetype: FreiburgVisualArchetype;
  assetKind: "exterior";
  variantId: VisualStateId;
  masterRefId: string;
  interiorPresetId?: string;
  runtimeImagePath: string;
  runtimeImageSharedWithLocationIds: string[];
  expectedBasename: string;
  expectedImagePath: string;
  expectedMetaPath: string;
  promptSlots: {
    s1: string;
    s2: string;
    s3: string;
    s4: string;
    s5: string;
    s6: string;
    s7: string;
  };
  finalPrompt: string;
  localVisualBrief?: {
    summary: string;
    mustInclude: string[];
    continuityMotifs?: string[];
    mustAvoid?: string[];
    toneTarget?: VnSceneToneTarget;
    styleReferenceImage?: string;
  };
}

export interface Case01VisualMissingAssetEntry {
  locationId: string;
  variantId: VisualStateId;
  assetKind: "exterior";
  expectedImagePath: string;
  expectedMetaPath: string;
  runtimeImagePath: string;
  runtimeImageSharedWithLocationIds: string[];
  issues: string[];
}

export interface Case01VisualParityReport {
  authoringPointCount: number;
  generatedPointCount: number;
  errors: string[];
}

export interface Case01VisualScaffoldOutput {
  manifest: Case01VisualManifestEntry[];
  variants: Case01VisualVariantStub[];
  missing: Case01VisualMissingAssetEntry[];
  parity: Case01VisualParityReport;
}

export interface Case01VnSceneBackgroundDefinition {
  sceneBackgroundId: string;
  expectedBasename: string;
  visualArchetype: FreiburgVisualArchetype;
  visualState: VisualStateId;
  policySlot: keyof typeof VN_POLICY_S6_TEXT;
  localVisualBrief: NonNullable<Case01VisualVariantStub["localVisualBrief"]> & {
    toneTarget: VnSceneToneTarget;
    styleReferenceImage: string;
  };
}

export interface Case01VnSceneBackgroundManifestEntry
  extends Case01VnSceneBackgroundDefinition {
  assetKind: "vn_scene_background";
  expectedImagePath: string;
  expectedMetaPath: string;
  promptSlots: Case01VisualVariantStub["promptSlots"];
  finalPrompt: string;
  finalPromptSha256: string;
}

export interface Case01VnSceneBackgroundMissingEntry {
  sceneBackgroundId: string;
  assetKind: "vn_scene_background";
  expectedImagePath: string;
  expectedMetaPath: string;
  issues: string[];
}

export interface Case01CharacterSpriteManifestEntry {
  characterId: string;
  displayName: string;
  assetKind: "character_sprite";
  productionTier: CharacterSpritePlan["productionTier"];
  runtimeLayout: CharacterSpritePlan["runtimeLayout"];
  sourceFraming: CharacterSpritePlan["sourceFraming"];
  backgroundPolicy: CharacterSpritePlan["backgroundPolicy"];
  styleFamily: CharacterSpritePlan["styleFamily"];
  portraitUrl: string;
  sourcePortraitRefs: string[];
  expectedRootPath: string;
  expectedMetaPath: string;
  requiredEmotions: string[];
  optionalPoseVariants: string[];
  specialOverlays: string[];
  renderingRules: string[];
  layerTemplates: CharacterSpritePlan["layerTemplates"];
  identity: CharacterSpritePlan["identity"];
  promptBrief: string;
  promptBriefSha256: string;
}

export interface Case01CharacterSpriteMissingEntry {
  characterId: string;
  assetKind: "character_sprite";
  layerKind: CharacterSpriteLayerKind | "manifest_meta";
  emotion?: string;
  overlay?: string;
  expectedImagePath?: string;
  expectedMetaPath?: string;
  issues: string[];
}

export interface Case01VnSceneBackgroundFileProbe {
  existsSync: (absolutePath: string) => boolean;
  readFileSync: (absolutePath: string) => string;
}

export const VISUAL_OUTPUT_DIR = path.join(
  repoRoot,
  "content",
  "visual-assets",
);
export const VISUAL_MANIFEST_OUTPUT_PATH = path.join(
  VISUAL_OUTPUT_DIR,
  "freiburg-case01.visual-manifest.json",
);
export const VISUAL_VARIANTS_OUTPUT_PATH = path.join(
  VISUAL_OUTPUT_DIR,
  "freiburg-case01.visual-variants.json",
);
export const VISUAL_MISSING_OUTPUT_PATH = path.join(
  VISUAL_OUTPUT_DIR,
  "freiburg-case01.visual-missing.json",
);
export const VN_SCENE_BACKGROUND_MANIFEST_OUTPUT_PATH = path.join(
  VISUAL_OUTPUT_DIR,
  "freiburg-case01.vn-scene-bg.manifest.json",
);
export const VN_SCENE_BACKGROUND_MISSING_OUTPUT_PATH = path.join(
  VISUAL_OUTPUT_DIR,
  "freiburg-case01.vn-scene-bg.missing.json",
);
export const CHARACTER_SPRITE_MANIFEST_OUTPUT_PATH = path.join(
  VISUAL_OUTPUT_DIR,
  "freiburg-case01.character-sprites.manifest.json",
);
export const CHARACTER_SPRITE_MISSING_OUTPUT_PATH = path.join(
  VISUAL_OUTPUT_DIR,
  "freiburg-case01.character-sprites.missing.json",
);

export const UNIVERSITY_NEOGOTHIC_PILOT_LOCATION_IDS = [
  "loc_uni_chem",
  "loc_uni_med",
  "loc_student_house",
] as const;

export const VISUAL_ARCHETYPE_S3_PREFIX: Record<
  FreiburgVisualArchetype,
  string
> = {
  civic_gothic:
    "High-Gothic stone architecture, carved civic facades, narrow cobbled lanes, cathedral-scale massing, Freiburg 1905",
  university_neogothic:
    "Neo-Gothic academic brickwork, disciplined facades, scholarly courtyards, tall lecture windows, Freiburg 1905",
  industrial_rail:
    "Industrial ironwork, soot-dark brick, rail sheds, freight platforms, steam-grime infrastructure, Freiburg 1905",
  canal_tavern:
    "Timber-framed canal houses, damp plaster, waterside taverns, cramped service alleys, Freiburg 1905",
  estate_noble:
    "Noble villa architecture, private stone approach, wrought-iron gates, manicured grounds, aristocratic restraint, Freiburg 1905",
};

export const SARGENT_STYLE_S1_TEXT =
  "Oil painting, broad expressive brushstrokes, visible canvas texture";

export const KAISER_ERA_S2_TEXT =
  "1905 Kaiser-era Germany, historical veracity";

export const VN_BACKGROUND_S5_TEXT = "Wide establishing shot";

export const MASTERPIECE_S7_TEXT =
  "Masterpiece quality, Avoid: plastic textures, flat digital art, CGI rendering, 3D smooth faces, modern photography, neon colors, generic 21st-century fashion";

export const VISUAL_STATE_S4_TEXT: Record<VisualStateId, string> = {
  default:
    "natural diffused daylight, soft shadows, balanced tones, everyday investigative mood",
  investigation:
    "stark chiaroscuro, moody gaslit atmosphere, deep shadows, high contrast, flickering warm highlights",
  memory:
    "ethereal glow, soft atmospheric perspective, blurred edges, surreal gentle focus, memory-like haze",
  crime_scene:
    "harsh magnesium flash lighting, chaotic shadow spill, brittle evidence glare, police-line tension",
};

export const VN_POLICY_S6_TEXT = {
  exterior_empty:
    "Empty exterior scene, no people visible, wide establishing shot for map readability",
  exterior_aftermath:
    "Empty exterior aftermath, no people visible, environmental traces only, wide establishing shot",
  interior_dialogue:
    "Interior dialogue-ready scene, no people visible, sprite-safe composition, readable mid-ground depth",
  interior_memory:
    "Interior memory scene, no people visible, softened silhouettes of furniture only, sprite-safe composition",
} as const;

const TONE_TARGET_PROMPT_TEXT: Record<VnSceneToneTarget, string> = {
  "daily_surface+pressure_layer":
    "Tone target: daily surface with controlled pressure underneath; ordinary details carry unease without overt horror",
  pressure_layer:
    "Tone target: pressure layer; social order appears composed while one detail quietly refuses to settle",
  shadow_layer:
    "Tone target: shadow layer; practical architecture darkened by consequence, not theatrical horror",
  ambiguous_occult:
    "Tone target: ambiguous occult; show usable traces and physical unease without confirming a literal supernatural figure",
  fail_forward_cost:
    "Tone target: fail-forward cost; the space implies danger and consequence through traces, not visible violence",
  "daily_surface+earned_darkness":
    "Tone target: daily surface after earned darkness; morning normality has to hold evidence it cannot fully hide",
};

export const FREIBURG_VISUAL_MASTER_REFS: FreiburgVisualMasterRef[] = [
  {
    id: "master_civic_gothic_exterior",
    visualArchetype: "civic_gothic",
    assetKind: "exterior",
    label: "Civic Gothic Master Exterior",
    description:
      "Reference for Altstadt civic stonework, carved facades, and cathedral-adjacent massing.",
  },
  {
    id: "master_university_neogothic_exterior",
    visualArchetype: "university_neogothic",
    assetKind: "exterior",
    label: "University Neo-Gothic Master Exterior",
    description:
      "Reference for university brick rhythm, academic windows, and orderly scholarly frontage.",
  },
  {
    id: "master_industrial_rail_exterior",
    visualArchetype: "industrial_rail",
    assetKind: "exterior",
    label: "Industrial Rail Master Exterior",
    description:
      "Reference for Freiburg rail sheds, iron spans, grime, and warehouse masonry.",
  },
  {
    id: "master_canal_tavern_exterior",
    visualArchetype: "canal_tavern",
    assetKind: "exterior",
    label: "Canal Tavern Master Exterior",
    description:
      "Reference for Gerberau canalside humidity, tavern fronts, and timber-framed service streets.",
  },
  {
    id: "master_estate_noble_exterior",
    visualArchetype: "estate_noble",
    assetKind: "exterior",
    label: "Estate Noble Master Exterior",
    description:
      "Reference for private villas, noble restraint, and estate perimeter composition.",
  },
] as const;

const INTERIOR_PRESET_BY_ARCHETYPE: Record<FreiburgVisualArchetype, string> = {
  civic_gothic: "preset_civic_gothic_interior_dialogue",
  university_neogothic: "preset_university_neogothic_interior_dialogue",
  industrial_rail: "preset_industrial_rail_interior_dialogue",
  canal_tavern: "preset_canal_tavern_interior_dialogue",
  estate_noble: "preset_estate_noble_interior_dialogue",
};

const MASTER_REF_ID_BY_ARCHETYPE: Record<FreiburgVisualArchetype, string> = {
  civic_gothic: "master_civic_gothic_exterior",
  university_neogothic: "master_university_neogothic_exterior",
  industrial_rail: "master_industrial_rail_exterior",
  canal_tavern: "master_canal_tavern_exterior",
  estate_noble: "master_estate_noble_exterior",
};

const DISTRICT_TO_VISUAL_ARCHETYPE: Record<
  FreiburgRuntimeDistrict,
  FreiburgVisualArchetype
> = {
  altstadt: "civic_gothic",
  wiehre: "university_neogothic",
  rail_hub: "industrial_rail",
  schneckenvorstadt: "canal_tavern",
  stuhlinger: "industrial_rail",
};

const RUNTIME_DISTRICT_BY_LOCATION_ID: Record<string, FreiburgRuntimeDistrict> =
  {
    loc_agency: "altstadt",
    loc_hbf: "rail_hub",
    loc_freiburg_bank: "altstadt",
    loc_rathaus: "altstadt",
    loc_munster: "altstadt",
    loc_uni_chem: "wiehre",
    loc_uni_med: "wiehre",
    loc_student_house: "wiehre",
    loc_pub_deutsche: "schneckenvorstadt",
    loc_red_light: "schneckenvorstadt",
    loc_freiburg_warehouse: "stuhlinger",
    loc_freiburg_estate: "wiehre",
    loc_workers_pub: "stuhlinger",
    loc_martinstor: "altstadt",
    loc_schwabentor: "altstadt",
    loc_tailor: "altstadt",
    loc_apothecary: "altstadt",
    loc_pub: "schneckenvorstadt",
    loc_telephone: "altstadt",
  };

const VISUAL_ARCHETYPE_OVERRIDE_BY_LOCATION_ID: Partial<
  Record<string, FreiburgVisualArchetype>
> = {
  loc_freiburg_estate: "estate_noble",
};

const LOCATION_STATE_VARIANTS: Partial<Record<string, VisualStateId[]>> = {
  loc_hbf: ["investigation"],
  loc_freiburg_bank: ["investigation", "crime_scene"],
  loc_rathaus: ["investigation"],
  loc_uni_chem: ["investigation"],
  loc_uni_med: ["investigation"],
  loc_student_house: ["investigation"],
  loc_red_light: ["investigation"],
  loc_freiburg_warehouse: ["investigation"],
  loc_freiburg_estate: ["investigation", "memory"],
  loc_workers_pub: ["investigation"],
  loc_tailor: ["investigation"],
  loc_apothecary: ["investigation"],
  loc_pub: ["investigation"],
};

const LOCAL_VISUAL_BRIEF_BY_LOCATION_VARIANT: Partial<
  Record<
    `${string}:${VisualStateId}`,
    NonNullable<Case01VisualVariantStub["localVisualBrief"]>
  >
> = {
  "loc_freiburg_bank:default": {
    summary:
      "Bankhaus J.A. Krebs on Freiburg Muensterplatz before the story visibly breaks: prestige first, unease only in composition.",
    mustInclude: [
      "baroque banking facade integrated with Freiburg civic stonework",
      "brass signage for Bankhaus J.A. Krebs",
      "wide readable exterior framing suitable for map use",
    ],
    continuityMotifs: ["polished brass", "black-yellow postal twine"],
  },
  "loc_freiburg_bank:investigation": {
    summary:
      "Daylight aftermath at the bank threshold: the postal lead is real but bent out of shape.",
    mustInclude: [
      "closed postal car parked awkwardly near the entrance",
      "rear postal car door not fully latched",
      "torn route slip or loose postal manifest on the step",
      "faint haze visible only in sunbeams through the lobby doors",
      "wet cloths abandoned on mahogany benches, yellowed evidence stains visible as environmental traces",
    ],
    continuityMotifs: [
      "black-yellow postal twine",
      "brass and marble prestige undercut by chemical residue",
    ],
    mustAvoid: [
      "opaque green gas cloud",
      "heroic action pose",
      "crowded scene that blocks the bank entrance",
      "visible clerks, witnesses, police officers, or character silhouettes",
    ],
  },
  "loc_freiburg_bank:crime_scene": {
    summary:
      "Exterior crime-scene variant for the staged raid: the bank is dignified, but the evidence is not.",
    mustInclude: [
      "postal car inspection traces without visible investigators",
      "scraped wheel mark or mud mismatch near the curb",
      "small evidence tag near black-yellow postal twine",
      "slightly opened lobby doors with dim marble interior beyond",
    ],
    continuityMotifs: [
      "black-yellow postal twine",
      "official order performing calm over physical disorder",
    ],
    mustAvoid: ["gas mask on public display", "obvious villain silhouette"],
  },
  "loc_apothecary:investigation": {
    summary:
      "Kiliani's apothecary as controlled order under pressure: perfect labels, one cleaned absence.",
    mustInclude: [
      "pharmacy window or threshold with immaculate labeled jars",
      "raw chemical stock implied through magnesium and sulfur labels",
      "one shelf or counter patch wiped too clean",
      "warm amber glass against cold civic stone outside",
    ],
    continuityMotifs: ["powder traces", "careful handwriting", "chemical order"],
    mustAvoid: ["mad-scientist clutter", "explosion imagery"],
  },
};

const renderLocalVisualBrief = (
  brief: Case01VisualVariantStub["localVisualBrief"],
): string[] => {
  if (!brief) {
    return [];
  }

  const parts = [
    brief.summary,
    `Must include: ${brief.mustInclude.join("; ")}`,
  ];
  if (brief.continuityMotifs && brief.continuityMotifs.length > 0) {
    parts.push(`Continuity motifs: ${brief.continuityMotifs.join("; ")}`);
  }
  if (brief.mustAvoid && brief.mustAvoid.length > 0) {
    parts.push(`Avoid locally: ${brief.mustAvoid.join("; ")}`);
  }
  if (brief.toneTarget) {
    parts.push(TONE_TARGET_PROMPT_TEXT[brief.toneTarget]);
  }
  if (brief.styleReferenceImage) {
    parts.push(`Style reference image: ${brief.styleReferenceImage}`);
  }

  return parts;
};

const buildFinalPrompt = (
  promptSlots: Case01VisualVariantStub["promptSlots"],
  localVisualBrief: Case01VisualVariantStub["localVisualBrief"],
): string =>
  [
    promptSlots.s1,
    promptSlots.s2,
    promptSlots.s3,
    ...renderLocalVisualBrief(localVisualBrief),
    promptSlots.s4,
    promptSlots.s5,
    promptSlots.s6,
    promptSlots.s7,
    "16:9 aspect ratio, high resolution",
  ].join(", ");

const resolveLocalVisualBrief = (
  locationId: string,
  variantId: VisualStateId,
): Case01VisualVariantStub["localVisualBrief"] =>
  LOCAL_VISUAL_BRIEF_BY_LOCATION_VARIANT[`${locationId}:${variantId}`];

const locationIdsFromPoints = (
  points: readonly Case01PointSource[],
): string[] =>
  [...points]
    .map((point) => point.locationId)
    .sort((left, right) => left.localeCompare(right));

const toRepoRelativePath = (absolutePath: string): string =>
  path.relative(repoRoot, absolutePath).replaceAll("\\", "/");

const runtimeAssetPathToRepoRelativePath = (runtimePath: string): string =>
  runtimePath.startsWith("/")
    ? `public${runtimePath}`
    : `public/${runtimePath}`;

const sha256 = (value: string): string =>
  createHash("sha256").update(value, "utf8").digest("hex");

const getRuntimeImageBasename = (imagePath: string): string =>
  path.basename(imagePath, path.extname(imagePath));

const getRuntimeImageExtension = (imagePath: string): string =>
  path.extname(imagePath) || ".webp";

const sortStates = (states: readonly VisualStateId[]): VisualStateId[] => {
  const order: Record<VisualStateId, number> = {
    default: 0,
    investigation: 1,
    memory: 2,
    crime_scene: 3,
  };
  return [...states].sort((left, right) => order[left] - order[right]);
};

const countRuntimeImageReuse = (
  points: readonly Case01PointSource[],
): ReadonlyMap<string, string[]> => {
  const grouped = new Map<string, string[]>();
  for (const point of points) {
    const current = grouped.get(point.image ?? "") ?? [];
    current.push(point.locationId);
    grouped.set(point.image ?? "", current);
  }

  for (const values of grouped.values()) {
    values.sort((left, right) => left.localeCompare(right));
  }

  return grouped;
};

export const resolveCase01RuntimeDistrict = (
  locationId: string,
): FreiburgRuntimeDistrict => {
  const districtId = RUNTIME_DISTRICT_BY_LOCATION_ID[locationId];
  if (!districtId) {
    throw new Error(
      `Missing runtime district mapping for Freiburg location '${locationId}'.`,
    );
  }
  return districtId;
};

export const resolveCase01VisualArchetype = (
  locationId: string,
): FreiburgVisualArchetype => {
  const override = VISUAL_ARCHETYPE_OVERRIDE_BY_LOCATION_ID[locationId];
  if (override) {
    return override;
  }
  const districtId = resolveCase01RuntimeDistrict(locationId);
  return DISTRICT_TO_VISUAL_ARCHETYPE[districtId];
};

export const compareCase01AuthoringAndGeneratedPoints = (
  authoringPoints: readonly Case01PointSource[] = CASE_01_POINTS,
  generatedPoints = GENERATED_STATIC_FREIBURG_CASE01_POINTS,
): Case01VisualParityReport => {
  const errors: string[] = [];
  const authoringByLocationId = new Map(
    authoringPoints.map((point) => [point.locationId, point]),
  );
  const generatedByLocationId = new Map(
    generatedPoints.map((point) => [point.locationId, point]),
  );

  for (const locationId of locationIdsFromPoints(authoringPoints)) {
    const authoring = authoringByLocationId.get(locationId);
    const generated = generatedByLocationId.get(locationId);

    if (!authoring) {
      continue;
    }

    if (!generated) {
      errors.push(`Generated map snapshot is missing '${locationId}'.`);
      continue;
    }

    if (authoring.id !== generated.id) {
      errors.push(
        `Point id mismatch for '${locationId}': authoring='${authoring.id}', generated='${generated.id}'.`,
      );
    }

    if ((authoring.image ?? "") !== (generated.image ?? "")) {
      errors.push(
        `Image mismatch for '${locationId}': authoring='${authoring.image}', generated='${generated.image}'.`,
      );
    }

    if (authoring.title !== generated.title) {
      errors.push(
        `Title mismatch for '${locationId}': authoring='${authoring.title}', generated='${generated.title}'.`,
      );
    }
  }

  for (const locationId of generatedByLocationId.keys()) {
    if (!authoringByLocationId.has(locationId)) {
      errors.push(`Generated map snapshot has extra location '${locationId}'.`);
    }
  }

  return {
    authoringPointCount: authoringPoints.length,
    generatedPointCount: generatedPoints.length,
    errors,
  };
};

export const buildCase01VisualManifest = (
  points: readonly Case01PointSource[] = CASE_01_POINTS,
): Case01VisualManifestEntry[] =>
  [...points]
    .map((point): Case01VisualManifestEntry => {
      const districtId = resolveCase01RuntimeDistrict(point.locationId);
      const visualArchetype = resolveCase01VisualArchetype(point.locationId);
      const stateVariantIds = LOCATION_STATE_VARIANTS[point.locationId];

      return {
        locationId: point.locationId,
        districtId,
        visualArchetype,
        assetKind: "exterior",
        masterRefId: MASTER_REF_ID_BY_ARCHETYPE[visualArchetype],
        defaultVariantId: "default",
        interiorPresetId: INTERIOR_PRESET_BY_ARCHETYPE[visualArchetype],
        ...(stateVariantIds && stateVariantIds.length > 0
          ? { stateVariantIds: sortStates(stateVariantIds) }
          : {}),
      };
    })
    .sort((left, right) => left.locationId.localeCompare(right.locationId));

export const buildCase01VisualVariants = (
  manifest: readonly Case01VisualManifestEntry[],
  points: readonly Case01PointSource[] = CASE_01_POINTS,
): Case01VisualVariantStub[] => {
  const pointByLocationId = new Map(
    points.map((point) => [point.locationId, point]),
  );
  const runtimeImageReuse = countRuntimeImageReuse(points);

  return manifest
    .flatMap((entry) => {
      const point = pointByLocationId.get(entry.locationId);
      if (!point?.image) {
        throw new Error(
          `Location '${entry.locationId}' is missing a runtime image path.`,
        );
      }
      const runtimeImagePath = point.image;

      const sharedLocationIds = runtimeImageReuse.get(runtimeImagePath) ?? [];
      const runtimeBasename = getRuntimeImageBasename(runtimeImagePath);
      const runtimeExtension = getRuntimeImageExtension(runtimeImagePath);
      const defaultBasename =
        sharedLocationIds.length > 1 ? entry.locationId : runtimeBasename;

      const variantIds = sortStates([
        "default",
        ...(entry.stateVariantIds ?? []),
      ]);

      return variantIds.map((variantId) => {
        const expectedBasename =
          variantId === "default"
            ? defaultBasename
            : `${defaultBasename}--${variantId}`;
        const expectedImagePath = toRepoRelativePath(
          path.join(
            repoRoot,
            "public",
            "images",
            "locations",
            `${expectedBasename}${runtimeExtension}`,
          ),
        );
        const expectedMetaPath = toRepoRelativePath(
          path.join(
            repoRoot,
            "public",
            "images",
            "locations",
            `${expectedBasename}.meta.json`,
          ),
        );
        const s6Template =
          variantId === "crime_scene"
            ? VN_POLICY_S6_TEXT.exterior_aftermath
            : VN_POLICY_S6_TEXT.exterior_empty;

        const localVisualBrief = resolveLocalVisualBrief(
          entry.locationId,
          variantId,
        );
        const promptSlots = {
          s1: SARGENT_STYLE_S1_TEXT,
          s2: KAISER_ERA_S2_TEXT,
          s3: VISUAL_ARCHETYPE_S3_PREFIX[entry.visualArchetype],
          s4: VISUAL_STATE_S4_TEXT[variantId],
          s5: VN_BACKGROUND_S5_TEXT,
          s6: s6Template,
          s7: MASTERPIECE_S7_TEXT,
        };

        return {
          locationId: entry.locationId,
          districtId: entry.districtId,
          visualArchetype: entry.visualArchetype,
          assetKind: entry.assetKind,
          variantId,
          masterRefId: entry.masterRefId,
          interiorPresetId: entry.interiorPresetId,
          runtimeImagePath,
          runtimeImageSharedWithLocationIds: sharedLocationIds,
          expectedBasename,
          expectedImagePath,
          expectedMetaPath,
          promptSlots,
          finalPrompt: buildFinalPrompt(promptSlots, localVisualBrief),
          ...(localVisualBrief ? { localVisualBrief } : {}),
        };
      });
    })
    .sort((left, right) => {
      const locationOrder = left.locationId.localeCompare(right.locationId);
      if (locationOrder !== 0) {
        return locationOrder;
      }
      return left.variantId.localeCompare(right.variantId);
    });
};

export const buildCase01MissingAssetReport = (
  variants: readonly Case01VisualVariantStub[],
): Case01VisualMissingAssetEntry[] =>
  variants
    .map((variant) => {
      const expectedImageAbsolutePath = path.join(
        repoRoot,
        variant.expectedImagePath,
      );
      const expectedMetaAbsolutePath = path.join(
        repoRoot,
        variant.expectedMetaPath,
      );
      const issues: string[] = [];

      if (!existsSync(expectedImageAbsolutePath)) {
        issues.push("missing_expected_image");
      }
      if (!existsSync(expectedMetaAbsolutePath)) {
        issues.push("missing_expected_meta");
      }
      if (
        variant.variantId === "default" &&
        variant.runtimeImageSharedWithLocationIds.length > 1
      ) {
        issues.push("runtime_reuses_shared_image");
      }

      return {
        locationId: variant.locationId,
        variantId: variant.variantId,
        assetKind: variant.assetKind,
        expectedImagePath: variant.expectedImagePath,
        expectedMetaPath: variant.expectedMetaPath,
        runtimeImagePath: variant.runtimeImagePath,
        runtimeImageSharedWithLocationIds:
          variant.runtimeImageSharedWithLocationIds,
        issues,
      };
    })
    .filter((entry) => entry.issues.length > 0)
    .sort((left, right) => {
      const locationOrder = left.locationId.localeCompare(right.locationId);
      if (locationOrder !== 0) {
        return locationOrder;
      }
      return left.variantId.localeCompare(right.variantId);
    });

export const buildCase01VisualScaffoldOutput = (
  points: readonly Case01PointSource[] = CASE_01_POINTS,
  generatedPoints = GENERATED_STATIC_FREIBURG_CASE01_POINTS,
): Case01VisualScaffoldOutput => {
  const parity = compareCase01AuthoringAndGeneratedPoints(
    points,
    generatedPoints,
  );
  const manifest = buildCase01VisualManifest(points);
  const variants = buildCase01VisualVariants(manifest, points);
  const missing = buildCase01MissingAssetReport(variants);

  return {
    manifest,
    variants,
    missing,
    parity,
  };
};

export const CASE01_VN_SCENE_BACKGROUND_DEFINITIONS: readonly Case01VnSceneBackgroundDefinition[] =
  [
    {
      sceneBackgroundId: "case01_vn_bg_estate_approach",
      expectedBasename: "bg_case01_estate_approach",
      visualArchetype: "estate_noble",
      visualState: "default",
      policySlot: "exterior_empty",
      localVisualBrief: {
        summary:
          "Road from Freiburg toward the estate, with city pressure receding before the house takes over.",
        mustInclude: [
          "damp carriage road",
          "distant iron gate",
          "linden silhouettes",
          "low evening mist",
          "no figures",
        ],
        continuityMotifs: ["linden silhouettes", "low evening mist"],
        mustAvoid: [
          "heroic mansion reveal",
          "modern road",
          "readable signs",
        ],
        toneTarget: "daily_surface+pressure_layer",
        styleReferenceImage:
          "/images/scenes/case01/bg_case01_convergence_city_threshold.webp",
      },
    },
    {
      sceneBackgroundId: "case01_vn_bg_estate_gates",
      expectedBasename: "bg_case01_estate_gates",
      visualArchetype: "estate_noble",
      visualState: "investigation",
      policySlot: "exterior_empty",
      localVisualBrief: {
        summary:
          "Grand Estate gates at first arrival: aristocratic order, partly open, already watching.",
        mustInclude: [
          "wrought iron estate gates partly open",
          "linden alley",
          "warm window-light far beyond",
          "controlled aristocratic order",
        ],
        continuityMotifs: [
          "wrought iron",
          "linden alley",
          "warm distant windows",
        ],
        mustAvoid: ["castle-horror", "ritual candles", "people"],
        toneTarget: "pressure_layer",
        styleReferenceImage:
          "/images/scenes/case01/bg_case01_estate_bureau.webp",
      },
    },
    {
      sceneBackgroundId: "case01_vn_bg_baroness_study",
      expectedBasename: "bg_case01_baroness_study",
      visualArchetype: "estate_noble",
      visualState: "investigation",
      policySlot: "interior_dialogue",
      localVisualBrief: {
        summary:
          "Baroness's private study at composed-surface tier: official correspondence immaculate on top, one drawer not fully closed.",
        mustInclude: [
          "wax-sealed correspondence stacked by date",
          "tarnished silver letter-opener where polish stopped mid-handle",
          "one drawer not fully closed; ledger spine visible inside",
          "afternoon light filtered through heavy velvet curtains",
          "tea set with cooled cup, one biscuit untouched",
        ],
        continuityMotifs: [
          "tarnished-silver-where-polish-stopped",
          "wax-sealed correspondence",
          "afternoon velvet light",
        ],
        mustAvoid: [
          "any human figure or silhouette",
          "modern fashion or furniture",
          "obvious gothic horror imagery",
          "literal blood, candles arranged ritually, pentagrams",
        ],
        toneTarget: "pressure_layer",
        styleReferenceImage:
          "/images/scenes/case01/bg_case01_rathaus_office_pressure.webp",
      },
    },
    {
      sceneBackgroundId: "case01_vn_bg_estate_vaults",
      expectedBasename: "bg_case01_estate_vaults",
      visualArchetype: "estate_noble",
      visualState: "investigation",
      policySlot: "interior_dialogue",
      localVisualBrief: {
        summary:
          "Stone estate vaults as servant-work infrastructure under cold pressure, not a warehouse.",
        mustInclude: [
          "stone vaulted cellars",
          "lime-stained frost",
          "service shelves",
          "tarnished lantern",
          "rat traces in the corner",
        ],
        continuityMotifs: ["lime-stained frost", "service shelves", "rats"],
        mustAvoid: [
          "wet-timber warehouse look",
          "modern pipes",
          "gore",
          "visible servants or silhouettes",
        ],
        toneTarget: "shadow_layer",
        styleReferenceImage:
          "/images/scenes/case01/bg_case01_warehouse_wet_timber.webp",
      },
    },
    {
      sceneBackgroundId: "case01_vn_bg_ghost_cellar",
      expectedBasename: "bg_case01_ghost_cellar",
      visualArchetype: "estate_noble",
      visualState: "memory",
      policySlot: "interior_memory",
      localVisualBrief: {
        summary:
          "Deep service cellar where the spirit is legible by traces, absence, and temperature rather than apparition.",
        mustInclude: [
          "old service-corridor masonry, lime-stained brick",
          "brass strongbox latch on stone",
          "dust pattern around a missing object on shelf",
          "candle-burn marks on stone not from this season",
          "cold air visible only as faint condensation on iron pipe",
        ],
        continuityMotifs: [
          "brass strongbox",
          "dust pattern around absence",
          "out-of-season candle marks",
        ],
        mustAvoid: [
          "literal ghost figure",
          "supernatural glow, ectoplasm, fog effects",
          "skulls, ritual circles, occult symbols on surfaces",
        ],
        toneTarget: "ambiguous_occult",
        styleReferenceImage:
          "/images/scenes/case01/bg_case01_estate_vaults.webp",
      },
    },
    {
      sceneBackgroundId: "case01_vn_bg_night_alley",
      expectedBasename: "bg_case01_night_alley",
      visualArchetype: "canal_tavern",
      visualState: "crime_scene",
      policySlot: "exterior_aftermath",
      localVisualBrief: {
        summary:
          "Narrow Freiburg service alley after midnight, built for an attack without showing the attacker.",
        mustInclude: [
          "narrow Freiburg service alley",
          "wet cobbles",
          "single gas lamp",
          "side arch",
          "dropped metal glint",
          "fog held low",
        ],
        continuityMotifs: ["wet cobbles", "single gas lamp", "metal glint"],
        mustAvoid: [
          "Hollywood noir",
          "modern signage",
          "visible attacker",
          "readable gang text",
        ],
        toneTarget: "fail_forward_cost",
        styleReferenceImage:
          "/images/scenes/case01/bg_case01_rail_yard_night.webp",
      },
    },
    {
      sceneBackgroundId: "case01_vn_bg_hotel_bedroom",
      expectedBasename: "bg_case01_hotel_bedroom",
      visualArchetype: "canal_tavern",
      visualState: "default",
      policySlot: "interior_dialogue",
      localVisualBrief: {
        summary:
          "Zum Goldenen Adler bedroom in morning normality, holding the evidence the night left behind.",
        mustInclude: [
          "1905 hotel room",
          "white bed linens",
          "washstand",
          "travel trunk",
          "morning light",
          "folded dress with small dark stain",
        ],
        continuityMotifs: ["white linens", "washstand", "small dark stain"],
        mustAvoid: [
          "telephone",
          "alarm clock",
          "electric lamp",
          "lurid gore",
        ],
        toneTarget: "daily_surface+earned_darkness",
        styleReferenceImage:
          "/images/scenes/case01/bg_case01_zum_goldenen_adler_lobby.webp",
      },
    },
  ] as const;

const buildVnSceneBackgroundPromptSlots = (
  definition: Case01VnSceneBackgroundDefinition,
): Case01VisualVariantStub["promptSlots"] => ({
  s1: SARGENT_STYLE_S1_TEXT,
  s2: KAISER_ERA_S2_TEXT,
  s3: VISUAL_ARCHETYPE_S3_PREFIX[definition.visualArchetype],
  s4: VISUAL_STATE_S4_TEXT[definition.visualState],
  s5: VN_BACKGROUND_S5_TEXT,
  s6: VN_POLICY_S6_TEXT[definition.policySlot],
  s7: MASTERPIECE_S7_TEXT,
});

export const buildCase01VnSceneBackgroundManifest =
  (): Case01VnSceneBackgroundManifestEntry[] =>
    [...CASE01_VN_SCENE_BACKGROUND_DEFINITIONS]
      .map((definition): Case01VnSceneBackgroundManifestEntry => {
        const promptSlots = buildVnSceneBackgroundPromptSlots(definition);
        const finalPrompt = buildFinalPrompt(
          promptSlots,
          definition.localVisualBrief,
        );
        return {
          ...definition,
          assetKind: "vn_scene_background",
          expectedImagePath: toRepoRelativePath(
            path.join(
              repoRoot,
              "public",
              "images",
              "scenes",
              "case01",
              `${definition.expectedBasename}.webp`,
            ),
          ),
          expectedMetaPath: toRepoRelativePath(
            path.join(
              repoRoot,
              "public",
              "images",
              "scenes",
              "case01",
              `${definition.expectedBasename}.meta.json`,
            ),
          ),
          promptSlots,
          finalPrompt,
          finalPromptSha256: sha256(finalPrompt),
        };
      })
      .sort((left, right) =>
        left.sceneBackgroundId.localeCompare(right.sceneBackgroundId),
      );

const readJsonIfExists = (
  absolutePath: string,
  probe: Case01VnSceneBackgroundFileProbe,
): unknown => {
  try {
    return JSON.parse(probe.readFileSync(absolutePath));
  } catch {
    return null;
  }
};

export const buildCase01VnSceneBackgroundMissingReport = (
  manifest: readonly Case01VnSceneBackgroundManifestEntry[] =
    buildCase01VnSceneBackgroundManifest(),
  probe: Case01VnSceneBackgroundFileProbe = {
    existsSync,
    readFileSync: (absolutePath) => readFileSync(absolutePath, "utf8"),
  },
): Case01VnSceneBackgroundMissingEntry[] =>
  manifest
    .map((entry) => {
      const expectedImageAbsolutePath = path.join(
        repoRoot,
        entry.expectedImagePath,
      );
      const expectedMetaAbsolutePath = path.join(
        repoRoot,
        entry.expectedMetaPath,
      );
      const issues: string[] = [];

      if (!probe.existsSync(expectedImageAbsolutePath)) {
        issues.push("missing_expected_image");
      }
      if (!probe.existsSync(expectedMetaAbsolutePath)) {
        issues.push("missing_expected_meta");
      } else {
        const meta = readJsonIfExists(expectedMetaAbsolutePath, probe);
        const metaRecord =
          meta && typeof meta === "object"
            ? (meta as Record<string, unknown>)
            : {};
        if (metaRecord.finalPrompt !== entry.finalPrompt) {
          issues.push("stale_expected_meta_prompt");
        }
        if (metaRecord.finalPromptSha256 !== entry.finalPromptSha256) {
          issues.push("stale_expected_meta_prompt_hash");
        }
        if (metaRecord.toneTarget !== entry.localVisualBrief.toneTarget) {
          issues.push("stale_expected_meta_tone_target");
        }
        if (
          metaRecord.styleReferenceImage !==
          entry.localVisualBrief.styleReferenceImage
        ) {
          issues.push("stale_expected_meta_style_reference");
        }
      }

      return {
        sceneBackgroundId: entry.sceneBackgroundId,
        assetKind: entry.assetKind,
        expectedImagePath: entry.expectedImagePath,
        expectedMetaPath: entry.expectedMetaPath,
        issues,
      };
    })
    .filter((entry) => entry.issues.length > 0)
    .sort((left, right) =>
      left.sceneBackgroundId.localeCompare(right.sceneBackgroundId),
    );

export const buildCase01CharacterSpriteManifest =
  (): Case01CharacterSpriteManifestEntry[] =>
    [...CHARACTER_SPRITE_PLANS]
      .map((plan): Case01CharacterSpriteManifestEntry => ({
        characterId: plan.characterId,
        displayName: plan.displayName,
        assetKind: "character_sprite",
        productionTier: plan.productionTier,
        runtimeLayout: plan.runtimeLayout,
        sourceFraming: plan.sourceFraming,
        backgroundPolicy: plan.backgroundPolicy,
        styleFamily: plan.styleFamily,
        portraitUrl: plan.portraitUrl,
        sourcePortraitRefs: [...plan.sourcePortraitRefs],
        expectedRootPath: runtimeAssetPathToRepoRelativePath(
          plan.rootRuntimePath,
        ),
        expectedMetaPath: runtimeAssetPathToRepoRelativePath(
          `${plan.rootRuntimePath}/sprite.meta.json`,
        ),
        requiredEmotions: [...plan.requiredEmotions],
        optionalPoseVariants: [...plan.optionalPoseVariants],
        specialOverlays: [...plan.specialOverlays],
        renderingRules: [...plan.renderingRules],
        layerTemplates: plan.layerTemplates,
        identity: plan.identity,
        promptBrief: plan.promptBrief,
        promptBriefSha256: sha256(plan.promptBrief),
      }))
      .sort((left, right) => left.characterId.localeCompare(right.characterId));

export const buildCase01CharacterSpriteMissingReport = (
  manifest: readonly Case01CharacterSpriteManifestEntry[] =
    buildCase01CharacterSpriteManifest(),
  plans: readonly CharacterSpritePlan[] = CHARACTER_SPRITE_PLANS,
  probe: Case01VnSceneBackgroundFileProbe = {
    existsSync,
    readFileSync: (absolutePath) => readFileSync(absolutePath, "utf8"),
  },
): Case01CharacterSpriteMissingEntry[] => {
  const manifestByCharacterId = new Map(
    manifest.map((entry) => [entry.characterId, entry]),
  );

  return plans
    .flatMap((plan): Case01CharacterSpriteMissingEntry[] => {
      const manifestEntry = manifestByCharacterId.get(plan.characterId);
      const entries: Case01CharacterSpriteMissingEntry[] = [];

      if (!manifestEntry) {
        entries.push({
          characterId: plan.characterId,
          assetKind: "character_sprite",
          layerKind: "manifest_meta",
          issues: ["missing_manifest_entry"],
        });
        return entries;
      }

      const metaAbsolutePath = path.join(repoRoot, manifestEntry.expectedMetaPath);
      if (!probe.existsSync(metaAbsolutePath)) {
        entries.push({
          characterId: plan.characterId,
          assetKind: "character_sprite",
          layerKind: "manifest_meta",
          expectedMetaPath: manifestEntry.expectedMetaPath,
          issues: ["missing_sprite_meta"],
        });
      } else {
        const meta = readJsonIfExists(metaAbsolutePath, probe);
        const metaRecord =
          meta && typeof meta === "object"
            ? (meta as Record<string, unknown>)
            : {};
        const issues: string[] = [];
        if (metaRecord.characterId !== plan.characterId) {
          issues.push("stale_sprite_meta_character_id");
        }
        if (metaRecord.promptBriefSha256 !== manifestEntry.promptBriefSha256) {
          issues.push("stale_sprite_meta_prompt_hash");
        }
        if (issues.length > 0) {
          entries.push({
            characterId: plan.characterId,
            assetKind: "character_sprite",
            layerKind: "manifest_meta",
            expectedMetaPath: manifestEntry.expectedMetaPath,
            issues,
          });
        }
      }

      for (const asset of getRequiredCharacterSpriteAssets(plan)) {
        const expectedImagePath = runtimeAssetPathToRepoRelativePath(
          asset.runtimePath,
        );
        const expectedImageAbsolutePath = path.join(repoRoot, expectedImagePath);
        if (!probe.existsSync(expectedImageAbsolutePath)) {
          entries.push({
            characterId: plan.characterId,
            assetKind: "character_sprite",
            layerKind: asset.layerKind,
            ...(asset.emotion ? { emotion: asset.emotion } : {}),
            ...(asset.overlay ? { overlay: asset.overlay } : {}),
            expectedImagePath,
            issues: ["missing_sprite_layer"],
          });
        }
      }

      return entries;
    })
    .sort((left, right) => {
      const characterOrder = left.characterId.localeCompare(right.characterId);
      if (characterOrder !== 0) {
        return characterOrder;
      }
      const layerOrder = left.layerKind.localeCompare(right.layerKind);
      if (layerOrder !== 0) {
        return layerOrder;
      }
      return (left.emotion ?? left.overlay ?? "").localeCompare(
        right.emotion ?? right.overlay ?? "",
      );
    });
};
