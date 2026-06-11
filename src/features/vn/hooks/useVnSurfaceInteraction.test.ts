import { act, renderHook } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import type { TypedTextHandle } from "../ui/TypedText";
import type { VnNode } from "../types";
import { useVnSurfaceInteraction } from "./useVnSurfaceInteraction";

const memoryNode: VnNode = {
  id: "memory",
  scenarioId: "case_test",
  title: "Memory",
  body: "",
  visualSequence: {
    advanceOnEnd: true,
    skippable: true,
    frames: [{ imageUrl: "/memory/one.png", durationMs: 1000 }],
  },
  choices: [{ id: "AUTO_MEMORY_END", text: "Continue", nextNodeId: "next" }],
};

describe("useVnSurfaceInteraction visual sequence", () => {
  it("commits the automatic transition once and ignores ordinary taps", () => {
    const handleChoiceClick = vi.fn();
    const { result } = renderHook(() =>
      useVnSurfaceInteraction({
        autoContinueChoice: memoryNode.choices[0],
        awaitingSkillChoice: null,
        choiceDisplayItemCount: 0,
        choiceEvaluationContext: {},
        currentNode: memoryNode,
        displayedScenarioCompleted: false,
        effectiveNarrativeLayout: "fullscreen",
        handleActiveResolveInteraction: () => false,
        handleChoiceClick,
        handleStartScenario: async () => undefined,
        isTyping: false,
        markInteractionHandled: vi.fn(),
        myFlags: {},
        mySession: {},
        myVars: {},
        narrativeLog: {
          state: {
            entries: [],
            currentNodeSegments: [],
            currentSegmentIndex: 0,
            isTypingSegment: false,
            sceneGroupId: null,
            currentNodeId: memoryNode.id,
          },
          advanceSegment: vi.fn(),
          finishCurrentSegment: vi.fn(),
        },
        pendingChoiceId: null,
        runCompletionTransition: async () => undefined,
        selectedScenarioId: "case_test",
        setIsTyping: vi.fn(),
        setVideoEnded: vi.fn(),
        transitionState: "idle",
        typedTextRef: createRef<TypedTextHandle>(),
        typingFinishedAtRef: { current: 0 },
      }),
    );

    act(() => {
      result.current.handleSurfaceTap();
      result.current.handleVisualSequenceEnded();
      result.current.handleVisualSequenceEnded();
    });

    expect(handleChoiceClick).toHaveBeenCalledTimes(1);
    expect(handleChoiceClick).toHaveBeenCalledWith(
      memoryNode.choices[0],
      false,
    );
  });
});
