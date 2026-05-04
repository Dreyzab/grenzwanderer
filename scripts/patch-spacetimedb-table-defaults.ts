/**
 * SpacetimeDB 2.0.x: table() only emits RawColumnDefaultValue when `if (meta.defaultValue)` is
 * truthy, so `.default(undefined)` for Option columns is dropped and maincloud rejects migrations.
 * Replace with `'defaultValue' in meta` so explicit undefined (Option None) serializes correctly.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const TARGET_SUBPATHS = [
  path.join("dist", "server", "index.mjs"),
  path.join("src", "lib", "table.ts"),
] as const;

const MARKER_FROM = /if \(meta\.defaultValue\) \{/g;
const MARKER_TO = 'if ("defaultValue" in meta) {';

const roots = [
  path.join(repoRoot, "node_modules", "spacetimedb"),
  path.join(repoRoot, "spacetimedb", "node_modules", "spacetimedb"),
];

let patchedFiles = 0;

for (const root of roots) {
  if (!existsSync(root)) {
    continue;
  }
  for (const sub of TARGET_SUBPATHS) {
    const filePath = path.join(root, sub);
    if (!existsSync(filePath)) {
      continue;
    }
    const before = readFileSync(filePath, "utf8");
    if (!before.includes("meta.defaultValue")) {
      continue;
    }
    const after = before.replace(MARKER_FROM, MARKER_TO);
    if (after === before) {
      continue;
    }
    writeFileSync(filePath, after, "utf8");
    patchedFiles += 1;
    console.log(
      `[patch-spacetimedb-table-defaults] updated ${path.relative(repoRoot, filePath)}`,
    );
  }
}

if (patchedFiles === 0) {
  console.log(
    "[patch-spacetimedb-table-defaults] no files patched (already patched or spacetimedb not installed)",
  );
}
