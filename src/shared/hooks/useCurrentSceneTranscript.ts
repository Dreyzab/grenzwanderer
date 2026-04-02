import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DialogueNode } from "@/entities/visual-novel/model/types";
import type {
  CurrentSceneTranscriptBlock,
  ResolvedTranscriptLine,
  TranscriptCharacterSource,
} from "@/shared/game/currentSceneTranscript";
import { resolveCurrentSceneTranscriptLine } from "@/shared/game/currentSceneTranscript";

export interface UseCurrentSceneTranscriptArgs {
  sceneId: string;
  lineIndex: number;
  backgroundUrl?: string;
  node?: DialogueNode;
  characters?: TranscriptCharacterSource[];
}

export interface UseCurrentSceneTranscriptResult {
  block: CurrentSceneTranscriptBlock;
  currentLine: ResolvedTranscriptLine | null;
  commitCurrentLine: () => void;
}

export function useCurrentSceneTranscript({
  sceneId,
  lineIndex,
  backgroundUrl,
  node,
  characters = [],
}: UseCurrentSceneTranscriptArgs): UseCurrentSceneTranscriptResult {
  const normalizedBackgroundUrl = backgroundUrl ?? "";
  const lastBackgroundRef = useRef(normalizedBackgroundUrl);
  const [block, setBlock] = useState<CurrentSceneTranscriptBlock>({
    backgroundUrl: normalizedBackgroundUrl,
    lines: [],
  });

  useEffect(() => {
    if (lastBackgroundRef.current === normalizedBackgroundUrl) {
      setBlock((previous) =>
        previous.backgroundUrl === normalizedBackgroundUrl
          ? previous
          : { ...previous, backgroundUrl: normalizedBackgroundUrl },
      );
      return;
    }

    lastBackgroundRef.current = normalizedBackgroundUrl;
    setBlock({
      backgroundUrl: normalizedBackgroundUrl,
      lines: [],
    });
  }, [normalizedBackgroundUrl]);

  const currentLine = useMemo(() => {
    if (!node) {
      return null;
    }

    const resolvedLine = resolveCurrentSceneTranscriptLine({
      sceneId,
      lineIndex,
      backgroundUrl: normalizedBackgroundUrl,
      node,
      characters,
    });

    if (!resolvedLine) {
      return null;
    }

    return block.lines.some((line) => line.key === resolvedLine.key)
      ? null
      : resolvedLine;
  }, [
    block.lines,
    characters,
    lineIndex,
    node,
    normalizedBackgroundUrl,
    sceneId,
  ]);

  const commitCurrentLine = useCallback(() => {
    if (!currentLine) {
      return;
    }

    setBlock((previous) => {
      if (previous.lines.some((line) => line.key === currentLine.key)) {
        return previous;
      }

      return {
        backgroundUrl: normalizedBackgroundUrl,
        lines: [...previous.lines, currentLine],
      };
    });
  }, [currentLine, normalizedBackgroundUrl]);

  return {
    block,
    currentLine,
    commitCurrentLine,
  };
}
