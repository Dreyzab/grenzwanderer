import React from "react";
import { VnChoice } from "../../features/vn/types";
import { VnNarrativeText } from "../../features/vn/ui/VnNarrativeText";
import { MapPin } from "lucide-react";
import type { TypedTextHandle } from "../../features/vn/ui/TypedText";

interface VnNarrativePanelProps {
  locationName: string;
  characterName?: string;
  narrativeText: string;
  choices?: VnChoice[];
  choicesSlot?: React.ReactNode;
  backgroundImageUrl?: string;
  onChoiceSelect?: (choiceId: string) => void;
  isTyping?: boolean;
  onTypingChange?: (typing: boolean) => void;
  onNarrativeComplete?: () => void;
  typedTextRef?: React.RefObject<TypedTextHandle>;
  onSurfaceTap?: () => void;
  children?: React.ReactNode;
}

export const VnNarrativePanel: React.FC<VnNarrativePanelProps> = ({
  locationName,
  characterName,
  narrativeText,
  choicesSlot,
  backgroundImageUrl,
  isTyping,
  onTypingChange,
  onNarrativeComplete,
  typedTextRef,
  onSurfaceTap,
  children,
}) => {
  return (
    <div
      className="fixed inset-0 z-[200] overflow-hidden bg-black select-none"
      style={{ height: "100dvh" }}
    >
      {/* Background Image Layer */}
      <div className="absolute inset-x-0 top-0 bottom-0 overflow-hidden">
        {backgroundImageUrl && (
          <div className="w-full h-full bg-black">
            <img
              src={backgroundImageUrl}
              className="w-full h-full object-cover brightness-[0.6] sepia-[0.2] contrast-[1.05]"
              alt="Background"
            />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-black/30" />
        <div className="absolute inset-0 z-[10] pointer-events-none mix-blend-overlay opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIj48ZmlsdGVyIGlkPSJub2lzZSIgeD0iMCIgeT0iMCIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuNjUiIG51bU9jdGF2ZXM9IjMiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWx0ZXI9InVybCgjbm9pc2UpIiBvcGFjaXR5PSIxIi8+PC9zdmc+')] brightness-100 contrast-150" />
      </div>

      {/* Header */}
      <div className="absolute top-0 inset-x-0 p-6 pt-12 flex justify-between items-start z-[100] bg-gradient-to-b from-black/90 via-black/40 to-transparent pb-32 pointer-events-none border-t-0 border-l-0 border-r-0 border-b-0">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-amber-500/90 uppercase tracking-[0.2em] text-[10px] font-bold">
            <MapPin size={12} className="text-amber-500" />
            <span>Current Location</span>
          </div>
          <h1 className="text-3xl font-display text-white font-bold tracking-tight drop-shadow-2xl opacity-90 m-0">
            {locationName}
          </h1>
          <div className="h-[1px] w-24 bg-gradient-to-r from-amber-500/50 to-transparent mt-1" />
        </div>
      </div>

      {children}

      {/* Dialogue Panel */}
      <div className="absolute inset-x-0 bottom-0 z-[150] min-h-[35%] max-h-[65%] flex flex-col shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.8)] border-t border-white/10 transition-all duration-700">
        <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-600/80 to-transparent flex-shrink-0" />

        {/* Speaker Badge */}
        {characterName && (
          <div className="absolute left-0 -top-5 z-20 flex items-end group">
            <div className="absolute left-8 top-full h-4 w-[2px] bg-amber-500/40" />
            <div className="relative px-6 py-2 bg-stone-950 border-l-[3px] border-amber-500 shadow-[0_5px_15px_rgba(0,0,0,0.5)] transform -skew-x-12 origin-bottom-left transition-transform duration-300 group-hover:-skew-x-6">
              <div className="transform skew-x-12 text-amber-500 font-bold tracking-widest uppercase text-sm">
                {characterName}
              </div>
              <div className="absolute -top-[1px] -right-[1px] w-2 h-2 border-t border-r border-amber-500/60" />
            </div>
          </div>
        )}

        {/* Narrative Area */}
        <div
          className={`flex-1 bg-gradient-to-b from-stone-950/20 to-black/50 backdrop-blur-md overflow-y-auto px-6 relative border-t-0 border-r-0 border-b-0 border-l-[1px] border-l-white/5 rounded-tr-[2rem] ${characterName ? "pt-12" : "py-6"}`}
          onClick={onSurfaceTap}
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-900/10 via-transparent to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-stone-950/40 pointer-events-none" />
          <div className="fixed inset-0 bg-[url('/paper-texture.png')] opacity-[0.05] mix-blend-overlay pointer-events-none" />

          <div className="font-body text-base sm:text-lg leading-relaxed text-stone-200 relative z-10 p-0">
            <VnNarrativeText
              text={narrativeText}
              onTypingChange={onTypingChange}
              onComplete={onNarrativeComplete}
              typedTextRef={typedTextRef}
            />
          </div>
        </div>

        {/* Choices */}
        {!isTyping && choicesSlot && (
          <div
            className="flex-shrink-0 bg-stone-950/90 backdrop-blur-xl border-t border-white/10 px-4 sm:px-6 py-2 sm:py-3 space-y-1 max-h-[50vh] overflow-y-auto shadow-inner"
            onClick={(event) => event.stopPropagation()}
          >
            {choicesSlot}
          </div>
        )}
      </div>
    </div>
  );
};
