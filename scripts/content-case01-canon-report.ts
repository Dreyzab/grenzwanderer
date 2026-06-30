import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  case01CoverageRule,
  contentSnapshotPath,
  storyRoot,
  storyRootRelativePath,
  validateStoryRoot,
} from "./content-authoring-contract";

const failOnDrift = process.argv.includes("--check");
const ledgerRelativePath = "40_GameViewer/Case01/CASE01_CANON_LEDGER.md";
const ledgerPath = path.join(storyRoot, ...ledgerRelativePath.split("/"));

type SnapshotScenario = {
  id: string;
  title?: string;
  nodeIds?: string[];
  packId?: string;
};

type SnapshotNode = {
  id: string;
  scenarioId?: string;
  title?: string;
  body?: string;
  choices?: Array<{ id?: string; text?: string }>;
  onEnter?: unknown[];
};

type Snapshot = {
  scenarios: SnapshotScenario[];
  nodes?: SnapshotNode[];
};

type CoverageStatus = "COVERED" | "BRIDGED" | "MISSING";

type CoverageRow = {
  scenarioId: string;
  scenarioTitle: string;
  nodeId: string;
  nodeTitle: string;
  status: CoverageStatus;
  ownerLayer: string;
  identityFindings: string[];
  note: string;
};

const parseFrontmatterId = (markdown: string): string | null => {
  const normalized = markdown.replace(/^\uFEFF/, "");
  const frontmatterMatch = normalized.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!frontmatterMatch) {
    return null;
  }
  const idMatch = frontmatterMatch[1].match(/^id:\s*([^\n]+)$/m);
  return idMatch ? idMatch[1].trim() : null;
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
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".md")) {
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

const markdownCell = (value: string): string =>
  value.replaceAll("|", "\\|").replace(/\r?\n/g, "<br>");

const percent = (value: number, total: number): string =>
  total === 0 ? "0.0" : ((value / total) * 100).toFixed(1);

const readSnapshot = (): Snapshot => {
  const snapshotRaw = readFileSync(contentSnapshotPath, "utf8");
  const parsed = JSON.parse(snapshotRaw) as Partial<Snapshot>;
  if (!Array.isArray(parsed.scenarios)) {
    throw new Error(
      "[content:case01:canon] pilot.snapshot.json is missing scenarios[]",
    );
  }
  return {
    scenarios: parsed.scenarios,
    nodes: Array.isArray(parsed.nodes) ? parsed.nodes : [],
  };
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
  return frontmatterPathsById;
};

const buildReportRows = (
  snapshot: Snapshot,
  frontmatterPathsById: Map<string, string[]>,
): CoverageRow[] => {
  const scenarioById = new Map(
    snapshot.scenarios.map((entry) => [entry.id, entry]),
  );
  const nodeById = new Map(
    (snapshot.nodes ?? []).map((entry) => [entry.id, entry]),
  );
  const bridgeScenarioIds = new Set(
    case01CoverageRule.temporaryRuntimeBridgeScenarioIds,
  );
  const strictCase01Prefix = `${storyRootRelativePath}/${case01CoverageRule.strictDirectoryRelativeToStoryRoot}/`;

  const rows: CoverageRow[] = [];
  for (const scenario of snapshot.scenarios
    .filter((entry) => entry.packId === case01CoverageRule.packId)
    .sort((left, right) => left.id.localeCompare(right.id))) {
    for (const nodeId of [...(scenario.nodeIds ?? [])].sort()) {
      const paths = frontmatterPathsById.get(nodeId) ?? [];
      const nonLocalePaths = paths.filter(
        (entry) => !/\.[a-z]{2}\.md$/.test(entry),
      );
      const hasStrictCase01Match = nonLocalePaths.some((entry) =>
        entry.startsWith(strictCase01Prefix),
      );
      const isBridgeScenario = bridgeScenarioIds.has(scenario.id);
      const status: CoverageStatus = hasStrictCase01Match
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
          if (!containsIdentityAlias(searchable, alias)) {
            continue;
          }
          identityFindings.push(`${alias} -> ${rule.canonical}`);
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
        note:
          status === "BRIDGED"
            ? "Hardcoded in scripts/data/case01_canon_runtime.ts until migrated."
            : status === "MISSING"
              ? "Add StoryDetective scene coverage or declare an explicit bridge."
              : "",
      });
    }
  }
  return rows;
};

