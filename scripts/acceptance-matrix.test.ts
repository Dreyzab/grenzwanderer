import { describe, expect, it } from "vitest";

import {
  acceptanceFlows,
  formatAcceptanceMatrixMarkdown,
  getSmokeAllPipeline,
  validateAcceptanceMatrix,
} from "./acceptance-matrix";

describe("acceptance matrix", () => {
  it("keeps unique supported flow ids", () => {
    const ids = acceptanceFlows.map((flow) => flow.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("references existing package scripts", () => {
    expect(() => validateAcceptanceMatrix()).not.toThrow();
  });

  it("builds smoke:all from the supported smoke flows", () => {
    expect(getSmokeAllPipeline()).toEqual([
      { label: "VN authority", script: "smoke:vn-authority" },
      { label: "Map authority", script: "smoke:map-authority" },
      { label: "Battle authority", script: "smoke:battle-authority" },
      { label: "Origin entry", script: "smoke:origin-entry" },
      { label: "Origin handoff", script: "smoke:origin-handoff" },
      { label: "MVP routes", script: "smoke:mvp-routes" },
      { label: "Banker duel", script: "smoke:banker-duel" },
      { label: "Social access", script: "smoke:social-access" },
      { label: "Rumor verification", script: "smoke:rumor-verification" },
      { label: "Agency career", script: "smoke:agency-career" },
      { label: "Service unlock", script: "smoke:service-unlock" },
      { label: "MindPalace", script: "smoke:mindpalace" },
      { label: "Dog Deduction", script: "smoke:dog-deduction" },
    ]);
  });

  it("renders a markdown table with the required columns", () => {
    const markdown = formatAcceptanceMatrixMarkdown();
    expect(markdown).toContain("| Supported flow | Type | Entry path |");
    expect(markdown).toContain("`freiburg_origin_entry`");
    expect(markdown).toContain("`bun run smoke:origin-entry`");
  });
});
