import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  PLAYER_FLAG_ALIAS_SET,
  PLAYER_FLAG_KEY_SET,
  PLAYER_KEY_ALIASES,
  PLAYER_VAR_ALIAS_SET,
  PLAYER_VAR_KEY_SET,
} from "../src/entities/player/keys";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

type KeyKind = "flag" | "var";

interface KeyHit {
  file: string;
  key: string;
  kind: KeyKind;
  operator: string;
}

interface PlayerKeyRegistryReport {
  unknownFlags: KeyHit[];
  unknownVars: KeyHit[];
  aliasHits: KeyHit[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const collectKeyHits = (value: unknown, file: string, hits: KeyHit[]): void => {
  if (Array.isArray(value)) {
    for (const entry of value) {
      collectKeyHits(entry, file, hits);
    }
    return;
  }

  if (!isRecord(value)) {
    return;
  }

  const type = value.type;
  const key = value.key;
  if (typeof type === "string" && typeof key === "string") {
    if (type === "set_flag" || type === "flag_equals") {
      hits.push({ file, key, kind: "flag", operator: type });
    }
    if (
      type === "set_var" ||
      type === "add_var" ||
      type === "var_gte" ||
      type === "var_lte"
    ) {
      hits.push({ file, key, kind: "var", operator: type });
    }
  }

  for (const child of Object.values(value)) {
    collectKeyHits(child, file, hits);
  }
};

export const checkPlayerKeyRegistry = (
  snapshotDir = path.join(repoRoot, "content", "vn"),
): PlayerKeyRegistryReport => {
  const hits: KeyHit[] = [];
  const files = readdirSync(snapshotDir)
    .filter((file) => file.endsWith(".snapshot.json"))
    .sort();

  for (const file of files) {
    const fullPath = path.join(snapshotDir, file);
    collectKeyHits(JSON.parse(readFileSync(fullPath, "utf8")), file, hits);
  }

  return {
    unknownFlags: hits.filter(
      (hit) =>
        hit.kind === "flag" &&
        !PLAYER_FLAG_KEY_SET.has(hit.key) &&
        !PLAYER_FLAG_ALIAS_SET.has(hit.key),
    ),
    unknownVars: hits.filter(
      (hit) =>
        hit.kind === "var" &&
        !PLAYER_VAR_KEY_SET.has(hit.key) &&
        !PLAYER_VAR_ALIAS_SET.has(hit.key),
    ),
    aliasHits: hits.filter((hit) =>
      hit.kind === "flag"
        ? PLAYER_FLAG_ALIAS_SET.has(hit.key)
        : PLAYER_VAR_ALIAS_SET.has(hit.key),
    ),
  };
};

const formatHits = (hits: readonly KeyHit[]): string =>
  hits.map((hit) => `${hit.file}: ${hit.operator}(${hit.key})`).join("\n");

const runCli = (): void => {
  const report = checkPlayerKeyRegistry();
  if (report.aliasHits.length > 0) {
    const aliasNotes = PLAYER_KEY_ALIASES.map(
      (entry) =>
        `${entry.kind} alias ${entry.aliasKey} -> ${entry.canonicalKey}; ${entry.removal}`,
    ).join("\n");
    console.warn(`Player key compatibility aliases in use:\n${aliasNotes}`);
    console.warn(formatHits(report.aliasHits));
  }

  if (report.unknownFlags.length > 0 || report.unknownVars.length > 0) {
    const sections = [
      report.unknownFlags.length > 0
        ? `Unknown player flags:\n${formatHits(report.unknownFlags)}`
        : null,
      report.unknownVars.length > 0
        ? `Unknown player vars:\n${formatHits(report.unknownVars)}`
        : null,
    ].filter((entry): entry is string => entry !== null);
    throw new Error(sections.join("\n\n"));
  }

  console.log("Player key registry check passed.");
};

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  runCli();
}
