import { ArrowRight, Check, Eye, Lock, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { getSkillCheckChanceTone } from "../checkChance";
import type { ChoiceInnerVoiceHintDisplay } from "../vnScreenTypes";
import {
  formatSkillCheckVoiceLabel,
  getSkillCheckVoicePalette,
} from "../skillCheckPalette";
import type { VnChoice } from "../types";
import {
  getVoiceFallbackIcon,
  resolveVoiceAvatarUrl,
  VnInlineSpeakerBadge,
} from "./VnInlineSpeakerBadge";

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
  const primaryVoice = skillCheck
    ? {
        id: skillCheck.voiceId,
        label: formatSkillCheckVoiceLabel(skillCheck.voiceId),
        palette: getSkillCheckVoicePalette(skillCheck.voiceId),
      }
    : innerVoiceHints.length > 0
      ? {
          id: innerVoiceHints[0].voiceId,
          label: innerVoiceHints[0].label,
          palette: innerVoiceHints[0].palette,
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
  const accentSoftColor = primaryVoice
    ? primaryVoice.palette.accentSoft
    : isAction
      ? "rgba(251, 191, 36, 0.16)"
      : "rgba(168, 162, 158, 0.16)";
  const glowColor = primaryVoice
    ? primaryVoice.palette.glowStrong
    : "rgba(168, 162, 158, 0.32)";
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
  const secondaryHints = innerVoiceHints;

  if (isLocked) {
    return (
      <div className="relative w-full cursor-not-allowed py-2 text-left opacity-50">
        <div className="flex items-start gap-3">
          <span aria-hidden="true" className="shrink-0">
            <VnInlineSpeakerBadge
              accentColor={primaryVoice?.palette.accent ?? "#f87171"}
              accentSoftColor={
                primaryVoice?.palette.accentSoft ?? "rgba(127, 29, 29, 0.28)"
              }
              className="mt-0.5"
              disabled
              fallbackIcon={
                primaryVoice ? getVoiceFallbackIcon(primaryVoice.id) : Lock
              }
              glowColor={
                primaryVoice?.palette.glowStrong ?? "rgba(248, 113, 113, 0.36)"
              }
              imageUrl={
                primaryVoice ? resolveVoiceAvatarUrl(primaryVoice.id) : null
              }
              label={primaryVoice?.label ?? "Locked"}
              labelMode={primaryVoice ? "short" : "none"}
              size="lg"
            />
          </span>
          <span className="min-w-0 flex-1 font-serif text-lg leading-relaxed text-stone-600 line-through sm:text-xl md:text-[22px]">
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
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="shrink-0">
          <VnInlineSpeakerBadge
            accentColor={accentColor}
            accentSoftColor={accentSoftColor}
            className="mt-0.5"
            fallbackIcon={ChoiceIcon}
            glowColor={glowColor}
            imageUrl={
              primaryVoice ? resolveVoiceAvatarUrl(primaryVoice.id) : null
            }
            label={primaryVoice?.label ?? type}
            labelMode={primaryVoice ? "short" : "none"}
            size="lg"
          />
        </span>
        <div className="min-w-0 flex-1">
          <div
            className={[
              "font-serif text-lg leading-relaxed transition-colors duration-300 sm:text-xl md:text-[22px]",
              isVisited
                ? "text-stone-500"
                : "text-stone-300 group-hover:text-stone-100",
              isFlavor ? "italic" : "",
            ].join(" ")}
          >
            {choice.text}
          </div>

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

          {secondaryHints.length > 0 ? (
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {secondaryHints.map((hint) => (
                <span
                  key={`${hint.voiceId}-${hint.stance}`}
                  className="inline-flex items-center gap-1.5 rounded-[5px] border bg-black/25 px-1.5 py-1 opacity-70 transition-opacity group-hover:opacity-100"
                  style={{
                    borderColor: hint.palette.accentSoft,
                    color: hint.palette.text,
                  }}
                  title={hint.text}
                >
                  <VnInlineSpeakerBadge
                    accentColor={hint.palette.accent}
                    accentSoftColor={hint.palette.accentSoft}
                    fallbackIcon={getVoiceFallbackIcon(hint.voiceId)}
                    glowColor={hint.palette.glowStrong}
                    imageUrl={resolveVoiceAvatarUrl(hint.voiceId)}
                    label={hint.label}
                    labelMode="short"
                    size="sm"
                  />
                  <span className="font-sans text-[9px] font-medium uppercase tracking-[0.12em] opacity-80">
                    {hint.stance}
                  </span>
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </motion.button>
  );
}
