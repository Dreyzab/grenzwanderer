import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const appShellPath = path.join(repoRoot, "src", "app", "AppShell.tsx");
const vnPagePath = path.join(repoRoot, "src", "pages", "VnPage.tsx");
const sharedBindingsPath = path.join(
  repoRoot,
  "src",
  "shared",
  "spacetime",
  "bindings.ts",
);
const devPagePath = path.join(repoRoot, "src", "pages", "DevPage.tsx");
const srcRoot = path.join(repoRoot, "src");
const scriptsRoot = path.join(repoRoot, "scripts");

const operationalPrivateRelations = [
  "idempotency_log",
  "telemetry_event",
  "telemetry_aggregate",
  "ai_request",
  "worker_identity",
] as const;

const playerScopedRelations = [
  "player_profile",
  "player_flag",
  "player_var",
  "player_location",
  "player_inventory",
  "player_spirit_state",
  "vn_session",
  "vn_skill_check_result",
  "player_mind_case",
  "player_mind_fact",
  "player_mind_hypothesis",
  "player_quest",
  "player_evidence",
  "player_relationship",
  "player_npc_state",
  "player_npc_favor",
  "player_faction_signal",
  "player_agency_career",
  "player_rumor_state",
  "battle_session",
  "battle_combatant",
  "battle_card_instance",
  "battle_history",
  "command_session",
  "command_party_member",
  "command_order_history",
  "player_unlock_group",
  "player_map_event",
  "player_redeemed_code",
] as const;

const governedPrivateRelations = [
  ...operationalPrivateRelations,
  ...playerScopedRelations,
] as const;

const governedPrivateTableAliases = new Set<string>([
  "playerProfile",
  "playerFlag",
  "playerVar",
  "playerLocation",
  "playerInventory",
  "playerSpiritState",
  "vnSession",
  "vnSkillCheckResult",
  "aiRequest",
  "playerMindCase",
  "playerMindFact",
  "playerMindHypothesis",
  "playerQuest",
  "playerEvidence",
  "playerRelationship",
  "playerNpcState",
  "playerNpcFavor",
  "playerFactionSignal",
  "playerAgencyCareer",
  "playerRumorState",
  "battleSession",
  "battleCombatant",
  "battleCardInstance",
  "battleHistory",
  "commandSession",
  "commandPartyMember",
  "commandOrderHistory",
  "playerUnlockGroup",
  "playerMapEvent",
  "playerRedeemedCode",
]);

const walk = (rootDir: string): string[] => {
  const files: string[] = [];

  for (const entry of readdirSync(rootDir)) {
    if (entry === "node_modules" || entry === "dist" || entry === ".git") {
      continue;
    }

    const fullPath = path.join(rootDir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      files.push(...walk(fullPath));
      continue;
    }

    if (/\.(ts|tsx)$/i.test(entry)) {
      files.push(fullPath);
    }
  }

  return files;
};

const toRepoPath = (fullPath: string): string =>
  path.relative(repoRoot, fullPath).replace(/\\/g, "/");

const fail = (issues: string[]): never => {
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  throw new Error("Security surface check failed.");
};

const browserFacingScriptPaths = walk(scriptsRoot).filter((filePath) =>
  /(^|\\)(smoke-[^\\]+\.ts|[a-z-]*smoke-helpers\.ts)$/i.test(filePath),
);

const rawPrivateQueryPatterns = governedPrivateRelations.map(
  (relationName) =>
    new RegExp(
      String.raw`\b(?:SELECT|INSERT|UPDATE|DELETE)\b[\s\S]{0,240}\b${relationName}\b`,
    ),
);

const forbiddenBrowserDebugPatterns: Array<{
  pattern: RegExp;
  description: string;
}> = [
  {
    pattern: /127\.0\.0\.1:7827/,
    description: "hardcoded local debug ingest endpoint",
  },
  {
    pattern: /\/ingest\/516e26f3-8222-4f1d-b4fe-801d6fa79ab1/,
    description: "hardcoded agent ingest path",
  },
];

const issues: string[] = [];

const appShellContent = readFileSync(appShellPath, "utf8");
if (
  appShellContent.includes("AdminPage") ||
  appShellContent.includes("DevPage") ||
  appShellContent.includes('| "admin"') ||
  appShellContent.includes('| "dev"') ||
  appShellContent.includes('{ id: "admin"') ||
  appShellContent.includes('{ id: "dev"')
) {
  issues.push("src/app/AppShell.tsx still exposes admin/debug navigation.");
}

const vnPageContent = readFileSync(vnPagePath, "utf8");
if (
  vnPageContent.includes("VnPilotPanel") ||
  vnPageContent.includes("Debug Panel") ||
  vnPageContent.includes("VN Debug Mode")
) {
  issues.push("src/pages/VnPage.tsx still exposes browser debug tooling.");
}

const sharedBindingsContent = readFileSync(sharedBindingsPath, "utf8");
if (/export\s+const\s+REMOTE_MODULE\b/.test(sharedBindingsContent)) {
  issues.push(
    "src/shared/spacetime/bindings.ts must not export REMOTE_MODULE.",
  );
}
for (const forbiddenReducer of [
  "bootstrapAdminIdentity",
  "grantAdminIdentity",
  "allowWorkerIdentity",
  "registerWorkerIdentity",
  "publishContent",
  "rollbackContent",
  "assertAdminAccess",
  "upsertOpsExternalMetric",
]) {
  if (new RegExp(`\\b${forbiddenReducer}\\b`).test(sharedBindingsContent)) {
    issues.push(
      `src/shared/spacetime/bindings.ts leaks privileged reducer ${forbiddenReducer}.`,
    );
  }
}

const devPageContent = readFileSync(devPagePath, "utf8");
for (const forbiddenToken of [
  "REMOTE_MODULE",
  "ReducerConsole",
  "useSpacetimeDB",
]) {
  if (devPageContent.includes(forbiddenToken)) {
    issues.push(`src/pages/DevPage.tsx still exposes ${forbiddenToken}.`);
  }
}

for (const filePath of walk(srcRoot)) {
  const source = readFileSync(filePath, "utf8");
  for (const { pattern, description } of forbiddenBrowserDebugPatterns) {
    if (pattern.test(source)) {
      issues.push(`${toRepoPath(filePath)} contains ${description}.`);
    }
  }
  for (const match of source.matchAll(/useTable\s*\(\s*tables\.(\w+)/g)) {
    const tableName = match[1];
    if (governedPrivateTableAliases.has(tableName)) {
      issues.push(
        `${toRepoPath(filePath)} still reads a governed private relation via useTable(tables.${tableName}).`,
      );
    }
  }
}

for (const filePath of browserFacingScriptPaths) {
  const source = readFileSync(filePath, "utf8");
  for (const pattern of rawPrivateQueryPatterns) {
    if (pattern.test(source)) {
      issues.push(
        `${toRepoPath(filePath)} still issues raw SQL against a governed private relation: ${pattern.source}.`,
      );
    }
  }
}

if (issues.length > 0) {
  fail(issues);
}

console.log("security surface check passed.");
