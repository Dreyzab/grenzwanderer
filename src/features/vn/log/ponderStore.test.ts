import { beforeEach, describe, expect, it } from "vitest";
import { loadPonders, savePonder } from "./ponderStore";

describe("ponderStore", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("round-trips prompt + result, scoped per scenario", () => {
    savePonder("case01", {
      nodeId: "coin_wake",
      prompt: "Почему он застыл?",
      result: "Он понял, что разбудил.",
    });

    const entries = loadPonders("case01");
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      nodeId: "coin_wake",
      prompt: "Почему он застыл?",
      result: "Он понял, что разбудил.",
    });
    expect(loadPonders("other_scenario")).toEqual([]);
  });
});
