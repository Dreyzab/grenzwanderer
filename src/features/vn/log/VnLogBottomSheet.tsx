import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { ReactNode, RefObject } from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import type { VnSnapshot } from "../types";
import type {
  TypedTextHandle,
  TypedTextTokenState,
  TypedTextTokenHandler,
} from "../ui/TypedText";
import type { PlayerProfileForLog } from "./LogSegmentRenderer";
import { VnNarrativeLog } from "./VnNarrativeLog";
import type { NarrativeLogState } from "./useNarrativeLog";

const SNAP_FRACTIONS = [0.22, 0.45, 0.92] as const;
/** Auto-grow bounds: opens compact, expands toward fullscreen as the log fills. */
const MIN_AUTO_FRACTION = 0.28;
const MAX_AUTO_FRACTION = SNAP_FRACTIONS[2];
/** Chrome above the scrollable log: drag handle + accent rule. */
const SHEET_CHROME_PX = 28;
const STORAGE_KEY = "vn-log-sheet-snap";
const SHEET_HEIGHT_SPRING = {
  type: "spring" as const,
  damping: 34,
  stiffness: 240,
  mass: 0.82,
};
const TAP_MAX_DRIFT_PX = 18;
const TAP_MAX_MS = 380;

interface VnLogBottomSheetProps {
  sceneGroupId: string | null;
  state: NarrativeLogState;
  snapshot: VnSnapshot | null;
  choicesSlot?: ReactNode;
  playerProfile?: PlayerProfileForLog | null;
  parliamentPresetId?: string;
  typedTextRef?: RefObject<TypedTextHandle>;
  onTypingChange?: (typing: boolean) => void;
  onSegmentComplete?: () => void;
  onSurfaceTap?: () => void;
  onTokenClick?: TypedTextTokenHandler;
  onTokenEnter?: TypedTextTokenHandler;
  onTokenLeave?: TypedTextTokenHandler;
  tokenStateByPayload?: Readonly<Record<string, TypedTextTokenState>>;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const fractionFromClientY = (clientY: number): number => {
  if (typeof window === "undefined") {
    return SNAP_FRACTIONS[1];
  }
  const h = window.innerHeight;
  return clamp((h - clientY) / h, SNAP_FRACTIONS[0], SNAP_FRACTIONS[2]);
};

const nearestSnapIndex = (frac: number): 0 | 1 | 2 => {
  let best: 0 | 1 | 2 = 0;
  let bestDist = Infinity;
  for (let i = 0; i < SNAP_FRACTIONS.length; i += 1) {
    const ix = i as 0 | 1 | 2;
    const d = Math.abs(SNAP_FRACTIONS[ix] - frac);
    if (d < bestDist) {
      bestDist = d;
      best = ix;
    }
  }
  return best;
};

const loadSnapIx = (): 0 | 1 | 2 => {
  if (typeof window === "undefined") {
    return 1;
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return 1;
  }
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n)) {
    return 1;
  }
  const clamped = clamp(n, SNAP_FRACTIONS[0], SNAP_FRACTIONS[2]);
  return nearestSnapIndex(clamped);
};

const persistSnapIx = (index: 0 | 1 | 2): void => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, String(SNAP_FRACTIONS[index]));
  } catch {
    // ignore
  }
};

