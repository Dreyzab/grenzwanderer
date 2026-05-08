import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  case01CoverageRule,
  contentSnapshotPath,
  obsidianCoverageRules,
  resolveStoryPath,
  storyRoot,
  storyRootRelativePath,
  validateStoryRoot,
} from "./content-authoring-contract";

const snapshotPath = contentSnapshotPath;

type Snapshot = {
  scenarios: Array<{ id: string; nodeIds: string[]; packId?: string }>;
  nodes?: Array<{
    id: string;
    scenarioId?: string;
    title?: string;
    body?: string;
    choices?: Array<{ id?: string; text?: string }>;
  }>;
};

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

const toStoryRelativePath = (absolutePath: string): string =>
  path.relative(storyRoot, absolutePath).replaceAll("\\", "/");

const toRepoStoryRelativePath = (absolutePath: string): string =>
  `${storyRootRelativePath}/${toStoryRelativePath(absolutePath)}`;

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const containsIdentityAlias = (searchable: string, alias: string): boolean => {
  const pattern = new RegExp(
    `(^|[^\\p{L}\\p{N}])${escapeRegExp(alias)}($|[^\\p{L}\\p{N}])`,
    "u",
  );
  return pattern.test(searchable);
};

const snapshotRaw = readFileSync(snapshotPath, "utf8");
const parsed = JSON.parse(snapshotRaw) as Partial<Snapshot>;
if (!Array.isArray(parsed.scenarios)) {
  throw new Error(
    "[content:obsidian:coverage] pilot.snapshot.json is missing scenarios[]",
  );
}

const snapshotNodeIdsByScenario = new Map<string, Set<string>>();
for (const scenario of parsed.scenarios) {
  if (!scenario || typeof scenario.id !== "string") {
    continue;
  }
  snapshotNodeIdsByScenario.set(scenario.id, new Set(scenario.nodeIds ?? []));
}

const snapshotNodesById = new Map(
  (parsed.nodes ?? [])
    .filter((node) => node && typeof node.id === "string")
    .map((node) => [node.id, node]),
);

const missingInSnapshot: string[] = [];
const missingInObsidian: string[] = [];
const malformedFiles: string[] = [];
const duplicateFrontmatterIds: string[] = [];
const localeOnlyCase01Matches: string[] = [];
const case01TemporaryRuntimeBridgeNodes: string[] = [];
const case01IdentityWarnings: string[] = [];
const case01IdentityErrors: string[] = [];

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

for (const [nodeId, paths] of frontmatterPathsById) {
  const nonLocalePaths = paths.filter(
    (entry) => !/\.[a-z]{2}\.md$/.test(entry),
  );
  if (nonLocalePaths.length > 1) {
    duplicateFrontmatterIds.push(`${nodeId} -> ${nonLocalePaths.join(" | ")}`);
  }
}

for (const rule of obsidianCoverageRules) {
  const absoluteDir = resolveStoryPath(rule.directoryRelativeToStoryRoot);
  const files = readdirSync(absoluteDir)
    .filter((entry) => entry.endsWith(".md"))
    .filter((entry) =>
      rule.prefixes.some((prefix) => entry.startsWith(prefix)),
    );

  const expectedNodeIds = new Set<string>();
  for (const scenarioId of rule.scenarioIds) {
    const scenarioNodeIds = snapshotNodeIdsByScenario.get(scenarioId);
    if (!scenarioNodeIds) {
      throw new Error(
        `[content:obsidian:coverage] Scenario '${scenarioId}' is missing in pilot snapshot`,
      );
    }
    for (const nodeId of scenarioNodeIds) {
      expectedNodeIds.add(nodeId);
    }
  }

  const discoveredNodeIds = new Set<string>();
  for (const file of files) {
    const absolutePath = path.join(absoluteDir, file);
    const relativePath = path
      .join(storyRootRelativePath, rule.directoryRelativeToStoryRoot, file)
      .replaceAll("\\", "/");
    const markdown = readFileSync(absolutePath, "utf8").replace(/\r\n/g, "\n");
    const nodeId = parseFrontmatterId(markdown);
    if (!nodeId) {
      malformedFiles.push(relativePath);
      continue;
    }

    discoveredNodeIds.add(nodeId);
    if (!expectedNodeIds.has(nodeId)) {
      missingInSnapshot.push(`${relativePath} (id=${nodeId})`);
    }
  }

  for (const nodeId of expectedNodeIds) {
    if (!discoveredNodeIds.has(nodeId)) {
      missingInObsidian.push(
        `${storyRootRelativePath}/${rule.directoryRelativeToStoryRoot} (id=${nodeId})`,
      );
    }
  }
}

const case01ScenarioIds = new Set(
  parsed.scenarios
    .filter((scenario) => scenario.packId === case01CoverageRule.packId)
    .map((scenario) => scenario.id),
);
const temporaryBridgeScenarioIds = new Set(
  case01CoverageRule.temporaryRuntimeBridgeScenarioIds,
);

