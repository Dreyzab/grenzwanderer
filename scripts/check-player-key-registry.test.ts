import { describe, expect, it } from "vitest";

import { checkPlayerKeyRegistry } from "./check-player-key-registry";

describe("check-player-key-registry", () => {
  it("accepts shipped VN snapshots", () => {
    const report = checkPlayerKeyRegistry();

    expect(report.unknownFlags).toEqual([]);
    expect(report.unknownVars).toEqual([]);
  });
});
