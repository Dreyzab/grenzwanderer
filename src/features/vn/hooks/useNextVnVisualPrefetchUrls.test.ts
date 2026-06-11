import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { VnSnapshot } from "../types";
import { useNextVnVisualPrefetchUrls } from "./useNextVnVisualPrefetchUrls";

const snapshot: VnSnapshot = {
  schemaVersion: 2,
  scenarios: [
    {
      id: "case_test",
      title: "Case",
      startNodeId: "video",
      nodeIds: ["video", "memory"],
    },
  ],
  nodes: [
    {
      id: "video",
      scenarioId: "case_test",
      title: "Video",
      body: "",
      backgroundVideoUrl: "/video/train.mp4",
      backgroundVideoPosterUrl: "/image/train.png",
      choices: [
        { id: "AUTO_TO_MEMORY", text: "Continue", nextNodeId: "memory" },
      ],
    },
    {
      id: "memory",
      scenarioId: "case_test",
      title: "Memory",
      body: "",
      backgroundUrl: "/image/sleeping.png",
      visualSequence: {
        frames: Array.from({ length: 7 }, (_, index) => ({
          imageUrl: `/memory/${index + 1}.png`,
          durationMs: 1000,
        })),
      },
      choices: [],
    },
  ],
};

describe("useNextVnVisualPrefetchUrls", () => {
  it("queues every visual-sequence frame from the next node", () => {
    const currentNode = snapshot.nodes[0];
    const autoContinueChoice = currentNode.choices[0];
    const { result } = renderHook(() =>
      useNextVnVisualPrefetchUrls({
        autoContinueChoice,
        currentNode,
        resolvedBgUrl: currentNode.backgroundVideoPosterUrl,
        snapshot,
        visibleChoices: [],
      }),
    );

    expect(result.current).toEqual([
      "/image/sleeping.png",
      "/memory/1.png",
      "/memory/2.png",
      "/memory/3.png",
      "/memory/4.png",
      "/memory/5.png",
      "/memory/6.png",
      "/memory/7.png",
    ]);
  });
});
