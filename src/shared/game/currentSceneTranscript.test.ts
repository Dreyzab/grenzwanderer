import { describe, expect, it } from "vitest";
import type { DialogueNode } from "@/entities/visual-novel/model/types";
import {
  buildCurrentSceneTranscriptLineKey,
  resolveCurrentSceneTranscriptLine,
} from "./currentSceneTranscript";

describe("currentSceneTranscript media resolution", () => {
  it("builds stable line keys from scene, index, and node identity", () => {
    const node: DialogueNode = {
      id: "line_a",
      text: "Open the vault.",
    };

    expect(buildCurrentSceneTranscriptLineKey("scene_alpha", 3, node)).toBe(
      "scene_alpha:3:line_a",
    );
  });

  it("resolves character portrait slots from characterId and sprite", () => {
    const line = resolveCurrentSceneTranscriptLine({
      sceneId: "scene_alpha",
      lineIndex: 0,
      backgroundUrl: "/images/backgrounds/vault.png",
      node: {
        id: "line_character",
        text: "The seal is broken.",
        characterId: "inspector",
        speaker: {
          characterId: "inspector",
          displayName: "Inspector",
          emotion: "determined",
        },
      },
      characters: [
        {
          id: "inspector",
          name: "Inspector",
          sprite: "/images/npcs/inspector.png",
        },
      ],
    });

    expect(line?.speakerKind).toBe("character");
    expect(line?.media.character?.url).toBe("/images/npcs/inspector.png");
    expect(line?.media.voice).toBeNull();
  });

  it("resolves voice icons from localized speaker labels", () => {
    const line = resolveCurrentSceneTranscriptLine({
      sceneId: "scene_beta",
      lineIndex: 2,
      backgroundUrl: "/images/backgrounds/terminal.png",
      node: {
        id: "line_voice",
        text: "Pattern mismatch detected.",
        speaker: "ЛОГИКА",
      },
    });

    expect(line?.speakerKind).toBe("voice");
    expect(line?.media.voice?.url).toBe("/images/voices/logic.svg");
    expect(line?.media.character).toBeNull();
  });

  it("keeps narration lines neutral when no speaker is present", () => {
    const line = resolveCurrentSceneTranscriptLine({
      sceneId: "scene_gamma",
      lineIndex: 1,
      backgroundUrl: "/images/backgrounds/street.png",
      node: {
        id: "line_narrator",
        type: "narration",
        text: "The checkpoint lights flicker once and die.",
      },
    });

    expect(line?.speakerKind).toBe("narrator");
    expect(line?.speakerLabel).toBe("Narrator");
    expect(line?.media.character).toBeNull();
    expect(line?.media.voice).toBeNull();
  });
});
