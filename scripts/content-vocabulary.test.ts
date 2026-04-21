import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { CONDITION_OPERATORS, EFFECT_OPERATORS } from "./content-vocabulary";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const typesPath = path.join(repoRoot, "src", "features", "vn", "types.ts");

const extractOperators = (
  typeName: "VnConditionLeaf" | "VnEffect",
): string[] => {
  const source = readFileSync(typesPath, "utf8");
  const match = source.match(
    new RegExp(`export type ${typeName} =([\\s\\S]*?);\\n\\nexport`),
  );
  if (!match) {
    throw new Error(`Unable to locate ${typeName} definition`);
  }
  return [...match[1].matchAll(/type: "([^"]+)"/g)].map((entry) => entry[1]);
};

describe("content-vocabulary", () => {
  it("covers every VN condition leaf operator", () => {
    const missing = extractOperators("VnConditionLeaf").filter(
      (entry) => !CONDITION_OPERATORS.has(entry),
    );
    expect(missing).toEqual([]);
  });

  it("covers every VN effect operator", () => {
    const missing = extractOperators("VnEffect").filter(
      (entry) => !EFFECT_OPERATORS.has(entry),
    );
    expect(missing).toEqual([]);
  });
});
