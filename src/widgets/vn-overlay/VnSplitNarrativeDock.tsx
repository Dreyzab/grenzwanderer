import React, { useCallback, useLayoutEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VnNarrativeText } from "../../features/vn/ui/VnNarrativeText";
import { getCharacterPortrait } from "../../features/vn/characterAssets";
import type {
  TypedTextHandle,
  TypedTextTokenHandler,
} from "../../features/vn/ui/TypedText";

interface VnSplitNarrativeDockProps {
  characterId?: string;
  characterName?: string;
  choicesSlot?: React.ReactNode;
  isThoughtLog: boolean;
  isTyping?: boolean;
  narrativeText: string;
  typedTextRef?: React.RefObject<TypedTextHandle>;
  onNarrativeComplete?: () => void;
  onSurfaceInteraction: () => void;
  onTokenClick?: TypedTextTokenHandler;
  onTokenEnter?: TypedTextTokenHandler;
  onTokenLeave?: TypedTextTokenHandler;
  onTypingChange?: (typing: boolean) => void;
}

export const VnSplitNarrativeDock = ({
  characterId,
  characterName,
  choicesSlot,
  isThoughtLog,
  isTyping,
  narrativeText,
  typedTextRef,
  onNarrativeComplete,
  onSurfaceInteraction,
  onTokenClick,
  onTokenEnter,
  onTokenLeave,
  onTypingChange,
}: VnSplitNarrativeDockProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const portraitUrl = getCharacterPortrait(characterId);

  const scrollToBottom = useCallback(() => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }
    element.scrollTop = element.scrollHeight;
  }, []);

  const scheduleScrollToBottom = useCallback(() => {
    scrollToBottom();
    if (typeof window === "undefined") {
      return undefined;
    }

    let nestedFrame = 0;
    const firstFrame = window.requestAnimationFrame(scrollToBottom);
    const secondFrame = window.requestAnimationFrame(() => {
      nestedFrame = window.requestAnimationFrame(scrollToBottom);
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
      if (nestedFrame) {
        window.cancelAnimationFrame(nestedFrame);
      }
    };
  }, [scrollToBottom]);

  useLayoutEffect(() => {
    return scheduleScrollToBottom();
  }, [choicesSlot, isTyping, narrativeText, scheduleScrollToBottom]);

  useLayoutEffect(() => {
    const target = contentRef.current;
    if (!target || typeof ResizeObserver === "undefined") {
      return scheduleScrollToBottom();
    }

    const observer = new ResizeObserver(() => {
      scheduleScrollToBottom();
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [scheduleScrollToBottom]);

  return (
    <motion.div
      className={[
        "absolute bottom-0 z-150 flex flex-col border-t border-white/10 shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.8)]",
        isThoughtLog
          ? "left-0 min-h-[48%] max-h-[78%] w-full sm:left-6 sm:max-w-2xl"
          : "inset-x-0 min-h-[35%] max-h-[65%]",
      ].join(" ")}
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 18 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="h-[2px] bg-linear-to-r from-transparent via-amber-600/80 to-transparent shrink-0" />

      {/* Character Portrait */}
      {!isThoughtLog && portraitUrl && (
        <div className="absolute left-0 bottom-full w-full pointer-events-none overflow-visible">
          <motion.div
            key={portraitUrl}
            initial={{ opacity: 0, x: -40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.98 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="absolute left-0 bottom-0 origin-bottom-left"
          >
            <div className="relative">
              <img
                src={portraitUrl}
                alt={characterName}
                className="h-[45vh] w-auto object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)] mix-blend-normal"
                style={{
                  maskImage:
                    "linear-gradient(to top, rgba(0,0,0,1) 85%, rgba(0,0,0,0))",
                  WebkitMaskImage:
                    "linear-gradient(to top, rgba(0,0,0,1) 85%, rgba(0,0,0,0))",
                }}
              />
              {/* Subtle rim light effect */}
              <div className="absolute inset-0 bg-linear-to-tr from-amber-500/10 to-transparent opacity-30 mix-blend-overlay" />
            </div>
          </motion.div>
        </div>
      )}

      {characterName && (
        <div className="absolute left-0 -top-5 z-20 flex items-end group">
          <div className="absolute left-8 top-full h-4 w-[2px] bg-amber-500/40" />
          <div className="relative px-6 py-2 bg-stone-950 border-l-[3px] border-amber-500 shadow-[0_5px_15px_rgba(0,0,0,0.5)] transform -skew-x-12 origin-bottom-left transition-transform duration-300 group-hover:-skew-x-6">
            <div className="transform skew-x-12 text-amber-500 font-bold tracking-widest uppercase text-base">
              {characterName}
            </div>
            <div className="absolute -top-px -right-px w-2 h-2 border-t border-r border-amber-500/60" />
          </div>
        </div>
      )}

      <div
        ref={scrollRef}
        className={[
          "flex-1 overflow-y-auto px-6 relative border-t-0 border-r-0 border-b-0 border-l border-white/5",
          isThoughtLog
            ? "bg-linear-to-b from-stone-950/78 to-black/82 pb-6 pt-10"
            : `bg-linear-to-b from-stone-950/20 to-black/50 backdrop-blur-md rounded-tr-4xl ${
                characterName ? "pt-12" : "py-6"
              }`,
        ].join(" ")}
        onClick={onSurfaceInteraction}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-amber-900/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-stone-950/40 pointer-events-none" />
        <div className="fixed inset-0 opacity-[0.05] mix-blend-overlay pointer-events-none" />

        <div
          ref={contentRef}
          className={[
            "font-body relative z-10 p-0 text-stone-200",
            isThoughtLog
              ? "mx-auto w-full max-w-prose text-[1.35rem] leading-8"
              : "text-2xl sm:text-3xl leading-relaxed",
          ].join(" ")}
        >
          <VnNarrativeText
            text={narrativeText}
            onTokenClick={onTokenClick}
            onTokenEnter={onTokenEnter}
            onTokenLeave={onTokenLeave}
            onTypingChange={onTypingChange}
            onComplete={onNarrativeComplete}
            typedTextRef={typedTextRef}
          />
        </div>
      </div>

      {!isTyping && choicesSlot && (
        <div
          className="shrink-0 bg-stone-950/90 backdrop-blur-xl border-t border-white/10 px-4 sm:px-6 py-2 sm:py-3 space-y-1 max-h-[50vh] overflow-y-auto shadow-inner"
          onClick={(event) => event.stopPropagation()}
        >
          {isThoughtLog ? (
            <div className="mx-auto w-full max-w-prose">{choicesSlot}</div>
          ) : (
            choicesSlot
          )}
        </div>
      )}
      <div className="h-[calc(4rem+env(safe-area-inset-bottom))]" />
    </motion.div>
  );
};
