import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../config", () => ({
  ENABLE_AI: true,
  ENABLE_AI_DIRECTOR: true,
}));

import {
  AI_DIRECTOR_STEP_SOURCE_VN_NODE_ENTRY,
  AI_PROPOSE_DIRECTOR_STEP_KIND,
} from "../../ai/contracts";
import { CASE01_SCENARIO_IDS } from "../../../shared/case01Canon";
import { useVnAiLogic } from "./useVnAiLogic";

const baseParams = () => ({
  snapshot: null,
  selectedScenarioId: CASE01_SCENARIO_IDS.defaultEntry,
  currentNode: {
    id: "scene_case01_hbf_arrival_intro",
    body: "Подъезжаем к платформе.",
  },
  contentReady: true,
  sessionReady: true,
  npcStateReady: true,
  activeAiThoughtContext: null,
  setActiveAiThoughtContext: vi.fn(),
  setActiveReactionKey: vi.fn(),
  currentReactionContext: null,
  myFlags: { freiburg_case01_mainline_active: true } as Record<string, boolean>,
  myVars: {} as Record<string, number>,
  questRows: [{ questId: "quest_case01_main", stage: 1 }] as ReadonlyArray<{
    questId: string;
    stage: number | bigint | null | undefined;
  }>,
  myAiRequests: [],
  myReactionRequests: [],
  myDirectorRequests: [] as Array<{
    payloadJson: unknown;
    status: unknown;
    updatedAt: unknown;
  }>,
  visibleFactsByCharacterId: new Map<string, string[]>([
    ["char_fritz", ["fritz_contact_established"]],
  ]),
  trustByNpcId: new Map<string, number>(),
  setError: vi.fn(),
});

describe("useVnAiLogic director step", () => {
  it("auto-enqueues a vn_node_entry director request when a VN node becomes active", async () => {
    const enqueueAiRequest = vi.fn(async (_req: any) => undefined);
    const params = baseParams();

    renderHook(() => useVnAiLogic({ ...params, enqueueAiRequest }));

    await waitFor(() => {
      expect(enqueueAiRequest).toHaveBeenCalledTimes(1);
    });

    const call = enqueueAiRequest.mock.calls[0]?.[0] as unknown as {
      requestId: string;
      kind: string;
      payloadJson: string;
    };
    expect(call.kind).toBe(AI_PROPOSE_DIRECTOR_STEP_KIND);
    const payload = JSON.parse(call.payloadJson) as {
      source: string;
      scenarioId: string;
      nodeId: string;
      allowedBeatIds: string[];
      activeFlags: string[];
      visibleFacts: string[];
      playerSuggestion?: string;
    };
    expect(payload.source).toBe(AI_DIRECTOR_STEP_SOURCE_VN_NODE_ENTRY);
    expect(payload.scenarioId).toBe(CASE01_SCENARIO_IDS.defaultEntry);
    expect(payload.nodeId).toBe("scene_case01_hbf_arrival_intro");
    expect(payload.allowedBeatIds).toContain(
      CASE01_SCENARIO_IDS.warehouseFinale,
    );
    expect(payload.activeFlags).toContain("freiburg_case01_mainline_active");
    expect(payload.visibleFacts).toContain("fritz_contact_established");
    expect(payload.playerSuggestion).toBeUndefined();
  });

  it("does not re-enqueue if an existing director request already covers the same scenario/node", async () => {
    const enqueueAiRequest = vi.fn(async (_req: any) => undefined);
    const params = baseParams();
    const directorRequest = {
      payloadJson: JSON.stringify({
        source: AI_DIRECTOR_STEP_SOURCE_VN_NODE_ENTRY,
        scenarioId: CASE01_SCENARIO_IDS.defaultEntry,
        nodeId: "scene_case01_hbf_arrival_intro",
        currentBeatId: CASE01_SCENARIO_IDS.defaultEntry,
        allowedBeatIds: [CASE01_SCENARIO_IDS.defaultEntry],
        visibleFacts: [],
        activeFlags: [],
        activeQuests: [],
      }),
      status: "pending",
      updatedAt: Date.now(),
    };

    renderHook(() =>
      useVnAiLogic({
        ...params,
        enqueueAiRequest,
        myDirectorRequests: [directorRequest],
      }),
    );

    // Allow effects to flush.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(enqueueAiRequest).not.toHaveBeenCalled();
  });
});
