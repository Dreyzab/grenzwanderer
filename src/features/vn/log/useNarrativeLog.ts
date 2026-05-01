import { useCallback, useEffect, useState } from "react";
import type { UiLanguage } from "../../../shared/hooks/useUiLanguage";
import { resolveVnNodeText } from "../../i18n/vnContentTranslations";
import { useI18n } from "../../i18n/I18nContext";
import type { VnNode } from "../types";
import { parseSpeakerSegments, type SpeakerSegment } from "./speakerParser";

export type LogEntryType = "segment" | "player_choice" | "skill_check_result";

export interface LogSkillCheckResult {
  voiceLabel: string;
  passed: boolean;
  roll: number;
  dc: number;
}

export interface LogEntry {
  id: string;
  type: LogEntryType;
  nodeId: string;
  segment?: SpeakerSegment;
  choiceText?: string;
  checkResult?: LogSkillCheckResult;
  timestamp: number;
}

export interface NarrativeLogState {
  entries: LogEntry[];
  currentNodeSegments: SpeakerSegment[];
  currentSegmentIndex: number;
  isTypingSegment: boolean;
  sceneGroupId: string | null;
  currentNodeId: string | null;
}

interface InternalNarrativeLogState extends NarrativeLogState {
  committedSegmentCount: number;
  sequence: number;
  /** Keeps implicit (no authored sceneGroupId) chains stable across nodes within one scenario. */
  implicitChainScenarioId: string | null;
}

const initialState: InternalNarrativeLogState = {
  entries: [],
  currentNodeSegments: [],
  currentSegmentIndex: 0,
  isTypingSegment: false,
  sceneGroupId: null,
  currentNodeId: null,
  committedSegmentCount: 0,
  sequence: 0,
  implicitChainScenarioId: null,
};

const createSegmentEntry = (
  nodeId: string,
  segment: SpeakerSegment,
  sequence: number,
): LogEntry => ({
  id: `${nodeId}:segment:${sequence}`,
  type: "segment",
  nodeId,
  segment,
  timestamp: Date.now(),
});

const appendUncommittedSegments = (
  state: InternalNarrativeLogState,
): Pick<InternalNarrativeLogState, "entries" | "sequence"> => {
  if (!state.currentNodeId) {
    return { entries: state.entries, sequence: state.sequence };
  }

  let sequence = state.sequence;
  const entries = [...state.entries];
  const startIndex = Math.max(0, state.committedSegmentCount);
  for (const segment of state.currentNodeSegments.slice(startIndex)) {
    entries.push(createSegmentEntry(state.currentNodeId, segment, sequence));
    sequence += 1;
  }

  return { entries, sequence };
};

const publicState = (state: InternalNarrativeLogState): NarrativeLogState => ({
  entries: state.entries,
  currentNodeSegments: state.currentNodeSegments,
  currentSegmentIndex: state.currentSegmentIndex,
  isTypingSegment: state.isTypingSegment,
  sceneGroupId: state.sceneGroupId,
  currentNodeId: state.currentNodeId,
});

