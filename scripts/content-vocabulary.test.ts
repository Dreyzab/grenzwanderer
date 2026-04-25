import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { CONDITION_OPERATORS, EFFECT_OPERATORS } from "./content-vocabulary";
import { VN_CONDITION_TYPES, VN_EFFECT_TYPES } from "../src/shared/vn-contract";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const readRepoFile = (...parts: string[]): string =>
  readFileSync(path.join(repoRoot, ...parts), "utf8");

const sorted = (values: Iterable<string>): string[] => [...values].sort();

describe("content-vocabulary", () => {
  it("keeps scripts vocabulary pinned to the shared VN contract", () => {
    expect(sorted(CONDITION_OPERATORS)).toEqual([...VN_CONDITION_TYPES]);
    expect(sorted(EFFECT_OPERATORS)).toEqual([...VN_EFFECT_TYPES]);
  });

  it("keeps frontend compatibility exports pointed at the shared contract", () => {
    expect(readRepoFile("src", "features", "vn", "types.ts")).toContain(
      "../../shared/vn-contract",
    );
    expect(
      readRepoFile("src", "features", "vn", "snapshotSchema.ts"),
    ).toContain("../../shared/vn-contract/schema");
  });

  it("keeps backend compatibility types pointed at the shared contract", () => {
    expect(
      readRepoFile("spacetimedb", "src", "reducers", "helpers", "types.ts"),
    ).toContain("../../../../src/shared/vn-contract");
  });
});
