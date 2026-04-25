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
    </div>
  );
};
