import { ArrowRight, MessageCircle, Eye, Lock, Check } from "lucide-react";
import type { VnChoice } from "../types";

export interface VnChoiceButtonProps {
  choice: VnChoice;
  index: number;
  isVisited?: boolean;
  isLocked?: boolean;
  disabled?: boolean;
  isPending?: boolean;
  hasFailedCheck?: boolean;
  onClick: () => void;
}

const getVoiceLabel = (voiceId: string): string =>
  voiceId.replace(/^attr_/, "").toUpperCase();

const getVoiceColor = (voiceId: string) => {
  if (voiceId === "attr_perception") return "#3b82f6"; // blue-500
  if (voiceId === "attr_encyclopedia") return "#8b5cf6"; // violet-500
  if (voiceId === "attr_deception") return "#f59e0b"; // amber-500
  if (voiceId === "attr_persuasion") return "#10b981"; // emerald-500
  return "#a8a29e"; // stone-400
};

export function VnChoiceButton({
  choice,
  isVisited = false,
  isLocked = false,
  disabled = false,
  isPending = false,
  hasFailedCheck = false,
  onClick,
}: VnChoiceButtonProps) {
  const hasSkillCheck = !!choice.skillCheck;
  const type = choice.choiceType || "action";

  const isAction = type === "action";
  const isInquiry = type === "inquiry";
  const isFlavor = type === "flavor";

  const visitedOpacity = isInquiry ? "opacity-30" : "opacity-50";
  const baseOpacity =
    isVisited || hasFailedCheck ? visitedOpacity : "opacity-100";

  if (isLocked) {
    return (
      <div
        className={`w-full min-h-[44px] px-3 py-2 flex items-center gap-4 border-l-2 border-red-900/50 bg-red-950/10 cursor-not-allowed`}
      >
        <Lock size={18} className="text-red-500/70 flex-shrink-0" />
        {hasSkillCheck && (
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm"
            style={{
              backgroundColor: `${getVoiceColor(choice.skillCheck!.voiceId)}15`,
              color: getVoiceColor(choice.skillCheck!.voiceId),
              border: `1px solid ${getVoiceColor(choice.skillCheck!.voiceId)}30`,
            }}
          >
            {getVoiceLabel(choice.skillCheck!.voiceId)}{" "}
            {choice.skillCheck!.difficulty}
          </span>
        )}
        <span className="flex-1 text-stone-600 line-through">
          {choice.text}
        </span>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled || isPending || hasFailedCheck}
      className={`w-full min-h-[44px] px-3 py-2 transition-all duration-200 text-left flex items-start gap-3 group border-l-2 
                     ${disabled || isPending || hasFailedCheck ? "opacity-50 cursor-not-allowed pointer-events-none" : "cursor-pointer"} 
                     ${baseOpacity}
                     ${
                       isAction
                         ? isVisited
                           ? "border-amber-500/20 bg-amber-950/5 hover:bg-amber-900/10"
                           : "border-amber-500/50 bg-amber-950/10 hover:bg-amber-900/20"
                         : "border-transparent hover:border-stone-600 hover:bg-white/5"
                     }`}
    >
      <div className="mt-1 flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
        {isAction && <ArrowRight size={18} className="text-amber-500" />}
        {isInquiry &&
          (isVisited ? (
            <Check size={18} className="text-stone-500" />
          ) : (
            <MessageCircle size={18} className="text-stone-400" />
          ))}
        {isFlavor && <Eye size={18} className="text-blue-300/70" />}
      </div>

      <div className="flex-1 flex flex-col gap-1">
        {hasSkillCheck && (
          <span
            className="text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-2 self-start px-1.5 py-0.5 rounded-sm mt-0.5"
            style={{
              backgroundColor: `${getVoiceColor(choice.skillCheck!.voiceId)}15`,
              color: getVoiceColor(choice.skillCheck!.voiceId),
              border: `1px solid ${getVoiceColor(choice.skillCheck!.voiceId)}30`,
            }}
          >
            {getVoiceLabel(choice.skillCheck!.voiceId)}{" "}
            {choice.skillCheck!.difficulty}
          </span>
        )}

        <span
          className={`text-base sm:text-lg leading-snug transition-colors
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
    </button>
  );
}
