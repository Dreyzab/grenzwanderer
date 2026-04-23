import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  VnChoice,
  VnNarrativeLayout,
  VnNarrativePresentation,
} from "../../features/vn/types";
import { VnNarrativeText } from "../../features/vn/ui/VnNarrativeText";
import { MapPin } from "lucide-react";
import {
  TypedText,
  type TypedTextHandle,
} from "../../features/vn/ui/TypedText";

interface VnNarrativePanelProps {
  sceneId?: string;
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
  letterOverlayRevealDelayMs?: number;
  onChoiceSelect?: (choiceId: string) => void;
  isTyping?: boolean;
  onTypingChange?: (typing: boolean) => void;
  onNarrativeComplete?: () => void;
  typedTextRef?: React.RefObject<TypedTextHandle>;
  onSurfaceTap?: () => void;
  onVideoEnded?: () => void;
  children?: React.ReactNode;
}

const DEFAULT_LETTER_OVERLAY_REVEAL_DELAY_MS = 2200;

type SoundPromptPhase = "prompt" | "playing";
type VideoStatus = "idle" | "loading" | "ready" | "playing" | "ended";

export const VnNarrativePanel: React.FC<VnNarrativePanelProps> = ({
  sceneId,
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
  letterOverlayRevealDelayMs,
  onChoiceSelect,
  isTyping,
  onTypingChange,
  onNarrativeComplete,
  typedTextRef,
  onSurfaceTap,
  onVideoEnded,
  children,
}) => {
  const postDebugLog = useCallback(
    (
      location: string,
      message: string,
      data: Record<string, unknown>,
      hypothesisId: string,
      runId = "run1",
    ) => {
      // #region agent log
      fetch(
        "http://127.0.0.1:7827/ingest/516e26f3-8222-4f1d-b4fe-801d6fa79ab1",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "f85e6b",
          },
          body: JSON.stringify({
            sessionId: "f85e6b",
            runId,
            hypothesisId,
            location,
            message,
            data,
            timestamp: Date.now(),
          }),
        },
      ).catch(() => {});
      // #endregion
    },
    [],
  );

  const effectiveNarrativeLayout =
    narrativeLayout ??
    (narrativePresentation === "letter" ? "letter_overlay" : "split");
  const isFullscreen = effectiveNarrativeLayout === "fullscreen";
  const isLetterOverlay = effectiveNarrativeLayout === "letter_overlay";
  const isThoughtLog = effectiveNarrativeLayout === "thought_log";
  const isImmersive = isFullscreen || isLetterOverlay;
  const needsSoundPrompt = Boolean(
    backgroundVideoUrl && backgroundVideoSoundPrompt,
  );
  const revealDelayMs =
    letterOverlayRevealDelayMs ?? DEFAULT_LETTER_OVERLAY_REVEAL_DELAY_MS;

  const videoRef = useRef<HTMLVideoElement>(null);

  const [soundPromptPhase, setSoundPromptPhase] = useState<SoundPromptPhase>(
    needsSoundPrompt ? "prompt" : "playing",
  );
  const [videoUnmuted, setVideoUnmuted] = useState(false);
  const [videoStatus, setVideoStatus] = useState<VideoStatus>("idle");
  const [letterRevealed, setLetterRevealed] = useState(!isLetterOverlay);

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

    if (!isLetterOverlay) {
      setLetterRevealed(true);
      return;
    }

    setLetterRevealed(false);
    const timeoutId = window.setTimeout(() => {
      setLetterRevealed(true);
      postDebugLog(
        "VnNarrativePanel.tsx:letter-reveal",
        "Letter overlay revealed by timer",
        {
          sceneId: sceneId ?? null,
          revealDelayMs,
        },
        "H3",
      );
    }, revealDelayMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    backgroundVideoUrl,
    isLetterOverlay,
    needsSoundPrompt,
    postDebugLog,
    revealDelayMs,
    sceneId,
  ]);

  useEffect(() => {
    postDebugLog(
      "VnNarrativePanel.tsx:scene-init",
      "Narrative panel scene state",
      {
        sceneId: sceneId ?? null,
        effectiveNarrativeLayout,
        isImmersive,
        isLetterOverlay,
        letterRevealed,
        backgroundVideoUrl: backgroundVideoUrl ?? null,
        needsSoundPrompt,
        soundPromptPhase,
      },
      "H2",
    );
  }, [
    backgroundVideoUrl,
    effectiveNarrativeLayout,
    isImmersive,
    isLetterOverlay,
    letterRevealed,
    needsSoundPrompt,
    postDebugLog,
    sceneId,
    soundPromptPhase,
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

  const handleSoundAllow = useCallback(() => {
    postDebugLog(
      "VnNarrativePanel.tsx:handleSoundAllow",
      "Sound prompt allow pressed",
      {
        sceneId: sceneId ?? null,
        videoStatus,
        hasVideoRef: Boolean(videoRef.current),
      },
      "H4",
    );
    setVideoUnmuted(true);
    setSoundPromptPhase("playing");
    void startVideoAfterSoundChoice(true);
  }, [postDebugLog, sceneId, startVideoAfterSoundChoice, videoStatus]);

  const handleSoundDeny = useCallback(() => {
    setVideoUnmuted(false);
    setSoundPromptPhase("playing");
    void startVideoAfterSoundChoice(false);
  }, [startVideoAfterSoundChoice]);

  const handleSurfaceInteraction = useCallback(
    (event?: React.MouseEvent<HTMLElement>) => {
      postDebugLog(
        "VnNarrativePanel.tsx:surface-v2",
        "Surface interaction observed",
        {
          sceneId: sceneId ?? null,
          isLetterOverlay,
          letterRevealed,
          soundPromptPhase,
          targetTag:
            (event?.target as HTMLElement | null)?.tagName?.toLowerCase() ??
            null,
          currentTargetTag:
            (
              event?.currentTarget as HTMLElement | null
            )?.tagName?.toLowerCase() ?? null,
        },
        "H6",
      );
      if (isLetterOverlay && !letterRevealed) {
        postDebugLog(
          "VnNarrativePanel.tsx:surface",
          "Surface tap blocked before letter reveal",
          {
            sceneId: sceneId ?? null,
            isLetterOverlay,
            letterRevealed,
          },
          "H3",
        );
        return;
      }
      postDebugLog(
        "VnNarrativePanel.tsx:surface",
        "Surface tap forwarded to VnScreen",
        {
          sceneId: sceneId ?? null,
          isLetterOverlay,
          letterRevealed,
          soundPromptPhase,
        },
        "H3",
      );
      onSurfaceTap?.();
    },
    [
      isLetterOverlay,
      letterRevealed,
      onSurfaceTap,
      postDebugLog,
      sceneId,
      soundPromptPhase,
    ],
  );

  const showVideoLoadingState =
    Boolean(backgroundVideoUrl) &&
    soundPromptPhase === "playing" &&
    videoStatus !== "playing" &&
    videoStatus !== "ended";

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
      <div
        className="absolute inset-0 z-0 transition-opacity duration-1000"
        style={{ opacity: soundPromptPhase === "prompt" ? 0 : 1 }}
      >
        {backgroundVideoUrl &&
          (backgroundVideoPosterUrl || backgroundImageUrl) && (
            <img
              src={backgroundVideoPosterUrl ?? backgroundImageUrl}
              className="absolute inset-0 h-full w-full object-cover brightness-[0.62] sepia-[0.16] contrast-[1.05]"
              alt="Background"
            />
          )}

        {backgroundVideoUrl && (
          <video
            ref={videoRef}
            key={sceneId ?? backgroundVideoUrl}
            className="absolute inset-0 h-full w-full object-cover"
            src={backgroundVideoUrl}
            poster={backgroundVideoPosterUrl ?? backgroundImageUrl}
            playsInline
            preload="auto"
            autoPlay={!needsSoundPrompt}
            muted={!videoUnmuted}
            onLoadStart={() => setVideoStatus("loading")}
            onCanPlay={() => {
              setVideoStatus("ready");
              if (soundPromptPhase === "playing" && videoRef.current?.paused) {
                void startVideoAfterSoundChoice(videoUnmuted);
              }
            }}
            onPlay={() => setVideoStatus("playing")}
            onEnded={() => {
              setVideoStatus("ended");
              onVideoEnded?.();
            }}
          />
        )}

        {!backgroundVideoUrl && backgroundImageUrl && (
          <img
            src={backgroundImageUrl}
            className="absolute inset-0 h-full w-full object-cover brightness-[0.62] sepia-[0.16] contrast-[1.05]"
            alt="Background"
          />
        )}

        <div className="absolute inset-0 bg-linear-to-t from-stone-950 via-transparent to-black/30" />
        <div className="absolute inset-0 z-10 pointer-events-none mix-blend-overlay opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIj48ZmlsdGVyIGlkPSJub2lzZSIgeD0iMCIgeT0iMCIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuNjUiIG51bU9jdGF2ZXM9IjMiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWx0ZXI9InVybCgjbm9pc2UpIiBvcGFjaXR5PSIxIi8+PC9zdmc+')] brightness-100 contrast-150" />
      </div>

      {isImmersive ? (
        <div
          className="absolute inset-0 z-60"
          onClick={(event) => handleSurfaceInteraction(event)}
          aria-hidden="true"
        />
      ) : null}

      {!isImmersive && (
        <div className="absolute top-0 inset-x-0 p-6 pt-12 flex justify-between items-start z-100 bg-linear-to-b from-black/90 via-black/40 to-transparent pb-32 pointer-events-none border-t-0 border-l-0 border-r-0 border-b-0">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-amber-500/90 uppercase tracking-[0.2em] text-[10px] font-bold">
              <MapPin size={12} className="text-amber-500" />
              <span>Current Location</span>
            </div>
            <h1 className="text-3xl font-display text-white font-bold tracking-tight drop-shadow-2xl opacity-90 m-0">
              {locationName}
            </h1>
            <div className="h-px w-24 bg-linear-to-r from-amber-500/50 to-transparent mt-1" />
          </div>
        </div>
      )}

      {showVideoLoadingState ? (
        <div className="absolute right-5 bottom-5 z-125 rounded-full border border-white/10 bg-black/45 px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-white/80 backdrop-blur-md">
          Buffering reel
        </div>
      ) : null}

      {backgroundVideoUrl && soundPromptPhase === "prompt" ? (
        <div
          className="absolute inset-0 z-130 flex items-end justify-center p-5 sm:items-center"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="w-full max-w-md rounded-[1.8rem] border border-white/12 bg-stone-950/90 px-6 py-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl">
            <p className="text-[11px] uppercase tracking-[0.22em] text-amber-300/80">
              Film Audio
            </p>
            <h2 className="mt-3 text-2xl font-display text-white">
              Start with sound?
            </h2>
            <p className="mt-3 text-sm leading-6 text-stone-300">
              This clip can start with audio or continue silently.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                className="flex-1 rounded-2xl border border-amber-300/30 bg-amber-200/10 px-4 py-3 text-sm font-semibold text-amber-50 transition-colors hover:bg-amber-200/16"
                onClick={handleSoundAllow}
              >
                Enable sound
              </button>
              <button
                type="button"
                className="flex-1 rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                onClick={handleSoundDeny}
              >
                Without sound
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {children}

      {isLetterOverlay ? (
        <div className="absolute inset-0 z-110 flex items-center justify-center px-4 pt-8 pb-[calc(2rem+4rem+env(safe-area-inset-bottom))] pointer-events-none sm:px-8">
          <div
            className={[
              "w-full max-w-[44rem] transform transition-all duration-700 ease-out",
              letterRevealed
                ? "translate-y-0 -rotate-1 scale-100 opacity-100"
                : "translate-y-10 rotate-2 scale-95 opacity-0",
            ].join(" ")}
          >
            <div className="relative">
              <div className="absolute -inset-4 rounded-[2.5rem] bg-black/30 blur-2xl" />
              <div className="relative overflow-hidden rounded-[1.25rem] border border-[#7a5830]/45 bg-[linear-gradient(135deg,rgba(255,250,229,0.99)_0%,rgba(238,220,178,0.99)_58%,rgba(218,190,139,0.99)_100%)] px-5 py-6 shadow-[0_34px_100px_rgba(0,0,0,0.62),inset_0_0_0_1px_rgba(255,255,255,0.35)] sm:px-12 sm:py-10">
                <div className="absolute inset-0 bg-[url('/images/paper-texture.png')] opacity-[0.22] mix-blend-multiply" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_12%,rgba(146,94,38,0.16),transparent_30%),radial-gradient(circle_at_86%_78%,rgba(88,47,20,0.18),transparent_34%)]" />
                <div className="absolute left-[13%] top-0 h-full w-px bg-[#8b683b]/18" />
                <div className="absolute inset-x-8 top-6 h-px bg-linear-to-r from-transparent via-[#7a5830]/35 to-transparent sm:inset-x-14" />
                <div className="absolute inset-x-8 bottom-6 h-px bg-linear-to-r from-transparent via-[#7a5830]/25 to-transparent sm:inset-x-14" />
                <div className="absolute -right-5 -bottom-5 size-24 rounded-full border border-[#7f2517]/35 bg-[radial-gradient(circle,rgba(128,35,24,0.2)_0%,rgba(128,35,24,0.12)_45%,transparent_70%)]" />

                <div className="relative z-10 mx-auto max-w-[34rem]">
                  <div className="flex items-start justify-between gap-5 border-b border-[#7a5830]/30 pb-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#6b4422]">
                        Private Correspondence
                      </p>
                      <p className="mt-2 text-[0.72rem] uppercase tracking-[0.2em] text-[#8c6a3d]">
                        Freiburg i. Br. / Station post
                      </p>
                    </div>
                    <div className="rounded-full border border-[#7a5830]/35 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[#6b4422]">
                      1905
                    </div>
                  </div>

                  <div className="mt-5 whitespace-pre-wrap text-[#3c2616]">
                    {letterRevealed ? letterNarrativeBody : null}
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-[#7a5830]/20 pt-3 text-[0.68rem] uppercase tracking-[0.22em] text-[#8c6a3d]">
                    <span>Unsealed at arrival</span>
                    <span>Tap to continue</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {!isFullscreen && !isLetterOverlay ? (
        <div
          className={[
            "absolute bottom-0 z-150 flex flex-col border-t border-white/10 shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.8)] transition-all duration-700",
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
                <div className="transform skew-x-12 text-amber-500 font-bold tracking-widest uppercase text-sm">
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
            onClick={(event) => handleSurfaceInteraction(event)}
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-amber-900/10 via-transparent to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-stone-950/40 pointer-events-none" />
            <div className="fixed inset-0 opacity-[0.05] mix-blend-overlay pointer-events-none" />

            <div
              className={[
                "font-body relative z-10 p-0 text-stone-200",
                isThoughtLog
                  ? "mx-auto w-full max-w-prose text-[1.02rem] leading-8"
                  : "text-base sm:text-lg leading-relaxed",
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
    </div>
  );
};
