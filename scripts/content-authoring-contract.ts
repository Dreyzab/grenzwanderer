import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export interface CoverageRule {
  directoryRelativeToStoryRoot: string;
  prefixes: string[];
  scenarioIds: string[];
}

export type ContentReleaseProfile = "default" | "karlsruhe_event";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const repoRoot = path.resolve(__dirname, "..");

export const storyRootRelativePath = "obsidian/StoryDetective";
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

export const contentSensitivePathPrefixes = [
  `${storyRootRelativePath}/`,
  "scripts/extract-vn-content.ts",
  "scripts/vn-case01-onboarding.ts",
  "scripts/content-vocabulary.ts",
  "scripts/content-ids.ts",
  "scripts/content-authoring-contract.ts",
  "scripts/content-obsidian-coverage-check.ts",
  "scripts/content-map-metrics.ts",
  "scripts/data/",
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
