import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";

interface UseBottomSheetOptions {
  snapPoints: number[];
  defaultSnap: number;
  storageKey?: string;
  onSnapChange?: (snap: number) => void;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const nearestSnapPoint = (value: number, snapPoints: number[]): number =>
  snapPoints.reduce((best, snap) =>
    Math.abs(snap - value) < Math.abs(best - value) ? snap : best,
  );

export function useBottomSheet({
  snapPoints,
  defaultSnap,
  storageKey,
  onSnapChange,
}: UseBottomSheetOptions): {
  heightPercent: number;
  handleRef: RefObject<HTMLDivElement>;
  contentRef: RefObject<HTMLDivElement>;
  isDragging: boolean;
  resetToDefault: () => void;
} {
  const normalizedSnapPoints = useMemo(
    () => [...snapPoints].sort((left, right) => left - right),
    [snapPoints],
  );
  const minSnap = normalizedSnapPoints[0] ?? defaultSnap;
  const maxSnap =
    normalizedSnapPoints[normalizedSnapPoints.length - 1] ?? defaultSnap;
  const handleRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const currentSnapRef = useRef(defaultSnap);
  const [isDragging, setIsDragging] = useState(false);
  const [heightPercent, setHeightPercent] = useState(() => {
    if (typeof window === "undefined" || !storageKey) {
      return defaultSnap * 100;
    }

    const stored = Number.parseFloat(
      window.localStorage.getItem(storageKey) ?? "",
    );
    if (!Number.isFinite(stored)) {
      return defaultSnap * 100;
    }

    return (
      nearestSnapPoint(clamp(stored, minSnap, maxSnap), normalizedSnapPoints) *
      100
    );
  });

  useEffect(() => {
    currentSnapRef.current = heightPercent / 100;
  }, [heightPercent]);

  const commitSnap = useCallback(
    (snap: number) => {
      const nextSnap = nearestSnapPoint(
        clamp(snap, minSnap, maxSnap),
        normalizedSnapPoints,
      );
      setHeightPercent(nextSnap * 100);
      if (storageKey && typeof window !== "undefined") {
        window.localStorage.setItem(storageKey, String(nextSnap));
      }
      onSnapChange?.(nextSnap);
    },
    [maxSnap, minSnap, normalizedSnapPoints, onSnapChange, storageKey],
  );

  const resetToDefault = useCallback(() => {
    commitSnap(defaultSnap);
  }, [commitSnap, defaultSnap]);

  useEffect(() => {
    const handle = handleRef.current;
    if (!handle || typeof window === "undefined") {
      return;
    }

    let activePointerId: number | null = null;

    const onPointerMove = (event: PointerEvent) => {
      if (activePointerId !== event.pointerId) {
        return;
      }

      const nextSnap = clamp(
        (window.innerHeight - event.clientY) / window.innerHeight,
        minSnap,
        maxSnap,
      );
      currentSnapRef.current = nextSnap;
      setHeightPercent(nextSnap * 100);
    };

    const onPointerUp = (event: PointerEvent) => {
      if (activePointerId !== event.pointerId) {
        return;
      }

      activePointerId = null;
      setIsDragging(false);
      commitSnap(currentSnapRef.current);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };

    const onPointerDown = (event: PointerEvent) => {
      activePointerId = event.pointerId;
      setIsDragging(true);
      handle.setPointerCapture(event.pointerId);
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerUp);
      event.preventDefault();
    };

    handle.addEventListener("pointerdown", onPointerDown);
    return () => {
      handle.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [commitSnap, maxSnap, minSnap]);

  return {
    heightPercent,
    handleRef,
    contentRef,
    isDragging,
    resetToDefault,
  };
}
