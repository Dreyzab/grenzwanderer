import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  SOUND_PROMPT_REVEAL_MAX_WAIT_MS,
  VIDEO_POSTER_REVEAL_FALLBACK_MS,
} from "./vnNarrativePanelConstants";
import type { SoundPromptPhase, VideoStatus } from "./vnNarrativePanel.types";

interface UseVnNarrativeBackgroundMediaInput {
  backgroundVisualKey: string;
  backgroundVideoPosterUrl?: string;
  backgroundVideoUrl?: string;
  markVisualReady: () => void;
  needsSoundPrompt: boolean;
  sceneId?: string;
  videoPlaybackComplete?: boolean;
  onVideoEnded?: () => void;
}

export function useVnNarrativeBackgroundMedia({
  backgroundVisualKey,
  backgroundVideoPosterUrl,
  backgroundVideoUrl,
  markVisualReady,
  needsSoundPrompt,
  sceneId,
  videoPlaybackComplete,
  onVideoEnded,
}: UseVnNarrativeBackgroundMediaInput) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const backgroundVisualKeyRef = useRef(backgroundVisualKey);
  const posterReadyRef = useRef(false);
  const videoPosterFallbackElapsedRef = useRef(false);

  const [soundPromptPhase, setSoundPromptPhase] = useState<SoundPromptPhase>(
    needsSoundPrompt ? "prompt" : "playing",
  );
  const [soundPromptRevealTimedOut, setSoundPromptRevealTimedOut] =
    useState(false);
  const [videoUnmuted, setVideoUnmuted] = useState(false);
  const [videoStatus, setVideoStatus] = useState<VideoStatus>("idle");
  const [posterReady, setPosterReady] = useState(false);

  const startVideoAfterSoundChoice = useCallback(async (unmuted: boolean) => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    video.muted = !unmuted;
    try {
      await video.play();
    } catch {
      // Playback can be blocked until the element is ready; onCanPlay retries.
    }
  }, []);

  const handleBackgroundImageLoad = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      const img = event.currentTarget;
      const visualKeyAtLoad = backgroundVisualKey;
      const markCurrentVisualReady = () => {
        if (backgroundVisualKeyRef.current === visualKeyAtLoad) {
          markVisualReady();
        }
      };

      if (typeof img.decode !== "function") {
        markCurrentVisualReady();
        return;
      }

      void img
        .decode()
        .catch(() => undefined)
        .finally(markCurrentVisualReady);
    },
    [backgroundVisualKey, markVisualReady],
  );

  const handleBackgroundImageError = useCallback(() => {
    if (backgroundVisualKeyRef.current === backgroundVisualKey) {
      markVisualReady();
    }
  }, [backgroundVisualKey, markVisualReady]);

  const markPosterReady = useCallback(() => {
    posterReadyRef.current = true;
    setPosterReady(true);
  }, []);

  const markPosterUnavailable = useCallback(() => {
    posterReadyRef.current = false;
    setPosterReady(false);
  }, []);

  useEffect(() => {
    setSoundPromptPhase(needsSoundPrompt ? "prompt" : "playing");
    setVideoUnmuted(false);
    setVideoStatus(backgroundVideoUrl ? "loading" : "idle");
    setSoundPromptRevealTimedOut(false);
  }, [backgroundVideoUrl, needsSoundPrompt]);

  useEffect(() => {
    backgroundVisualKeyRef.current = backgroundVisualKey;
    posterReadyRef.current = false;
    videoPosterFallbackElapsedRef.current = false;
    setPosterReady(false);
  }, [backgroundVisualKey]);

  useEffect(() => {
    if (!needsSoundPrompt || soundPromptPhase !== "prompt") {
      return undefined;
    }
    const timer = window.setTimeout(() => {
      setSoundPromptRevealTimedOut(true);
    }, SOUND_PROMPT_REVEAL_MAX_WAIT_MS);
    return () => window.clearTimeout(timer);
  }, [needsSoundPrompt, sceneId, backgroundVideoUrl, soundPromptPhase]);

  const allowSoundPromptChrome =
    !needsSoundPrompt ||
    soundPromptPhase !== "prompt" ||
    videoStatus === "ready" ||
    videoStatus === "playing" ||
    videoStatus === "ended" ||
    soundPromptRevealTimedOut;

  const showSoundPromptSpinner =
    needsSoundPrompt &&
    soundPromptPhase === "prompt" &&
    !allowSoundPromptChrome;

  const soundGateAwaitingChoice =
    needsSoundPrompt && soundPromptPhase === "prompt";

  useEffect(() => {
    if (!backgroundVideoUrl || soundGateAwaitingChoice) {
      return undefined;
    }

    videoPosterFallbackElapsedRef.current = false;
    const timer = window.setTimeout(() => {
      videoPosterFallbackElapsedRef.current = true;
      if (posterReadyRef.current) {
        markVisualReady();
      }
    }, VIDEO_POSTER_REVEAL_FALLBACK_MS);

    return () => window.clearTimeout(timer);
  }, [
    backgroundVideoUrl,
    backgroundVisualKey,
    markVisualReady,
    soundGateAwaitingChoice,
  ]);

  useEffect(() => {
    if (
      backgroundVideoUrl &&
      !soundGateAwaitingChoice &&
      posterReady &&
      videoPosterFallbackElapsedRef.current
    ) {
      markVisualReady();
    }
  }, [
    backgroundVideoUrl,
    backgroundVisualKey,
    markVisualReady,
    posterReady,
    soundGateAwaitingChoice,
  ]);

  useEffect(() => {
    if (!backgroundVideoUrl || soundPromptPhase !== "playing") {
      return;
    }

    void startVideoAfterSoundChoice(videoUnmuted);
  }, [
    backgroundVideoUrl,
    sceneId,
    soundPromptPhase,
    startVideoAfterSoundChoice,
    videoUnmuted,
  ]);

  useEffect(() => {
    if (!videoPlaybackComplete || !videoRef.current) {
      return;
    }
    videoRef.current.pause();
  }, [videoPlaybackComplete, sceneId, backgroundVideoUrl]);

  const handleSoundAllow = useCallback(() => {
    setVideoUnmuted(true);
    setSoundPromptPhase("playing");
    markVisualReady();
    void startVideoAfterSoundChoice(true);
  }, [markVisualReady, startVideoAfterSoundChoice]);

  const handleSoundDeny = useCallback(() => {
    setVideoUnmuted(false);
    setSoundPromptPhase("playing");
    markVisualReady();
    void startVideoAfterSoundChoice(false);
  }, [markVisualReady, startVideoAfterSoundChoice]);

  const handleVideoLoadStart = useCallback(() => {
    setVideoStatus("loading");
  }, []);

  const handleVideoLoadedData = useCallback(() => {
    setVideoStatus((previous) =>
      previous === "playing" || previous === "ended" ? previous : "ready",
    );
  }, []);

  const handleVideoCanPlay = useCallback(() => {
    setVideoStatus("ready");
    markVisualReady();
    if (soundPromptPhase === "playing" && videoRef.current?.paused) {
      void startVideoAfterSoundChoice(videoUnmuted);
    }
  }, [
    markVisualReady,
    soundPromptPhase,
    startVideoAfterSoundChoice,
    videoUnmuted,
  ]);

  const handleVideoError = useCallback(() => {
    setVideoStatus("ready");
    markVisualReady();
  }, [markVisualReady]);

  const handleVideoPlay = useCallback(() => {
    setVideoStatus("playing");
  }, []);

  const handleVideoEnded = useCallback(() => {
    setVideoStatus("ended");
    onVideoEnded?.();
  }, [onVideoEnded]);

  return {
    allowSoundPromptChrome,
    backgroundVisualKey,
    handleBackgroundImageError,
    handleBackgroundImageLoad,
    handleSoundAllow,
    handleSoundDeny,
    handleVideoCanPlay,
    handleVideoEnded,
    handleVideoError,
    handleVideoLoadedData,
    handleVideoLoadStart,
    handleVideoPlay,
    markPosterReady,
    markPosterUnavailable,
    needsSoundPrompt,
    showSoundPromptSpinner,
    soundGateAwaitingChoice,
    soundPromptPhase,
    videoRef,
    videoStatus,
    videoUnmuted,
  };
}
