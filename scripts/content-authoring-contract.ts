import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export interface CoverageRule {
  directoryRelativeToStoryRoot: string;
  prefixes: string[];
  scenarioIds: string[];
}

export interface Case01CanonIdentityRule {
  canonical: string;
  aliases: string[];
  severity: "error" | "warning";
  note: string;
}

export interface Case01CoverageRule {
  packId: string;
  strictDirectoryRelativeToStoryRoot: string;
  temporaryRuntimeBridgeScenarioIds: string[];
  identityRules: Case01CanonIdentityRule[];
}

export type ContentReleaseProfile = "default" | "karlsruhe_event";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const repoRoot = path.resolve(__dirname, "..");

export const storyRootRelativePath = "obsidian/StoryDetective";
export const designDocsRootRelativePath = "obsidian/Detectiv";
export const case01OnboardingRelativeRoot =
  "40_GameViewer/Case01/Plot/01_Onboarding";
export const normalizeContentReleaseProfile = (
  value: string | undefined,
): ContentReleaseProfile =>
  value === "karlsruhe_event" ? "karlsruhe_event" : "default";

export const resolveContentReleaseProfile = (
  value: string | undefined = process.env.CONTENT_RELEASE_PROFILE ??
    process.env.VITE_RELEASE_PROFILE,
): ContentReleaseProfile => normalizeContentReleaseProfile(value);

export const getContentSnapshotRelativePath = (
  profile: ContentReleaseProfile = "default",
): string =>
  profile === "karlsruhe_event"
    ? "content/vn/karlsruhe.snapshot.json"
    : "content/vn/pilot.snapshot.json";

export const getPublicContentSnapshotRelativePath = (
  profile: ContentReleaseProfile = "default",
): string =>
  profile === "karlsruhe_event"
    ? "public/content/vn/karlsruhe.snapshot.json"
    : "public/content/vn/pilot.snapshot.json";

export const getReleaseManifestRelativePath = (
  profile: ContentReleaseProfile = "default",
): string =>
  profile === "karlsruhe_event"
    ? "content/vn/karlsruhe.releases.manifest.json"
    : "content/vn/releases.manifest.json";

export const contentSnapshotRelativePath =
  getContentSnapshotRelativePath("default");
export const publicContentSnapshotRelativePath =
  getPublicContentSnapshotRelativePath("default");
export const mapMetricsSnapshotRelativePath =
  "content/vn/map-metrics.snapshot.json";

export const storyRoot = path.join(
  repoRoot,
  ...storyRootRelativePath.split("/"),
);
export const designDocsRoot = path.join(
  repoRoot,
  ...designDocsRootRelativePath.split("/"),
);
export const contentSnapshotPath = path.join(
  repoRoot,
  ...contentSnapshotRelativePath.split("/"),
);
export const publicContentSnapshotPath = path.join(
  repoRoot,
  ...publicContentSnapshotRelativePath.split("/"),
);
export const mapMetricsSnapshotPath = path.join(
  repoRoot,
  ...mapMetricsSnapshotRelativePath.split("/"),
);

export const resolveContentSnapshotPath = (
  profile: ContentReleaseProfile = resolveContentReleaseProfile(),
): string => resolveRepoPath(getContentSnapshotRelativePath(profile));

export const resolvePublicContentSnapshotPath = (
  profile: ContentReleaseProfile = resolveContentReleaseProfile(),
): string => resolveRepoPath(getPublicContentSnapshotRelativePath(profile));

export const resolveReleaseManifestPath = (
  profile: ContentReleaseProfile = resolveContentReleaseProfile(),
): string => resolveRepoPath(getReleaseManifestRelativePath(profile));

export const obsidianCoverageRules: CoverageRule[] = [
  {
    directoryRelativeToStoryRoot: "40_GameViewer/Sandbox_KA/Plot/02_Dog",
    prefixes: ["scene_dog_", "scene_park_"],
    scenarioIds: ["sandbox_dog_pilot"],
  },
  {
    directoryRelativeToStoryRoot: "40_GameViewer/Sandbox_KA/Plot/03_Ghost",
    prefixes: [
      "scene_estate_",
      "scene_evidence_",
      "scene_guild_",
      "scene_conclusion_",
    ],
    scenarioIds: ["sandbox_ghost_pilot"],
  },
  {
    directoryRelativeToStoryRoot: "40_GameViewer/Sandbox_KA/08_LivingCity",
    prefixes: ["scene_city_"],
    scenarioIds: [
      "sandbox_city_student_tip",
      "sandbox_city_cleaner_tip",
      "sandbox_city_bootblack_tip",
    ],
  },
];