export function VnLogBottomSheet({
  sceneGroupId,
  state,
  snapshot,
  choicesSlot,
  playerProfile,
  parliamentPresetId,
  typedTextRef,
  onTypingChange,
  onSegmentComplete,
  onSurfaceTap,
  onTokenClick,
  onTokenEnter,
  onTokenLeave,
  tokenStateByPayload,
}: VnLogBottomSheetProps) {
  const previousSceneGroupIdRef = useRef<string | null | undefined>(undefined);
  const [phase, setPhase] = useState<"idle" | "exit" | "enter">("idle");

  const initialSnap = loadSnapIx();
  const [snapIx, setSnapIxState] = useState<0 | 1 | 2>(initialSnap);
  const lastExpandedIxRef = useRef<1 | 2>(initialSnap === 2 ? 2 : 1);

  /** Until the reader drags/snaps manually, the dock height tracks the content. */
  const [userControlled, setUserControlled] = useState(false);
  const [contentPx, setContentPx] = useState(0);

  const autoFraction = useMemo(() => {
    if (typeof window === "undefined" || window.innerHeight === 0) {
      return SNAP_FRACTIONS[1];
    }
    const raw = (contentPx + SHEET_CHROME_PX) / window.innerHeight;
    return clamp(raw, MIN_AUTO_FRACTION, MAX_AUTO_FRACTION);
  }, [contentPx]);

  const [dragFrac, setDragFracState] = useState<number | null>(null);
  const dragFracRef = useRef<number | null>(null);

  const setDragFrac = useCallback((value: number | null) => {
    dragFracRef.current = value;
    setDragFracState(value);
  }, []);

  const resetToDefaultSnap = useCallback(() => {
    setSnapIxState(1);
    persistSnapIx(1);
    setDragFrac(null);
    setUserControlled(false);
  }, [setDragFrac]);

  const pointerIdRef = useRef<number | null>(null);
  const pointerStartRef = useRef({ x: 0, y: 0, t: 0 });
  const maxDriftRef = useRef(0);

  const commitSnapFromFraction = useCallback(
    (frac: number) => {
      const bounded = clamp(frac, SNAP_FRACTIONS[0], SNAP_FRACTIONS[2]);
      const nextIx = nearestSnapIndex(bounded);
      if (nextIx === 1 || nextIx === 2) {
        lastExpandedIxRef.current = nextIx;
      }
      setSnapIxState(nextIx);
      persistSnapIx(nextIx);
      setDragFrac(null);
      setUserControlled(true);
    },
    [setDragFrac],
  );

  const togglePeekExpanded = useCallback(() => {
    setUserControlled(true);
    setSnapIxState((ix) => {
      if (ix === 0) {
        const next = lastExpandedIxRef.current;
        persistSnapIx(next);
        return next;
      }
      if (ix >= 1) {
        lastExpandedIxRef.current = ix;
      }
      persistSnapIx(0);
      return 0;
    });
    setDragFrac(null);
  }, [setDragFrac]);

  useEffect(() => {
    if (previousSceneGroupIdRef.current === undefined) {
      previousSceneGroupIdRef.current = sceneGroupId;
      return;
    }
    if (previousSceneGroupIdRef.current === sceneGroupId) {
      return;
    }

    previousSceneGroupIdRef.current = sceneGroupId;

    setPhase("exit");
    const exitTimer = window.setTimeout(() => {
      resetToDefaultSnap();
      setPhase("enter");
    }, 400);
    const enterTimer = window.setTimeout(() => {
      setPhase("idle");
    }, 820);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(enterTimer);
    };
  }, [resetToDefaultSnap, sceneGroupId]);

  const baseFraction = userControlled ? SNAP_FRACTIONS[snapIx] : autoFraction;
  const fracVisible = dragFrac ?? baseFraction;
  const isCollapsedPeek = userControlled && snapIx === 0 && dragFrac === null;

  /** ADV "tap to continue" hint: a beat finished typing and another awaits a tap. */
  const hasPendingAdvance =
    !state.isTypingSegment &&
    state.currentSegmentIndex < state.currentNodeSegments.length;

  const endPointerSession = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      const el = event.currentTarget;
      if (pointerIdRef.current !== event.pointerId) {
        return;
      }

      pointerIdRef.current = null;
      try {
        el.releasePointerCapture(event.pointerId);
      } catch {
        // ignore
      }

      const elapsed = Date.now() - pointerStartRef.current.t;
      const drift = maxDriftRef.current;

      if (drift < TAP_MAX_DRIFT_PX && elapsed < TAP_MAX_MS) {
        togglePeekExpanded();
        return;
      }

      const releaseFrac =
        dragFracRef.current ?? fractionFromClientY(event.clientY);
      commitSnapFromFraction(releaseFrac);
    },
    [commitSnapFromFraction, togglePeekExpanded],
  );

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }
    pointerIdRef.current = event.pointerId;
    pointerStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      t: Date.now(),
    };
    maxDriftRef.current = 0;
    event.currentTarget.setPointerCapture(event.pointerId);
    event.stopPropagation();
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (pointerIdRef.current !== event.pointerId) {
      return;
    }
    const dx = event.clientX - pointerStartRef.current.x;
    const dy = event.clientY - pointerStartRef.current.y;
    maxDriftRef.current = Math.max(maxDriftRef.current, Math.hypot(dx, dy));
    setDragFrac(fractionFromClientY(event.clientY));
    event.preventDefault();
  };

  const handlePointerCancel = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (pointerIdRef.current !== event.pointerId) {
      return;
    }
    pointerIdRef.current = null;
    setDragFrac(null);
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // ignore
    }
  };

  return (
    <motion.div
      className="absolute inset-x-0 bottom-0 z-150 flex justify-center pointer-events-none"
      initial={false}
      animate={{
        opacity: phase === "exit" ? 0 : 1,
        y: phase === "exit" ? "108%" : 0,
      }}
      transition={{
        duration: phase === "exit" ? 0.36 : 0.32,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <motion.div
        className="pointer-events-auto relative flex w-full flex-col overflow-hidden rounded-t-xl bg-stone-950/88 shadow-[0_-24px_60px_rgba(0,0,0,0.62)] backdrop-blur-md"
        animate={{ height: `${fracVisible * 100}vh` }}
        transition={dragFrac !== null ? { duration: 0 } : SHEET_HEIGHT_SPRING}
        onClick={onSurfaceTap}
      >
        {/* Compact grip with a generous invisible hit area: tap toggles the
            peek, drag regulates the height. */}
        <button
          type="button"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endPointerSession}
          onPointerCancel={handlePointerCancel}
          onClick={(event) => event.stopPropagation()}
          className="group absolute inset-x-0 top-0 z-20 mx-auto flex h-7 w-28 cursor-grab touch-none select-none items-start justify-center active:cursor-grabbing"
          aria-label={
            isCollapsedPeek ? "Expand narrative log" : "Collapse narrative log"
          }
        >
          <span className="mt-1.5 h-1.5 w-9 rounded-full bg-stone-500/80 shadow-sm transition-colors group-hover:bg-stone-300" />
        </button>

        <div className="min-h-0 flex-1 overflow-hidden">
          <VnNarrativeLog
            state={state}
            snapshot={snapshot}
            typedTextRef={typedTextRef}
            choicesSlot={choicesSlot}
            playerProfile={playerProfile}
            parliamentPresetId={parliamentPresetId}
            onTypingChange={onTypingChange}
            onSegmentComplete={onSegmentComplete}
            onTokenClick={onTokenClick}
            onTokenEnter={onTokenEnter}
            onTokenLeave={onTokenLeave}
            tokenStateByPayload={tokenStateByPayload}
            onContentHeightChange={setContentPx}
          />
        </div>

        {hasPendingAdvance ? (
          <motion.div
            className="pointer-events-none absolute right-4 bottom-3 z-10 text-ember-400/85 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]"
            aria-hidden="true"
            animate={{ opacity: [0.25, 1, 0.25], x: [0, 2, 0] }}
            transition={{ duration: 1.1, ease: "easeInOut", repeat: Infinity }}
          >
            <ChevronRight size={22} strokeWidth={2.75} />
          </motion.div>
        ) : null}
      </motion.div>
    </motion.div>
  );
}
