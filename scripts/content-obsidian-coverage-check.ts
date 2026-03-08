import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const snapshotPath = path.join(repoRoot, "content", "vn", "pilot.snapshot.json");

type Snapshot = {
  scenarios: Array<{ id: string; nodeIds: string[] }>;
};

type CoverageRule = {
  directory: string;
  prefixes: string[];
  scenarioIds: string[];
};

const coverageRules: CoverageRule[] = [
  {
    directory: "obsidian/StoryDetective/40_GameViewer/Sandbox_KA/Plot/02_Dog",
    prefixes: ["scene_dog_", "scene_park_"],
    scenarioIds: ["sandbox_dog_pilot"],
  },
  {
    directory: "obsidian/StoryDetective/40_GameViewer/Sandbox_KA/Plot/03_Ghost",
    prefixes: [
      "scene_estate_",
      "scene_evidence_",
      "scene_guild_",
      "scene_conclusion_",
    ],
    scenarioIds: ["sandbox_ghost_pilot"],
  },
  {
    directory: "obsidian/StoryDetective/40_GameViewer/Sandbox_KA/08_LivingCity",
    prefixes: ["scene_city_"],
    scenarioIds: [
      "sandbox_city_student_tip",
      "sandbox_city_cleaner_tip",
      "sandbox_city_bootblack_tip",
    ],
  },
];

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

const missingInSnapshot: string[] = [];
const missingInObsidian: string[] = [];
const malformedFiles: string[] = [];

for (const rule of coverageRules) {
  const absoluteDir = path.join(repoRoot, rule.directory);
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
    const relativePath = path.join(rule.directory, file).replaceAll("\\", "/");
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
      missingInObsidian.push(`${rule.directory} (id=${nodeId})`);
    }
  }
}

if (
  missingInSnapshot.length > 0 ||
  missingInObsidian.length > 0 ||
  malformedFiles.length > 0
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
    console.error("[content:obsidian:coverage] Files with missing frontmatter id:");
    for (const file of malformedFiles) {
      console.error(`- ${file}`);
    }
  }
  process.exitCode = 1;
} else {
  console.log(
    "[content:obsidian:coverage] Dog/Ghost Obsidian coverage matches parsed snapshot graph node IDs.",
  );
}
