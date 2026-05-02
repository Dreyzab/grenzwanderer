import { existsSync } from "node:fs";
import path from "node:path";
import { repoRoot } from "../content-authoring-contract";
import { CASE_01_POINTS, type Case01PointSource } from "./case_01_points";
import { GENERATED_STATIC_FREIBURG_CASE01_POINTS } from "../../src/features/map/data/generated-static-points";

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
    s3: string;
    s4: string;
    s6: string;
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

const locationIdsFromPoints = (
  points: readonly Case01PointSource[],
): string[] =>
  [...points]
    .map((point) => point.locationId)
    .sort((left, right) => left.localeCompare(right));

const toRepoRelativePath = (absolutePath: string): string =>
  path.relative(repoRoot, absolutePath).replaceAll("\\", "/");

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
          promptSlots: {
            s3: VISUAL_ARCHETYPE_S3_PREFIX[entry.visualArchetype],
            s4: VISUAL_STATE_S4_TEXT[variantId],
            s6: s6Template,
          },
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
