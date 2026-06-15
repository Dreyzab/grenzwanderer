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
  type TypedTextTokenState,
  type TypedTextTokenHandler,
} from "../ui/TypedText";
import { resolveVoiceAvatarUrl } from "../ui/VnInlineSpeakerBadge";
import { getVoicePresentation } from "../voicePresentation";
import {
  isInnerVoiceId,
  isSkillVoiceId,
} from "../../../../data/innerVoiceContract";
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
  parliamentPresetId?: string;
  typedTextRef?: RefObject<TypedTextHandle>;
  onTypingChange?: (typing: boolean) => void;
  onComplete?: () => void;
  onTokenClick?: TypedTextTokenHandler;
  onTokenEnter?: TypedTextTokenHandler;
  onTokenLeave?: TypedTextTokenHandler;
  tokenStateByPayload?: Readonly<Record<string, TypedTextTokenState>>;
}

const PLAYER_DEFAULT_ACCENT = "#e7e5e4";

const categoryTextClassName = (category: SpeakerSegment["category"]) => {
  if (category === "narrator") {
    return "text-stone-300/86 italic";
  }
  if (category === "inner_voice" || category === "method_voice") {
    return "italic";
  }
  if (category === "player") {
    return "font-semibold text-ember-100";
  }
  return "text-stone-100";
};

interface SpeakerHeaderProps {
  avatarUrl?: string | null;
  name: string;
  accentColor: string;
  fallbackIcon: LucideIcon;
  ariaLabel: string;
  /** Skewed accent-tab nameplate (ADV / dossier look) for embodied speakers. */
  tab?: boolean;
}

function SpeakerHeader({
  avatarUrl,
  name,
  accentColor,
  fallbackIcon: FallbackIcon,
  ariaLabel,
  tab = false,
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
      {tab ? (
        <span
          className="mb-1.5 inline-flex max-w-full -skew-x-12 items-center border-l-[3px] bg-stone-950/75 px-2.5 py-1 align-top shadow-[0_4px_14px_rgba(0,0,0,0.5)]"
          style={{ borderLeftColor: accentColor }}
        >
          <span
            className="skew-x-12 text-[0.66rem] leading-none font-bold uppercase tracking-[0.18em] drop-shadow-md"
            data-testid="vn-speaker-name"
            style={{ color: accentColor }}
          >
            {name}
          </span>
        </span>
      ) : (
        <span
          className="mb-1 block text-[0.66rem] leading-none font-bold uppercase tracking-[0.18em] drop-shadow-md"
          data-testid="vn-speaker-name"
          style={{ color: accentColor }}
        >
          {name}
        </span>
      )}
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
  parliamentPresetId,
  typedTextRef,
  onTypingChange,
  onComplete,
  onTokenClick,
  onTokenEnter,
  onTokenLeave,
  tokenStateByPayload,
}: LogSegmentRendererProps) {
  const isNarrator = segment.category === "narrator";
  const isInnerVoice = segment.category === "inner_voice";
  const isMethodVoice = segment.category === "method_voice";
  const isVoice = isInnerVoice || isMethodVoice;
  const isPlayer = segment.category === "player";
  // Entrance fade only for live beats; historical (dimmed) entries are already settled.
  const enterAnimation = dimmed ? "" : "vn-log-segment-in";

  const renderedText = (
    <TypedText
      ref={typedTextRef}
      instant={!isTyping}
      text={segment.text}
      tokenStateByPayload={tokenStateByPayload}
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
          enterAnimation,
          "pt-1 transition-opacity duration-500",
          dimmed ? "opacity-50" : "opacity-100",
        ].join(" ")}
      >
        <div
          className={[
            "whitespace-pre-wrap text-[1.08rem] leading-7 sm:text-[1.18rem]",
            categoryTextClassName(segment.category),
          ].join(" ")}
        >
          {renderedText}
        </div>
      </article>
    );
  }

  const collapsed =
    !isVoice &&
    (!showSpeaker ||
      (previousSpeakerId != null && previousSpeakerId === segment.speaker));

  if (isVoice) {
    const presentation =
      isInnerVoiceId(segment.speaker) || isSkillVoiceId(segment.speaker)
        ? getVoicePresentation(segment.speaker, parliamentPresetId)
        : null;
    const voiceLabel = presentation?.label ?? segment.speakerLabel;
    const accentColor =
      presentation?.palette.accent ?? segment.accentColor ?? "#fbbf24";
    const accentSoftColor =
      presentation?.palette.accentSoft ??
      segment.accentSoftColor ??
      "rgba(251,191,36,0.14)";
    const glowColor =
      presentation?.palette.glow ??
      segment.glowColor ??
      "rgba(251,191,36,0.22)";
    const textColor =
      presentation?.palette.text ?? segment.textColor ?? "#fef3c7";
    const avatarUrl = resolveVoiceAvatarUrl(segment.speaker);

    return (
      <article
        className={[
          enterAnimation,
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
              "relative z-10 overflow-hidden whitespace-pre-wrap text-[1.02rem] leading-7 sm:text-[1.12rem] [&_.vn-typed-text]:leading-[1.2]",
              categoryTextClassName(segment.category),
            ].join(" ")}
            style={{ color: textColor } satisfies CSSProperties}
          >
            <SpeakerHeader
              ariaLabel={voiceLabel}
              accentColor={accentColor}
              avatarUrl={avatarUrl}
              fallbackIcon={Sparkles}
              name={voiceLabel.toUpperCase()}
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
        enterAnimation,
        "pt-2 transition-opacity duration-500",
        dimmed ? "opacity-50" : "opacity-100",
      ].join(" ")}
    >
      <div
        className={[
          "overflow-hidden whitespace-pre-wrap text-[1.08rem] leading-7 sm:text-[1.18rem] [&_.vn-typed-text]:leading-[1.2]",
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
            tab
          />
        ) : null}
        {renderedText}
      </div>
    </article>
  );
}
