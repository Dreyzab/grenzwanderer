import React from "react";
import { NoirTypography } from "../../../shared/ui/NoirTypography";
import { TypedText, TypedTextHandle } from "./TypedText";

interface VnNarrativeTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  onTypingChange?: (isTyping: boolean) => void;
  typedTextRef?: React.RefObject<TypedTextHandle>;
}

export const VnNarrativeText: React.FC<VnNarrativeTextProps> = ({
  text,
  speed,
  onComplete,
  onTypingChange,
  typedTextRef,
}) => {
  return (
    <div className="max-w-[600px] mx-auto pt-4 relative">
      {/* We need the TypedText logic inside NoirTypography for stylistic output */}
      <NoirTypography>
        <TypedText
          ref={typedTextRef}
          text={text}
          speed={speed}
          onComplete={onComplete}
          onTypingChange={onTypingChange}
        />
      </NoirTypography>

      <div className="mt-6 flex justify-between items-center text-white/40">
        <div className="flex gap-1">
          <div className="h-1.5 w-6 rounded-full bg-primary/40"></div>
          <div className="h-1.5 w-1.5 rounded-full bg-white/10"></div>
          <div className="h-1.5 w-1.5 rounded-full bg-white/10"></div>
        </div>
        <span className="text-[10px] font-bold tracking-widest uppercase">
          Tap to continue
        </span>
      </div>
    </div>
  );
};
