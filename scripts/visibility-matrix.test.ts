import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  extractSchemaTables,
  formatVisibilityMatrixMarkdown,
  validateVisibilityMatrix,
  visibilityMatrix,
} from "./visibility-matrix";

const schemaSource = readFileSync(
  join(process.cwd(), "spacetimedb", "src", "schema.ts"),
  "utf8",
);

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

  it("fails when a raw schema table is not classified", () => {
    const schemaWithUnclassifiedTable = `${schemaSource}
export const auditGap = table(
  {
    name: "audit_gap",
    public: false,
  },
  {
    auditGapId: t.string().primaryKey(),
  },
);
`;

    expect(() =>
      validateVisibilityMatrix({ schemaSource: schemaWithUnclassifiedTable }),
    ).toThrow("audit_gap");
  });

  it("fails when a governed private table becomes public", () => {
    const schemaWithLeakedPlayerProfile = schemaSource.replace(
      /name: "player_profile",\r?\n\s{4}public: false/,
      'name: "player_profile",\n    public: true',
    );

    expect(() =>
      validateVisibilityMatrix({ schemaSource: schemaWithLeakedPlayerProfile }),
    ).toThrow("player_profile");
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
