import { act, renderHook } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import type { TypedTextHandle } from "../ui/TypedText";
import type { VnChoice, VnNode } from "../types";
import { TAP_CONTINUE_COOLDOWN_MS } from "../vnScreenUtils";
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

const drowseNode: VnNode = {
  id: "scene_case01_opening_arrival_video_witch",
  scenarioId: "case01_hbf_arrival",
  title: "Полудрема",
  body: "**[Narrator]**:\nTrain rhythm.",
  narrativeLayout: "log",
  choices: [
    {
      id: "AUTO_CONTINUE_WITCH_DROWSE_TO_MEMORY",
      text: "Continue.",
      nextNodeId: "scene_case01_witch_compartment_memory",
    },
  ],
};

const buildLogSurfaceHook = ({
  autoContinueChoice = drowseNode.choices[0],
  handleChoiceClick = vi.fn<(choice: VnChoice, isLocked: boolean) => void>(),
  advanceSegment = vi.fn<() => void>(),
  finishCurrentSegment = vi.fn<() => void>(),
  isTyping = false,
  isTypingSegment = false,
  currentSegmentIndex = 0,
  typingFinishedAtRef = { current: 0 },
}: {
  autoContinueChoice?: VnChoice | null;
  handleChoiceClick?: (choice: VnChoice, isLocked: boolean) => void;
  advanceSegment?: () => void;
  finishCurrentSegment?: () => void;
  isTyping?: boolean;
  isTypingSegment?: boolean;
  currentSegmentIndex?: number;
  typingFinishedAtRef?: { current: number };
} = {}) =>
  renderHook(() =>
    useVnSurfaceInteraction({
      autoContinueChoice,
      awaitingSkillChoice: null,
      choiceDisplayItemCount: 0,
      choiceEvaluationContext: {},
      currentNode: drowseNode,
      displayedScenarioCompleted: false,
      effectiveNarrativeLayout: "log",
      handleActiveResolveInteraction: () => false,
      handleChoiceClick,
      handleStartScenario: async () => undefined,
      isTyping,
      markInteractionHandled: vi.fn(),
      myFlags: {},
      mySession: {},
      myVars: {},
      narrativeLog: {
        state: {
          entries: [],
          currentNodeSegments: [
            {
              speaker: "Narrator",
              speakerLabel: "Narrator",
              category: "narrator",
              text: "Train rhythm.",
            },
          ],
          currentSegmentIndex,
          isTypingSegment,
          sceneGroupId: "witch_train_compartment",
          currentNodeId: drowseNode.id,
        },
        advanceSegment,
        finishCurrentSegment,
      },
      pendingChoiceId: null,
      runCompletionTransition: async () => undefined,
      selectedScenarioId: "case01_hbf_arrival",
      setIsTyping: vi.fn(),
      setVideoEnded: vi.fn(),
      transitionState: "idle",
      typedTextRef: createRef<TypedTextHandle>(),
      typingFinishedAtRef,
    }),
  );

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

describe("useVnSurfaceInteraction log layout", () => {
  it("auto-continues after the final log segment on a single tap", () => {
    const handleChoiceClick = vi.fn();
    const advanceSegment = vi.fn();
    const { result } = buildLogSurfaceHook({
      handleChoiceClick,
      advanceSegment,
      typingFinishedAtRef: {
        current: Date.now() - TAP_CONTINUE_COOLDOWN_MS - 1,
      },
    });

    act(() => {
      result.current.handleSurfaceTap();
    });

    expect(advanceSegment).toHaveBeenCalledTimes(1);
    expect(handleChoiceClick).toHaveBeenCalledTimes(1);
    expect(handleChoiceClick).toHaveBeenCalledWith(
      drowseNode.choices[0],
      false,
    );
  });

  it("finishes typing when isTypingSegment is still true but isTyping is false", () => {
    const finishCurrentSegment = vi.fn();
    const setIsTyping = vi.fn();
    const typedTextRef = { current: { finish: vi.fn() } };

    const { result } = renderHook(() =>
      useVnSurfaceInteraction({
        autoContinueChoice: drowseNode.choices[0],
        awaitingSkillChoice: null,
        choiceDisplayItemCount: 0,
        choiceEvaluationContext: {},
        currentNode: drowseNode,
        displayedScenarioCompleted: false,
        effectiveNarrativeLayout: "log",
        handleActiveResolveInteraction: () => false,
        handleChoiceClick: vi.fn(),
        handleStartScenario: async () => undefined,
        isTyping: false,
        markInteractionHandled: vi.fn(),
        myFlags: {},
        mySession: {},
        myVars: {},
        narrativeLog: {
          state: {
            entries: [],
            currentNodeSegments: [
              {
                speaker: "Narrator",
                speakerLabel: "Narrator",
                category: "narrator",
                text: "Train rhythm.",
              },
            ],
            currentSegmentIndex: 0,
            isTypingSegment: true,
            sceneGroupId: "witch_train_compartment",
            currentNodeId: drowseNode.id,
          },
          advanceSegment: vi.fn(),
          finishCurrentSegment,
        },
        pendingChoiceId: null,
        runCompletionTransition: async () => undefined,
        selectedScenarioId: "case01_hbf_arrival",
        setIsTyping,
        setVideoEnded: vi.fn(),
        transitionState: "idle",
        typedTextRef,
        typingFinishedAtRef: { current: 0 },
      }),
    );

    act(() => {
      result.current.handleSurfaceTap();
    });

    expect(finishCurrentSegment).toHaveBeenCalledTimes(1);
    expect(typedTextRef.current?.finish).toHaveBeenCalledTimes(1);
    expect(setIsTyping).toHaveBeenCalledWith(false);
  });
});
