import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  VnChoice,
  VnNarrativeLayout,
  VnNarrativePresentation,
  VnSnapshot,
} from "../../features/vn/types";
import { VnStrings } from "../../features/i18n/uiStrings";
import { VnLogBottomSheet } from "../../features/vn/log/VnLogBottomSheet";
import type { NarrativeLogState } from "../../features/vn/log/useNarrativeLog";
import { VnNarrativeText } from "../../features/vn/ui/VnNarrativeText";
import { MapPin } from "lucide-react";
import {
  TypedText,
  type TypedTextHandle,
} from "../../features/vn/ui/TypedText";
import { useVnSceneTransition } from "./useVnSceneTransition";

interface VnNarrativePanelProps {
  t: VnStrings;
  sceneId?: string;
  /** Resolved log coordinator id (same as `logState.sceneGroupId`) — drives bottom-sheet scene transitions only. */
  sceneGroupId?: string | null;
  locationName: string;
  characterName?: string;
  narrativeText: string;
  choices?: VnChoice[];
  choicesSlot?: React.ReactNode;
  backgroundImageUrl?: string;
  backgroundVideoUrl?: string;
  backgroundVideoPosterUrl?: string;
  backgroundVideoSoundPrompt?: boolean;
  narrativeLayout?: VnNarrativeLayout;
  narrativePresentation?: VnNarrativePresentation;
  logState?: NarrativeLogState;
  logSnapshot?: VnSnapshot | null;
  letterOverlayRevealDelayMs?: number;
  onChoiceSelect?: (choiceId: string) => void;
  isTyping?: boolean;
  onTypingChange?: (typing: boolean) => void;
  onNarrativeComplete?: () => void;
  typedTextRef?: React.RefObject<TypedTextHandle>;
  onSurfaceTap?: () => void;
  onVideoEnded?: () => void;
  /** Parent marks natural/skip end — pauses the background video element to avoid double audio. */
  videoPlaybackComplete?: boolean;
  children?: React.ReactNode;
}

/** Must match the letter card `duration-*` in Tailwind (transition-all duration-700). */
const LETTER_CARD_EXPAND_MS = 700;
/** Do not block the sound prompt indefinitely if decoding/network fails (e.g. flaky media cache). */
const SOUND_PROMPT_REVEAL_MAX_WAIT_MS = 2500;

type SoundPromptPhase = "prompt" | "playing";
type VideoStatus = "idle" | "loading" | "ready" | "playing" | "ended";

