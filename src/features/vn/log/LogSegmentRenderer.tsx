import {
  ChevronRight,
  CircleUserRound,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { useState, type CSSProperties, type RefObject } from "react";
import {
  TypedText,
  type TypedTextHandle,
  type TypedTextTokenHandler,
} from "../ui/TypedText";
import { resolveVoiceAvatarUrl } from "../ui/VnInlineSpeakerBadge";
import type { SpeakerSegment } from "./speakerParser";

export interface PlayerProfileForLog {
  name: string;
  avatarUrl?: string | null;
  accentColor?: string;
}

interface LogSegmentRendererProps {
  segment: SpeakerSegment;
  dimmed?: boolean;
  isTyping?: boolean;
  showSpeaker?: boolean;
  previousSpeakerId?: string | null;
  playerProfile?: PlayerProfileForLog | null;
  typedTextRef?: RefObject<TypedTextHandle>;
  onTypingChange?: (typing: boolean) => void;
  onComplete?: () => void;
  onTokenClick?: TypedTextTokenHandler;
  onTokenEnter?: TypedTextTokenHandler;
  onTokenLeave?: TypedTextTokenHandler;
}

const PLAYER_DEFAULT_ACCENT = "#e7e5e4";

const categoryTextClassName = (category: SpeakerSegment["category"]) => {
  if (category === "narrator") {
    return "text-stone-300/86 italic";
  }
  if (category === "inner_voice") {
    return "italic";
  }
  if (category === "player") {
    return "font-semibold text-amber-100";
  }
  return "text-stone-100";
};

interface SpeakerHeaderProps {
  avatarUrl?: string | null;
  name: string;
  accentColor: string;
  fallbackIcon: LucideIcon;
  ariaLabel: string;
}

function SpeakerHeader({
  avatarUrl,
  name,
  accentColor,
  fallbackIcon: FallbackIcon,
  ariaLabel,
}: SpeakerHeaderProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(avatarUrl) && !imageFailed;

  return (
    <>
      <span
        aria-label={ariaLabel}
        className="float-left mr-3 mb-0.5 flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-[4px] border border-white/10 bg-black/45"
        data-testid="vn-speaker-avatar"
        data-speaker-label={ariaLabel}
        style={{ borderColor: `${accentColor}33` }}
        title={ariaLabel}
      >
        {showImage ? (
          <img
            alt=""
            className="size-full object-cover"
            data-testid="vn-speaker-avatar-image"
            decoding="async"
            loading="lazy"
            src={avatarUrl ?? undefined}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <FallbackIcon
            aria-hidden="true"
            className="opacity-90"
            size={20}
            strokeWidth={2.2}
            style={{ color: accentColor }}
          />
        )}
      </span>
      <span
        className="mb-1 block text-[0.66rem] leading-none font-bold uppercase tracking-[0.18em] drop-shadow-md"
        data-testid="vn-speaker-name"
        style={{ color: accentColor }}
      >
        {name}
      </span>
    </>
  );
}

export function LogSegmentRenderer({
  segment,
  dimmed = false,
  isTyping = false,
  showSpeaker = true,
  previousSpeakerId,
  playerProfile,
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

  const collapsed =
    !isInnerVoice &&
    (!showSpeaker ||
      (previousSpeakerId != null && previousSpeakerId === segment.speaker));

  if (isInnerVoice) {
    const accentColor = segment.accentColor ?? "#fbbf24";
    const accentSoftColor = segment.accentSoftColor ?? "rgba(251,191,36,0.14)";
    const glowColor = segment.glowColor ?? "rgba(251,191,36,0.22)";
    const textColor = segment.textColor ?? "#fef3c7";
    const avatarUrl = resolveVoiceAvatarUrl(segment.speaker);

    return (
      <article
        className={[
          "transition-opacity duration-500",
          dimmed ? "opacity-50" : "opacity-100",
        ].join(" ")}
        data-testid="vn-inner-voice-segment"
      >
        <div
          className="relative max-w-2xl overflow-hidden border border-white/10 bg-stone-950/72 px-4 py-4 shadow-[0_18px_42px_rgba(0,0,0,0.42)] backdrop-blur-md sm:px-5"
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

          <div
            className={[
              "relative z-10 overflow-hidden whitespace-pre-wrap text-[1.22rem] leading-8 sm:text-[1.34rem] [&_.vn-typed-text]:leading-[1.2]",
              categoryTextClassName(segment.category),
            ].join(" ")}
            style={{ color: textColor } satisfies CSSProperties}
          >
            <SpeakerHeader
              ariaLabel={segment.speakerLabel}
              accentColor={accentColor}
              avatarUrl={avatarUrl}
              fallbackIcon={Sparkles}
              name={segment.speakerLabel.toUpperCase()}
            />
            {renderedText}
          </div>
        </div>
      </article>
    );
  }

  const baseAccent = isPlayer
    ? (playerProfile?.accentColor ?? PLAYER_DEFAULT_ACCENT)
    : (segment.accentColor ?? "#fbbf24");
  const avatarUrl = isPlayer
    ? (playerProfile?.avatarUrl ?? null)
    : (segment.portraitUrl ?? null);
  const displayName = isPlayer
    ? (playerProfile?.name ?? segment.speakerLabel ?? "You").toUpperCase()
    : segment.speakerLabel.toUpperCase();
  const ariaLabel = isPlayer
    ? (playerProfile?.name ?? segment.speakerLabel ?? "You")
    : segment.speakerLabel;

  return (
    <article
      className={[
        "pt-2 transition-opacity duration-500",
        dimmed ? "opacity-50" : "opacity-100",
      ].join(" ")}
    >
      <div
        className={[
          "overflow-hidden whitespace-pre-wrap text-[1.3rem] leading-8 sm:text-[1.4rem] [&_.vn-typed-text]:leading-[1.2]",
          categoryTextClassName(segment.category),
        ].join(" ")}
      >
        {!collapsed ? (
          <SpeakerHeader
            ariaLabel={ariaLabel}
            accentColor={baseAccent}
            avatarUrl={avatarUrl}
            fallbackIcon={isPlayer ? ChevronRight : CircleUserRound}
            name={displayName}
          />
        ) : null}
        {renderedText}
      </div>
    </article>
  );
}
