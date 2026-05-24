import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

import { buildDirectorAllowedBeatIds } from "../src/shared/case01Canon";
import {
  buildCaseBuildArtifact,
  buildCaseIrFromSnapshot,
  CASE_CATALOG,
  parseVnSnapshotPayload,
  validateCaseIr,
  type CaseBuildArtifact,
  type CaseBuildLedgerEntry,
  type CaseBuildCoverageStatus,
  type VnSnapshot,
} from "../src/shared/vn-contract";
import { SUPPORTED_AI_KINDS } from "../spacetimedb/src/reducers/aiQueue";
import {
  case01CoverageRule,
  getContentSnapshotRelativePath,
  resolveContentReleaseProfile,
  resolveRepoPath,
  storyRoot,
  storyRootRelativePath,
  validateStoryRoot,
  type ContentReleaseProfile,
} from "./content-authoring-contract";
import { readSnapshotForProfile } from "./content-manifest";
import { buildCase01MapSnapshot } from "./data/case_01_points";
import { buildCase01VisualScaffoldOutput } from "./data/freiburg_visual_assets";

export const caseBuildRelativePath = "content/case-build/case01.build.json";
export const caseBuildPath = resolveRepoPath(caseBuildRelativePath);

const parseCliProfile = (): ContentReleaseProfile =>
  resolveContentReleaseProfile(
    (() => {
      const profileIndex = process.argv.indexOf("--profile");
      return profileIndex >= 0 ? process.argv[profileIndex + 1] : undefined;
    })(),
  );

const parseFrontmatterId = (markdown: string): string | null => {
  const normalized = markdown.replace(/^\uFEFF/, "");
  const frontmatterMatch = normalized.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!frontmatterMatch) {
    return null;
  }
  const idMatch = frontmatterMatch[1].match(/^id:\s*([^\n]+)$/m);
  if (!idMatch) {
    return null;
  }
  const id = idMatch[1].trim();
  return id.length > 0 ? id : null;
};

const walkMarkdownFiles = (directory: string): string[] => {
  const files: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) {
      continue;
    }
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkMarkdownFiles(absolutePath));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(absolutePath);
    }
  }
  return files;
};

const toRepoStoryRelativePath = (absolutePath: string): string =>
  `${storyRootRelativePath}/${path
    .relative(storyRoot, absolutePath)
    .replaceAll("\\", "/")}`;

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const containsIdentityAlias = (searchable: string, alias: string): boolean => {
  const pattern = new RegExp(
    `(^|[^\\p{L}\\p{N}])${escapeRegExp(alias)}($|[^\\p{L}\\p{N}])`,
    "u",
  );
  return pattern.test(searchable);
};

const buildFrontmatterPathsById = (): Map<string, string[]> => {
  validateStoryRoot(storyRoot);
  const frontmatterPathsById = new Map<string, string[]>();
  for (const absolutePath of walkMarkdownFiles(storyRoot)) {
    const markdown = readFileSync(absolutePath, "utf8").replace(/\r\n/g, "\n");
    const nodeId = parseFrontmatterId(markdown);
    if (!nodeId) {
      continue;
    }
    const existing = frontmatterPathsById.get(nodeId) ?? [];
    existing.push(toRepoStoryRelativePath(absolutePath));
    frontmatterPathsById.set(nodeId, existing);
  }
  for (const paths of frontmatterPathsById.values()) {
    paths.sort((left, right) => left.localeCompare(right));
  }
  return frontmatterPathsById;
};