export function useNarrativeLog(
  currentNode: VnNode | null,
  sceneGroupId: string | null,
  language: UiLanguage = "en",
): {
  state: NarrativeLogState;
  advanceSegment: () => void;
  finishCurrentSegment: () => void;
  setTypingSegment: (typing: boolean) => void;
  appendChoice: (text: string) => void;
  appendCheckResult: (result: LogSkillCheckResult) => void;
  resetLog: () => void;
} {
  const { dictionary } = useI18n();
  const [state, setState] = useState<InternalNarrativeLogState>(initialState);

  useEffect(() => {
    const nextNodeId = currentNode?.id ?? null;
    const nextScenarioId = currentNode?.scenarioId ?? null;
    const nextBody = currentNode
      ? resolveVnNodeText(
          language,
          currentNode.scenarioId,
          currentNode.id,
          "body",
          currentNode.body,
          dictionary,
        )
      : "";
    const nextSegments = currentNode
      ? parseSpeakerSegments(nextBody, dictionary)
      : [];

    setState((previous) => {
      const nextSceneGroupId =
        sceneGroupId != null
          ? sceneGroupId
          : previous.implicitChainScenarioId != null &&
              nextScenarioId != null &&
              previous.implicitChainScenarioId === nextScenarioId
            ? (previous.sceneGroupId ?? nextNodeId)
            : nextNodeId;

      const nextImplicitChainScenarioId =
        sceneGroupId != null
          ? nextScenarioId
          : nextSceneGroupId === nextNodeId &&
              (previous.implicitChainScenarioId == null ||
                previous.implicitChainScenarioId !== nextScenarioId)
            ? nextScenarioId
            : (previous.implicitChainScenarioId ?? nextScenarioId);

      if (
        previous.currentNodeId === nextNodeId &&
        previous.sceneGroupId === nextSceneGroupId
      ) {
        return {
          ...previous,
          implicitChainScenarioId: nextImplicitChainScenarioId,
          currentNodeSegments: nextSegments,
          isTypingSegment:
            previous.currentSegmentIndex < nextSegments.length &&
            previous.isTypingSegment,
        };
      }

      if (previous.sceneGroupId !== nextSceneGroupId) {
        return {
          ...initialState,
          currentNodeId: nextNodeId,
          currentNodeSegments: nextSegments,
          isTypingSegment: nextSegments.length > 0,
          sceneGroupId: nextSceneGroupId,
          implicitChainScenarioId: nextImplicitChainScenarioId,
        };
      }

      const carried = appendUncommittedSegments(previous);
      return {
        ...previous,
        entries: carried.entries,
        sequence: carried.sequence,
        currentNodeId: nextNodeId,
        currentNodeSegments: nextSegments,
        currentSegmentIndex: 0,
        committedSegmentCount: 0,
        isTypingSegment: nextSegments.length > 0,
        implicitChainScenarioId: nextImplicitChainScenarioId,
      };
    });
  }, [
    currentNode,
    currentNode?.body,
    currentNode?.id,
    dictionary,
    language,
    sceneGroupId,
  ]);

  const advanceSegment = useCallback(() => {
    setState((previous) => {
      if (
        !previous.currentNodeId ||
        previous.currentSegmentIndex >= previous.currentNodeSegments.length
      ) {
        return previous;
      }

      const segment =
        previous.currentNodeSegments[previous.currentSegmentIndex];
      if (!segment) {
        return previous;
      }

      const nextIndex = previous.currentSegmentIndex + 1;
      const nextEntries = [
        ...previous.entries,
        createSegmentEntry(previous.currentNodeId, segment, previous.sequence),
      ];

      return {
        ...previous,
        entries: nextEntries,
        sequence: previous.sequence + 1,
        currentSegmentIndex: nextIndex,
        committedSegmentCount: Math.max(
          previous.committedSegmentCount,
          nextIndex,
        ),
        isTypingSegment: nextIndex < previous.currentNodeSegments.length,
      };
    });
  }, []);

  const finishCurrentSegment = useCallback(() => {
    setState((previous) => ({ ...previous, isTypingSegment: false }));
  }, []);

  const setTypingSegment = useCallback((typing: boolean) => {
    setState((previous) => ({ ...previous, isTypingSegment: typing }));
  }, []);

  const appendChoice = useCallback((text: string) => {
    const trimmedText = text.trim();
    if (!trimmedText) {
      return;
    }

    setState((previous) => {
      const nodeId = previous.currentNodeId ?? "unknown_node";
      return {
        ...previous,
        entries: [
          ...previous.entries,
          {
            id: `${nodeId}:choice:${previous.sequence}`,
            type: "player_choice",
            nodeId,
            choiceText: trimmedText,
            timestamp: Date.now(),
          },
        ],
        sequence: previous.sequence + 1,
      };
    });
  }, []);

  const appendCheckResult = useCallback((result: LogSkillCheckResult) => {
    setState((previous) => {
      const nodeId = previous.currentNodeId ?? "unknown_node";
      return {
        ...previous,
        entries: [
          ...previous.entries,
          {
            id: `${nodeId}:check:${previous.sequence}`,
            type: "skill_check_result",
            nodeId,
            checkResult: result,
            timestamp: Date.now(),
          },
        ],
        sequence: previous.sequence + 1,
      };
    });
  }, []);

  const resetLog = useCallback(() => {
    setState((previous) => ({
      ...initialState,
      sceneGroupId: previous.sceneGroupId,
      implicitChainScenarioId: previous.implicitChainScenarioId,
      currentNodeId: previous.currentNodeId,
      currentNodeSegments: previous.currentNodeSegments,
      isTypingSegment: previous.currentNodeSegments.length > 0,
    }));
  }, []);

  return {
    state: publicState(state),
    advanceSegment,
    finishCurrentSegment,
    setTypingSegment,
    appendChoice,
    appendCheckResult,
    resetLog,
  };
}
