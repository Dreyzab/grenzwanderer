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
  parliamentPresetId?: string;
  onTypingChange?: (typing: boolean) => void;
  onSegmentComplete?: () => void;
  onTokenClick?: TypedTextTokenHandler;
  onTokenEnter?: TypedTextTokenHandler;
  onTokenLeave?: TypedTextTokenHandler;
  tokenStateByPayload?: Readonly<Record<string, TypedTextTokenState>>;
  /** Natural pixel height of the rendered log, so the dock can grow with content. */
  onContentHeightChange?: (heightPx: number) => void;
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
  parliamentPresetId,
  onTypingChange,
  onSegmentComplete,
  onTokenClick,
  onTokenEnter,
  onTokenLeave,
  tokenStateByPayload,
  onContentHeightChange,
}: VnNarrativeLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  /** Live typing flag for observers that must not re-target the dock spring per word. */
  const isTypingRef = useRef(state.isTypingSegment);
  isTypingRef.current = state.isTypingSegment;

  const reportContentHeight = useCallback(() => {
    const element = contentRef.current;
    if (element) {
      onContentHeightChange?.(element.offsetHeight);
    }
  }, [onContentHeightChange]);

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

  /** Stay pinned only while the reader is at/near the bottom — never yank them up from backlog. */
  const pinnedToBottomRef = useRef(true);
  const STICK_THRESHOLD_PX = 96;

  const handleScroll = useCallback(() => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }
    const distanceFromBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight;
    pinnedToBottomRef.current = distanceFromBottom <= STICK_THRESHOLD_PX;
  }, []);

  const scrollToBottom = useCallback(() => {
    const element = scrollRef.current;
    if (!element || !pinnedToBottomRef.current) {
      return;
    }
    element.scrollTop = element.scrollHeight;
  }, []);

  // Tapping the text surface means "take me to the action": re-pin and snap down,
  // even if the reader had scrolled up into the backlog. Runs before the advance
  // handler bubbles up, so the post-advance scroll effect also sticks.
  const handleSurfaceTap = useCallback(() => {
    pinnedToBottomRef.current = true;
    const element = scrollRef.current;
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }, []);

  const scheduleScrollToBottom = useCallback(() => {
    scrollToBottom();
    if (typeof window === "undefined") {
      return undefined;
    }
    const rafId = window.requestAnimationFrame(scrollToBottom);
    return () => window.cancelAnimationFrame(rafId);
  }, [scrollToBottom]);

  const handleTypingChange = useCallback(
    (typing: boolean) => {
      onTypingChange?.(typing);
      reportContentHeight();
      if (!typing) {
        scheduleScrollToBottom();
      }
    },
    [onTypingChange, reportContentHeight, scheduleScrollToBottom],
  );

  // A fresh node is a fresh beat: re-pin so the new text is followed even if the
  // reader had scrolled up in the previous node.
  useLayoutEffect(() => {
    pinnedToBottomRef.current = true;
  }, [state.currentNodeId]);

  useLayoutEffect(() => {
    reportContentHeight();
    return scheduleScrollToBottom();
  }, [
    reportContentHeight,
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
      reportContentHeight();
      return scheduleScrollToBottom();
    }

    const observer = new ResizeObserver(() => {
      // While a segment streams in word-by-word, keep the text scrolled into view
      // but don't re-measure the dock every frame — that re-targets the height
      // spring on each word and makes the sheet stutter. The settled height is
      // captured on typing-complete and at each segment boundary instead.
      scheduleScrollToBottom();
      if (isTypingRef.current) {
        return;
      }
      reportContentHeight();
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [reportContentHeight, scheduleScrollToBottom]);

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      onClick={handleSurfaceTap}
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
              parliamentPresetId={parliamentPresetId}
              tokenStateByPayload={tokenStateByPayload}
            />
          );
        })}

        {currentSegment ? (
          <LogSegmentRenderer
            key={`current-${state.currentNodeId}-${state.currentSegmentIndex}`}
            segment={currentSegment}
            isTyping={state.isTypingSegment}
            previousSpeakerId={currentPreviousSpeakerId}
            playerProfile={playerProfile}
            parliamentPresetId={parliamentPresetId}
            typedTextRef={typedTextRef}
            onTypingChange={handleTypingChange}
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