export const case01CoverageRule: Case01CoverageRule = {
  packId: "case01_mainline",
  strictDirectoryRelativeToStoryRoot: "40_GameViewer/Case01",
  temporaryRuntimeBridgeScenarioIds: [
    "case01_hbf_arrival",
    "case01_rail_yard_shadow_tail",
  ],
  identityRules: [
    {
      canonical: "Elias Thorne",
      aliases: ["Arthur Vance"],
      severity: "error",
      note: "Elias Thorne is the runtime player identity; Arthur Vance is Detectiv/reference only.",
    },
    {
      canonical: "Fritz Muller",
      aliases: ["Fritz Mueller", "Fritz Müller"],
      severity: "warning",
      note: "Supported runtime content should use Fritz Muller; locale/design aliases are reference-only.",
    },
    {
      canonical: "Victoria Sterling",
      aliases: ["Clara von Altenburg", "Clara Altenburg"],
      severity: "warning",
      note: "Clara is a legacy planning shard; supported Case01 scientific companion text should use Victoria Sterling / victoria_sterling. The generic assistant role is compatibility-only.",
    },
    {
      canonical: "Baroness Elise von Altenburg",
      aliases: [
        "Baroness Klara von Altenburg",
        "Баронесса Клара",
        "Клара фон Альтенбург",
      ],
      severity: "error",
      note: "Witch-prologue estate runtime uses npc_baroness_elise / Baroness Elise; Klara is legacy drift.",
    },
    {
      canonical: "Bankhaus J.A. Krebs",
      aliases: ["Kaiserbank", "Bankhaus Krebs"],
      severity: "warning",
      note: "Kaiserbank is a legacy planning label, not the runtime bank name.",
    },
    {
      canonical: "Heinrich Galdermann",
      aliases: ["Heinrich Haldermann", "Galderman"],
      severity: "warning",
      note: "Use Heinrich Galdermann for the Case01 bank manager.",
    },
  ],
};

export const contentSensitivePathPrefixes = [
  `${storyRootRelativePath}/`,
  "scripts/extract-vn-content.ts",
  "scripts/case-ir-lint.ts",
  "scripts/vn-case01-onboarding.ts",
  "scripts/content-vocabulary.ts",
  "scripts/content-ids.ts",
  "scripts/content-authoring-contract.ts",
  "scripts/content-obsidian-coverage-check.ts",
  "scripts/content-case01-canon-report.ts",
  "scripts/content-case-build.ts",
  "scripts/content-map-metrics.ts",
  "scripts/data/",
  "src/shared/vn-contract/case-build-artifact.ts",
  "src/shared/vn-contract/case-ir.ts",
  "src/shared/vn-contract/procedural-planner.ts",
  "src/shared/vn-contract/types.ts",
  "content/case-build/",
  "content/visual-assets/",
  contentSnapshotRelativePath,
  publicContentSnapshotRelativePath,
  mapMetricsSnapshotRelativePath,
] as const;

export const normalizeRepoRelativePath = (value: string): string =>
  value.replaceAll("\\", "/").replace(/^\.\//, "").replace(/\/+$/, "");

export const resolveRepoPath = (relativePath: string): string =>
  path.join(repoRoot, ...normalizeRepoRelativePath(relativePath).split("/"));

export const resolveStoryPath = (
  relativePath: string,
  customStoryRoot: string = storyRoot,
): string =>
  path.join(
    customStoryRoot,
    ...normalizeRepoRelativePath(relativePath).split("/"),
  );

export const validateStoryRoot = (
  customStoryRoot: string = storyRoot,
): string => {
  if (!existsSync(customStoryRoot)) {
    throw new Error(
      `[content:contract] Missing Obsidian story root: ${customStoryRoot}. Expected vault at '${storyRootRelativePath}'.`,
    );
  }
  return customStoryRoot;
};

export const validateCase01OnboardingRoot = (
  customStoryRoot: string = storyRoot,
): string => {
  validateStoryRoot(customStoryRoot);
  const onboardingRoot = resolveStoryPath(
    case01OnboardingRelativeRoot,
    customStoryRoot,
  );
  if (!existsSync(onboardingRoot)) {
    throw new Error(
      `[content:contract] Missing Case01 onboarding root '${case01OnboardingRelativeRoot}'. Do not rename or move onboarding folders without updating the content contract.`,
    );
  }
  return onboardingRoot;
};

export const isContentSensitivePath = (candidatePath: string): boolean => {
  const normalized = normalizeRepoRelativePath(candidatePath);
  return contentSensitivePathPrefixes.some(
    (prefix) => normalized === prefix || normalized.startsWith(prefix),
  );
};

export const hasContentSensitiveChanges = (
  changedPaths: Iterable<string>,
): boolean => {
  for (const changedPath of changedPaths) {
    if (isContentSensitivePath(changedPath)) {
      return true;
    }
  }
  return false;
};
