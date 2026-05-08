import { useState, type CSSProperties } from "react";
import {
  Activity,
  Brain,
  Book,
  Eye,
  Fingerprint,
  MessageSquare,
  Moon,
  Shield,
  Sparkles,
  type LucideIcon,
  VenetianMask,
} from "lucide-react";

type BadgeIcon = LucideIcon;

export type VnInlineSpeakerBadgeSize = "sm" | "md" | "lg";
export type VnInlineSpeakerBadgeLabelMode = "none" | "short" | "full";

interface VnInlineSpeakerBadgeProps {
  label: string;
  accentColor?: string;
  accentSoftColor?: string;
  className?: string;
  disabled?: boolean;
  fallbackIcon?: BadgeIcon;
  glowColor?: string;
  imageUrl?: string | null;
  labelMode?: VnInlineSpeakerBadgeLabelMode;
  size?: VnInlineSpeakerBadgeSize;
}

const DIRECT_VOICE_IMAGE_BY_ID: Record<string, string> = {
  ana: "/images/voices/analyst.png",
  analyst: "/images/voices/analyst.png",
  inner_analyst: "/images/voices/analyst.png",
  guide: "/images/voices/guide.png",
  gui: "/images/voices/guide.png",
  inner_guide: "/images/voices/guide.png",
  inner_leader: "/images/voices/leader.png",
  lea: "/images/voices/leader.png",
  leader: "/images/voices/leader.png",
};

const GROUP_IMAGE_KEY_BY_ID: Record<string, string> = {
  agility: "agility",
  attr_agility: "agility",
  attr_authority: "authority",
  attr_charisma: "charisma",
  attr_composure: "composure",
  attr_deception: "deception",
  attr_empathy: "empathy",
  attr_encyclopedia: "encyclopedia",
  attr_endurance: "endurance",
  attr_forensics: "forensics",
  attr_imagination: "imagination",
  attr_intellect: "logic",
  attr_intrusion: "intrusion",
  attr_intuition: "intuition",
  attr_logic: "logic",
  attr_occultism: "occultism",
  attr_perception: "perception",
  attr_persuasion: "social",
  attr_physical: "physical",
  attr_poetics: "poetics",
  attr_psyche: "psyche",
  attr_shadow: "shadow",
  attr_social: "social",
  attr_spirit: "spirit",
  attr_stealth: "stealth",
  attr_tradition: "tradition",
  authority: "authority",
  charisma: "charisma",
  deception: "deception",
  empathy: "empathy",
  encyclopedia: "encyclopedia",
  endurance: "endurance",
  forensics: "forensics",
  imagination: "imagination",
  inner_adapter: "agility",
  inner_cynic: "perception",
  inner_exile: "occultism",
  inner_hermit: "tradition",
  inner_manipulator: "charisma",
  intellect: "logic",
  intrusion: "intrusion",
  intuition: "intuition",
  logic: "logic",
  occultism: "occultism",
  perception: "perception",
  persuasion: "social",
  physical: "physical",
  poetics: "poetics",
  psyche: "psyche",
  shadow: "shadow",
  social: "social",
  spirit: "spirit",
  stealth: "stealth",
  tradition: "tradition",
};

const SPECIAL_SHORT_LABELS: Record<string, string> = {
  assistant: "ASST",
  authority: "AUT",
  charisma: "CHR",
  deception: "DCP",
  empathy: "EMP",
  encyclopedia: "ENC",
  logic: "LOG",
  occultism: "OCC",
  perception: "PRC",
  persuasion: "PRS",
};

const SIZE_CLASSES: Record<
  VnInlineSpeakerBadgeSize,
  { avatar: string; icon: number; label: string; root: string }
> = {
  sm: {
    root: "h-7 min-w-[3.25rem] gap-1 pl-1 pr-2",
    avatar: "size-5",
    icon: 12,
    label: "text-[0.56rem]",
  },
  md: {
    root: "h-9 min-w-[4.25rem] gap-1.5 pl-1 pr-2.5",
    avatar: "size-7",
    icon: 15,
    label: "text-[0.62rem]",
  },
  lg: {
    root: "h-10 min-w-[4.75rem] gap-2 pl-1 pr-3",
    avatar: "size-8",
    icon: 17,
    label: "text-[0.66rem]",
  },
};

const normalizeVoiceKey = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/^inner\s+/, "inner_")
    .replace(/[\s-]+/g, "_");

