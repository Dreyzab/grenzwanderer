import React from "react";
import { act, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { VnNarrativeLog } from "./VnNarrativeLog";
import type { NarrativeLogState } from "./useNarrativeLog";

const makeState = (
  overrides: Partial<NarrativeLogState> = {},
): NarrativeLogState => ({
  entries: [],
  currentNodeSegments: [
    {
      speaker: "narrator",
      speakerLabel: "Narrator",
      category: "narrator",
      text: "Current line",
    },
  ],
  currentSegmentIndex: 0,
  isTypingSegment: false,
  sceneGroupId: "train_assistant",
  currentNodeId: "node-a",
  ...overrides,
});

describe("VnNarrativeLog scroll focus", () => {
  let scrollHeightValue = 1200;
  let resizeCallbacks: ResizeObserverCallback[] = [];
  let scrollToSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.restoreAllMocks();
    scrollHeightValue = 1200;
    resizeCallbacks = [];
    scrollToSpy = vi.fn();

    Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
      configurable: true,
      get() {
        return this.classList.contains("vn-log-container")
          ? scrollHeightValue
          : 0;
      },
    });
    Object.defineProperty(HTMLElement.prototype, "scrollTo", {
      configurable: true,
      value: scrollToSpy,
    });
    Object.defineProperty(window, "requestAnimationFrame", {
      configurable: true,
      value: (callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      },
    });
    Object.defineProperty(window, "cancelAnimationFrame", {
      configurable: true,
      value: vi.fn(),
    });
    Object.defineProperty(window, "ResizeObserver", {
      configurable: true,
      value: class MockResizeObserver {
        constructor(callback: ResizeObserverCallback) {
          resizeCallbacks.push(callback);
        }
        observe = vi.fn();
        disconnect = vi.fn();
      },
    });
    Object.defineProperty(globalThis, "ResizeObserver", {
      configurable: true,
      value: window.ResizeObserver,
    });
  });

  it("scrolls to the bottom on mount without smooth scrolling", () => {
    const { container } = render(
      <VnNarrativeLog state={makeState()} snapshot={null} />,
    );

    const log = container.querySelector(".vn-log-container") as HTMLDivElement;
    expect(log.scrollTop).toBe(1200);
    expect(scrollToSpy).not.toHaveBeenCalled();
  });

  it("keeps focus on the newest node when previous entries are carried", () => {
    const { container, rerender } = render(
      <VnNarrativeLog
        state={makeState({
          entries: [
            {
              id: "node-a:segment:0",
              type: "segment",
              nodeId: "node-a",
              timestamp: 1,
              segment: {
                speaker: "assistant",
                speakerLabel: "Assistant",
                category: "npc",
                text: "Old line",
              },
            },
          ],
        })}
        snapshot={null}
      />,
    );

    const log = container.querySelector(".vn-log-container") as HTMLDivElement;
    log.scrollTop = 0;
    scrollHeightValue = 1800;

    rerender(
      <VnNarrativeLog
        state={makeState({
          currentNodeId: "node-b",
          entries: [
            {
              id: "node-a:segment:0",
              type: "segment",
              nodeId: "node-a",
              timestamp: 1,
              segment: {
                speaker: "assistant",
                speakerLabel: "Assistant",
                category: "npc",
                text: "Old line",
              },
            },
          ],
          currentNodeSegments: [
            {
              speaker: "narrator",
              speakerLabel: "Narrator",
              category: "narrator",
              text: "Newest line",
            },
          ],
        })}
        snapshot={null}
      />,
    );

    expect(log.scrollTop).toBe(1800);
  });

  it("holds the bottom when rendered text changes size", () => {
    const { container } = render(
      <VnNarrativeLog state={makeState()} snapshot={null} />,
    );
    const log = container.querySelector(".vn-log-container") as HTMLDivElement;

    log.scrollTop = 0;
    scrollHeightValue = 2200;

    act(() => {
      for (const callback of resizeCallbacks) {
        callback([], {} as ResizeObserver);
      }
    });

    expect(log.scrollTop).toBe(2200);
  });
});
