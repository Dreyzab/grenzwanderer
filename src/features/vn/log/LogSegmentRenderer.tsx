import { ChevronRight, CircleUserRound, Sparkles } from "lucide-react";
import type { RefObject } from "react";
import {
  TypedText,
  type TypedTextHandle,
  type TypedTextTokenHandler,
} from "../ui/TypedText";
import type { SpeakerSegment } from "./speakerParser";

interface LogSegmentRendererProps {
  segment: SpeakerSegment;
  dimmed?: boolean;
  isTyping?: boolean;
  showSpeaker?: boolean;
  typedTextRef?: RefObject<TypedTextHandle>;
  onTypingChange?: (typing: boolean) => void;
  onComplete?: () => void;
  onTokenClick?: TypedTextTokenHandler;
  onTokenEnter?: TypedTextTokenHandler;
  onTokenLeave?: TypedTextTokenHandler;
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
  onTokenClick,
  onTokenEnter,
  onTokenLeave,
}: LogSegmentRendererProps) {
  const isNarrator = segment.category === "narrator";
  const isInnerVoice = segment.category === "inner_voice";
  const isPlayer = segment.category === "player";
  const showSpeakerChrome = showSpeaker && !isNarrator && !isPlayer;
  const renderedText = (
    <TypedText
      ref={typedTextRef}
      text={segment.text}
      instant={!isTyping}
      onTypingChange={isTyping ? onTypingChange : undefined}
      onComplete={isTyping ? onComplete : undefined}
      onTokenClick={onTokenClick}
      onTokenEnter={onTokenEnter}
      onTokenLeave={onTokenLeave}
    />
  );

  if (isInnerVoice) {
    const accentColor = segment.accentColor ?? "#fbbf24";
    const accentSoftColor = segment.accentSoftColor ?? "rgba(251,191,36,0.14)";
    const glowColor = segment.glowColor ?? "rgba(251,191,36,0.22)";
    const textColor = segment.textColor ?? "#fef3c7";

    return (
      <article
        className={[
          "transition-opacity duration-500",
          dimmed ? "opacity-50" : "opacity-100",
        ].join(" ")}
        data-testid="vn-inner-voice-segment"
      >
        <div
          className="relative ml-3 max-w-[42rem] overflow-hidden border border-white/10 bg-stone-950/72 px-4 py-4 shadow-[0_18px_42px_rgba(0,0,0,0.42)] backdrop-blur-md sm:ml-8 sm:px-5"
          style={{
            borderColor: accentSoftColor,
            boxShadow: `0 18px 42px rgba(0,0,0,0.42), 0 0 34px ${glowColor}`,
          }}
        >
          <div
            className="absolute inset-y-0 left-0 w-1"
            style={{ backgroundColor: accentColor }}
          />
          <div
            className="absolute inset-0 pointer-events-none opacity-70"
            style={{
              background: `linear-gradient(120deg, ${accentSoftColor}, transparent 46%)`,
            }}
          />

          <div className="relative z-10 flex items-start gap-3">
            <span
              className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full border bg-black/35"
              style={{
                borderColor: accentColor,
                color: accentColor,
                boxShadow: `0 0 22px ${glowColor}`,
              }}
              aria-hidden
            >
              <Sparkles size={15} />
            </span>

            <div className="min-w-0">
              <div
                className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.2em]"
                style={{ color: accentColor }}
              >
                {segment.speakerLabel}
              </div>
              <div
                className="max-w-[36rem] whitespace-pre-wrap text-[1.22rem] italic leading-8 sm:text-[1.34rem]"
                style={{ color: textColor }}
              >
                {renderedText}
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  }

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
              loading="lazy"
              decoding="async"
              width={32}
              height={32}
              className="size-8 aspect-square rounded-full border border-amber-300/25 object-cover shadow-[0_0_20px_rgba(0,0,0,0.4)]"
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
        >
          {renderedText}
        </div>
      </div>
    </article>
  );
}
