import { describe, expect, it } from "vitest";
import {
  collectOriginDossierUrls,
  collectScenarioVisualUrls,
} from "./collectEntryPrefetchUrls";
import type { VnSnapshot } from "../types";

const minimalSnapshot = (): VnSnapshot => ({
  schemaVersion: 2,
  scenarios: [
    {
      id: "case_test",
      title: "Case",
      startNodeId: "n1",
      nodeIds: ["n1", "n2", "n3"],
    },
  ],
  nodes: [
    {
      id: "n1",
      scenarioId: "case_test",
      title: "One",
      body: "",
      choices: [
        { id: "z_last", text: "Z", nextNodeId: "n3" },
        { id: "a_first", text: "A", nextNodeId: "n2" },
      ],
      backgroundUrl: "/bg/a.png",
      backgroundVideoPosterUrl: "/post/a.webp",
    },
    {
      id: "n2",
      scenarioId: "case_test",
      title: "Two",
      body: "",
      choices: [{ id: "to3", text: "Go", nextNodeId: "n3" }],
      backgroundUrl: "/bg/a.png",
      backgroundVideoPosterUrl: undefined,
    },
    {
      id: "n3",
      scenarioId: "case_test",
      title: "Three",
      body: "",
      choices: [],
      backgroundUrl: "/bg/b.png",
    },
  ],
});

describe("collectScenarioVisualUrls", () => {
  it("returns empty when scenario is missing", () => {
    const snap = minimalSnapshot();
    expect(collectScenarioVisualUrls(snap, "missing")).toEqual([]);
  });

  it("walks scenario-local nodes in stable BFS order and dedupes URLs", () => {
    const urls = collectScenarioVisualUrls(minimalSnapshot(), "case_test", {
      maxNodes: 10,
    });
    expect(urls).toEqual(["/bg/a.png", "/post/a.webp", "/bg/b.png"]);
  });

  it("respects maxNodes", () => {
    const urls = collectScenarioVisualUrls(minimalSnapshot(), "case_test", {
      maxNodes: 2,
    });
    expect(urls).toEqual(["/bg/a.png", "/post/a.webp"]);
  });

  it("limits breadth expansion per node", () => {
    const urls = collectScenarioVisualUrls(minimalSnapshot(), "case_test", {
      maxNodes: 10,
      breadthPerNode: 1,
    });
    // From n1 only first lexicographic choice target (n2) is queued; n3 is reached via n2.
    expect(urls).toContain("/bg/a.png");
    expect(urls).toContain("/bg/b.png");
    expect(urls.indexOf("/bg/a.png")).toBeLessThan(urls.indexOf("/bg/b.png"));
  });
});

describe("collectOriginDossierUrls", () => {
  it("collects unique avatar URLs across profiles", () => {
    const urls = collectOriginDossierUrls();
    expect(urls.length).toBeGreaterThan(0);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("filters to one profile id", () => {
    const detective = collectOriginDossierUrls({ onlyProfileId: "detective" });
    expect(detective).toHaveLength(1);
    expect(detective[0]).toContain("detective");
  });
});
