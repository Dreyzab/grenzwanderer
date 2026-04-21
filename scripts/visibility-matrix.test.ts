import { describe, expect, it } from "vitest";

import {
  extractSchemaTables,
  formatVisibilityMatrixMarkdown,
  validateVisibilityMatrix,
  visibilityMatrix,
} from "./visibility-matrix";

describe("visibility matrix", () => {
  it("covers every governed relation exactly once", () => {
    const schemaTables = extractSchemaTables();
    const schemaTableNames = new Set(
      schemaTables.map((tableInfo) => tableInfo.tableName),
    );

    expect(new Set(visibilityMatrix.map((entry) => entry.tableName)).size).toBe(
      visibilityMatrix.length,
    );
    for (const entry of visibilityMatrix) {
      expect(schemaTableNames.has(entry.tableName)).toBe(true);
    }
  });

  it("stays aligned with the current schema inventory", () => {
    expect(() => validateVisibilityMatrix()).not.toThrow();
  });

  it("renders a markdown table with classification and wave columns", () => {
    const markdown = formatVisibilityMatrixMarkdown();
    expect(markdown).toContain(
      "| Table | Class | Consumers | Replacement path | Wave |",
    );
    expect(markdown).toContain("`content_version`");
    expect(markdown).toContain("`wave1-operational`");
    expect(markdown).toContain("Governed relations inventoried");
  });
});
