import {
  ArrowRight,
  Check,
  Eye,
  Lock,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { getSkillCheckChanceTone } from "../checkChance";
import type { ChoiceInnerVoiceHintDisplay } from "../vnScreenTypes";
import {
  formatSkillCheckVoiceLabel,
  getSkillCheckVoicePalette,
} from "../skillCheckPalette";
import type { VnChoice } from "../types";
import {
  CHARACTER_SYNERGIES,
  type VnChoiceSource,
} from "../../../shared/game/characterProgression";
import {
  getVoiceFallbackIcon,
  resolveVoiceAvatarUrl,
} from "./VnInlineSpeakerBadge";

interface ChoicePrimaryAvatarProps {
  avatarUrl: string | null;
  fallbackIcon: LucideIcon;
  borderColor: string;
  glowColor?: string;
  ariaLabel?: string;
  disabled?: boolean;
}

function ChoicePrimaryAvatar({
  avatarUrl,
  fallbackIcon: FallbackIcon,
  borderColor,
  glowColor,
  ariaLabel,
  disabled,
}: ChoicePrimaryAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(avatarUrl) && !imageFailed;
  const style: CSSProperties = {
    borderColor,
    opacity: disabled ? 0.55 : 1,
  };
  if (glowColor) {
    style.boxShadow = `0 0 14px ${glowColor}`;
  }
  return (
    <span
      aria-label={ariaLabel}
      className="flex size-10 items-center justify-center overflow-hidden rounded-[4px] border-2 bg-black/55"
      data-testid="choice-primary-avatar"
      style={style}
      title={ariaLabel}
    >
      {showImage ? (
        <img
          alt=""
          className="size-full object-cover"
          data-testid="choice-primary-avatar-image"
          decoding="async"
          loading="lazy"
          src={avatarUrl ?? undefined}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <FallbackIcon
          aria-hidden="true"
          size={18}
          strokeWidth={2.2}
          style={{ color: borderColor }}
        />
      )}
    </span>
  );
}

export interface VnChoiceButtonProps {
  choice: VnChoice;
  index: number;
  isVisited?: boolean;
  isLocked?: boolean;
  disabled?: boolean;
  isPending?: boolean;
  hasFailedCheck?: boolean;
  chancePercent?: number;
  innerVoiceHints?: ChoiceInnerVoiceHintDisplay[];
  skillCheckState?:
    | "idle"
    | "arming"
    | "rolling"
    | "impact_success"
    | "impact_fail"
    | "result_success"
    | "result_fail";
  onClick: () => void;
}

const motionForState = (
  state: NonNullable<VnChoiceButtonProps["skillCheckState"]>,
) => {
  if (state === "arming") {
    return {
      animate: { scale: [1, 1.012, 1], y: [0, -2, 0] },
      transition: { duration: 0.3, ease: "easeOut" as const },
    };
  }
  if (state === "rolling") {
    return {
      animate: {
        scale: [1, 1.016, 1.01, 1],
        y: [0, -3, 0, -2],
        x: [0, 1.5, -1.5, 0],
      },
      transition: { duration: 1.2, ease: "easeInOut" as const },
    };
  }
  if (state === "impact_success") {
    return {
      animate: { scale: [1, 1.04, 1.015], y: [0, -5, -2] },
      transition: { duration: 0.5, ease: "easeOut" as const },
    };
  }
  if (state === "impact_fail") {
    return {
      animate: { scale: [1, 0.985, 0.995], y: [0, 5, 2], x: [0, -4, 4, 0] },
      transition: { duration: 0.5, ease: "easeOut" as const },
    };
  }
  if (state === "result_success") {
    return {
      animate: { scale: 1.015, y: -2, x: 0 },
      transition: { duration: 0.18, ease: "easeOut" as const },
    };
  }
  if (state === "result_fail") {
    return {
      animate: { scale: 0.995, y: 2, x: 0 },
      transition: { duration: 0.18, ease: "easeOut" as const },
    };
  }
  return {
    animate: { scale: 1, x: 0, y: 0 },
    transition: { duration: 0.16, ease: "easeOut" as const },
  };
};

const chanceColorClassName = (chancePercent: number): string => {
  const tone = getSkillCheckChanceTone(chancePercent);
  if (tone === "confident") {
    return "text-emerald-400";
  }
  if (tone === "risky") {
    return "text-amber-400";
  }
  return "text-rose-400";
};

const choiceSourceLabelById: Record<VnChoiceSource, string> = {
  common: "Common",
  voice: "Voice",
  origin: "Origin",
  synergy: "Synergy",
  signature: "Signature",
  flaw: "Flaw",
};

const choiceSourceAccentById: Record<VnChoiceSource, string> = {
  common: "#a8a29e",
  voice: "#fbbf24",
  origin: "#f59e0b",
  synergy: "#38bdf8",
  signature: "#34d399",
  flaw: "#fb7185",
};

const resolveChoiceSource = (choice: VnChoice): VnChoiceSource =>
  choice.choiceSource ?? (choice.skillCheck ? "voice" : "common");

const resolveChoiceSourceLabel = (choice: VnChoice): string => {
  const source = resolveChoiceSource(choice);
  if (source === "voice" && choice.skillCheck) {
    return formatSkillCheckVoiceLabel(choice.skillCheck.voiceId);
  }
  if (source === "synergy" && choice.skillCheck?.synergyId) {
    return CHARACTER_SYNERGIES[choice.skillCheck.synergyId].labelRu;
  }
  return choiceSourceLabelById[source];
};

function ChoiceSourceBadge({
  choice,
  voiceAccent,
}: {
  choice: VnChoice;
  voiceAccent?: string;
}) {
  const source = resolveChoiceSource(choice);
  const color =
    source === "voice" && voiceAccent
      ? voiceAccent
      : choiceSourceAccentById[source];

  return (
    <span
      className="mr-2 inline-flex max-w-full translate-y-[-0.12em] items-center rounded-[4px] border px-1.5 py-0.5 font-sans text-[9px] font-semibold uppercase tracking-[0.16em]"
      data-testid="choice-source-badge"
      data-choice-source={source}
      style={{
        borderColor: `${color}55`,
        backgroundColor: `${color}14`,
        color,
      }}
    >
      {resolveChoiceSourceLabel(choice)}
    </span>
  );
}

interface PrimaryVoiceFloatProps {
  hint: ChoiceInnerVoiceHintDisplay | null;
  children: ReactNode;
}

function PrimaryVoiceFloat({ hint, children }: PrimaryVoiceFloatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [popoverPos, setPopoverPos] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const containerRef = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLSpanElement>(null);
  const closeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const onDocPointer = (event: MouseEvent | TouchEvent) => {
      const trigger = containerRef.current;
      const popover = popoverRef.current;
      const target = event.target as Node;
      if (
        (trigger && trigger.contains(target)) ||
        (popover && popover.contains(target))
      ) {
        return;
      }
      setIsOpen(false);
    };
    document.addEventListener("mousedown", onDocPointer);
    document.addEventListener("touchstart", onDocPointer);
    return () => {
      document.removeEventListener("mousedown", onDocPointer);
      document.removeEventListener("touchstart", onDocPointer);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const onScrollOrResize = () => setIsOpen(false);
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [isOpen]);

  useLayoutEffect(() => {
    if (!isOpen || !containerRef.current) {
      setPopoverPos(null);
      return;
    }
    const rect = containerRef.current.getBoundingClientRect();
    setPopoverPos({ top: rect.top, left: rect.left });
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  if (!hint) {
    return (
      <span aria-hidden="true" className="float-left mr-3 mb-0.5 inline-block">
        {children}
      </span>
    );
  }

  const cancelCloseTimer = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const scheduleClose = () => {
    cancelCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setIsOpen(false);
      closeTimerRef.current = null;
    }, 120);
  };

  const handleToggle = (
    event:
      | ReactMouseEvent<HTMLSpanElement>
      | ReactKeyboardEvent<HTMLSpanElement>,
  ) => {
    event.stopPropagation();
    event.preventDefault();
    cancelCloseTimer();
    setIsOpen((prev) => !prev);
  };

  const stanceLabel = hint.stance.toUpperCase();

  return (
    <span
      ref={containerRef}
      className="float-left mr-3 mb-0.5 inline-block"
      data-testid="choice-primary-voice"
      data-stance={hint.stance}
      data-voice-id={hint.voiceId}
      onMouseEnter={() => {
        cancelCloseTimer();
        setIsOpen(true);
      }}
      onMouseLeave={scheduleClose}
    >
      <span
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={hint.label}
        className="cursor-pointer"
        onClick={handleToggle}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            handleToggle(event);
          } else if (event.key === "Escape" && isOpen) {
            event.stopPropagation();
            setIsOpen(false);
          }
        }}
        role="button"
        tabIndex={0}
        title={`${hint.label} ${hint.stance}`}
      >
        {children}
      </span>
      {isOpen && popoverPos && typeof document !== "undefined"
        ? createPortal(
            <span
              ref={popoverRef}
              className="pointer-events-auto fixed z-200 w-max max-w-[20rem] -translate-y-full cursor-default rounded-[5px] border bg-stone-950/95 px-3 py-2 text-left shadow-[0_18px_42px_rgba(0,0,0,0.62)] backdrop-blur-md"
              data-testid="choice-primary-voice-popover"
              role="dialog"
              style={{
                top: popoverPos.top - 8,
                left: popoverPos.left,
                borderColor: hint.palette.accentSoft,
                boxShadow: `0 18px 42px rgba(0,0,0,0.62), 0 0 24px ${hint.palette.glowStrong}`,
              }}
              onClick={(event) => event.stopPropagation()}
              onMouseEnter={cancelCloseTimer}
              onMouseLeave={scheduleClose}
            >
              <span
                className="block font-sans text-[9px] font-semibold uppercase tracking-[0.18em]"
                style={{ color: hint.palette.accent }}
              >
                {hint.label} · {stanceLabel}
              </span>
              <span
                className="mt-1 block font-serif text-[13px] leading-snug italic"
                style={{ color: hint.palette.text }}
              >
                {hint.text}
              </span>
            </span>,
            document.body,
          )
        : null}
    </span>
  );
}