export const VnNarrativePanel: React.FC<VnNarrativePanelProps> = ({
  t,
  sceneId,
  sceneGroupId,
  locationName,
  characterName,
  narrativeText,
  choicesSlot,
  backgroundImageUrl,
  backgroundVideoUrl,
  backgroundVideoPosterUrl,
  backgroundVideoSoundPrompt,
  narrativeLayout,
  narrativePresentation,
  logState,
  logSnapshot,
  letterOverlayRevealDelayMs,
  onChoiceSelect,
  isTyping,
  onTypingChange,
  onNarrativeComplete,
  typedTextRef,
  onSurfaceTap,
  onVideoEnded,
  videoPlaybackComplete,
  children,
}) => {
  const effectiveNarrativeLayout =
    narrativeLayout ??
    (narrativePresentation === "letter" ? "letter_overlay" : "split");
  const isFullscreen = effectiveNarrativeLayout === "fullscreen";
  const isLetterOverlay = effectiveNarrativeLayout === "letter_overlay";
  const isLogLayout = effectiveNarrativeLayout === "log";
  const isThoughtLog = effectiveNarrativeLayout === "thought_log";
  const isImmersive = isFullscreen || isLetterOverlay;
  const isSplitLayout = !isFullscreen && !isLetterOverlay;
  const needsSoundPrompt = Boolean(
    backgroundVideoUrl && backgroundVideoSoundPrompt,
  );
  const prefersReducedMotion = useReducedMotion();

  const backgroundVisualKey = useMemo(
    () =>
      [
        effectiveNarrativeLayout,
        backgroundImageUrl ?? "",
        backgroundVideoUrl ?? "",
        backgroundVideoPosterUrl ?? "",
        needsSoundPrompt ? "sound-prompt" : "direct",
      ].join("\0"),
    [
      backgroundImageUrl,
      backgroundVideoPosterUrl,
      backgroundVideoUrl,
      effectiveNarrativeLayout,
      needsSoundPrompt,
    ],
  );
  const videoRef = useRef<HTMLVideoElement>(null);

  const [soundPromptPhase, setSoundPromptPhase] = useState<SoundPromptPhase>(
    needsSoundPrompt ? "prompt" : "playing",
  );
  const [soundPromptRevealTimedOut, setSoundPromptRevealTimedOut] =
    useState(false);
  const [videoUnmuted, setVideoUnmuted] = useState(false);
  const [videoStatus, setVideoStatus] = useState<VideoStatus>("idle");
  /** After the letter card expand animation; blocks continue + chrome until set. */
  const [letterRevealSettled, setLetterRevealSettled] =
    useState(!isLetterOverlay);

  const sceneTransition = useVnSceneTransition({
    visualKey: backgroundVisualKey,
    layout: effectiveNarrativeLayout,
    hasImage: Boolean(backgroundImageUrl),
    hasVideo: Boolean(backgroundVideoUrl),
    needsSoundPrompt,
    revealMode: letterOverlayRevealDelayMs == null ? "tap" : "auto",
    autoRevealAfterMs: letterOverlayRevealDelayMs,
  });
  const chromeRevealed = sceneTransition.isChromeRevealed;
  const displayedLetterRevealSettled =
    !isLetterOverlay || (chromeRevealed && letterRevealSettled);
  const backgroundFadeDuration = prefersReducedMotion ? 0.08 : 0.58;

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

  useEffect(() => {
    setSoundPromptPhase(needsSoundPrompt ? "prompt" : "playing");
    setVideoUnmuted(false);
    setVideoStatus(backgroundVideoUrl ? "loading" : "idle");
    setSoundPromptRevealTimedOut(false);
  }, [backgroundVideoUrl, needsSoundPrompt]);

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

  /** Hide scene art / poster until the player chooses sound — avoids story spoilers on the gate. */
  const soundGateAwaitingChoice =
    needsSoundPrompt && soundPromptPhase === "prompt";

  useEffect(() => {
    if (!isLetterOverlay) {
      setLetterRevealSettled(true);
      return;
    }

    setLetterRevealSettled(false);
  }, [backgroundVisualKey, isLetterOverlay]);

  useEffect(() => {
    if (!isLetterOverlay || !chromeRevealed) {
      return undefined;
    }

    const id = window.setTimeout(() => {
      setLetterRevealSettled(true);
    }, LETTER_CARD_EXPAND_MS);
    return () => {
      window.clearTimeout(id);
    };
  }, [chromeRevealed, isLetterOverlay, sceneId]);

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
    sceneTransition.markVisualReady();
    void startVideoAfterSoundChoice(true);
  }, [sceneTransition, startVideoAfterSoundChoice]);

  const handleSoundDeny = useCallback(() => {
    setVideoUnmuted(false);
    setSoundPromptPhase("playing");
    sceneTransition.markVisualReady();
    void startVideoAfterSoundChoice(false);
  }, [sceneTransition, startVideoAfterSoundChoice]);

  const handleSurfaceInteraction = useCallback(() => {
    if (!chromeRevealed) {
      sceneTransition.revealChrome();
      return;
    }
    if (isLetterOverlay && !displayedLetterRevealSettled) {
      return;
    }
    if (isLetterOverlay && isTyping) {
      typedTextRef?.current?.finish();
      return;
    }
    onSurfaceTap?.();
  }, [
    chromeRevealed,
    isLetterOverlay,
    isTyping,
    displayedLetterRevealSettled,
    typedTextRef,
    onSurfaceTap,
    sceneTransition,
  ]);

  const showVideoLoadingState =
    Boolean(backgroundVideoUrl) &&
    soundPromptPhase === "playing" &&
    videoStatus !== "playing" &&
    videoStatus !== "ended";

  const showSplitBgAdmireLayer =
    isSplitLayout &&
    !chromeRevealed &&
    (!needsSoundPrompt || soundPromptPhase === "playing");

  const narrativeBody = (
    <VnNarrativeText
      text={narrativeText}
      onTypingChange={onTypingChange}
      onComplete={onNarrativeComplete}
      typedTextRef={typedTextRef}
    />
  );
  const letterNarrativeBody = (
    <div className="vn-letter-sheet">
      <TypedText
        ref={typedTextRef}
        text={narrativeText}
        onComplete={onNarrativeComplete}
        onTypingChange={onTypingChange}
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-40 flex flex-col overflow-hidden bg-black font-serif text-stone-200 select-none">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <AnimatePresence initial={false}>
          {(backgroundVideoUrl || backgroundImageUrl) && (
            <motion.div
              key={backgroundVisualKey}
              className="absolute inset-0"
              initial={{ opacity: prefersReducedMotion ? 1 : 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: prefersReducedMotion ? 1 : 0 }}
              transition={{
                duration: backgroundFadeDuration,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {backgroundVideoUrl &&
                (backgroundVideoPosterUrl || backgroundImageUrl) &&
                !soundGateAwaitingChoice && (
                  <img
                    src={backgroundVideoPosterUrl ?? backgroundImageUrl}
                    className="absolute inset-0 h-full w-full object-cover brightness-[0.62] sepia-[0.16] contrast-[1.05] transition-opacity duration-700 ease-out motion-reduce:transition-none"
                    alt="Background"
                  />
                )}

              {backgroundVideoUrl ? (
                <video
                  ref={videoRef}
                  className={[
                    "absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ease-out motion-reduce:transition-none",
                    soundGateAwaitingChoice ? "opacity-0" : "opacity-100",
                  ].join(" ")}
                  src={backgroundVideoUrl}
                  poster={
                    soundGateAwaitingChoice
                      ? undefined
                      : (backgroundVideoPosterUrl ?? backgroundImageUrl)
                  }
                  playsInline
                  preload="auto"
                  autoPlay={!needsSoundPrompt}
                  muted={!videoUnmuted}
                  onLoadStart={() => setVideoStatus("loading")}
                  onLoadedData={() => {
                    setVideoStatus((previous) =>
                      previous === "playing" || previous === "ended"
                        ? previous
                        : "ready",
                    );
                  }}
                  onCanPlay={() => {
                    setVideoStatus("ready");
                    sceneTransition.markVisualReady();
                    if (
                      soundPromptPhase === "playing" &&
                      videoRef.current?.paused
                    ) {
                      void startVideoAfterSoundChoice(videoUnmuted);
                    }
                  }}
                  onError={() => {
                    setVideoStatus("ready");
                    sceneTransition.markVisualReady();
                  }}
                  onPlay={() => setVideoStatus("playing")}
                  onEnded={() => {
                    setVideoStatus("ended");
                    onVideoEnded?.();
                  }}
                />
              ) : backgroundImageUrl ? (
                <img
                  src={backgroundImageUrl}
                  className="absolute inset-0 h-full w-full object-cover brightness-[0.62] sepia-[0.16] contrast-[1.05]"
                  alt="Background"
                  onLoad={sceneTransition.markVisualReady}
                  onError={sceneTransition.markVisualReady}
                />
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>

        {!soundGateAwaitingChoice ? (
          <>
            <div className="absolute inset-0 bg-linear-to-t from-stone-950 via-transparent to-black/30" />
            <div className="absolute inset-0 z-10 pointer-events-none mix-blend-overlay opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIj48ZmlsdGVyIGlkPSJub2lzZSIgeD0iMCIgeT0iMCIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuNjUiIG51bU9jdGF2ZXM9IjMiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWx0ZXI9InVybCgjbm9pc2UpIiBvcGFjaXR5PSIxIi8+PC9zdmc+')] brightness-100 contrast-150" />
          </>
        ) : null}
      </div>

      {soundGateAwaitingChoice ? (
        <div
          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black px-6 text-center pointer-events-none"
          aria-hidden
        >
          <div className="pointer-events-none absolute inset-0 bg-[url('/images/paper-texture.png')] opacity-[0.04] mix-blend-overlay" />
          <div className="relative z-10 space-y-3">
            <div className="relative inline-block">
              <h1 className="m-0 text-4xl font-sans text-primary tracking-tighter drop-shadow-lg sm:text-6xl md:text-7xl">
                Grenzwanderer 4
              </h1>
              <div className="absolute -inset-4 rounded-full bg-primary/10 blur-3xl -z-10" />
            </div>
            <div className="mx-auto h-[2px] w-16 bg-linear-to-r from-transparent via-primary/80 to-transparent opacity-70" />
            <p className="font-serif text-base italic tracking-wide text-gray-500 md:text-lg">
              Shadows of the Black Forest
            </p>
          </div>
        </div>
      ) : null}

      {!isImmersive && chromeRevealed && (
        <div className="absolute top-0 inset-x-0 p-6 pt-12 flex justify-between items-start z-100 bg-linear-to-b from-black/90 via-black/40 to-transparent pb-32 pointer-events-none border-t-0 border-l-0 border-r-0 border-b-0">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-amber-500/90 uppercase tracking-[0.2em] text-[10px] font-bold">
              <MapPin size={12} className="text-amber-500" />
              <span>{t.currentLocation}</span>
            </div>
            <h1 className="text-4xl font-display text-white font-bold tracking-tight drop-shadow-2xl opacity-90 m-0">
              {locationName}
            </h1>
            <div className="h-px w-24 bg-linear-to-r from-amber-500/50 to-transparent mt-1" />
          </div>
        </div>
      )}

      {showVideoLoadingState ? (
        <div className="absolute right-5 bottom-5 z-125 rounded-full border border-white/10 bg-black/45 px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-white/80 backdrop-blur-md">
          {t.bufferingReel}
        </div>
      ) : null}

      {showSoundPromptSpinner ? (
        <div className="absolute inset-0 z-129 flex items-center justify-center p-6">
          <div className="rounded-full border border-white/12 bg-black/50 px-5 py-2.5 text-[11px] uppercase tracking-[0.18em] text-white/85 backdrop-blur-md">
            {t.bufferingReel}
          </div>
        </div>
      ) : null}

      {backgroundVideoUrl &&
      soundPromptPhase === "prompt" &&
      allowSoundPromptChrome ? (
        <div
          className="absolute inset-0 z-130 flex items-center justify-center p-5"
          onClick={(event) => event.stopPropagation()}
        >
          <motion.div
            key={sceneId ?? backgroundVideoUrl}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.38,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="w-full max-w-md rounded-[1.8rem] border border-white/12 bg-stone-950/90 px-6 py-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl"
          >
            <p className="text-[11px] uppercase tracking-[0.22em] text-amber-300/80">
              {t.filmAudio}
            </p>
            <h2 className="mt-3 text-2xl font-display text-white">
              {t.startWithSound}
            </h2>
            <p className="mt-3 text-sm leading-6 text-stone-300">
              {t.startWithSoundDescription}
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                className="flex-1 rounded-2xl border border-amber-300/30 bg-amber-200/10 px-4 py-3 text-sm font-semibold text-amber-50 transition-colors hover:bg-amber-200/16"
                onClick={handleSoundAllow}
              >
                {t.enableSound}
              </button>
              <button
                type="button"
                className="flex-1 rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                onClick={handleSoundDeny}
              >
                {t.withoutSound}
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}

      {showSplitBgAdmireLayer ? (
        <div
          className="fixed inset-0 z-[160] cursor-pointer touch-manipulation"
          role="button"
          tabIndex={0}
          aria-label="Show dialogue and continue"
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              sceneTransition.revealChrome();
            }
          }}
          onClick={sceneTransition.revealChrome}
        />
      ) : null}

      <div
        className={
          isLetterOverlay && !displayedLetterRevealSettled
            ? "pointer-events-none"
            : undefined
        }
      >
        {children}
      </div>

      {isLetterOverlay ? (
        <div
          className="absolute inset-0 z-110 flex cursor-pointer items-center justify-center px-4 pt-8 pb-[calc(2rem+4rem+env(safe-area-inset-bottom))] sm:px-8"
          onClick={handleSurfaceInteraction}
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
                    {chromeRevealed ? letterNarrativeBody : null}
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
      ) : null}

      {isLogLayout && chromeRevealed && logState ? (
        <VnLogBottomSheet
          sceneGroupId={sceneGroupId ?? null}
          state={logState}
          snapshot={logSnapshot ?? null}
          typedTextRef={typedTextRef}
          choicesSlot={choicesSlot}
          onTypingChange={onTypingChange}
          onSegmentComplete={onNarrativeComplete}
          onSurfaceTap={handleSurfaceInteraction}
        />
      ) : null}

      {!isLogLayout && !isFullscreen && !isLetterOverlay && chromeRevealed ? (
        <div
          className={[
            "absolute bottom-0 z-150 flex flex-col border-t border-white/10 shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.8)]",
            isThoughtLog
              ? "left-0 min-h-[48%] max-h-[78%] w-full sm:left-6 sm:max-w-2xl"
              : "inset-x-0 min-h-[35%] max-h-[65%]",
          ].join(" ")}
        >
          <div className="h-[2px] bg-linear-to-r from-transparent via-amber-600/80 to-transparent shrink-0" />

          {characterName && (
            <div className="absolute left-0 -top-5 z-20 flex items-end group">
              <div className="absolute left-8 top-full h-4 w-[2px] bg-amber-500/40" />
              <div className="relative px-6 py-2 bg-stone-950 border-l-[3px] border-amber-500 shadow-[0_5px_15px_rgba(0,0,0,0.5)] transform -skew-x-12 origin-bottom-left transition-transform duration-300 group-hover:-skew-x-6">
                <div className="transform skew-x-12 text-amber-500 font-bold tracking-widest uppercase text-base">
                  {characterName}
                </div>
                <div className="absolute -top-px -right-px w-2 h-2 border-t border-r border-amber-500/60" />
              </div>
            </div>
          )}

          <div
            className={[
              "flex-1 overflow-y-auto px-6 relative border-t-0 border-r-0 border-b-0 border-l border-white/5",
              isThoughtLog
                ? "bg-linear-to-b from-stone-950/78 to-black/82 pb-6 pt-10"
                : `bg-linear-to-b from-stone-950/20 to-black/50 backdrop-blur-md rounded-tr-4xl ${
                    characterName ? "pt-12" : "py-6"
                  }`,
            ].join(" ")}
            onClick={handleSurfaceInteraction}
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-amber-900/10 via-transparent to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-stone-950/40 pointer-events-none" />
            <div className="fixed inset-0 opacity-[0.05] mix-blend-overlay pointer-events-none" />

            <div
              className={[
                "font-body relative z-10 p-0 text-stone-200",
                isThoughtLog
                  ? "mx-auto w-full max-w-prose text-[1.35rem] leading-8"
                  : "text-2xl sm:text-3xl leading-relaxed",
              ].join(" ")}
            >
              {narrativeBody}
            </div>
          </div>

          {!isTyping && choicesSlot && (
            <div
              className="shrink-0 bg-stone-950/90 backdrop-blur-xl border-t border-white/10 px-4 sm:px-6 py-2 sm:py-3 space-y-1 max-h-[50vh] overflow-y-auto shadow-inner"
              onClick={(event) => event.stopPropagation()}
            >
              {isThoughtLog ? (
                <div className="mx-auto w-full max-w-prose">{choicesSlot}</div>
              ) : (
                choicesSlot
              )}
            </div>
          )}
          {/* Navbar Spacer */}
          <div className="h-[calc(4rem+env(safe-area-inset-bottom))]" />
        </div>
      ) : null}

      {isImmersive && !isLetterOverlay ? (
        <div
          className="absolute inset-0 z-128 cursor-pointer touch-manipulation"
          onClick={handleSurfaceInteraction}
          aria-hidden="true"
        />
      ) : null}
    </div>
  );
};
