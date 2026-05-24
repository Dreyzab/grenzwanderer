import { useCallback, useLayoutEffect, useMemo, useRef } from "react";
import type { ReactNode, RefObject } from "react";
import type { VnSnapshot } from "../types";
import type {
  TypedTextHandle,
  TypedTextTokenState,
  TypedTextTokenHandler,
} from "../ui/TypedText";
import { LogEntryRenderer } from "./LogEntryRenderer";
import {
  LogSegmentRenderer,
  type PlayerProfileForLog,
} from "./LogSegmentRenderer";
import { resolveSpeakerPortrait } from "./speakerRegistry";
import type { SpeakerSegment } from "./speakerParser";
import type { LogEntry, NarrativeLogState } from "./useNarrativeLog";

interface VnNarrativeLogProps {
  state: NarrativeLogState;
  snapshot: VnSnapshot | null;
  typedTextRef?: RefObject<TypedTextHandle>;
  choicesSlot?: ReactNode;
  playerProfile?: PlayerProfileForLog | null;
  onTypingChange?: (typing: boolean) => void;
  onSegmentComplete?: () => void;
  onTokenClick?: TypedTextTokenHandler;
  onTokenEnter?: TypedTextTokenHandler;
  onTokenLeave?: TypedTextTokenHandler;
  tokenStateByPayload?: Readonly<Record<string, TypedTextTokenState>>;
}

const speakerIdForEntry = (entry: LogEntry): string | null => {
  if (entry.type === "segment" && entry.segment) {
    return entry.segment.speaker;
  }
  if (entry.type === "player_choice") {
    return "player";
  }
  return null;
};

const withPortrait = (
  segment: SpeakerSegment,
  snapshot: VnSnapshot | null,
): SpeakerSegment => ({
  ...segment,
  portraitUrl:
    segment.portraitUrl ?? resolveSpeakerPortrait(segment.speaker, snapshot),
});

export function VnNarrativeLog({
  state,
  snapshot,
  typedTextRef,
  choicesSlot,
  playerProfile,
  onTypingChange,
  onSegmentComplete,
  onTokenClick,
  onTokenEnter,
  onTokenLeave,
  tokenStateByPayload,
}: VnNarrativeLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const entries = useMemo<LogEntry[]>(
    () =>
      state.entries.map((entry) =>
        entry.segment
          ? {
              ...entry,
              segment: withPortrait(entry.segment, snapshot),
            }
          : entry,
      ),
    [snapshot, state.entries],
  );

  const currentSegments = useMemo(
    () =>
      state.currentNodeSegments.map((segment) =>
        withPortrait(segment, snapshot),
      ),
    [snapshot, state.currentNodeSegments],
  );
  const currentSegment = currentSegments[state.currentSegmentIndex] ?? null;
  const allSegmentsDone = state.currentSegmentIndex >= currentSegments.length;
  const choicesVisible = allSegmentsDone && choicesSlot != null;

  const lastCommittedSpeakerId =
    entries.length > 0 ? speakerIdForEntry(entries[entries.length - 1]) : null;
  const previousCurrentSpeakerId =
    state.currentSegmentIndex > 0
      ? (currentSegments[state.currentSegmentIndex - 1]?.speaker ?? null)
      : null;
  const currentPreviousSpeakerId =
    previousCurrentSpeakerId ?? lastCommittedSpeakerId;

  const scrollToBottom = useCallback(() => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }
    element.scrollTop = element.scrollHeight;
  }, []);

  const scheduleScrollToBottom = useCallback(() => {
    scrollToBottom();
    if (typeof window === "undefined") {
      return undefined;
    }
    const rafId = window.requestAnimationFrame(scrollToBottom);
    return () => window.cancelAnimationFrame(rafId);
  }, [scrollToBottom]);

  useLayoutEffect(() => {
    return scheduleScrollToBottom();
  }, [
    scheduleScrollToBottom,
    entries.length,
    state.currentSegmentIndex,
    state.currentNodeId,
    allSegmentsDone,
    choicesVisible,
  ]);

  useLayoutEffect(() => {
    const target = contentRef.current;
    if (!target || typeof ResizeObserver === "undefined") {
      return scheduleScrollToBottom();
    }

    const observer = new ResizeObserver(() => {
      scheduleScrollToBottom();
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [scheduleScrollToBottom]);

  return (
    <div
      ref={scrollRef}
      className="vn-log-container h-full overflow-y-auto px-5 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-4 sm:px-8"
    >
      <div
        ref={contentRef}
        className="mx-auto flex w-full max-w-3xl flex-col gap-1"
      >
        {entries.map((entry, index) => {
          const previousEntry = index > 0 ? entries[index - 1] : null;
          const previousSpeakerId = previousEntry
            ? speakerIdForEntry(previousEntry)
            : null;
          return (
            <LogEntryRenderer
              key={entry.id}
              entry={entry}
              dimmed
              previousSpeakerId={previousSpeakerId}
              playerProfile={playerProfile}
              tokenStateByPayload={tokenStateByPayload}
            />
          );
        })}

        {currentSegment ? (
          <LogSegmentRenderer
            segment={currentSegment}
            isTyping={state.isTypingSegment}
            previousSpeakerId={currentPreviousSpeakerId}
            playerProfile={playerProfile}
            typedTextRef={typedTextRef}
            onTypingChange={onTypingChange}
            onComplete={onSegmentComplete}
            onTokenClick={onTokenClick}
            onTokenEnter={onTokenEnter}
            onTokenLeave={onTokenLeave}
            tokenStateByPayload={tokenStateByPayload}
          />
        ) : null}

        {allSegmentsDone ? choicesSlot : null}
      </div>
    </div>
  );
}
