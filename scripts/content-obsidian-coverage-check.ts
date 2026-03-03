import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const extractorPath = path.join(repoRoot, "scripts", "extract-vn-content.ts");
const extractorSource = readFileSync(extractorPath, "utf8");

const sourcePathRegex = /sourcePath:\s*"([^"]+)"/g;
const referencedPaths = new Set<string>();
for (const match of extractorSource.matchAll(sourcePathRegex)) {
  referencedPaths.add(match[1]);
}

const coverageRules: Array<{ directory: string; prefixes: string[] }> = [
  {
    directory: "obsidian/StoryDetective/40_GameViewer/Sandbox_KA/Plot/02_Dog",
    prefixes: ["scene_dog_", "scene_park_"],
  },
  {
    directory: "obsidian/StoryDetective/40_GameViewer/Sandbox_KA/Plot/03_Ghost",
    prefixes: [
      "scene_estate_",
      "scene_evidence_",
      "scene_guild_",
      "scene_conclusion_",
    ],
  },
];

const missing: string[] = [];
for (const rule of coverageRules) {
  const absoluteDir = path.join(repoRoot, rule.directory);
  const files = readdirSync(absoluteDir)
    .filter((entry) => entry.endsWith(".md"))
    .filter((entry) =>
      rule.prefixes.some((prefix) => entry.startsWith(prefix)),
    );

  for (const file of files) {
    const relativePath = path
      .join(rule.directory, file)
      .replaceAll("\\", "/")
      .replace(/^obsidian\/StoryDetective\//, "");

    if (!referencedPaths.has(relativePath)) {
      missing.push(relativePath);
    }
  }
}

if (missing.length > 0) {
  console.error(
    "[content:obsidian:coverage] Unreferenced Obsidian scene files detected:",
  );
  for (const file of missing) {
    console.error(`- ${file}`);
  }
  console.error(
    "Add matching node blueprints in scripts/extract-vn-content.ts or adjust coverage prefixes if intentional.",
  );
  process.exitCode = 1;
} else {
  console.log(
    "[content:obsidian:coverage] Active Dog/Ghost scene files are covered by extractor sourcePath entries.",
  );
}
