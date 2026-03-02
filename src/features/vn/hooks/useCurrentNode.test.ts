import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useCurrentNode } from "./useCurrentNode";

const snapshot = {
  schemaVersion: 1,
  scenarios: [
    {
      id: "scenario_1",
      title: "Scenario",
      startNodeId: "node_1",
      nodeIds: ["node_1", "node_2"],
    },
  ],
  nodes: [
    {
      id: "node_1",
      scenarioId: "scenario_1",
      title: "Start",
      body: "Body",
      choices: [],
    },
    {
      id: "node_2",
      scenarioId: "scenario_1",
      title: "Next",
      body: "Body",
      choices: [],
    },
  ],
} as const;

describe("useCurrentNode", () => {
  it("returns scenario start node when session is missing", () => {
    const { result } = renderHook(() =>
      useCurrentNode(snapshot as any, snapshot.scenarios[0] as any, null, true),
    );

    expect(result.current?.id).toBe("node_1");
  });

  it("returns node pointed by current session", () => {
    const session = { nodeId: "node_2" };
    const { result } = renderHook(() =>
      useCurrentNode(
        snapshot as any,
        snapshot.scenarios[0] as any,
        session as any,
        true,
      ),
    );

    expect(result.current?.id).toBe("node_2");
  });

  it("returns null while session table is still hydrating", () => {
    const { result } = renderHook(() =>
      useCurrentNode(
        snapshot as any,
        snapshot.scenarios[0] as any,
        null,
        false,
      ),
    );

    expect(result.current).toBeNull();
  });
});
