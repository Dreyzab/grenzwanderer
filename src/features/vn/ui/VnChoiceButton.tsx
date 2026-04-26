import { ArrowRight, Check, Eye, Lock, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { getSkillCheckChanceTone } from "../checkChance";
import type { ChoiceInnerVoiceHintDisplay } from "../vnScreenTypes";
import {
  formatSkillCheckVoiceLabel,
  getSkillCheckVoicePalette,
} from "../skillCheckPalette";
import type { VnChoice } from "../types";

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

const chanceChipClassName = (chancePercent: number): string => {
  const tone = getSkillCheckChanceTone(chancePercent);
  if (tone === "confident") {
    return "border-emerald-400/35 bg-emerald-500/10 text-emerald-200";
  }
  if (tone === "risky") {
    return "border-amber-300/35 bg-amber-500/10 text-amber-100";
  }
  return "border-rose-400/35 bg-rose-500/10 text-rose-100";
};

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
  const hasSkillCheck = !!skillCheck;
  const type = choice.choiceType || "action";

  const isAction = type === "action";
  const isInquiry = type === "inquiry";
  const isFlavor = type === "flavor";

  const visitedOpacity = isInquiry ? "opacity-30" : "opacity-50";
  const baseOpacity =
    isVisited || hasFailedCheck ? visitedOpacity : "opacity-100";
  const toneMotion = motionForState(skillCheckState);
  const voicePalette = skillCheck
    ? getSkillCheckVoicePalette(skillCheck.voiceId)
    : null;

  const activeStateClassName =
    skillCheckState === "arming"
      ? "shadow-[0_0_0_1px_rgba(251,191,36,0.18),0_14px_36px_rgba(0,0,0,0.28)]"
      : skillCheckState === "rolling"
        ? "shadow-[0_0_0_1px_rgba(226,186,109,0.22),0_20px_48px_rgba(0,0,0,0.34)]"
        : skillCheckState === "impact_success" ||
            skillCheckState === "result_success"
          ? "shadow-[0_0_0_1px_rgba(167,243,208,0.2),0_18px_46px_rgba(7,18,11,0.32)] border-l-emerald-300/70"
          : skillCheckState === "impact_fail" ||
              skillCheckState === "result_fail"
            ? "shadow-[0_0_0_1px_rgba(251,113,133,0.18),0_18px_46px_rgba(30,7,10,0.36)] border-l-rose-400/60"
            : "";

  if (isLocked) {
    return (
      <div className="w-full min-h-[44px] px-3 py-2 flex items-center gap-4 border-l-2 border-red-900/50 bg-red-950/10 cursor-not-allowed">
        <Lock size={18} className="text-red-500/70 flex-shrink-0" />
        {hasSkillCheck ? (
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm"
              style={{
                backgroundColor: voicePalette?.accentSoft,
                color: voicePalette?.accent,
                border: `1px solid ${voicePalette?.glow}`,
              }}
            >
              {formatSkillCheckVoiceLabel(skillCheck!.voiceId).toUpperCase()}{" "}
              {skillCheck!.difficulty}
            </span>
            {chancePercent !== undefined ? (
              <span
                className={[
                  "text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded-sm border uppercase",
                  chanceChipClassName(chancePercent),
                ].join(" ")}
              >
                {`${chancePercent}%`}
              </span>
            ) : null}
          </div>
        ) : null}
        <span className="flex-1 text-stone-600 line-through">
          {choice.text}
        </span>
      </div>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled || isPending || hasFailedCheck}
      className={`w-full min-h-[44px] px-3 py-2 transition-all duration-200 text-left flex items-start gap-3 group border-l-2 
                     ${disabled || isPending || hasFailedCheck ? "opacity-50 cursor-not-allowed pointer-events-none" : "cursor-pointer"} 
                     ${baseOpacity}
                     ${activeStateClassName}
                     ${
                       isAction
                         ? isVisited
                           ? "border-amber-500/20 bg-amber-950/5 hover:bg-amber-900/10"
                           : "border-amber-500/50 bg-amber-950/10 hover:bg-amber-900/20"
                         : "border-transparent hover:border-stone-600 hover:bg-white/5"
                     }`}
      animate={toneMotion.animate}
      transition={toneMotion.transition}
    >
      <div className="mt-1 flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
        {isAction ? <ArrowRight size={18} className="text-amber-500" /> : null}
        {isInquiry ? (
          isVisited ? (
            <Check size={18} className="text-stone-500" />
          ) : (
            <MessageCircle size={18} className="text-stone-400" />
          )
        ) : null}
        {isFlavor ? <Eye size={18} className="text-blue-300/70" /> : null}
      </div>

      <div className="flex-1 flex flex-col gap-1">
        {hasSkillCheck ? (
          <div className="flex flex-wrap items-center gap-2 mt-0.5">
            <span
              className="text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-2 self-start px-1.5 py-0.5 rounded-sm"
              style={{
                backgroundColor: voicePalette?.accentSoft,
                color: voicePalette?.accent,
                border: `1px solid ${voicePalette?.glow}`,
              }}
            >
              {formatSkillCheckVoiceLabel(skillCheck!.voiceId).toUpperCase()}{" "}
              {skillCheck!.difficulty}
            </span>
            {chancePercent !== undefined ? (
              <span
                className={[
                  "text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded-sm border uppercase",
                  chanceChipClassName(chancePercent),
                ].join(" ")}
                title="Predicted chance"
              >
                {`${chancePercent}%`}
              </span>
            ) : null}
          </div>
        ) : null}

        {innerVoiceHints.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 mt-0.5">
            {innerVoiceHints.map((hint) => (
              <span
                key={`${hint.voiceId}-${hint.stance}`}
                className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.16em]"
                style={{
                  borderColor: hint.palette.glowStrong,
                  backgroundColor: hint.palette.accentSoft,
                  color: hint.palette.text,
                }}
                title={hint.text}
              >
                <span>{hint.label}</span>
                <span className="opacity-70">
                  {hint.stance === "supports" ? "supports" : "opposes"}
                </span>
              </span>
            ))}
          </div>
        ) : null}

        <span
          className={`text-lg sm:text-xl leading-snug transition-colors
                  ${
                    isAction
                      ? isVisited
                        ? "text-stone-500 font-medium"
                        : "text-amber-100 font-medium group-hover:text-amber-50 shadow-black drop-shadow-sm"
                      : ""
                  }
                  ${
                    isInquiry
                      ? isVisited
                        ? "text-stone-600"
                        : "text-stone-300 group-hover:text-stone-100"
                      : ""
                  }
                  ${
                    isFlavor
                      ? isVisited
                        ? "text-blue-200/40 italic"
                        : "text-blue-100/80 italic group-hover:text-blue-50"
                      : ""
                  }
              `}
        >
          {choice.text}
        </span>
      </div>
    </motion.button>
  );
}
