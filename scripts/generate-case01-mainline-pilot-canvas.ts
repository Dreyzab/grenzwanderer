/**
 * Builds Obsidian canvas: one node per snapshot scene id (case01 mainline + detective bootstrap).
 * Links to vault .md only when frontmatter `id:` matches exactly — otherwise a text stub (gap report).
 *
 * Run: bun run scripts/generate-case01-mainline-pilot-canvas.ts
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  contentSnapshotPath,
  storyRoot,
  storyRootRelativePath,
  validateStoryRoot,
} from "./content-authoring-contract";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type Scenario = {
  id: string;
  title?: string;
  nodeIds?: string[];
  packId?: string;
  mode?: string;
  startNodeId?: string;
  completionRoute?: { nextScenarioId?: string };
};

type SnapshotNode = {
  id: string;
  scenarioId?: string;
  title?: string;
};

type Snapshot = {
  scenarios: Scenario[];
  nodes: SnapshotNode[];
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

function walkMdSync(dir: string): string[] {
  const out: string[] = [];
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith(".")) {
      continue;
    }
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      out.push(...walkMdSync(p));
    } else if (ent.name.endsWith(".md")) {
      out.push(p);
    }
  }
  return out;
}

/** Narrative-ish order; unknown ids append in snapshot file order. */
const SCENARIO_ORDER: string[] = [
  "origin_detective_bootstrap",
  "case01_hbf_arrival",
  "case01_mayor_briefing",
  "case01_bank_investigation",
  "case01_lead_apothecary",
  "case01_lead_pub",
  "case01_lead_tailor",
  "case01_estate_branch",
  "case01_lotte_interlude",
  "case01_archive_warrant_run",
  "case01_rail_yard_shadow_tail",
  "case01_convergence",
  "case01_warehouse_finale",
];

const HEADER_W = 400;
const NODE_W = 280;
const NODE_H = 460;
const GAP_X = 28;
const ROW_STEP_Y = NODE_H + 100;

function canvasNodeId(scenarioId: string, nodeId: string): string {
  const safe = `${scenarioId}__${nodeId}`.replace(/[^a-zA-Z0-9_]/g, "_");
  return `n_${safe}`;
}

