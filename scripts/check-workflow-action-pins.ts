import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), "..");
const workflowsRoot = path.join(repoRoot, ".github", "workflows");
const fullShaPattern = /^[0-9a-f]{40}$/i;

const workflowFiles = readdirSync(workflowsRoot)
  .filter((name) => /\.(ya?ml)$/i.test(name))
  .map((name) => path.join(workflowsRoot, name));

const issues: string[] = [];

for (const filePath of workflowFiles) {
  const source = readFileSync(filePath, "utf8");
  const repoPath = path.relative(repoRoot, filePath).replace(/\\/g, "/");

  for (const match of source.matchAll(/^\s*uses:\s*["']?([^"'\s#]+)["']?/gm)) {
    const usesValue = match[1];
    if (usesValue.startsWith("./")) {
      continue;
    }

    const atIndex = usesValue.lastIndexOf("@");
    if (atIndex === -1) {
      issues.push(`${repoPath}: uses '${usesValue}' is missing an @ref.`);
      continue;
    }

    const ref = usesValue.slice(atIndex + 1);
    if (!fullShaPattern.test(ref)) {
      issues.push(
        `${repoPath}: uses '${usesValue}' must be pinned to a full 40-character commit SHA.`,
      );
    }
  }
}

if (issues.length > 0) {
  console.error("Unpinned GitHub Actions found:");
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log("workflow action pin check passed.");
