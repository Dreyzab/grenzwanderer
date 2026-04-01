import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type VisibilityClass =
  | "public-by-design"
  | "player-scoped"
  | "operational-private";

export type MigrationWave =
  | "retain-public"
  | "wave1-operational"
  | "wave2-sessional"
  | "wave3-core-progression";

export interface VisibilityMatrixEntry {
  tableName: string;
  schemaExport: string;
  visibilityClass: VisibilityClass;
  replacementReadPath: string;
  migrationWave: MigrationWave;
  rationale: string;
}

export interface PublicSchemaTable {
  tableName: string;
  schemaExport: string;
}

export interface ConsumerInventory {
  playerUiFiles: string[];
  smokeFiles: string[];
  operatorDebugFiles: string[];
  internalRuntimeFiles: string[];
}

export interface VisibilityInventoryRow extends VisibilityMatrixEntry {
  consumers: ConsumerInventory;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const schemaPath = path.join(repoRoot, "spacetimedb", "src", "schema.ts");
const ignoredDirectoryNames = new Set([
  ".git",
  ".venv",
  "__pycache__",
  "dist",
  "node_modules",
  "site-packages",
]);
const fileListCache = new Map<string, string[]>();
const fileSourceCache = new Map<string, string>();
let publicSchemaTablesCache: PublicSchemaTable[] | null = null;
let visibilityInventoryCache: VisibilityInventoryRow[] | null = null;

const entry = (
  tableName: string,
  schemaExport: string,
  visibilityClass: VisibilityClass,
  replacementReadPath: string,
  migrationWave: MigrationWave,
  rationale: string,
): VisibilityMatrixEntry => ({
  tableName,
  schemaExport,
  visibilityClass,
  replacementReadPath,
  migrationWave,
  rationale,
});

export const visibilityMatrix: VisibilityMatrixEntry[] = [
  entry(
    "player_profile",
    "playerProfile",
    "player-scoped",
    "my_player_profile",
    "wave3-core-progression",
    "Per-player identity metadata should become self-scoped rather than globally readable.",
  ),
  entry(
    "player_flag",
    "playerFlag",
    "player-scoped",
    "my_player_flags",
    "wave3-core-progression",
    "Flags drive HomePage, VN, map, and social flows, so they need a scoped read model before any visibility flip.",
  ),
  entry(
    "player_var",
    "playerVar",
    "player-scoped",
    "my_player_vars",
    "wave3-core-progression",
    "Per-player numeric state powers VN, battle, and map logic and should move behind self-scoped reads.",
  ),
  entry(
    "player_location",
    "playerLocation",
    "player-scoped",
    "my_player_location",
    "wave3-core-progression",
    "Current location is player-private progression state consumed directly by map/runtime surfaces.",
  ),
  entry(
    "player_inventory",
    "playerInventory",
    "player-scoped",
    "my_player_inventory",
    "wave3-core-progression",
    "Inventory is player-private state used in map and detective hub surfaces.",
  ),
  entry(
    "vn_session",
    "vnSession",
    "player-scoped",
    "my_vn_sessions",
    "wave3-core-progression",
    "Live VN progress is player-owned runtime state and should not remain raw-public once scoped reads exist.",
  ),
  entry(
    "vn_skill_check_result",
    "vnSkillCheckResult",
    "player-scoped",
    "my_vn_skill_results",
    "wave3-core-progression",
    "Skill check history is player-specific progression data currently read directly by the VN UI.",
  ),
  entry(
    "content_version",
    "contentVersion",
    "public-by-design",
    "retain public active content metadata",
    "retain-public",
    "Active content metadata is shared runtime state every client needs to resolve the current snapshot.",
  ),
  entry(
    "content_snapshot",
    "contentSnapshot",
    "public-by-design",
    "retain public active content snapshot",
    "retain-public",
    "The current runtime content payload is the client-consumed source for VN and map content.",
  ),
  entry(
    "idempotency_log",
    "idempotencyLog",
    "operational-private",
    "no client read path",
    "wave1-operational",
    "Idempotency bookkeeping is backend-only operational state and should leave the client surface first.",
  ),
  entry(
    "telemetry_event",
    "telemetryEvent",
    "operational-private",
    "ops export or server-side audit stream",
    "wave1-operational",
    "Raw telemetry contains operational payloads and should not remain raw-client-readable.",
  ),
  entry(
    "telemetry_aggregate",
    "telemetryAggregate",
    "operational-private",
    "ops dashboard feed",
    "wave1-operational",
    "Telemetry rollups are operational analytics artifacts, not player-facing runtime state.",
  ),
  entry(
    "ai_request",
    "aiRequest",
    "operational-private",
    "my_ai_requests",
    "wave1-operational",
    "AI request rows mix player-facing thought history with backend processing state, so they need a scoped projection before closure.",
  ),
  entry(
    "worker_identity",
    "workerIdentity",
    "operational-private",
    "no client read path",
    "wave1-operational",
    "Worker registration is internal infrastructure state and should not stay public after allowlist hardening.",
  ),
  entry(
    "mind_case",
    "mindCase",
    "public-by-design",
    "retain public shared case catalog",
    "retain-public",
    "Mind Palace case definitions are shared authored content rather than player-private progression.",
  ),
  entry(
    "mind_fact",
    "mindFact",
    "public-by-design",
    "retain public shared fact catalog",
    "retain-public",
    "Fact definitions are authored content used to render Mind Palace state for every client.",
  ),
  entry(
    "mind_hypothesis",
    "mindHypothesis",
    "public-by-design",
    "retain public shared hypothesis catalog",
    "retain-public",
    "Hypothesis definitions are shared authored content that pair with player-specific validation state.",
  ),
  entry(
    "player_mind_case",
    "playerMindCase",
    "player-scoped",
    "my_mind_cases",
    "wave2-sessional",
    "Per-player case progression should move behind self-scoped Mind Palace reads.",
  ),
  entry(
    "player_mind_fact",
    "playerMindFact",
    "player-scoped",
    "my_mind_facts",
    "wave2-sessional",
    "Discovered facts are player-specific deduction state currently consumed by Mind Palace and smoke flows.",
  ),
  entry(
    "player_mind_hypothesis",
    "playerMindHypothesis",
    "player-scoped",
    "my_mind_hypotheses",
    "wave2-sessional",
    "Validated or pending hypotheses are player-private deduction state.",
  ),
  entry(
    "player_quest",
    "playerQuest",
    "player-scoped",
    "my_quests",
    "wave3-core-progression",
    "Quest stage state is player progression data used by map, character, and social flows.",
  ),
  entry(
    "player_evidence",
    "playerEvidence",
    "player-scoped",
    "my_evidence",
    "wave3-core-progression",
    "Evidence discovery is player-owned progression state and should become self-scoped.",
  ),
  entry(
    "player_relationship",
    "playerRelationship",
    "player-scoped",
    "my_relationships",
    "wave3-core-progression",
    "Relationship values are player-specific social state and should not stay globally readable.",
  ),
  entry(
    "player_npc_state",
    "playerNpcState",
    "player-scoped",
    "my_npc_state",
    "wave3-core-progression",
    "NPC trust and availability are player-private progression state used in character and map surfaces.",
  ),
  entry(
    "player_npc_favor",
    "playerNpcFavor",
    "player-scoped",
    "my_npc_favors",
    "wave3-core-progression",
    "Favor balances are player-private social currency used across VN and Freiburg social smokes.",
  ),
  entry(
    "player_faction_signal",
    "playerFactionSignal",
    "player-scoped",
    "my_faction_signals",
    "wave3-core-progression",
    "Faction standing is player-specific progression data consumed directly by the character surface.",
  ),
  entry(
    "player_agency_career",
    "playerAgencyCareer",
    "player-scoped",
    "my_agency_career",
    "wave3-core-progression",
    "Agency rank and criteria state are player-private progression but currently power multiple supported Freiburg flows.",
  ),
  entry(
    "player_rumor_state",
    "playerRumorState",
    "player-scoped",
    "my_rumor_state",
    "wave3-core-progression",
    "Rumor verification state is player-private and heavily coupled to Freiburg social progression.",
  ),
  entry(
    "battle_session",
    "battleSession",
    "player-scoped",
    "my_battle_sessions",
    "wave2-sessional",
    "Battle runtime state is player-owned session data with a narrower surface than map/VN core reads.",
  ),
  entry(
    "battle_combatant",
    "battleCombatant",
    "player-scoped",
    "my_battle_combatants",
    "wave2-sessional",
    "Battle combatant rows are session-scoped player state for the dedicated battle UI.",
  ),
  entry(
    "battle_card_instance",
    "battleCardInstance",
    "player-scoped",
    "my_battle_cards",
    "wave2-sessional",
    "Battle hand and zone state is player-specific runtime session data.",
  ),
  entry(
    "battle_history",
    "battleHistory",
    "player-scoped",
    "my_battle_history",
    "wave2-sessional",
    "Battle history is player-owned session output used only inside battle-related surfaces and smokes.",
  ),
  entry(
    "command_session",
    "commandSession",
    "player-scoped",
    "my_command_sessions",
    "wave2-sessional",
    "Command mode state is player-specific session data consumed by a dedicated screen.",
  ),
  entry(
    "command_party_member",
    "commandPartyMember",
    "player-scoped",
    "my_command_party",
    "wave2-sessional",
    "Command party members are session-scoped runtime rows for command mode only.",
  ),
  entry(
    "command_order_history",
    "commandOrderHistory",
    "player-scoped",
    "my_command_history",
    "wave2-sessional",
    "Command history is player-specific session output and can migrate after a narrower replacement path exists.",
  ),
  entry(
    "player_unlock_group",
    "playerUnlockGroup",
    "player-scoped",
    "my_unlock_groups",
    "wave3-core-progression",
    "Unlock groups gate supported Freiburg routes and currently fan into map and social smokes.",
  ),
  entry(
    "player_map_event",
    "playerMapEvent",
    "player-scoped",
    "my_map_events",
    "wave3-core-progression",
    "Spawned map events are player-private map state used directly by map runtime hooks.",
  ),
  entry(
    "player_redeemed_code",
    "playerRedeemedCode",
    "player-scoped",
    "my_redeemed_codes",
    "wave3-core-progression",
    "Redeemed code history is player-private map/runtime state and should become self-scoped.",
  ),
];

const readCachedUtf8 = (filePath: string): string => {
  const cached = fileSourceCache.get(filePath);
  if (cached !== undefined) {
    return cached;
  }

  const source = readFileSync(filePath, "utf8");
  fileSourceCache.set(filePath, source);
  return source;
};

const walkFiles = (rootDir: string): string[] => {
  const cached = fileListCache.get(rootDir);
  if (cached) {
    return cached;
  }

  const entries: string[] = [];

  for (const name of readdirSync(rootDir)) {
    if (ignoredDirectoryNames.has(name)) {
      continue;
    }

    const fullPath = path.join(rootDir, name);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      entries.push(...walkFiles(fullPath));
      continue;
    }

    if (!/\.(ts|tsx|md)$/i.test(name)) {
      continue;
    }

    entries.push(fullPath);
  }