function main(): void {
  validateStoryRoot(storyRoot);
  const raw = readFileSync(contentSnapshotPath, "utf8");
  const snap = JSON.parse(raw) as Snapshot;
  if (!Array.isArray(snap.scenarios) || !Array.isArray(snap.nodes)) {
    throw new Error("snapshot missing scenarios[] or nodes[]");
  }

  const nodeMeta = new Map<string, SnapshotNode>();
  for (const n of snap.nodes) {
    if (n?.id) {
      nodeMeta.set(n.id, n);
    }
  }

  const wantedScenarios = snap.scenarios.filter(
    (s) =>
      s?.id &&
      (s.packId === "case01_mainline" || s.id === "origin_detective_bootstrap"),
  );

  const orderIndex = (id: string): number => {
    const i = SCENARIO_ORDER.indexOf(id);
    return i === -1 ? 999 + wantedScenarios.findIndex((s) => s.id === id) : i;
  };
  wantedScenarios.sort((a, b) => orderIndex(a.id) - orderIndex(b.id));

  const idToPaths = new Map<string, string[]>();
  for (const abs of walkMdSync(storyRoot)) {
    const head = readFileSync(abs, "utf8")
      .slice(0, 12000)
      .replace(/\r\n/g, "\n");
    const id = parseFrontmatterId(head);
    if (!id) {
      continue;
    }
    const rel = path.relative(storyRoot, abs).split(path.sep).join("/");
    const list = idToPaths.get(id) ?? [];
    list.push(rel);
    idToPaths.set(id, list);
  }

  /** Prefer non-locale file when id is shared with `*.ru.md`. */
  const pickCanonicalVaultPath = (
    paths: string[],
  ): { file: string | null; duplicateNonLocale: boolean } => {
    const nonRu = paths.filter((p) => !p.endsWith(".ru.md"));
    if (nonRu.length === 1) {
      return { file: nonRu[0]!, duplicateNonLocale: false };
    }
    if (nonRu.length > 1) {
      return { file: null, duplicateNonLocale: true };
    }
    if (paths.length >= 1) {
      return { file: paths[0]!, duplicateNonLocale: false };
    }
    return { file: null, duplicateNonLocale: false };
  };

  const duplicateVaultIds: string[] = [];
  for (const [id, paths] of idToPaths) {
    const { duplicateNonLocale } = pickCanonicalVaultPath(paths);
    if (duplicateNonLocale) {
      duplicateVaultIds.push(`${id} -> ${paths.join(" | ")}`);
    }
  }

  const nodes: Record<string, unknown>[] = [];
  const edges: Record<string, unknown>[] = [];

  nodes.push({
    id: "note_policy",
    type: "text",
    text:
      "# Case 01 mainline (pilot snapshot)\n\n" +
      "Один узел = один `nodeId` из `pilot.snapshot.json`.\n" +
      "Файл Obsidian подключается **только** при точном совпадении frontmatter `id:`.\n" +
      "Серые текстовые карточки = нет .md в StoryDetective с таким id (расхождение с каноном рантайма).",
    x: -4400,
    y: -420,
    width: 520,
    height: 260,
  });

  const scenarioLastCanvasId: string[] = [];
  const scenarioFirstCanvasId: string[] = [];

  let row = 0;
  for (const scenario of wantedScenarios) {
    const nodeIds = scenario.nodeIds ?? [];
    for (const nid of nodeIds) {
      const meta = nodeMeta.get(nid);
      if (meta?.scenarioId && meta.scenarioId !== scenario.id) {
        console.error(
          `[canvas] scenarioId mismatch: node ${nid} lists scenario ${scenario.id} but nodes[].scenarioId=${meta.scenarioId}`,
        );
      }
    }
    const seenInScenario = new Set<string>();
    const dupInList: string[] = [];
    for (const nid of nodeIds) {
      if (seenInScenario.has(nid)) {
        dupInList.push(nid);
      }
      seenInScenario.add(nid);
    }
    if (dupInList.length > 0) {
      console.error(
        `[canvas] Duplicate nodeIds inside scenario ${scenario.id}: ${dupInList.join(", ")}`,
      );
    }

    const rowY = -320 + row * ROW_STEP_Y;
    const headerId = `hdr_${scenario.id.replace(/[^a-zA-Z0-9_]/g, "_")}`;
    nodes.push({
      id: headerId,
      type: "text",
      text:
        `# ${scenario.title ?? scenario.id}\n\n` +
        `\`scenario: ${scenario.id}\`\n` +
        (scenario.mode ? `\`mode: ${scenario.mode}\`\n` : "") +
        (scenario.packId ? `\`pack: ${scenario.packId}\`\n` : "") +
        `\`${nodeIds.length} scenes\``,
      x: -4400,
      y: rowY,
      width: HEADER_W,
      height: Math.min(220, 80 + nodeIds.length * 4),
    });

    let prevCanvasId = headerId;
    for (let i = 0; i < nodeIds.length; i++) {
      const nodeId = nodeIds[i]!;
      const cid = canvasNodeId(scenario.id, nodeId);
      if (i === 0) {
        scenarioFirstCanvasId.push(cid);
      }
      const meta = nodeMeta.get(nodeId);
      const paths = idToPaths.get(nodeId);
      const title = meta?.title ?? "";
      const picked = paths?.length
        ? pickCanonicalVaultPath(paths)
        : { file: null as string | null, duplicateNonLocale: false };

      if (picked.file && !picked.duplicateNonLocale) {
        nodes.push({
          id: cid,
          type: "file",
          file: `${storyRootRelativePath}/${picked.file}`,
          x: -4400 + HEADER_W + 40 + i * (NODE_W + GAP_X),
          y: rowY,
          width: NODE_W,
          height: NODE_H,
        });
      } else if (picked.duplicateNonLocale) {
        nodes.push({
          id: cid,
          type: "text",
          text:
            `## DUPLICATE VAULT id\n\n\`${nodeId}\`\n\n` +
            (paths ?? []).map((p) => `- \`${p}\``).join("\n"),
          x: -4400 + HEADER_W + 40 + i * (NODE_W + GAP_X),
          y: rowY,
          width: NODE_W,
          height: NODE_H,
        });
      } else {
        nodes.push({
          id: cid,
          type: "text",
          text:
            `## ${nodeId}\n\n` +
            (title ? `${title}\n\n` : "") +
            "**Нет .md в StoryDetective** с `id: " +
            nodeId +
            "`",
          x: -4400 + HEADER_W + 40 + i * (NODE_W + GAP_X),
          y: rowY,
          width: NODE_W,
          height: NODE_H,
        });
      }

      const fromSide = i === 0 ? "right" : "right";
      const toSide = i === 0 ? "left" : "left";
      edges.push({
        id: `e_${scenario.id}_${i}_seq`.replace(/[^a-zA-Z0-9_]/g, "_"),
        fromNode: prevCanvasId,
        fromSide,
        toNode: cid,
        toSide: toSide,
        ...(i > 0 ? {} : { label: "start" }),
      });
      prevCanvasId = cid;
    }
    scenarioLastCanvasId.push(prevCanvasId);
    row += 1;
  }

  let eHandoff = 0;
  for (let si = 0; si < wantedScenarios.length; si++) {
    const s = wantedScenarios[si]!;
    const nextId = s.completionRoute?.nextScenarioId;
    if (!nextId) {
      continue;
    }
    const ti = wantedScenarios.findIndex((x) => x.id === nextId);
    if (ti === -1) {
      continue;
    }
    const fromC = scenarioLastCanvasId[si];
    const toC = scenarioFirstCanvasId[ti];
    if (fromC && toC) {
      edges.push({
        id: `e_handoff_${eHandoff++}`,
        fromNode: fromC,
        fromSide: "right",
        toNode: toC,
        toSide: "left",
        label: `→ ${nextId}`,
      });
    }
  }

  const outPath = path.join(
    path.dirname(__dirname),
    "obsidian",
    "StoryDetective",
    "40_GameViewer",
    "Case01",
    "Case01_Mainline_PilotFlow.canvas",
  );
  const json = JSON.stringify({ nodes, edges }, null, "\t");
  writeFileSync(outPath, `${json}\n`, "utf8");

  const missingMd = new Set<string>();
  for (const s of wantedScenarios) {
    for (const nid of s.nodeIds ?? []) {
      const p = idToPaths.get(nid);
      const pick = p?.length
        ? pickCanonicalVaultPath(p)
        : { file: null, duplicateNonLocale: false };
      if (!pick.file || pick.duplicateNonLocale) {
        missingMd.add(nid);
      }
    }
  }

  console.log(`[canvas] Wrote ${outPath}`);
  console.log(`[canvas] Scenarios: ${wantedScenarios.length}`);
  console.log(
    `[canvas] Scene nodes total: ${wantedScenarios.reduce((a, s) => a + (s.nodeIds?.length ?? 0), 0)}`,
  );
  console.log(`[canvas] Missing strict Obsidian id match: ${missingMd.size}`);
  if (missingMd.size > 0 && missingMd.size <= 40) {
    console.log([...missingMd].sort().join("\n"));
  } else if (missingMd.size > 40) {
    console.log([...missingMd].sort().slice(0, 40).join("\n"));
    console.log(`[canvas] … and ${missingMd.size - 40} more`);
  }
  if (duplicateVaultIds.length > 0) {
    console.error("[canvas] Duplicate frontmatter ids in vault:");
    for (const line of duplicateVaultIds) {
      console.error(`- ${line}`);
    }
  }
}

main();
