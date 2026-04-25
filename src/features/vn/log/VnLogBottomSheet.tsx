import { useEffect, useRef, useState } from "react";
import type { ReactNode, RefObject } from "react";
import { useBottomSheet } from "../../../shared/hooks/useBottomSheet";
import type { VnSnapshot } from "../types";
import type { TypedTextHandle } from "../ui/TypedText";
import { VnNarrativeLog } from "./VnNarrativeLog";
import type { NarrativeLogState } from "./useNarrativeLog";

interface VnLogBottomSheetProps {
  sceneGroupId: string | null;
  state: NarrativeLogState;
  snapshot: VnSnapshot | null;
  choicesSlot?: ReactNode;
  typedTextRef?: RefObject<TypedTextHandle>;
  onTypingChange?: (typing: boolean) => void;
  onSegmentComplete?: () => void;
  onSurfaceTap?: () => void;
}

export function VnLogBottomSheet({
  sceneGroupId,
  state,
  snapshot,
  choicesSlot,
  typedTextRef,
  onTypingChange,
  onSegmentComplete,
  onSurfaceTap,
}: VnLogBottomSheetProps) {
  const previousSceneGroupIdRef = useRef(sceneGroupId);
  const [phase, setPhase] = useState<"idle" | "exit" | "enter">("idle");
  const { heightPercent, handleRef, contentRef, isDragging, resetToDefault } =
    useBottomSheet({
      snapPoints: [0.25, 0.45, 0.95],
      defaultSnap: 0.45,
      storageKey: "vn-log-sheet-snap",
    });

  useEffect(() => {
    if (previousSceneGroupIdRef.current === sceneGroupId) {
      return;
    }

    previousSceneGroupIdRef.current = sceneGroupId;

    setPhase("exit");
    const exitTimer = window.setTimeout(() => {
      resetToDefault();
      setPhase("enter");
    }, 400);
    const enterTimer = window.setTimeout(() => {
      setPhase("idle");
    }, 820);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(enterTimer);
    };
  }, [resetToDefault, sceneGroupId]);

  return (
    <div
      className={[
        "absolute inset-x-0 bottom-0 z-150 flex flex-col border-t border-white/10 bg-stone-950/88 shadow-[0_-24px_60px_rgba(0,0,0,0.62)] backdrop-blur-md",
        isDragging ? "" : "transition-[height,opacity,transform] duration-300",
        phase === "exit"
          ? "translate-y-full opacity-0"
          : "translate-y-0 opacity-100",
      ].join(" ")}
      style={{ height: `${heightPercent}vh` }}
      onClick={onSurfaceTap}
    >
      <div
        ref={handleRef}
        className={[
          "flex h-8 shrink-0 items-center justify-center touch-none",
          isDragging ? "cursor-grabbing" : "cursor-grab",
        ].join(" ")}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="h-1 w-10 rounded-full bg-white/20" />
      </div>
      <div className="h-[2px] shrink-0 bg-linear-to-r from-transparent via-amber-600/80 to-transparent" />
      <div ref={contentRef} className="min-h-0 flex-1">
        <VnNarrativeLog
          state={state}
          snapshot={snapshot}
          typedTextRef={typedTextRef}
          choicesSlot={choicesSlot}
          onTypingChange={onTypingChange}
          onSegmentComplete={onSegmentComplete}
        />
      </div>
    </div>
  );
}
