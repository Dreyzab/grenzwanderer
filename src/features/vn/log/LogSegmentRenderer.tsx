import { ChevronRight, CircleUserRound, Sparkles } from "lucide-react";
import type { RefObject } from "react";
import { TypedText, type TypedTextHandle } from "../ui/TypedText";
import type { SpeakerSegment } from "./speakerParser";

interface LogSegmentRendererProps {
  segment: SpeakerSegment;
  dimmed?: boolean;
  isTyping?: boolean;
  showSpeaker?: boolean;
  typedTextRef?: RefObject<TypedTextHandle>;
  onTypingChange?: (typing: boolean) => void;
  onComplete?: () => void;
}

const categoryTextClassName = (category: SpeakerSegment["category"]) => {
  if (category === "narrator") {
    return "text-stone-300/86 italic";
  }
  if (category === "inner_voice") {
    return "italic";
  }
  if (category === "player") {
    return "font-semibold text-amber-200";
  }
  return "text-stone-100";
};

export function LogSegmentRenderer({
  segment,
  dimmed = false,
  isTyping = false,
  showSpeaker = true,
  typedTextRef,
  onTypingChange,
  onComplete,
}: LogSegmentRendererProps) {
  const isNarrator = segment.category === "narrator";
  const isInnerVoice = segment.category === "inner_voice";
  const isPlayer = segment.category === "player";
  const showSpeakerChrome = showSpeaker && !isNarrator && !isPlayer;

  return (
    <article
      className={[
        "grid grid-cols-[2rem_minmax(0,1fr)] gap-3 transition-opacity duration-500",
        dimmed ? "opacity-50" : "opacity-100",
        showSpeakerChrome ? "pt-3" : "pt-1",
      ].join(" ")}
    >
      <div className="flex justify-center pt-1">
        {showSpeakerChrome ? (
          segment.portraitUrl ? (
            <img
              src={segment.portraitUrl}
              alt=""
              className="size-8 rounded-full border border-amber-300/25 object-cover shadow-[0_0_20px_rgba(0,0,0,0.4)]"
            />
          ) : isInnerVoice ? (
            <span
              className="flex size-8 items-center justify-center rounded-full border bg-black/30"
              style={{
                borderColor: segment.accentColor ?? "rgba(251,191,36,0.35)",
                color: segment.accentColor ?? "#fbbf24",
              }}
            >
              <Sparkles size={15} />
            </span>
          ) : (
            <span className="flex size-8 items-center justify-center rounded-full border border-amber-300/25 bg-black/35 text-amber-200/80">
              <CircleUserRound size={17} />
            </span>
          )
        ) : isPlayer ? (
          <ChevronRight size={18} className="mt-0.5 text-amber-300" />
        ) : null}
      </div>

      <div className="min-w-0">
        {showSpeakerChrome ? (
          <div
            className={[
              "mb-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]",
              isInnerVoice ? "" : "text-amber-300/88",
            ].join(" ")}
            style={{
              color: isInnerVoice ? segment.accentColor : undefined,
            }}
          >
            {segment.speakerLabel}
          </div>
        ) : null}
        <div
          className={[
            "whitespace-pre-wrap text-[1.3rem] leading-8 sm:text-[1.4rem]",
            categoryTextClassName(segment.category),
          ].join(" ")}
          style={{ color: isInnerVoice ? segment.textColor : undefined }}
        >
          {isTyping ? (
            <TypedText
              ref={typedTextRef}
              text={segment.text}
              onTypingChange={onTypingChange}
              onComplete={onComplete}
            />
          ) : (
            segment.text
          )}
        </div>
      </div>
    </article>
  );
}
