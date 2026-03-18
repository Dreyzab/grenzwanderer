import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const appShellPath = path.join(repoRoot, "src", "app", "AppShell.tsx");
const sharedBindingsPath = path.join(
  repoRoot,
  "src",
  "shared",
  "spacetime",
  "bindings.ts",
);
const devPagePath = path.join(repoRoot, "src", "pages", "DevPage.tsx");

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

const rawPrivateQueryPatterns = [
  /SELECT \* FROM ai_request\b/,
  /SELECT \* FROM vn_session\b/,
  /SELECT \* FROM vn_skill_check_result\b/,
  /SELECT \* FROM player_[a-z0-9_]+\b/,
  /SELECT \* FROM battle_[a-z0-9_]+\b/,
  /SELECT \* FROM command_[a-z0-9_]+\b/,
  /SELECT \* FROM telemetry_event\b/,
  /SELECT \* FROM telemetry_aggregate\b/,
  /SELECT \* FROM audit_log\b/,
  /SELECT \* FROM player_presence\b/,
  /SELECT \* FROM ops_external_metric\b/,
  /SELECT \* FROM idempotency_log\b/,
  /SELECT \* FROM worker_identity\b/,
];

const bundleRoots = [
  path.join(repoRoot, "src"),
  path.join(repoRoot, "scripts"),
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

for (const rootDir of bundleRoots) {
  for (const filePath of walk(rootDir)) {
    const source = readFileSync(filePath, "utf8");
    for (const pattern of rawPrivateQueryPatterns) {
      if (pattern.test(source)) {
        issues.push(
          `${toRepoPath(filePath)} still subscribes to a raw private relation: ${pattern.source}.`,
        );
      }
    }
  }
}

if (issues.length > 0) {
  fail(issues);
}

console.log("security surface check passed.");