export const buildCase01LedgerRows = (
  snapshot: VnSnapshot,
  frontmatterPathsById: ReadonlyMap<string, readonly string[]>,
): CaseBuildLedgerEntry[] => {
  const scenarioById = new Map(
    snapshot.scenarios.map((entry) => [entry.id, entry]),
  );
  const nodeById = new Map(snapshot.nodes.map((entry) => [entry.id, entry]));
  const bridgeScenarioIds = new Set(
    case01CoverageRule.temporaryRuntimeBridgeScenarioIds,
  );
  const strictCase01Prefix = `${storyRootRelativePath}/${case01CoverageRule.strictDirectoryRelativeToStoryRoot}/`;

  const rows: CaseBuildLedgerEntry[] = [];
  for (const scenario of snapshot.scenarios
    .filter((entry) => entry.packId === case01CoverageRule.packId)
    .sort((left, right) => left.id.localeCompare(right.id))) {
    for (const nodeId of [...scenario.nodeIds].sort()) {
      const paths = [...(frontmatterPathsById.get(nodeId) ?? [])].sort(
        (left, right) => left.localeCompare(right),
      );
      const nonLocalePaths = paths.filter(
        (entry) => !/\.[a-z]{2}\.md$/.test(entry),
      );
      const hasStrictCase01Match = nonLocalePaths.some((entry) =>
        entry.startsWith(strictCase01Prefix),
      );
      const isBridgeScenario = bridgeScenarioIds.has(scenario.id);
      const status: CaseBuildCoverageStatus = hasStrictCase01Match
        ? "COVERED"
        : isBridgeScenario
          ? "BRIDGED"
          : "MISSING";
      const node = nodeById.get(nodeId);
      const searchable = [
        node?.title,
        node?.body,
        ...(node?.choices ?? []).flatMap((choice) => [choice.id, choice.text]),
      ]
        .filter((entry): entry is string => typeof entry === "string")
        .join("\n");
      const identityFindings: string[] = [];

      for (const rule of case01CoverageRule.identityRules) {
        for (const alias of rule.aliases) {
          if (containsIdentityAlias(searchable, alias)) {
            identityFindings.push(`${alias} -> ${rule.canonical}`);
          }
        }
      }

      rows.push({
        scenarioId: scenario.id,
        scenarioTitle: scenarioById.get(scenario.id)?.title ?? scenario.id,
        nodeId,
        nodeTitle: node?.title ?? "",
        status,
        ownerLayer:
          status === "COVERED"
            ? "StoryDetective authoritative"
            : status === "BRIDGED"
              ? "temporary_runtime_bridge"
              : "unowned",
        identityFindings,
        sourcePaths: paths,
        note:
          status === "BRIDGED"
            ? "Hardcoded in scripts/data/case01_canon_runtime.ts until migrated."
            : status === "MISSING"
              ? "Add StoryDetective scene coverage or declare an explicit bridge."
              : "",
      });
    }
  }

  return rows.sort((left, right) =>
    `${left.scenarioId}:${left.nodeId}`.localeCompare(
      `${right.scenarioId}:${right.nodeId}`,
    ),
  );
};

const formatParseFailure = (
  issues: readonly { path: string; message: string }[],
): string =>
  [
    "[content:case-build] Snapshot parse failed.",
    ...issues.map((issue) => `- ${issue.path}: ${issue.message}`),
  ].join("\n");

