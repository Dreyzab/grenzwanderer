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
const INDEX_LOOKUP_FROM =
  "const index_id = sys.index_id_from_name(indexDef.sourceName);";
const INDEX_LOOKUP_TO = `const index_id = (() => {
      try {
        return sys.index_id_from_name(indexDef.sourceName);
      } catch (error) {
        const snakeName = indexDef.sourceName.replace(/[A-Z]/g, (char) => \`_\${char.toLowerCase()}\`);
        if (snakeName !== indexDef.sourceName) {
          try {
            return sys.index_id_from_name(snakeName);
          } catch {
            // Throw the original lookup failure to preserve SpacetimeDB's normal error shape.
          }
        }
        throw error;
      }
    })();`;

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
    let after = before.replace(MARKER_FROM, MARKER_TO);
    if (sub === path.join("dist", "server", "index.mjs")) {
      after = after.replace(INDEX_LOOKUP_FROM, INDEX_LOOKUP_TO);
    }
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

const mapboxPointGeometryTypesPath = path.join(
  repoRoot,
  "node_modules",
  "@types",
  "mapbox__point-geometry",
  "index.d.ts",
);

if (!existsSync(mapboxPointGeometryTypesPath)) {
  const mapboxPointGeometryTypesRoot = path.dirname(
    mapboxPointGeometryTypesPath,
  );
  if (existsSync(mapboxPointGeometryTypesRoot)) {
    writeFileSync(
      mapboxPointGeometryTypesPath,
      '/// <reference types="@mapbox/point-geometry" />\n',
      "utf8",
    );
    console.log(
      "[patch-spacetimedb-table-defaults] added @types/mapbox__point-geometry stub entrypoint",
    );
  }
}
