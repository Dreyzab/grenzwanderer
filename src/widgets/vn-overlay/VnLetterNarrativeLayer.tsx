import React from "react";
import {
  TypedText,
  type TypedTextHandle,
  type TypedTextTokenHandler,
} from "../../features/vn/ui/TypedText";
import type { VnStrings } from "../../features/i18n/uiStrings";

interface VnLetterNarrativeLayerProps {
  chromeRevealed: boolean;
  narrativeText: string;
  t: VnStrings;
  typedTextRef?: React.RefObject<TypedTextHandle>;
  onNarrativeComplete?: () => void;
  onSurfaceInteraction: () => void;
  onTokenClick?: TypedTextTokenHandler;
  onTokenEnter?: TypedTextTokenHandler;
  onTokenLeave?: TypedTextTokenHandler;
  onTypingChange?: (typing: boolean) => void;
}

export const VnLetterNarrativeLayer = ({
  chromeRevealed,
  narrativeText,
  t,
  typedTextRef,
  onNarrativeComplete,
  onSurfaceInteraction,
  onTokenClick,
  onTokenEnter,
  onTokenLeave,
  onTypingChange,
}: VnLetterNarrativeLayerProps) => (
  <div
    className="absolute inset-0 z-110 flex cursor-pointer items-center justify-center px-4 pt-8 pb-[calc(2rem+4rem+env(safe-area-inset-bottom))] sm:px-8"
    onClick={onSurfaceInteraction}
  >
    <div
      className={[
        "w-full max-w-[44rem] transform transition-all duration-700 ease-out",
        chromeRevealed
          ? "translate-y-0 -rotate-1 scale-100 opacity-100"
          : "translate-y-10 rotate-2 scale-95 opacity-0",
      ].join(" ")}
    >
      <div className="relative">
        <div className="absolute -inset-4 rounded-[2.5rem] bg-black/30 blur-2xl" />
        <div className="relative overflow-hidden rounded-[1.25rem] border border-[#7a5830]/45 bg-[linear-gradient(135deg,rgba(255,250,229,0.99)_0%,rgba(238,220,178,0.99)_58%,rgba(218,190,139,0.99)_100%)] px-5 py-6 shadow-[0_34px_100px_rgba(0,0,0,0.62),inset_0_0_0_1px_rgba(255,255,255,0.35)] sm:px-12 sm:py-10">
          <div className="absolute inset-0 bg-[url('/images/paper-texture.png')] opacity-[0.22] mix-blend-multiply" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(146,94,38,0.11),transparent_36%),radial-gradient(circle_at_84%_76%,rgba(88,47,20,0.13),transparent_38%)]" />
          <div className="absolute left-[13%] top-0 h-full w-px bg-[#8b683b]/18" />
          <div className="absolute inset-x-8 top-6 h-px bg-linear-to-r from-transparent via-[#7a5830]/35 to-transparent sm:inset-x-14" />
          <div className="absolute inset-x-8 bottom-6 h-px bg-linear-to-r from-transparent via-[#7a5830]/25 to-transparent sm:inset-x-14" />
          <div className="absolute -right-5 -bottom-5 size-24 rounded-full border border-[#7f2517]/35 bg-[radial-gradient(circle,rgba(128,35,24,0.2)_0%,rgba(128,35,24,0.12)_45%,transparent_70%)]" />

          <div className="relative z-10 mx-auto max-w-[34rem]">
            <div className="flex items-start justify-between gap-5 border-b border-[#7a5830]/30 pb-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#6b4422]">
                  {t.privateCorrespondence}
                </p>
                <p className="mt-2 text-[0.72rem] uppercase tracking-[0.2em] text-[#8c6a3d]">
                  {t.stationPost}
                </p>
              </div>
              <div className="rounded-full border border-[#7a5830]/35 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[#6b4422]">
                1905
              </div>
            </div>

            <div className="mt-5 whitespace-pre-wrap text-left text-[#2e2319]">
              {chromeRevealed ? (
                <div className="vn-letter-sheet">
                  <TypedText
                    ref={typedTextRef}
                    text={narrativeText}
                    onComplete={onNarrativeComplete}
                    onTokenClick={onTokenClick}
                    onTokenEnter={onTokenEnter}
                    onTokenLeave={onTokenLeave}
                    onTypingChange={onTypingChange}
                  />
                </div>
              ) : null}
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-[#7a5830]/20 pt-3 text-[0.68rem] uppercase tracking-[0.22em] text-[#8c6a3d]">
              <span>{t.unsealedAtArrival}</span>
              <span>{t.tapToContinue}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
