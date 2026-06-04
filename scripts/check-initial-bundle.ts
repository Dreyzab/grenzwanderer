import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

interface ManifestChunk {
  file?: string;
  src?: string;
  name?: string;
  isEntry?: boolean;
  imports?: string[];
}

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), "..");
const manifestPath = path.join(repoRoot, "dist", ".vite", "manifest.json");
const forbiddenInitialPatterns = [
  /(^|[/\\])mapbox-[^/\\]+\.js$/i,
  /(^|[/\\])three-vendor-[^/\\]+\.js$/i,
  /(^|[/\\])vn-dice-scene-[^/\\]+\.js$/i,
  /VnSkillCheckDiceScene/i,
];

if (!existsSync(manifestPath)) {
  console.error(
    "Missing dist/.vite/manifest.json. Run `bun run build` before the initial bundle guard.",
  );
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Record<
  string,
  ManifestChunk
>;

const entryKeys = Object.entries(manifest)
  .filter(([, chunk]) => chunk.isEntry)
  .map(([key]) => key);

const collectStaticImports = (
  key: string,
  visited = new Set<string>(),
): Set<string> => {
  if (visited.has(key)) {
    return visited;
  }
  visited.add(key);

  const chunk = manifest[key];
  for (const importKey of chunk?.imports ?? []) {
    collectStaticImports(importKey, visited);
  }

  return visited;
};

const initialChunkKeys = new Set<string>();
for (const entryKey of entryKeys) {
  for (const key of collectStaticImports(entryKey)) {
    initialChunkKeys.add(key);
  }
}

const violations: string[] = [];
for (const key of initialChunkKeys) {
  const chunk = manifest[key];
  const searchable = [key, chunk?.file, chunk?.src, chunk?.name]
    .filter(Boolean)
    .join(" ");
  if (forbiddenInitialPatterns.some((pattern) => pattern.test(searchable))) {
    violations.push(`${key} -> ${chunk?.file ?? "(missing file)"}`);
  }
}

if (violations.length > 0) {
  console.error("Forbidden heavy chunks are in the initial bundle graph:");
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log(
  `initial bundle guard passed for ${entryKeys.length} entry chunk(s).`,
);