for (const scenario of parsed.scenarios.filter((entry) =>
  case01ScenarioIds.has(entry.id),
)) {
  const isTemporaryBridgeScenario = temporaryBridgeScenarioIds.has(scenario.id);
  for (const nodeId of scenario.nodeIds ?? []) {
    const paths = frontmatterPathsById.get(nodeId) ?? [];
    const nonLocalePaths = paths.filter(
      (entry) => !/\.[a-z]{2}\.md$/.test(entry),
    );
    const hasStrictCase01Match = nonLocalePaths.some((entry) =>
      entry.startsWith(
        `${storyRootRelativePath}/${case01CoverageRule.strictDirectoryRelativeToStoryRoot}/`,
      ),
    );

    if (hasStrictCase01Match) {
      continue;
    }

    if (paths.length > 0 && nonLocalePaths.length === 0) {
      localeOnlyCase01Matches.push(`${scenario.id} (id=${nodeId})`);
    }

    if (isTemporaryBridgeScenario) {
      case01TemporaryRuntimeBridgeNodes.push(`${scenario.id} (id=${nodeId})`);
      continue;
    }

    missingInObsidian.push(
      `${storyRootRelativePath}/${case01CoverageRule.strictDirectoryRelativeToStoryRoot} (case01_mainline scenario=${scenario.id}, id=${nodeId})`,
    );
  }
}

for (const scenarioId of case01ScenarioIds) {
  if (temporaryBridgeScenarioIds.has(scenarioId)) {
    continue;
  }
  const nodes = [...(snapshotNodeIdsByScenario.get(scenarioId) ?? [])]
    .map((nodeId) => snapshotNodesById.get(nodeId))
    .filter((node): node is NonNullable<typeof node> => Boolean(node));

  for (const node of nodes) {
    const searchable = [
      node.title,
      node.body,
      ...(node.choices ?? []).flatMap((choice) => [choice.id, choice.text]),
    ]
      .filter((entry): entry is string => typeof entry === "string")
      .join("\n");

    for (const rule of case01CoverageRule.identityRules) {
      for (const alias of rule.aliases) {
        if (!containsIdentityAlias(searchable, alias)) {
          continue;
        }
        const message = `${scenarioId}/${node.id}: found alias '${alias}' for canonical '${rule.canonical}'. ${rule.note}`;
        if (rule.severity === "error") {
          case01IdentityErrors.push(message);
        } else {
          case01IdentityWarnings.push(message);
        }
      }
    }
  }
}

if (
  missingInSnapshot.length > 0 ||
  missingInObsidian.length > 0 ||
  malformedFiles.length > 0 ||
  duplicateFrontmatterIds.length > 0 ||
  localeOnlyCase01Matches.length > 0 ||
  case01IdentityErrors.length > 0
) {
  console.error(
    "[content:obsidian:coverage] Coverage mismatch between Obsidian docs and parsed snapshot graph.",
  );
  if (missingInSnapshot.length > 0) {
    console.error(
      "[content:obsidian:coverage] Obsidian nodes missing in snapshot graph:",
    );
    for (const entry of missingInSnapshot) {
      console.error(`- ${entry}`);
    }
  }
  if (missingInObsidian.length > 0) {
    console.error(
      "[content:obsidian:coverage] Snapshot nodes missing in Obsidian coverage directories:",
    );
    for (const entry of missingInObsidian) {
      console.error(`- ${entry}`);
    }
  }
  if (malformedFiles.length > 0) {
    console.error(
      "[content:obsidian:coverage] Files with missing frontmatter id:",
    );
    for (const file of malformedFiles) {
      console.error(`- ${file}`);
    }
  }
  if (duplicateFrontmatterIds.length > 0) {
    console.error(
      "[content:obsidian:coverage] Duplicate non-locale frontmatter ids:",
    );
    for (const entry of duplicateFrontmatterIds) {
      console.error(`- ${entry}`);
    }
  }
  if (localeOnlyCase01Matches.length > 0) {
    console.error(
      "[content:obsidian:coverage] Case01 nodes matched only locale files:",
    );
    for (const entry of localeOnlyCase01Matches) {
      console.error(`- ${entry}`);
    }
  }
  if (case01IdentityErrors.length > 0) {
    console.error("[content:obsidian:coverage] Case01 identity drift errors:");
    for (const entry of case01IdentityErrors) {
      console.error(`- ${entry}`);
    }
  }
  process.exitCode = 1;
} else {
  if (case01TemporaryRuntimeBridgeNodes.length > 0) {
    console.log(
      `[content:obsidian:coverage] Case01 temporary_runtime_bridge nodes: ${case01TemporaryRuntimeBridgeNodes.length}`,
    );
    for (const entry of case01TemporaryRuntimeBridgeNodes) {
      console.log(`- ${entry}`);
    }
  }
  if (case01IdentityWarnings.length > 0) {
    console.warn("[content:obsidian:coverage] Case01 identity warnings:");
    for (const entry of case01IdentityWarnings) {
      console.warn(`- ${entry}`);
    }
  }
  console.log(
    "[content:obsidian:coverage] Obsidian coverage matches parsed snapshot graph node IDs.",
  );
}
