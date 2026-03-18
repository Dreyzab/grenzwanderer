import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const indexFilePath = join("src", "module_bindings", "index.ts");

const helperExportBlock = `
export {
  __DbConnectionBuilder,
  __DbConnectionImpl,
  __SubscriptionBuilderImpl,
  __convertToAccessorMap,
  __makeQueryBuilder,
  __schema,
  __t,
  __table,
};
`;

try {
  let content = readFileSync(indexFilePath, "utf8");

  if (!content.includes("export const REMOTE_MODULE")) {
    content = content.replace(
      "const REMOTE_MODULE = {",
      "export const REMOTE_MODULE = {",
    );
  }

  if (!content.includes("(table as any).sourceName = toSnakeCase(key);")) {
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
  }

  if (!content.includes("export {\n  __DbConnectionBuilder,")) {
    content += helperExportBlock;
  }

  writeFileSync(indexFilePath, content, "utf8");
  console.log(
    "postgenerate: exported REMOTE_MODULE, patched source names, and re-exported internal helpers.",
  );
} catch (error) {
  console.error("postgenerate failed:", error);
  process.exit(1);
}
