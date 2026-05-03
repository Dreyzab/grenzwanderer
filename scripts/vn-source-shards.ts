import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import type { ContentReleaseProfile } from "./content-authoring-contract";
import type { NodeBlueprint, ScenarioBlueprint } from "./vn-blueprint-types";

/** Authoring shards (JSON) merged into blueprints during `content:extract`. */
export const VN_SOURCE_SHARDS_RELATIVE_DIR = "content/vn/sources";

export const VN_SOURCE_MANIFEST_DEFAULT = "manifest.json";
export const VN_SOURCE_MANIFEST_KARLSRUHE = "karlsruhe.manifest.json";

interface SourceManifestV1 {
  schemaVersion: 1;
  shards: string[];
}

interface SourceShardV1 {
  schemaVersion?: number;
  scenarios?: ScenarioBlueprint[];
  nodes?: NodeBlueprint[];
}

const assertNoPathTraversal = (relativePath: string, label: string): void => {
  const normalized = path.normalize(relativePath);
  if (path.isAbsolute(normalized) || normalized.startsWith(`..${path.sep}`)) {
    throw new Error(`${label}: illegal path "${relativePath}"`);
  }
};

const assertShardResolvedUnderSources = (
  repoRoot: string,
  absoluteShardPath: string,
): void => {
  const sourcesRoot = path.resolve(
    path.join(repoRoot, VN_SOURCE_SHARDS_RELATIVE_DIR),
  );
  const resolved = path.resolve(absoluteShardPath);
  const rel = path.relative(sourcesRoot, resolved);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error(
      `VN source shard resolves outside ${VN_SOURCE_SHARDS_RELATIVE_DIR}: ${absoluteShardPath}`,
    );
  }
};

const readManifest = (
  repoRoot: string,
  manifestRelativeName: string,
): SourceManifestV1 | null => {
  const manifestPath = path.join(
    repoRoot,
    VN_SOURCE_SHARDS_RELATIVE_DIR,
    manifestRelativeName,
  );
  if (!existsSync(manifestPath)) {
    return null;
  }
  const parsed: unknown = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (!parsed || typeof parsed !== "object") {
    throw new Error(`VN source manifest invalid JSON: ${manifestPath}`);
  }
  const record = parsed as Record<string, unknown>;
  if (record.schemaVersion !== 1) {
    throw new Error(
      `VN source manifest ${manifestPath}: expected schemaVersion 1, got ${String(record.schemaVersion)}`,
    );
  }
  if (!Array.isArray(record.shards)) {
    throw new Error(`VN source manifest ${manifestPath}: missing shards array`);
  }
  if (!record.shards.every((entry) => typeof entry === "string")) {
    throw new Error(
      `VN source manifest ${manifestPath}: shards must be an array of strings`,
    );
  }
  return { schemaVersion: 1, shards: record.shards as string[] };
};

const readShardFile = (
  repoRoot: string,
  shardRelativePath: string,
): SourceShardV1 => {
  assertNoPathTraversal(shardRelativePath, "manifest shard");
  const shardPath = path.join(
    repoRoot,
    VN_SOURCE_SHARDS_RELATIVE_DIR,
    shardRelativePath,
  );
  assertShardResolvedUnderSources(repoRoot, shardPath);
  if (!existsSync(shardPath)) {
    throw new Error(`VN source shard missing on disk: ${shardPath}`);
  }
  const parsed: unknown = JSON.parse(readFileSync(shardPath, "utf8"));
  if (!parsed || typeof parsed !== "object") {
    throw new Error(`VN source shard invalid JSON: ${shardPath}`);
  }
  const record = parsed as Record<string, unknown>;
  if (
    record.schemaVersion !== undefined &&
    record.schemaVersion !== null &&
    record.schemaVersion !== 1
  ) {
    throw new Error(
      `VN source shard ${shardPath}: expected schemaVersion 1 or omitted, got ${String(record.schemaVersion)}`,
    );
  }
  const scenarios = Array.isArray(record.scenarios)
    ? (record.scenarios as ScenarioBlueprint[])
    : [];
  const nodes = Array.isArray(record.nodes)
    ? (record.nodes as NodeBlueprint[])
    : [];
  return { schemaVersion: 1, scenarios, nodes };
};

/**
 * Loads optional JSON blueprints from `content/vn/sources/` per manifest.
 * Merge order: existing extractor blueprints first, then each shard in manifest order.
 * Duplicate scenario or node ids across the combined set throw.
 */
export const loadVnSourceShardBlueprints = (options: {
  repoRoot: string;
  profile: ContentReleaseProfile;
}): { scenarios: ScenarioBlueprint[]; nodes: NodeBlueprint[] } => {
  const manifestName =
    options.profile === "karlsruhe_event"
      ? VN_SOURCE_MANIFEST_KARLSRUHE
      : VN_SOURCE_MANIFEST_DEFAULT;
  const manifest = readManifest(options.repoRoot, manifestName);
  if (!manifest) {
    return { scenarios: [], nodes: [] };
  }

  const scenarios: ScenarioBlueprint[] = [];
  const nodes: NodeBlueprint[] = [];
  const seenScenarioIds = new Set<string>();
  const seenNodeIds = new Set<string>();

  for (const shardRel of manifest.shards) {
    const shard = readShardFile(options.repoRoot, shardRel);
    for (const scenario of shard.scenarios ?? []) {
      if (seenScenarioIds.has(scenario.id)) {
        throw new Error(
          `VN source shard duplicate scenario id "${scenario.id}" (shard ${shardRel})`,
        );
      }
      seenScenarioIds.add(scenario.id);
      scenarios.push(scenario);
    }
    for (const node of shard.nodes ?? []) {
      if (seenNodeIds.has(node.id)) {
        throw new Error(
          `VN source shard duplicate node id "${node.id}" (shard ${shardRel})`,
        );
      }
      seenNodeIds.add(node.id);
      nodes.push(node);
    }
  }

  return { scenarios, nodes };
};
