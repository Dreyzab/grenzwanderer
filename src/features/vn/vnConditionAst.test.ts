import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { parseSnapshot, isChoiceEnabled, isChoiceVisible } from "./vnContent";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

describe("VN condition AST", () => {
  it("evaluates nested visibility and enablement conditions", () => {
    const choice = {
      id: "CHOICE",
      text: "Continue",
      nextNodeId: "node_next",
      visibleIfAll: [
        {
          type: "logic_and" as const,
          conditions: [
            { type: "flag_equals" as const, key: "origin_detective", value: true },
            {
              type: "logic_not" as const,
              condition: {
                type: "flag_equals" as const,
                key: "banker_case_closed",
                value: true,
              },
            },
          ],
        },
      ],
      requireAny: [
        {
          type: "logic_or" as const,
          conditions: [
            { type: "var_gte" as const, key: "attr_intellect", value: 3 },
            { type: "var_gte" as const, key: "attr_social", value: 3 },
          ],
        },
      ],
    };

    expect(
      isChoiceVisible(choice, {
        origin_detective: true,
        banker_case_closed: false,
      }, {}),
    ).toBe(true);
    expect(
      isChoiceEnabled(choice, {}, {
        attr_intellect: 1,
        attr_social: 4,
      }),
    ).toBe(true);
  });

  it("parses snapshot schema 8 with nested VN conditions", () => {
    const snapshot = parseSnapshot(
      readFileSync(
        path.join(repoRoot, "content", "vn", "pilot.snapshot.json"),
        "utf8",
      ),
    );

    expect(snapshot?.schemaVersion).toBe(8);
    const runtimeNode = snapshot?.nodes.find(
      (node) => node.id === "scene_detective_runtime_agency_orientation",
    );
    expect(runtimeNode?.choices[0]?.visibleIfAll?.[0]).toMatchObject({
      type: "logic_and",
    });
  });
});
