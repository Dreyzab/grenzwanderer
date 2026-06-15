import {
  AnimatePresence,
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
} from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePrefetchVnVisuals } from "../../features/vn/hooks/usePrefetchVnVisuals";
import type {
  VnVisualSequence,
  VnVisualSequenceFrame,
} from "../../features/vn/types";

/** Slow push-in across the frame; subtle depth without pulling focus. */
const FRAME_ZOOM_FROM = 1.04;
const FRAME_ZOOM_TO = 1.1;

interface MemoryFrameImageProps {
  frame: VnVisualSequenceFrame;
  transitionDuration: number;
  prefersReducedMotion: boolean;
  onError: () => void;
}

/**
 * One memory frame whose focus slowly travels through the authored points —
 * resting on faces first, then gliding to the central theme — over the frame's
 * duration. Static when reduced motion is requested or only one point exists.
 */
function MemoryFrameImage({
  frame,
  transitionDuration,
  prefersReducedMotion,
  onError,
}: MemoryFrameImageProps) {
  const points =
    frame.focusPath && frame.focusPath.length > 0
      ? frame.focusPath
      : frame.focusPoint
        ? [frame.focusPoint]
        : [{ x: 50, y: 50 }];
  const ox = useMotionValue(points[0].x);
  const oy = useMotionValue(points[0].y);
  const scale = useMotionValue(prefersReducedMotion ? 1 : FRAME_ZOOM_FROM);
  const objectPosition = useMotionTemplate`${ox}% ${oy}%`;

  useEffect(() => {
    if (prefersReducedMotion || points.length < 2) {
      return undefined;
    }

    // Hold on each point (duplicated keyframe = dwell), ease between them, end
    // settled on the final point (the central theme) for the rest of the frame.
    const oxKeys: number[] = [];
    const oyKeys: number[] = [];
    for (const point of points) {
      oxKeys.push(point.x, point.x);
      oyKeys.push(point.y, point.y);
    }
    const duration = Math.max(frame.durationMs, 800) / 1000;
    const options = { duration, ease: "easeInOut" as const };
    const controls = [
      animate(ox, oxKeys, options),
      animate(oy, oyKeys, options),
      animate(scale, [FRAME_ZOOM_FROM, FRAME_ZOOM_TO], options),
    ];
    return () => controls.forEach((control) => control.stop());
    // points/ox/oy/scale are stable for this frame's lifetime (keyed remount).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame.imageUrl, frame.durationMs, prefersReducedMotion]);

  return (
    <motion.img
      src={frame.imageUrl}
      alt=""
      aria-hidden="true"
      className="absolute inset-0 h-full w-full object-cover"
      style={{ objectPosition, scale }}
      initial={{ opacity: transitionDuration === 0 ? 1 : 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: transitionDuration === 0 ? 1 : 0 }}
      transition={{ duration: transitionDuration, ease: "easeOut" }}
      onError={onError}
    />
  );
}

interface VnVisualSequenceLayerProps {
  sequence: VnVisualSequence;
  skipLabel: string;
  prefersReducedMotion: boolean;
  onComplete?: () => void;
}

const FINISH_FADE_MS = 450;

export function VnVisualSequenceLayer({
  sequence,
  skipLabel,
  prefersReducedMotion,
  onComplete,
}: VnVisualSequenceLayerProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const completedRef = useRef(false);
  const finishTimerRef = useRef<number | null>(null);
  const imageUrls = useMemo(
    () => sequence.frames.map((frame) => frame.imageUrl),
    [sequence.frames],
  );

  usePrefetchVnVisuals(imageUrls, true, {
    maxPrefetch: sequence.frames.length,
  });

  const finish = useCallback(() => {
    if (completedRef.current) {
      return;
    }

    completedRef.current = true;
    setFinishing(true);
    finishTimerRef.current = window.setTimeout(
      () => onComplete?.(),
      prefersReducedMotion ? 80 : FINISH_FADE_MS,
    );
  }, [onComplete, prefersReducedMotion]);

  const advanceFrame = useCallback(() => {
    if (frameIndex >= sequence.frames.length - 1) {
      finish();
      return;
    }
    setFrameIndex(frameIndex + 1);
  }, [finish, frameIndex, sequence.frames.length]);

  useEffect(() => {
    completedRef.current = false;
    setFinishing(false);
    setFrameIndex(0);
  }, [sequence]);

  useEffect(() => {
    if (finishing) {
      return undefined;
    }

    const frame = sequence.frames[frameIndex];
    if (!frame) {
      finish();
      return undefined;
    }

    const timer = window.setTimeout(advanceFrame, frame.durationMs);
    return () => window.clearTimeout(timer);
  }, [advanceFrame, finish, finishing, frameIndex, sequence.frames]);

  useEffect(() => {
    if (!sequence.skippable) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        finish();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [finish, sequence.skippable]);

  useEffect(
    () => () => {
      if (finishTimerRef.current !== null) {
        window.clearTimeout(finishTimerRef.current);
      }
    },
    [],
  );

  const frame = sequence.frames[frameIndex];
  if (!frame) {
    return null;
  }

  const transitionDuration =
    prefersReducedMotion || frame.transition === "cut" ? 0 : 0.32;

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <motion.section
      className="fixed inset-0 z-[300] overflow-hidden bg-black"
      data-testid="vn-visual-sequence"
      aria-label="Memory sequence"
      initial={false}
      animate={{ opacity: finishing ? 0 : 1 }}
      transition={{
        duration: prefersReducedMotion ? 0.08 : FINISH_FADE_MS / 1000,
      }}
    >
      <AnimatePresence initial={false} mode="sync">
        <MemoryFrameImage
          key={`${frameIndex}:${frame.imageUrl}`}
          frame={frame}
          transitionDuration={transitionDuration}
          prefersReducedMotion={prefersReducedMotion}
          onError={advanceFrame}
        />
      </AnimatePresence>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_42%,rgba(6,4,4,0.52)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/65 via-transparent to-black/35" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48ZmlsdGVyIGlkPSJuIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC44IiBudW1PY3RhdmVzPSIyIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI24pIi8+PC9zdmc+')]" />

      <AnimatePresence mode="wait">
        {frame.caption ? (
          <motion.p
            key={`${frameIndex}:${frame.caption}`}
            className="pointer-events-none absolute inset-x-5 bottom-[12vh] m-0 text-center font-display text-xl italic tracking-[0.04em] text-stone-100 drop-shadow-[0_3px_12px_rgba(0,0,0,0.95)] sm:text-3xl"
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0.08 : 0.28 }}
            aria-live="polite"
          >
            {frame.caption}
          </motion.p>
        ) : null}
      </AnimatePresence>

      <div className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center gap-1.5">
        {sequence.frames.map((item, index) => (
          <span
            key={`${item.imageUrl}:${index}`}
            className={[
              "h-0.5 rounded-full transition-[width,background-color]",
              index === frameIndex ? "w-7 bg-red-800/90" : "w-3 bg-white/25",
            ].join(" ")}
          />
        ))}
      </div>

      {sequence.skippable ? (
        <button
          type="button"
          className="absolute right-4 top-[calc(1rem+env(safe-area-inset-top))] z-10 rounded-sm border border-stone-300/25 bg-black/45 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-200 backdrop-blur-sm transition-colors hover:border-stone-100/45 hover:bg-black/65 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 sm:right-6 sm:top-[calc(1.5rem+env(safe-area-inset-top))]"
          onClick={finish}
        >
          {skipLabel}
        </button>
      ) : null}
    </motion.section>,
    document.body,
  );
}
