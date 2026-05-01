import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { ReactNode, RefObject } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { VnSnapshot } from "../types";
import type { TypedTextHandle } from "../ui/TypedText";
import { VnNarrativeLog } from "./VnNarrativeLog";
import type { NarrativeLogState } from "./useNarrativeLog";

const SNAP_FRACTIONS = [0.22, 0.45, 0.92] as const;
const STORAGE_KEY = "vn-log-sheet-snap";
const SPRING = { type: "spring" as const, damping: 28, stiffness: 280 };
const TAP_MAX_DRIFT_PX = 18;
const TAP_MAX_MS = 380;

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
  typedTextRef,
  onTypingChange,
  onSegmentComplete,
  onSurfaceTap,
}: VnLogBottomSheetProps) {
  const previousSceneGroupIdRef = useRef<string | null | undefined>(undefined);
  const [phase, setPhase] = useState<"idle" | "exit" | "enter">("idle");

  const initialSnap = loadSnapIx();
  const [snapIx, setSnapIxState] = useState<0 | 1 | 2>(initialSnap);
  const lastExpandedIxRef = useRef<1 | 2>(initialSnap === 2 ? 2 : 1);

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
    },
    [setDragFrac],
  );

  const togglePeekExpanded = useCallback(() => {
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

  const fracVisible = dragFrac ?? SNAP_FRACTIONS[snapIx];
  const isCollapsedPeek = snapIx === 0 && dragFrac === null;

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
        className="pointer-events-auto flex w-full flex-col overflow-hidden rounded-t-xl border-t border-white/10 bg-stone-950/88 shadow-[0_-24px_60px_rgba(0,0,0,0.62)] backdrop-blur-md"
        animate={{ height: `${fracVisible * 100}vh` }}
        transition={dragFrac !== null ? { duration: 0 } : SPRING}
        onClick={onSurfaceTap}
      >
        <div className="flex shrink-0 justify-center bg-stone-950/40 pt-1">
          <motion.button
            type="button"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endPointerSession}
            onPointerCancel={handlePointerCancel}
            onClick={(event) => event.stopPropagation()}
            className="group relative -top-1 flex h-9 w-24 touch-none select-none items-center justify-center rounded-t-2xl border-x border-t border-stone-700/90 bg-stone-950/95 pb-1 shadow-sm transition-colors hover:bg-stone-900/95"
            aria-label={
              isCollapsedPeek
                ? "Expand narrative log"
                : "Collapse narrative log"
            }
          >
            <div className="absolute top-1.5 h-1 w-9 rounded-full bg-stone-600 transition-colors group-hover:bg-stone-500" />
            <motion.div
              animate={{ rotate: isCollapsedPeek ? 180 : 0 }}
              transition={{ type: "spring", damping: 24, stiffness: 320 }}
              className="mt-1 text-stone-500"
            >
              <ChevronDown size={14} strokeWidth={2.5} />
            </motion.div>
          </motion.button>
        </div>

        <div className="h-[2px] shrink-0 bg-linear-to-r from-transparent via-amber-600/80 to-transparent" />
        <div className="min-h-0 flex-1 overflow-hidden">
          <VnNarrativeLog
            state={state}
            snapshot={snapshot}
            typedTextRef={typedTextRef}
            choicesSlot={choicesSlot}
            onTypingChange={onTypingChange}
            onSegmentComplete={onSegmentComplete}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
