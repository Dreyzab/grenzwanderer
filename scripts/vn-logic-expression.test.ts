import { describe, expect, it } from "vitest";

import {
  parseConditionExpression,
  parseEffectExpression,
} from "./vn-logic-expression";

describe("vn-logic-expression", () => {
  it("parses nested AST conditions", () => {
    expect(
      parseConditionExpression(
        "and(flag_equals(origin_detective,true), not(var_lte(attr_intellect,1)))",
      ),
    ).toEqual({
      type: "logic_and",
      conditions: [
        { type: "flag_equals", key: "origin_detective", value: true },
        {
          type: "logic_not",
          condition: { type: "var_lte", key: "attr_intellect", value: 1 },
        },
      ],
    });
  });

  it("parses effect expressions with optional args", () => {
    expect(
      parseEffectExpression(
        'change_favor_balance(victoria_sterling,2,"detective_briefing")',
      ),
    ).toEqual({
      type: "change_favor_balance",
      npcId: "victoria_sterling",
      delta: 2,
      reason: "detective_briefing",
    });
  });

  it("rejects empty logic groups", () => {
    expect(() => parseConditionExpression("and()")).toThrow(
      /logic_and requires at least one nested condition/,
    );
  });
});
