import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const indexFilePath = join("src", "module_bindings", "index.ts");

try {
  let content = readFileSync(indexFilePath, "utf8");

  // If already exported, do nothing
  if (!content.includes("export const REMOTE_MODULE")) {
    // Replace const with export const
    content = content.replace(
      "const REMOTE_MODULE = {",
      "export const REMOTE_MODULE = {",
    );

    // Append the sourceName patch
    const patchSnippet = `
// --- AUTOMATICALLY APPENDED BY POSTGENERATE.TS ---
const toSnakeCase = (value: string): string =>
  value
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .toLowerCase();

for (const [key, table] of Object.entries(REMOTE_MODULE.tables)) {
    (table as any).sourceName = toSnakeCase(key);
}
// -------------------------------------------------
`;
    content += patchSnippet;

    writeFileSync(indexFilePath, content, "utf8");
    console.log(
      "✅ postgenerate: Exported REMOTE_MODULE in bindings and patched source_names.",
    );
  } else {
    console.log("✅ postgenerate: REMOTE_MODULE already exported and patched.");
  }
} catch (error) {
  console.error("❌ postgenerate failed:", error);
  process.exit(1);
}
