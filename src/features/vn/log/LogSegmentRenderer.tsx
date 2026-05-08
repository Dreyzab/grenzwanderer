import { ChevronRight, CircleUserRound, Sparkles } from "lucide-react";
import type { RefObject } from "react";
import {
  TypedText,
  type TypedTextHandle,
  type TypedTextTokenHandler,
} from "../ui/TypedText";
import {
  resolveVoiceAvatarUrl,
  VnInlineSpeakerBadge,
} from "../ui/VnInlineSpeakerBadge";
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
  const renderedText = (
    <TypedText
      ref={typedTextRef}
      instant={!isTyping}
      text={segment.text}
      onComplete={isTyping ? onComplete : undefined}
      onTokenClick={onTokenClick}
      onTokenEnter={onTokenEnter}
      onTokenLeave={onTokenLeave}
      onTypingChange={isTyping ? onTypingChange : undefined}
    />
  );

  if (isNarrator) {
    return (
      <article
        className={[
          "pt-1 transition-opacity duration-500",
          dimmed ? "opacity-50" : "opacity-100",
        ].join(" ")}
      >
        <div
          className={[
            "whitespace-pre-wrap text-[1.3rem] leading-8 sm:text-[1.4rem]",
            categoryTextClassName(segment.category),
          ].join(" ")}
        >
          {renderedText}
        </div>
      </article>
    );
  }

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
          className="relative max-w-[42rem] overflow-hidden border border-white/10 bg-stone-950/72 px-4 py-4 shadow-[0_18px_42px_rgba(0,0,0,0.42)] backdrop-blur-md sm:px-5"
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
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{
              background: `linear-gradient(120deg, ${accentSoftColor}, transparent 46%)`,
            }}
          />

          <div className="relative z-10 flex items-start gap-3">
            <VnInlineSpeakerBadge
              accentColor={accentColor}
              accentSoftColor={accentSoftColor}
              className="shrink-0 mt-0.5"
              fallbackIcon={Sparkles}
              glowColor={glowColor}
              imageUrl={resolveVoiceAvatarUrl(segment.speaker)}
              label={segment.speakerLabel}
              labelMode="short"
              size="lg"
            />
            <div
              className={[
                "min-w-0 flex-1 whitespace-pre-wrap text-[1.22rem] leading-8 sm:text-[1.34rem]",
                categoryTextClassName(segment.category),
              ].join(" ")}
              style={{ color: textColor }}
            >
              {renderedText}
            </div>
          </div>
        </div>
      </article>
    );
  }

  const accentColor = isPlayer ? "#fcd34d" : (segment.accentColor ?? "#fbbf24");
  const accentSoftColor = isPlayer
    ? "rgba(251, 191, 36, 0.18)"
    : (segment.accentSoftColor ?? "rgba(251, 191, 36, 0.16)");
  const avatarUrl = isPlayer ? null : segment.portraitUrl;

  return (
    <article
      className={[
        "pt-2 transition-opacity duration-500",
        dimmed ? "opacity-50" : "opacity-100",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <VnInlineSpeakerBadge
          accentColor={accentColor}
          accentSoftColor={accentSoftColor}
          className="shrink-0 mt-0.5"
          fallbackIcon={isPlayer ? ChevronRight : CircleUserRound}
          glowColor={
            isPlayer ? "rgba(251, 191, 36, 0.36)" : "rgba(251, 191, 36, 0.28)"
          }
          imageUrl={avatarUrl}
          label={isPlayer ? "You" : segment.speakerLabel}
          labelMode="short"
          size="md"
        />
        <div
          className={[
            "min-w-0 flex-1 whitespace-pre-wrap text-[1.3rem] leading-8 sm:text-[1.4rem]",
            categoryTextClassName(segment.category),
          ].join(" ")}
        >
          {renderedText}
        </div>
      </div>
    </article>
  );
}
