/**
 * Character bridge validator.
 *
 * Reconciles Obsidian `char_*.md` design notes against the runtime character id
 * namespaces and reports drift: unresolved runtime ids, name drift, duplicate
 * dossiers, and major runtime NPCs with no dossier.
 *
 *   bun run content:character:bridge          # write ledger + print summary
 *   bun run content:character:bridge --check  # also exit 1 on error-severity findings
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  designDocsRoot,
  repoRoot,
  storyRoot,
} from "./content-authoring-contract";
import { FREIBURG_SOCIAL_CATALOG } from "./data/freiburg_social_catalog";
import { FREIBURG_NPC_REGISTRY_BY_ID } from "./data/freiburg_location_cast";
import { getCharacterPortrait } from "../src/features/vn/characterAssets";
import {
  buildBridgeFindings,
  summarizeFindings,
  type BridgeFinding,
  type BridgeSeverity,
  type CharNote,
  type CharVault,
  type RuntimeRegistries,
} from "./character-bridge-core";

const failOnError = process.argv.includes("--check");
const ledgerPath = path.join(repoRoot, "docs", "CHARACTER_BRIDGE_LEDGER.md");

const walkCharNoteFiles = (directory: string): string[] => {
  const files: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) {
      continue;
    }
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkCharNoteFiles(absolutePath));
      continue;
    }
    if (
      entry.isFile() &&
      entry.name.startsWith("char_") &&
      entry.name.endsWith(".md") &&
      !/\.[a-z]{2}\.md$/.test(entry.name)
    ) {
      files.push(absolutePath);
    }
  }
  return files;
};

const extractFrontmatter = (markdown: string): string | null => {
  const normalized = markdown.replace(/^\uFEFF/, "");
  const match = normalized.match(/^---\n([\s\S]*?)\n---/);
  return match ? match[1] : null;
};

const scalarField = (frontmatter: string, key: string): string | undefined => {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
  if (!match) {
    return undefined;
  }
  return match[1].trim().replace(/^["']|["']$/g, "") || undefined;
};

const parseAliases = (frontmatter: string): string[] => {
  const inline = frontmatter.match(/^aliases:\s*\[(.*)\]\s*$/m);
  if (inline) {
    return inline[1]
      .split(",")
      .map((value) => value.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
  }
  // YAML block list fallback.
  const blockMatch = frontmatter.match(/^aliases:\s*\n((?:\s*-\s*.+\n?)+)/m);
  if (blockMatch) {
    return blockMatch[1]
      .split("\n")
      .map((line) =>
        line
          .replace(/^\s*-\s*/, "")
          .trim()
          .replace(/^["']|["']$/g, ""),
      )
      .filter(Boolean);
  }
  return [];
};

const parseHeading = (markdown: string): string | undefined => {
  const body = markdown
    .replace(/^\uFEFF/, "")
    .replace(/^---\n[\s\S]*?\n---\n?/, "");
  const match = body.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : undefined;
};

const toRepoRelative = (absolutePath: string): string =>
  path.relative(repoRoot, absolutePath).replaceAll("\\", "/");

const readCharNotes = (): CharNote[] => {
  const notes: CharNote[] = [];
  const seenPaths = new Set<string>();

  for (const root of [designDocsRoot, storyRoot]) {
    for (const absolutePath of walkCharNoteFiles(root)) {
      if (seenPaths.has(absolutePath)) {
        continue;
      }
      seenPaths.add(absolutePath);

      const markdown = readFileSync(absolutePath, "utf8").replace(
        /\r\n/g,
        "\n",
      );
      const frontmatter = extractFrontmatter(markdown);
      if (!frontmatter) {
        continue;
      }

      const relativePath = toRepoRelative(absolutePath);
      const vault: CharVault = relativePath.startsWith("obsidian/Detectiv")
        ? "Detectiv"
        : "StoryDetective";
      const fileId =
        scalarField(frontmatter, "id") ?? path.basename(absolutePath, ".md");

      notes.push({
        fileId,
        vault,
        relativePath,
        runtimeCharacterId: scalarField(frontmatter, "runtime_character_id"),
        npcIdentity: scalarField(frontmatter, "npc_identity"),
        aliases: parseAliases(frontmatter),
        tier: scalarField(frontmatter, "tier"),
        displayName: parseHeading(markdown),
        designOnly: scalarField(frontmatter, "design_only") === "true",
      });
    }
  }

  return notes.sort((left, right) =>
    left.relativePath.localeCompare(right.relativePath),
  );
};