export const buildCase01CaseBuildArtifact = (
  profile: ContentReleaseProfile = "default",
): CaseBuildArtifact => {
  const snapshotEnvelope = readSnapshotForProfile(profile);
  const parsedSnapshot = parseVnSnapshotPayload(snapshotEnvelope.payloadJson);
  if (!parsedSnapshot.ok) {
    throw new Error(formatParseFailure(parsedSnapshot.issues));
  }

  const snapshot = parsedSnapshot.snapshot;
  const contentVersion =
    typeof snapshotEnvelope.payload.contentVersion === "string"
      ? snapshotEnvelope.payload.contentVersion
      : undefined;
  const caseIr = buildCaseIrFromSnapshot(
    snapshot,
    {
      bundleChecksum: snapshotEnvelope.checksum,
      generatedAt: snapshotEnvelope.generatedAt,
      contentVersion,
    },
    CASE_CATALOG,
  );
  const validation = validateCaseIr(caseIr);
  const validationErrors = validation.issues.filter(
    (issue) => issue.severity === "error",
  );
  if (validationErrors.length > 0) {
    throw new Error(
      [
        "[content:case-build] Case IR validation failed.",
        ...validationErrors.map(
          (issue) => `- [${issue.code}] ${issue.path}: ${issue.message}`,
        ),
      ].join("\n"),
    );
  }

  const visualScaffold = buildCase01VisualScaffoldOutput();
  if (visualScaffold.parity.errors.length > 0) {
    throw new Error(
      [
        "[content:case-build] Case01 visual scaffold parity failed.",
        ...visualScaffold.parity.errors.map((entry) => `- ${entry}`),
      ].join("\n"),
    );
  }

  const availableScenarioIds = new Set(
    snapshot.scenarios.map((scenario) => scenario.id),
  );

  return buildCaseBuildArtifact({
    caseId: case01CoverageRule.packId,
    snapshot,
    snapshotChecksum: snapshotEnvelope.checksum,
    snapshotPath: getContentSnapshotRelativePath(profile),
    caseIr,
    caseLedger: buildCase01LedgerRows(snapshot, buildFrontmatterPathsById()),
    mapSnapshot: buildCase01MapSnapshot(availableScenarioIds),
    visualManifest: visualScaffold.manifest,
    visualVariants: visualScaffold.variants,
    visualMissingAssets: visualScaffold.missing,
    triggerRules: CASE_CATALOG.triggerRules,
    questArchetypes: CASE_CATALOG.questArchetypes,
    supportedAiKinds: SUPPORTED_AI_KINDS,
    directorAllowedBeatIds: buildDirectorAllowedBeatIds(
      snapshot.scenarios.map((scenario) => scenario.id),
    ),
  });
};

export const renderCaseBuildArtifactJson = (
  artifact: CaseBuildArtifact,
): string => `${JSON.stringify(artifact, null, 2)}\n`;

export const isCaseBuildArtifactStale = (
  currentJson: string | null,
  expectedJson: string,
): boolean => currentJson !== expectedJson;

const readUtf8IfExists = (absolutePath: string): string | null =>
  existsSync(absolutePath) ? readFileSync(absolutePath, "utf8") : null;

export const writeCaseBuildArtifact = (
  artifact: CaseBuildArtifact,
  absolutePath: string = caseBuildPath,
): void => {
  mkdirSync(path.dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, renderCaseBuildArtifactJson(artifact), "utf8");
};

export const runContentCaseBuild = (): void => {
  const checkOnly = process.argv.includes("--check");
  const profile = parseCliProfile();
  const artifact = buildCase01CaseBuildArtifact(profile);
  const expectedJson = renderCaseBuildArtifactJson(artifact);

  if (checkOnly) {
    const currentJson = readUtf8IfExists(caseBuildPath);
    if (isCaseBuildArtifactStale(currentJson, expectedJson)) {
      throw new Error(
        [
          "[content:case-build] CaseBuildArtifact is stale.",
          `- ${caseBuildRelativePath}`,
          "Run 'bun run content:case-build' and commit the updated artifact.",
        ].join("\n"),
      );
    }
    console.log("[content:case-build] CaseBuildArtifact is up to date.");
  } else {
    writeCaseBuildArtifact(artifact);
    console.log(`[content:case-build] Artifact written: ${caseBuildPath}`);
  }

  console.log(
    `[content:case-build] Snapshot checksum: ${artifact.source.snapshotChecksum}`,
  );
  console.log(
    `[content:case-build] Case01 nodes: ${artifact.caseLedger.summary.totalNodes} total, ${artifact.caseLedger.summary.coveredNodes} covered, ${artifact.caseLedger.summary.bridgedNodes} bridged, ${artifact.caseLedger.summary.missingNodes} missing.`,
  );
  console.log(
    `[content:case-build] QA findings: ${artifact.qaFindings.length}`,
  );
};

if (import.meta.main) {
  try {
    runContentCaseBuild();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
