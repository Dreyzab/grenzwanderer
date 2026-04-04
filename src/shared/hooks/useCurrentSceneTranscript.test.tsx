// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { DialogueNode } from "../../features/vn/types";
import { useCurrentSceneTranscript } from "./useCurrentSceneTranscript";

describe("useCurrentSceneTranscript", () => {
  it("commits only revealed lines once and resets on background change", () => {
    const initialNode: DialogueNode = {
      id: "line_logic",
      text: "Trace the breach before it cools.",
      speaker: "ЛОГИКА",
    };

    const { result, rerender } = renderHook(
      (props: {
        sceneId: string;
        lineIndex: number;
        backgroundUrl: string;
        node: DialogueNode;
      }) => useCurrentSceneTranscript(props),
      {
        initialProps: {
          sceneId: "scene_alpha",
          lineIndex: 0,
          backgroundUrl: "/images/backgrounds/vault.png",
          node: initialNode,
        },
      },
    );

    expect(result.current.currentLine?.speakerKind).toBe("voice");
    expect(result.current.block.lines).toHaveLength(0);

    act(() => {
      result.current.commitCurrentLine();
    });

    expect(result.current.block.lines).toHaveLength(1);
    expect(result.current.block.lines[0]?.key).toBe("scene_alpha:0:line_logic");
    expect(result.current.currentLine).toBeNull();

    act(() => {
      result.current.commitCurrentLine();
    });

    expect(result.current.block.lines).toHaveLength(1);

    rerender({
      sceneId: "scene_beta",
      lineIndex: 0,
      backgroundUrl: "/images/backgrounds/street.png",
      node: {
        id: "line_narrator",
        text: "A different district breathes into frame.",
      },
    });

    expect(result.current.block.backgroundUrl).toBe(
      "/images/backgrounds/street.png",
    );
    expect(result.current.block.lines).toHaveLength(0);
    expect(result.current.currentLine?.speakerKind).toBe("narrator");
  });
});