  fileListCache.set(rootDir, entries);
  return entries;
};

const toRepoPath = (fullPath: string): string =>
  path.relative(repoRoot, fullPath).replace(/\\/g, "/");

const addRef = (
  map: Map<string, Set<string>>,
  key: string,
  filePath: string,
) => {
  const next = map.get(key) ?? new Set<string>();
  next.add(toRepoPath(filePath));
  map.set(key, next);
};

const collectUiRefs = (): {
  playerUiRefs: Map<string, Set<string>>;
  operatorDebugRefs: Map<string, Set<string>>;
} => {
  const playerUiRefs = new Map<string, Set<string>>();
  const operatorDebugRefs = new Map<string, Set<string>>();
  const files = walkFiles(path.join(repoRoot, "src")).filter(
    (filePath) => !/\.test\.(ts|tsx)$/i.test(filePath),
  );

  for (const filePath of files) {
    const source = readCachedUtf8(filePath);
    const refs = source.matchAll(/useTable\s*\(\s*tables\.(\w+)/g);
    const isOperatorDebug = /(VnPilotPanel|DevPage)\.tsx$/i.test(filePath);
    for (const match of refs) {
      if (isOperatorDebug) {
        addRef(operatorDebugRefs, match[1], filePath);
      } else {
        addRef(playerUiRefs, match[1], filePath);
      }
    }
  }

  return { playerUiRefs, operatorDebugRefs };
};

const collectSmokeRefs = (): Map<string, Set<string>> => {
  const smokeRefs = new Map<string, Set<string>>();
  const files = walkFiles(path.join(repoRoot, "scripts")).filter(
    (filePath) => !/\.test\.ts$/i.test(filePath),
  );

  for (const filePath of files) {
    const source = readCachedUtf8(filePath);
    for (const match of source.matchAll(/SELECT \* FROM ([a-z0-9_]+)/g)) {
      addRef(smokeRefs, match[1], filePath);
    }
  }

  return smokeRefs;
};

const collectRuntimeRefs = (): Map<string, Set<string>> => {
  const runtimeRefs = new Map<string, Set<string>>();
  const files = walkFiles(path.join(repoRoot, "spacetimedb", "src")).filter(
    (filePath) => !/schema\.ts$/i.test(filePath),
  );

  for (const filePath of files) {
    const source = readCachedUtf8(filePath);
    for (const match of source.matchAll(/\bctx\.db\.(\w+)/g)) {
      addRef(runtimeRefs, match[1], filePath);
    }
  }

  return runtimeRefs;
};

const parsePublicSchemaTables = (schemaSource: string): PublicSchemaTable[] => {
  const tables: PublicSchemaTable[] = [];
  const tablePattern =
    /export const (\w+) = table\(\s*\{([\s\S]*?)\}\s*,\s*\{/g;

  for (const match of schemaSource.matchAll(tablePattern)) {
    const schemaExport = match[1];
    const optionsBlock = match[2];
    const tableNameMatch = optionsBlock.match(/name:\s*"([^"]+)"/);
    if (!tableNameMatch || !/public:\s*true/.test(optionsBlock)) {
      continue;
    }

    tables.push({
      tableName: tableNameMatch[1],
      schemaExport,
    });
  }

  return tables;
};

export const extractPublicSchemaTables = (
  schemaSource?: string,
): PublicSchemaTable[] => {
  if (schemaSource !== undefined) {
    return parsePublicSchemaTables(schemaSource);
  }

  if (publicSchemaTablesCache) {
    return publicSchemaTablesCache;
  }

  publicSchemaTablesCache = parsePublicSchemaTables(readCachedUtf8(schemaPath));
  return publicSchemaTablesCache;
};

export const buildVisibilityInventory = (): VisibilityInventoryRow[] => {
  if (visibilityInventoryCache) {
    return visibilityInventoryCache;
  }

  const { playerUiRefs, operatorDebugRefs } = collectUiRefs();
  const smokeRefs = collectSmokeRefs();
  const runtimeRefs = collectRuntimeRefs();

  visibilityInventoryCache = visibilityMatrix.map((entryValue) => ({
    ...entryValue,
    consumers: {
      playerUiFiles: [
        ...(playerUiRefs.get(entryValue.schemaExport) ?? []),
      ].sort(),
      smokeFiles: [...(smokeRefs.get(entryValue.tableName) ?? [])].sort(),
      operatorDebugFiles: [
        ...(operatorDebugRefs.get(entryValue.schemaExport) ?? []),
      ].sort(),
      internalRuntimeFiles: [
        ...(runtimeRefs.get(entryValue.schemaExport) ?? []),
      ].sort(),
    },
  }));

  return visibilityInventoryCache;
};

const countsByClass = (
  rows: VisibilityMatrixEntry[],
): Record<VisibilityClass, number> => ({
  "public-by-design": rows.filter(
    (entryValue) => entryValue.visibilityClass === "public-by-design",
  ).length,
  "player-scoped": rows.filter(
    (entryValue) => entryValue.visibilityClass === "player-scoped",
  ).length,
  "operational-private": rows.filter(
    (entryValue) => entryValue.visibilityClass === "operational-private",
  ).length,
});

const summarizeConsumers = (consumers: ConsumerInventory): string => {
  const labels: string[] = [];
  if (consumers.playerUiFiles.length > 0) {
    labels.push("player UI");
  }
  if (consumers.smokeFiles.length > 0) {
    labels.push("smoke");
  }
  if (consumers.operatorDebugFiles.length > 0) {
    labels.push("operator/debug");
  }
  if (consumers.internalRuntimeFiles.length > 0) {
    labels.push("internal runtime");
  }
  return labels.join(", ") || "unreferenced";
};

export const validateVisibilityMatrix = (): void => {
  const publicTables = extractPublicSchemaTables();
  const publicTableNames = new Set(
    publicTables.map((tableInfo) => tableInfo.tableName),
  );
  const publicSchemaExports = new Set(
    publicTables.map((tableInfo) => tableInfo.schemaExport),
  );
  const seenTableNames = new Set<string>();
  const seenSchemaExports = new Set<string>();
  const problems: string[] = [];

  for (const entryValue of visibilityMatrix) {
    if (seenTableNames.has(entryValue.tableName)) {
      problems.push(
        `Duplicate matrix entry for table '${entryValue.tableName}'.`,
      );
    }
    seenTableNames.add(entryValue.tableName);

    if (seenSchemaExports.has(entryValue.schemaExport)) {
      problems.push(
        `Duplicate matrix entry for schema export '${entryValue.schemaExport}'.`,
      );
    }
    seenSchemaExports.add(entryValue.schemaExport);

    if (!publicTableNames.has(entryValue.tableName)) {
      problems.push(
        `Matrix entry '${entryValue.tableName}' is not a current public table in schema.ts.`,
      );
    }

    if (!publicSchemaExports.has(entryValue.schemaExport)) {
      problems.push(
        `Matrix entry '${entryValue.schemaExport}' is not a current public schema export.`,
      );
    }

    if (entryValue.visibilityClass === "public-by-design") {
      if (entryValue.migrationWave !== "retain-public") {
        problems.push(
          `Public-by-design table '${entryValue.tableName}' must stay in 'retain-public'.`,
        );
      }
    } else if (entryValue.migrationWave === "retain-public") {
      problems.push(
        `Non-public-by-design table '${entryValue.tableName}' cannot stay in 'retain-public'.`,
      );
    }

    if (entryValue.replacementReadPath.trim().length === 0) {
      problems.push(
        `Table '${entryValue.tableName}' is missing a replacement read path note.`,
      );
    }

    if (entryValue.rationale.trim().length === 0) {
      problems.push(`Table '${entryValue.tableName}' is missing a rationale.`);
    }
  }

  for (const tableInfo of publicTables) {
    if (!seenTableNames.has(tableInfo.tableName)) {
      problems.push(
        `Public table '${tableInfo.tableName}' is missing from the visibility matrix.`,
      );
    }
  }

  if (problems.length > 0) {
    throw new Error(problems.join("\n"));
  }
};

export const formatVisibilityMatrixMarkdown = (): string => {
  validateVisibilityMatrix();
  const inventory = buildVisibilityInventory();
  const classificationCounts = countsByClass(visibilityMatrix);
  const wave1Tables = visibilityMatrix
    .filter((entryValue) => entryValue.migrationWave === "wave1-operational")
    .map((entryValue) => `\`${entryValue.tableName}\``)
    .join(", ");

  const lines = [
    "# SpacetimeDB Visibility Matrix",
    "",
    `- Public tables inventoried: ${visibilityMatrix.length}`,
    `- public-by-design: ${classificationCounts["public-by-design"]}`,
    `- player-scoped: ${classificationCounts["player-scoped"]}`,
    `- operational-private: ${classificationCounts["operational-private"]}`,
    "",
    `First migration tranche: ${wave1Tables}`,
    "",
    "| Table | Class | Consumers | Replacement path | Wave |",
    "| --- | --- | --- | --- | --- |",
  ];

  for (const row of inventory) {
    lines.push(
      `| \`${row.tableName}\` | \`${row.visibilityClass}\` | ${summarizeConsumers(row.consumers)} | \`${row.replacementReadPath}\` | \`${row.migrationWave}\` |`,
    );
  }

  return lines.join("\n");
};

const printCheckSummary = (): void => {
  validateVisibilityMatrix();
  const counts = countsByClass(visibilityMatrix);
  console.log(
    [
      `Visibility matrix valid for ${visibilityMatrix.length} public tables.`,
      `public-by-design=${counts["public-by-design"]}`,
      `player-scoped=${counts["player-scoped"]}`,
      `operational-private=${counts["operational-private"]}`,
    ].join(" "),
  );
};

if (import.meta.main) {
  if (process.argv.includes("--check")) {
    printCheckSummary();
  } else {
    console.log(formatVisibilityMatrixMarkdown());
  }
}
