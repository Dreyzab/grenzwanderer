import { describe, expect, it } from "vitest";

import {
  extractPublicSchemaTables,
  formatVisibilityMatrixMarkdown,
  validateVisibilityMatrix,
  visibilityMatrix,
} from "./visibility-matrix";

describe("visibility matrix", () => {
  it("covers every current public table exactly once", () => {
    const publicTables = extractPublicSchemaTables();
    expect(visibilityMatrix).toHaveLength(publicTables.length);
    expect(new Set(visibilityMatrix.map((entry) => entry.tableName)).size).toBe(
      publicTables.length,
    );
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
  });
});