export function VnChoiceButton({
  choice,
  isVisited = false,
  isLocked = false,
  disabled = false,
  isPending = false,
  hasFailedCheck = false,
  chancePercent,
  innerVoiceHints = [],
  skillCheckState = "idle",
  onClick,
}: VnChoiceButtonProps) {
  const skillCheck = choice.skillCheck;
  const hasSkillCheck = Boolean(skillCheck);
  const type = choice.choiceType || "action";

  const isAction = type === "action";
  const isInquiry = type === "inquiry";
  const isFlavor = type === "flavor";

  const visitedOpacity = isInquiry ? "opacity-30" : "opacity-50";
  const baseOpacity =
    isVisited || hasFailedCheck ? visitedOpacity : "opacity-100";
  const toneMotion = motionForState(skillCheckState);
  const primaryHint =
    !skillCheck && innerVoiceHints.length > 0 ? innerVoiceHints[0] : null;
  const primaryVoice = skillCheck
    ? {
        id: skillCheck.voiceId,
        label: formatSkillCheckVoiceLabel(skillCheck.voiceId),
        palette: getSkillCheckVoicePalette(skillCheck.voiceId),
      }
    : primaryHint
      ? {
          id: primaryHint.voiceId,
          label: primaryHint.label,
          palette: primaryHint.palette,
        }
      : null;
  const ChoiceIcon = primaryVoice
    ? getVoiceFallbackIcon(primaryVoice.id)
    : isAction
      ? ArrowRight
      : isInquiry
        ? isVisited
          ? Check
          : MessageCircle
        : Eye;
  const accentColor = primaryVoice
    ? primaryVoice.palette.accent
    : isAction
      ? "#fbbf24"
      : "#a8a29e";
  const glowColor = primaryVoice
    ? primaryVoice.palette.glowStrong
    : "rgba(168, 162, 158, 0.32)";
  const avatarBorderColor = accentColor;
  const avatarGlowColor = glowColor;
  const activeStateClassName =
    skillCheckState === "arming"
      ? "brightness-125"
      : skillCheckState === "rolling"
        ? "brightness-150"
        : skillCheckState === "impact_success" ||
            skillCheckState === "result_success"
          ? "brightness-150 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]"
          : skillCheckState === "impact_fail" ||
              skillCheckState === "result_fail"
            ? "brightness-75 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]"
            : "";

  const choiceTextClassName = [
    "font-serif text-lg leading-snug transition-colors duration-300 sm:text-xl md:text-[22px]",
    isVisited ? "text-stone-500" : "text-stone-300 group-hover:text-stone-100",
    isFlavor ? "italic" : "",
  ].join(" ");

  if (isLocked) {
    return (
      <div className="relative w-full cursor-not-allowed py-2 text-left opacity-50">
        <div className="flow-root">
          <span
            aria-hidden="true"
            className="float-left mr-3 mb-0.5 inline-block"
          >
            <ChoicePrimaryAvatar
              avatarUrl={
                primaryVoice ? resolveVoiceAvatarUrl(primaryVoice.id) : null
              }
              borderColor={primaryVoice?.palette.accent ?? "#f87171"}
              disabled
              fallbackIcon={
                primaryVoice ? getVoiceFallbackIcon(primaryVoice.id) : Lock
              }
            />
          </span>
          <span className="font-serif text-lg leading-snug text-stone-600 line-through sm:text-xl md:text-[22px]">
            <ChoiceSourceBadge choice={choice} voiceAccent={accentColor} />
            {choice.text}
          </span>
        </div>
      </div>
    );
  }

  return (
    <motion.button
      animate={toneMotion.animate}
      className={[
        "group relative w-full py-2 text-left transition-all duration-300",
        disabled || isPending || hasFailedCheck
          ? "pointer-events-none cursor-not-allowed opacity-50"
          : "cursor-pointer",
        baseOpacity,
        activeStateClassName,
      ].join(" ")}
      disabled={disabled || isPending || hasFailedCheck}
      transition={toneMotion.transition}
      type="button"
      onClick={onClick}
    >
      <div className="flow-root">
        <PrimaryVoiceFloat hint={primaryHint}>
          <ChoicePrimaryAvatar
            avatarUrl={
              primaryVoice ? resolveVoiceAvatarUrl(primaryVoice.id) : null
            }
            borderColor={avatarBorderColor}
            fallbackIcon={ChoiceIcon}
            glowColor={avatarGlowColor}
          />
        </PrimaryVoiceFloat>
        <span className={choiceTextClassName}>
          <ChoiceSourceBadge choice={choice} voiceAccent={accentColor} />
          {choice.text}
        </span>

        {hasSkillCheck ? (
          <div className="mt-1.5 flex items-center gap-2 font-sans text-[10px] uppercase tracking-[0.15em] opacity-70 transition-opacity group-hover:opacity-100">
            <span style={{ color: primaryVoice?.palette.accent }}>
              {skillCheck!.difficulty}
            </span>
            {chancePercent !== undefined ? (
              <>
                <span className="text-stone-500/45">-</span>
                <span className={chanceColorClassName(chancePercent)}>
                  {`${chancePercent}%`}
                </span>
              </>
            ) : null}
          </div>
        ) : null}
      </div>
    </motion.button>
  );
}
