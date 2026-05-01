import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import type { VnNarrativeLayout } from "../../features/vn/types";

export type VnSceneTransitionPhase = "loading" | "admiring" | "revealed";
export type VnSceneRevealMode = "tap" | "auto";

interface UseVnSceneTransitionParams {
  visualKey: string;
  layout: VnNarrativeLayout;
  hasImage: boolean;
  hasVideo: boolean;
  needsSoundPrompt: boolean;
  revealMode?: VnSceneRevealMode;
  autoRevealAfterMs?: number;
}

interface UseVnSceneTransitionResult {
  phase: VnSceneTransitionPhase;
  isChromeRevealed: boolean;
  isVisualReady: boolean;
  markVisualReady: () => void;
  revealChrome: () => void;
}

const getInitialPhase = (hasVisual: boolean): VnSceneTransitionPhase =>
  hasVisual ? "loading" : "admiring";

export function useVnSceneTransition({
  visualKey,
  layout,
  hasImage,
  hasVideo,
  needsSoundPrompt,
  revealMode = "tap",
  autoRevealAfterMs,
}: UseVnSceneTransitionParams): UseVnSceneTransitionResult {
  const hasVisual = hasImage || hasVideo;
  const [phase, setPhase] = useState<VnSceneTransitionPhase>(() =>
    getInitialPhase(hasVisual),
  );

  useLayoutEffect(() => {
    setPhase(getInitialPhase(hasVisual));
  }, [hasVisual, layout, needsSoundPrompt, visualKey]);

  const markVisualReady = useCallback(() => {
    setPhase((current) => (current === "loading" ? "admiring" : current));
  }, []);

  const revealChrome = useCallback(() => {
    setPhase((current) => (current === "admiring" ? "revealed" : current));
  }, []);

  useEffect(() => {
    if (hasVisual) {
      return;
    }

    markVisualReady();
  }, [hasVisual, markVisualReady, visualKey]);

  useEffect(() => {
    if (
      revealMode !== "auto" ||
      phase !== "admiring" ||
      autoRevealAfterMs == null
    ) {
      return undefined;
    }

    const timer = window.setTimeout(revealChrome, autoRevealAfterMs);
    return () => window.clearTimeout(timer);
  }, [autoRevealAfterMs, phase, revealChrome, revealMode, visualKey]);

  return {
    phase,
    isChromeRevealed: phase === "revealed",
    isVisualReady: phase !== "loading",
    markVisualReady,
    revealChrome,
  };
}
