import { useEffect, useMemo, useRef } from "react";
import type { ReactNode, RefObject } from "react";
import type { VnSnapshot } from "../types";
import type { TypedTextHandle } from "../ui/TypedText";
import { LogEntryRenderer } from "./LogEntryRenderer";
import { LogSegmentRenderer } from "./LogSegmentRenderer";
import { resolveSpeakerPortrait } from "./speakerRegistry";
import type { SpeakerSegment } from "./speakerParser";
import type { LogEntry, NarrativeLogState } from "./useNarrativeLog";

interface VnNarrativeLogProps {
  state: NarrativeLogState;
  snapshot: VnSnapshot | null;
  typedTextRef?: RefObject<TypedTextHandle>;
  choicesSlot?: ReactNode;
  onTypingChange?: (typing: boolean) => void;
  onSegmentComplete?: () => void;
}

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
  onTypingChange,
  onSegmentComplete,
}: VnNarrativeLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }
    element.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
  }, [
    entries.length,
    state.currentSegmentIndex,
    state.currentNodeId,
    allSegmentsDone,
  ]);

  let previousSpeaker: string | null = null;

  return (
    <div
      ref={scrollRef}
      className="vn-log-container h-full overflow-y-auto px-5 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-4 sm:px-8"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-1">
        {entries.map((entry) => {
          const showSpeaker =
            entry.type !== "segment" ||
            !entry.segment ||
            entry.segment.speaker !== previousSpeaker;
          if (entry.segment) {
            previousSpeaker = entry.segment.speaker;
          }
          return (
            <LogEntryRenderer
              key={entry.id}
              entry={entry}
              dimmed
              showSpeaker={showSpeaker}
            />
          );
        })}

        {currentSegment ? (
          <LogSegmentRenderer
            segment={currentSegment}
            isTyping={state.isTypingSegment}
            showSpeaker={currentSegment.speaker !== previousSpeaker}
            typedTextRef={typedTextRef}
            onTypingChange={onTypingChange}
            onComplete={onSegmentComplete}
          />
        ) : null}

        {allSegmentsDone ? choicesSlot : null}
      </div>
    </div>
  );
}