const renderLedger = (rows: CoverageRow[]): string => {
  const total = rows.length;
  const covered = rows.filter((entry) => entry.status === "COVERED").length;
  const bridged = rows.filter((entry) => entry.status === "BRIDGED").length;
  const missing = rows.filter((entry) => entry.status === "MISSING").length;
  const identityDrift = rows.filter(
    (entry) => entry.identityFindings.length > 0,
  ).length;

  const lines: string[] = [
    "# Case01 Canon Ledger",
    "",
    "> This file is generated by `bun run content:case01:canon:report`.",
    "> Edit `scripts/content-case01-canon-report.ts` and the StoryDetective source files instead of hand-editing this ledger.",
    "",
    "## Canon Policy",
    "",
    "- Runtime source of truth: `obsidian/StoryDetective`.",
    "- Design/reference source: `obsidian/Detectiv`; aliases there do not replace supported runtime canon.",
    "- New Case01 scenes must be authored as StoryDetective `_scenario.md` plus `scene_*.md` files.",
    "- Existing hardcoded Case01 slices are tracked as `temporary_runtime_bridge` until migrated into StoryDetective scene files with exact frontmatter `id`.",
    "",
    "## Matthias / Arthur Origin Split",
    "",
    "- Runtime character id: `inspector`.",
    "- Runtime display identity: Matthias Adler.",
    "- Journalist-origin identity: Arthur Vance (`origin_journalist`).",
    "- Arthur is not a Matthias/detective alias; old Arthur-as-detective text is legacy reference.",
    "- Baseline tone: professional, observant, restrained, and willing to apply procedural pressure.",
    "- New depth is added through player-choice alternatives, not by replacing the base persona.",
    "",
    "## Matthias Identity Starting Baseline",
    "",
    "| Trait | Base Value | Dynamic Factor | Description |",
    "| --- | ---: | --- | --- |",
    "| Professionalism | 50 | Institutional Trust | Adherence to protocols and professional distance. |",
    "| Empathy | 50 | Social Resonance | Connection to marginalized people and attention to human cost. |",
    "| Authority | 50 | Command Presence | Willingness to occupy institutional space and use special-mandate status. |",
    "| Vulnerability | 10 | Inner Parliament | Openness to self-doubt and personal memories. |",
    "",
    "## Identity Impact Mapping",
    "",
    "| Node ID | Choice Vector | Impacted Trait | Rationale |",
    "| --- | --- | --- | --- |",
    "| `scene_case01_hbf_police` | Cooperate with local police | +Authority | Establishes Matthias as a legitimate special-mandate investigator. |",
    "| `scene_case01_hbf_newsboy_approach` | Investigate the newsboy without reducing him to a clue dispenser | +Empathy | Looks beyond the task to the person carrying the rumor. |",
    "| `scene_case01_hbf_luggage_robbery` | Intervene procedurally in civil disorder | +Professionalism | Turns surprise into method instead of panic. |",
    "",
    "## Identity Policy",
    "",
    "| Canonical runtime name | Reference aliases | Runtime policy |",
    "| --- | --- | --- |",
    "| Matthias Adler | Detective Arthur Vance, Inspector Arthur Vance | Matthias is the detective-origin identity; Arthur is reserved for journalist origin. |",
    "| Arthur Vance | — | Canon journalist-origin protagonist (`origin_journalist`), not a detective replacement. |",
    "| Lotte Weber | Lotte Fischer, legacy `operator` key | Runtime social identity is `npc_weber_dispatcher`; `operator` is reference metadata only. |",
    "| Fritz Muller | Fritz Mueller, locale variants | Runtime text uses Fritz Muller unless localized. |",
    "| Victoria Sterling | Clara von Altenburg, Clara Altenburg | Clara is legacy planning; scientific companion runtime uses Victoria / `victoria_sterling`; `assistant` is compatibility-only. |",
    "| Baroness Elise von Altenburg | Baroness Klara von Altenburg, Баронесса Клара, Клара фон Альтенбург | Witch-prologue estate runtime uses `npc_baroness_elise`; Klara is legacy drift. |",
    "| Heinrich Galdermann | Heinrich Haldermann, Galderman | Runtime spelling is Heinrich Galdermann. |",
    "| Bankhaus J.A. Krebs | Kaiserbank, Bankhaus Krebs | Runtime display name is Bankhaus J.A. Krebs. |",
    "",
    "## Coverage Summary",
    "",
    `- Total Case01 nodes: ${total}`,
    `- Covered by StoryDetective: ${covered} (${percent(covered, total)}%)`,
    `- Bridged from TypeScript: ${bridged}`,
    `- Missing ownership: ${missing}`,
    `- Identity drift findings: ${identityDrift}`,
    "",
    "## Narrative Node Coverage",
    "",
    "| Scenario | Node ID | Title | Status | Owner Layer | Identity | Note |",
    "| --- | --- | --- | --- | --- | --- | --- |",
  ];

  for (const row of rows) {
    lines.push(
      [
        markdownCell(row.scenarioId),
        `\`${markdownCell(row.nodeId)}\``,
        markdownCell(row.nodeTitle),
        row.status,
        markdownCell(row.ownerLayer),
        markdownCell(row.identityFindings.join("<br>") || "OK"),
        markdownCell(row.note),
      ]
        .join(" | ")
        .replace(/^/, "| ") + " |",
    );
  }

  lines.push("");
  lines.push("## Migration Rule");
  lines.push("");
  lines.push(
    "Move one bridge scenario at a time into StoryDetective `_runtime`, preserve current flags/routes/outcomes, run `content:extract`, then remove that scenario id from `temporaryRuntimeBridgeScenarioIds`.",
  );
  lines.push("");
  return `${lines.join("\n")}\n`;
};

const snapshot = readSnapshot();
const rows = buildReportRows(snapshot, buildFrontmatterPathsById());
const missingCount = rows.filter((entry) => entry.status === "MISSING").length;
const identityDriftCount = rows.filter(
  (entry) => entry.identityFindings.length > 0,
).length;

mkdirSync(path.dirname(ledgerPath), { recursive: true });
writeFileSync(ledgerPath, renderLedger(rows), "utf8");

console.log(`[content:case01:canon] Ledger generated: ${ledgerPath}`);
console.log(
  `[content:case01:canon] Coverage: ${
    rows.filter((entry) => entry.status === "COVERED").length
  }/${rows.length} covered, ${
    rows.filter((entry) => entry.status === "BRIDGED").length
  } bridged, ${missingCount} missing, ${identityDriftCount} identity drift.`,
);

if (failOnDrift && (missingCount > 0 || identityDriftCount > 0)) {
  console.error("[content:case01:canon] --check failed.");
  process.exitCode = 1;
}