export const resolveVoiceAvatarUrl = (voiceId: string): string | null => {
  const normalized = normalizeVoiceKey(voiceId);
  const direct = DIRECT_VOICE_IMAGE_BY_ID[normalized];
  if (direct) {
    return direct;
  }

  const groupImageKey = GROUP_IMAGE_KEY_BY_ID[normalized];
  return groupImageKey ? `/images/ui/voices/groups/${groupImageKey}.png` : null;
};

export const getShortSpeakerLabel = (label: string): string => {
  const normalized = label.trim();
  if (!normalized) {
    return "";
  }

  const key = normalizeVoiceKey(normalized).replace(/^attr_/, "");
  const special = SPECIAL_SHORT_LABELS[key];
  if (special) {
    return special;
  }

  const words = normalized
    .replace(/^inner[_\s-]+/i, "")
    .split(/[\s_-]+/)
    .filter(Boolean);
  if (words.length > 1) {
    return words
      .map((word) => word[0])
      .join("")
      .slice(0, 3)
      .toUpperCase();
  }

  return normalized.slice(0, 3).toUpperCase();
};

export const getVoiceFallbackIcon = (voiceId: string): BadgeIcon => {
  const normalized = normalizeVoiceKey(voiceId);
  if (normalized.includes("logic") || normalized.includes("intellect")) {
    return Brain;
  }
  if (normalized.includes("encyclopedia")) {
    return Book;
  }
  if (normalized.includes("deception") || normalized.includes("manipulator")) {
    return VenetianMask;
  }
  if (
    normalized.includes("persuasion") ||
    normalized.includes("charisma") ||
    normalized.includes("social")
  ) {
    return MessageSquare;
  }
  if (
    normalized.includes("occultism") ||
    normalized.includes("spirit") ||
    normalized.includes("exile")
  ) {
    return Moon;
  }
  if (normalized.includes("perception") || normalized.includes("cynic")) {
    return Eye;
  }
  if (normalized.includes("empath") || normalized.includes("guide")) {
    return Activity;
  }
  if (normalized.includes("authorit") || normalized.includes("leader")) {
    return Shield;
  }
  if (normalized.startsWith("inner_")) {
    return Sparkles;
  }
  return Fingerprint;
};

export function VnInlineSpeakerBadge({
  label,
  accentColor = "#fbbf24",
  accentSoftColor = "rgba(251, 191, 36, 0.18)",
  className,
  disabled = false,
  fallbackIcon: FallbackIcon = Fingerprint,
  glowColor = "rgba(251, 191, 36, 0.3)",
  imageUrl,
  labelMode = "short",
  size = "md",
}: VnInlineSpeakerBadgeProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const sizeClass = SIZE_CLASSES[size];
  const displayLabel =
    labelMode === "full" ? label.toUpperCase() : getShortSpeakerLabel(label);
  const showImage = Boolean(imageUrl && !imageFailed);
  const rootStyle = {
    borderColor: accentSoftColor,
    boxShadow: `inset 0 0 14px rgba(0,0,0,0.62), 0 0 18px ${glowColor}`,
    color: accentColor,
  } satisfies CSSProperties;

  return (
    <span
      aria-label={label}
      className={[
        "inline-flex max-w-full shrink-0 items-center justify-center overflow-hidden rounded-[5px] border bg-black/55 align-middle text-current shadow-black/30 backdrop-blur-sm",
        sizeClass.root,
        disabled ? "opacity-55 grayscale" : "",
        className ?? "",
      ].join(" ")}
      data-testid="vn-inline-speaker-badge"
      data-speaker-label={label}
      style={rootStyle}
      title={label}
    >
      <span
        className={[
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded-[3px] border border-white/10 bg-black/45",
          sizeClass.avatar,
        ].join(" ")}
      >
        {showImage ? (
          <img
            alt=""
            className="size-full object-cover"
            data-testid="vn-inline-speaker-badge-image"
            decoding="async"
            loading="lazy"
            src={imageUrl ?? undefined}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <FallbackIcon
            aria-hidden="true"
            className="opacity-90"
            size={sizeClass.icon}
            strokeWidth={2.2}
          />
        )}
      </span>

      {labelMode !== "none" ? (
        <span
          className={[
            "min-w-0 truncate font-sans font-bold uppercase tracking-[0.12em] drop-shadow-md",
            labelMode === "full" ? "max-w-[8.5rem]" : "max-w-[3rem]",
            sizeClass.label,
          ].join(" ")}
        >
          {displayLabel}
        </span>
      ) : null}
    </span>
  );
}
