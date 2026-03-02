import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const thisFile = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(thisFile), "..");
const srcRoot = path.join(repoRoot, "src");
const allowedMain = path.normalize(path.join(srcRoot, "main.tsx"));
const allowedSharedPrefix =
  path.normalize(path.join(srcRoot, "shared", "spacetime")) + path.sep;

const isSourceFile = (entryPath: string): boolean =>
  entryPath.endsWith(".ts") || entryPath.endsWith(".tsx");

const walk = (directory: string): string[] => {
  const entries = readdirSync(directory);
  const files: string[] = [];

  for (const entry of entries) {
    const absolute = path.join(directory, entry);
    const stats = statSync(absolute);
    if (stats.isDirectory()) {
      files.push(...walk(absolute));
      continue;
    }
    if (isSourceFile(absolute)) {
      files.push(path.normalize(absolute));
    }
  }

  return files;
};

const sourceFiles = walk(srcRoot);
const violations = sourceFiles.filter((filePath) => {
  if (filePath === allowedMain) {
    return false;
  }
  if (filePath.startsWith(allowedSharedPrefix)) {
    return false;
  }

  const content = readFileSync(filePath, "utf8");
  return content.includes("module_bindings");
});

if (violations.length > 0) {
  console.error("Forbidden module_bindings imports found:");
  for (const violation of violations) {
    console.error(`- ${path.relative(repoRoot, violation)}`);
  }
  process.exit(1);
}

console.log("module_bindings import boundary check passed.");
