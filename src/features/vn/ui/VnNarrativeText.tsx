import React from "react";
import { NoirTypography } from "../../../shared/ui/NoirTypography";
import {
  TypedText,
  type TypedTextHandle,
  type TypedTextTokenState,
  type TypedTextTokenHandler,
} from "./TypedText";

interface VnNarrativeTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  onTokenClick?: TypedTextTokenHandler;
  onTokenEnter?: TypedTextTokenHandler;
  onTokenLeave?: TypedTextTokenHandler;
  tokenStateByPayload?: Readonly<Record<string, TypedTextTokenState>>;
  onTypingChange?: (isTyping: boolean) => void;
  typedTextRef?: React.RefObject<TypedTextHandle>;
}

export const VnNarrativeText: React.FC<VnNarrativeTextProps> = ({
  text,
  speed,
  onComplete,
  onTokenClick,
  onTokenEnter,
  onTokenLeave,
  tokenStateByPayload,
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
          tokenStateByPayload={tokenStateByPayload}
          onComplete={onComplete}
          onTokenClick={onTokenClick}
          onTokenEnter={onTokenEnter}
          onTokenLeave={onTokenLeave}
          onTypingChange={onTypingChange}
        />
      </NoirTypography>
    </div>
  );
};
