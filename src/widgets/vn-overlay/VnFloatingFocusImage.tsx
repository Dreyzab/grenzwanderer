import type React from "react";
import { useEffect, useMemo } from "react";
import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  type HTMLMotionProps,
} from "framer-motion";
import { useMediaQuery } from "../../shared/hooks/useMediaQuery";
import type { VnVisualSequenceFocusPoint } from "../../features/vn/types";

/** `fetchpriority` is not in React's img typings; cast onto motion's img props. */
const HIGH_PRIORITY_IMG_PROPS = {
  fetchpriority: "high",
} as unknown as HTMLMotionProps<"img">;

interface VnFloatingFocusImageProps {
  src: string;
  /** Positioning + cinematic filter classes inherited from the static background. */
  className: string;
  prefersReducedMotion: boolean;
  /** Optional authored camera path. Falls back to ambient drift when omitted. */
  focusPath?: VnVisualSequenceFocusPoint[];
  onLoad: (event: React.SyntheticEvent<HTMLImageElement>) => void;
  onError: () => void;
}

const AMBIENT_DURATION_S = 28;
const AMBIENT_X_AMP = 14;
const AMBIENT_Y_AMP = 9;
const AMBIENT_BASE_SCALE = 1.06;
const AMBIENT_SCALE_AMP = 0.05;

/** Travel + dwell budget per authored focus point. */
const FOCUS_SEGMENT_S = 4.6;
const FOCUS_BASE_SCALE = 1.04;
const FOCUS_SCALE_PUSH = 0.04;

const REPEAT = {
  repeat: Infinity,
  repeatType: "loop",
  ease: "easeInOut",
} as const;

const clampPct = (value: number) => Math.min(100, Math.max(0, value));

/** Deterministic 0..1 seed so each scene drifts a little differently, jank-free across re-renders. */
const hashSeed = (input: string): number => {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 0xffffffff;
};

interface Keyframes {
  ox: number[];
  oy: number[];
  scale: number[];
  duration: number;
}

/** Soft seamless loop tracing a rounded quad in object-position space. */
const buildAmbient = (seed: number): Keyframes => {
  const sx = seed < 0.5 ? 1 : -1;
  const sy = (seed * 16) % 1 < 0.5 ? 1 : -1;
  const ax = AMBIENT_X_AMP;
  const ay = AMBIENT_Y_AMP;
  const base = AMBIENT_BASE_SCALE;
  const peak = AMBIENT_BASE_SCALE + AMBIENT_SCALE_AMP;
  const mid = AMBIENT_BASE_SCALE + AMBIENT_SCALE_AMP * 0.6;
  return {
    ox: [50, 50 + sx * ax, 50 + sx * ax, 50 - sx * ax, 50 - sx * ax, 50].map(
      clampPct,
    ),
    oy: [
      50 - sy * ay,
      50 - sy * ay,
      50 + sy * ay,
      50 + sy * ay,
      50 - sy * ay,
      50 - sy * ay,
    ].map(clampPct),
    scale: [base, peak, mid, peak, base, base],
    duration: AMBIENT_DURATION_S,
  };
};

/** Eases between authored points, holding briefly on each (duplicated keyframe = dwell). */
const buildFocus = (points: VnVisualSequenceFocusPoint[]): Keyframes => {
  const seq =
    points.length === 1 ? [points[0], points[0]] : [...points, points[0]];
  const ox: number[] = [];
  const oy: number[] = [];
  const scale: number[] = [];
  seq.forEach((point, index) => {
    const x = clampPct(point.x);
    const y = clampPct(point.y);
    const push =
      index % 2 === 0 ? FOCUS_BASE_SCALE + FOCUS_SCALE_PUSH : FOCUS_BASE_SCALE;
    ox.push(x, x);
    oy.push(y, y);
    scale.push(push, push);
  });
  return {
    ox,
    oy,
    scale,
    duration: Math.max(seq.length - 1, 1) * FOCUS_SEGMENT_S,
  };
};

/**
 * Background still that slowly floats its focus in portrait, revealing the parts
 * of a wide image that `object-cover` would otherwise crop. Static (current
 * behaviour) in landscape or under reduced motion.
 */
export function VnFloatingFocusImage({
  src,
  className,
  prefersReducedMotion,
  focusPath,
  onLoad,
  onError,
}: VnFloatingFocusImageProps) {
  const isPortrait = useMediaQuery("(orientation: portrait)");
  const active = isPortrait && !prefersReducedMotion;

  const restX = focusPath?.[0]?.x ?? 50;
  const restY = focusPath?.[0]?.y ?? 50;
  const ox = useMotionValue(restX);
  const oy = useMotionValue(restY);
  const scale = useMotionValue(1);
  const objectPosition = useMotionTemplate`${ox}% ${oy}%`;

  // Stable dependency for the authored path (prop identity may vary across renders).
  const focusKey = useMemo(
    () => (focusPath && focusPath.length > 0 ? JSON.stringify(focusPath) : ""),
    [focusPath],
  );

  useEffect(() => {
    if (!active) {
      ox.set(restX);
      oy.set(restY);
      scale.set(1);
      return undefined;
    }

    const kf =
      focusPath && focusPath.length > 0
        ? buildFocus(focusPath)
        : buildAmbient(hashSeed(src));
    const options = { ...REPEAT, duration: kf.duration };
    const controls = [
      animate(ox, kf.ox, options),
      animate(oy, kf.oy, options),
      animate(scale, kf.scale, options),
    ];
    return () => controls.forEach((control) => control.stop());
    // focusKey captures focusPath content; restX/restY derive from it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, src, focusKey]);

  return (
    <motion.img
      src={src}
      className={className}
      alt="background"
      decoding="async"
      style={{ objectPosition, scale }}
      {...HIGH_PRIORITY_IMG_PROPS}
      onLoad={onLoad}
      onError={onError}
    />
  );
}