const registries: RuntimeRegistries = {
  socialNpcs: FREIBURG_SOCIAL_CATALOG.npcIdentities.map((npc) => ({
    id: npc.id,
    displayName: npc.displayName,
    rosterTier: npc.rosterTier,
  })),
  locationCastIds: Array.from(FREIBURG_NPC_REGISTRY_BY_ID.keys()),
  resolvesInAssets: (candidate) => getCharacterPortrait(candidate) !== null,
};

const SEVERITY_ORDER: BridgeSeverity[] = ["error", "warn", "info"];

const CATEGORY_TITLES: Record<string, string> = {
  "duplicate-runtime-id-same-vault":
    "Duplicate runtime id (same vault) — ambiguous",
  "duplicate-runtime-id-cross-vault":
    "Design + runtime dossier across vaults (intended split)",
  "unresolved-runtime-id":
    "Unresolved runtime_character_id — design-only or drift",
  "name-drift": "Name drift vs runtime displayName",
  "duplicate-dossier-file":
    "Dossier in both vaults (intended design/runtime split)",
  "no-runtime-binding": "No runtime binding (design/archetype note)",
  "design-only-archetype": "Design-only archetype (intentionally unbound)",
  "missing-dossier": "Major runtime NPC without a dossier",
};

const markdownCell = (value: string): string =>
  value.replaceAll("|", "\\|").replace(/\r?\n/g, "<br>");

const renderLedger = (
  notes: CharNote[],
  findings: BridgeFinding[],
  summary: Record<BridgeSeverity, number>,
): string => {
  const lines: string[] = [
    "# Character Bridge Ledger",
    "",
    "> Generated by `bun run content:character:bridge`. Do not hand-edit.",
    "> Reconciles Obsidian `char_*.md` notes against the runtime character id",
    "> namespaces (socialCatalog, location cast, character assets).",
    "",
    "## Summary",
    "",
    `- Char notes scanned: ${notes.length}`,
    `- With runtime_character_id: ${notes.filter((n) => n.runtimeCharacterId).length}`,
    `- Findings: ${summary.error} error, ${summary.warn} warn, ${summary.info} info`,
    "",
  ];

  const byCategory = new Map<string, BridgeFinding[]>();
  for (const finding of findings) {
    const group = byCategory.get(finding.category) ?? [];
    group.push(finding);
    byCategory.set(finding.category, group);
  }

  const orderedCategories = Object.keys(CATEGORY_TITLES).filter((category) =>
    byCategory.has(category),
  );

  for (const category of orderedCategories) {
    const group = byCategory.get(category) ?? [];
    lines.push(`## ${CATEGORY_TITLES[category]} (${group.length})`);
    lines.push("");
    lines.push("| Severity | Subject | Detail |");
    lines.push("| --- | --- | --- |");
    for (const finding of group.sort((a, b) =>
      a.subject.localeCompare(b.subject),
    )) {
      lines.push(
        `| ${finding.severity} | ${markdownCell(finding.subject)} | ${markdownCell(finding.detail)} |`,
      );
    }
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
};

const notes = readCharNotes();
const findings = buildBridgeFindings(notes, registries);
const summary = summarizeFindings(findings);

mkdirSync(path.dirname(ledgerPath), { recursive: true });
writeFileSync(ledgerPath, renderLedger(notes, findings, summary), "utf8");

console.log(
  `[content:character:bridge] Ledger written: ${toRepoRelative(ledgerPath)}`,
);
console.log(
  `[content:character:bridge] ${notes.length} notes scanned — ${summary.error} error, ${summary.warn} warn, ${summary.info} info.`,
);
for (const severity of SEVERITY_ORDER) {
  for (const finding of findings.filter((f) => f.severity === severity)) {
    const tag = severity.toUpperCase().padEnd(5);
    console.log(`  ${tag} [${finding.category}] ${finding.subject}`);
  }
}

if (failOnError && summary.error > 0) {
  console.error(
    `[content:character:bridge] --check failed: ${summary.error} error-severity finding(s).`,
  );
  process.exitCode = 1;
}
