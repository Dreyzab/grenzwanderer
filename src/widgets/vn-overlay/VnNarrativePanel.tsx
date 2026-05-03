import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, useReducedMotion } from "framer-motion";
import { VnLogBottomSheet } from "../../features/vn/log/VnLogBottomSheet";
import { MapPin } from "lucide-react";
import { usePrefetchVnVisuals } from "../../features/vn/hooks/usePrefetchVnVisuals";
import { useVnSceneTransition } from "./useVnSceneTransition";
import { useVnNarrativeBackgroundMedia } from "./useVnNarrativeBackgroundMedia";
import { VnNarrativeBackgroundVisuals } from "./VnNarrativeBackgroundVisuals";
import { VnFilmSoundPromptOverlay } from "./VnFilmSoundPromptOverlay";
import { VnLetterNarrativeLayer } from "./VnLetterNarrativeLayer";
import { VnSplitNarrativeDock } from "./VnSplitNarrativeDock";
import { LETTER_CARD_EXPAND_MS } from "./vnNarrativePanelConstants";
import type { VnNarrativePanelProps } from "./vnNarrativePanel.types";

export const VnNarrativePanel: React.FC<VnNarrativePanelProps> = ({
  t,
  sceneId,
  sceneGroupId,
  locationName,
  characterId,
  characterName,
  narrativeText,
  choicesSlot,
  backgroundImageUrl,
  backgroundVideoUrl,
  backgroundVideoPosterUrl,
  backgroundVideoSoundPrompt,
  nextVisualUrls,
  narrativeLayout,
  narrativePresentation,
  logState,
  logSnapshot,
  letterOverlayRevealDelayMs,
  onChoiceSelect,
  isTyping,
  onTypingChange,
  onNarrativeComplete,
  onTokenClick,
  onTokenEnter,
  onTokenLeave,
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
  const {
    isChromeRevealed: chromeRevealed,
    isVisualReady,
    markVisualReady,
    revealChrome,
  } = sceneTransition;
  const {
    allowSoundPromptChrome,
    handleBackgroundImageError,
    handleBackgroundImageLoad,
    handleSoundAllow,
    handleSoundDeny,
    handleVideoCanPlay,
    handleVideoEnded: handleBackgroundVideoEnded,
    handleVideoError,
    handleVideoLoadedData,
    handleVideoLoadStart,
    handleVideoPlay,
    markPosterReady,
    markPosterUnavailable,
    showSoundPromptSpinner,
    soundGateAwaitingChoice,
    soundPromptPhase,
    videoRef,
    videoStatus,
    videoUnmuted,
  } = useVnNarrativeBackgroundMedia({
    backgroundVisualKey,
    backgroundVideoUrl,
    markVisualReady,
    needsSoundPrompt,
    sceneId,
    videoPlaybackComplete,
    onVideoEnded,
  });
  usePrefetchVnVisuals(nextVisualUrls, isVisualReady);
  const displayedLetterRevealSettled =
    !isLetterOverlay || (chromeRevealed && letterRevealSettled);
  const backgroundFadeDuration = prefersReducedMotion ? 0.08 : 0.58;

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

  const handleSurfaceInteraction = useCallback(() => {
    if (!chromeRevealed) {
      revealChrome();
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
    revealChrome,
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

  return (
    <div className="fixed inset-0 z-40 flex flex-col overflow-hidden bg-black font-serif text-stone-200 select-none">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <VnNarrativeBackgroundVisuals
          backgroundFadeDuration={backgroundFadeDuration}
          backgroundImageUrl={backgroundImageUrl}
          backgroundVideoPosterUrl={backgroundVideoPosterUrl}
          backgroundVideoUrl={backgroundVideoUrl}
          backgroundVisualKey={backgroundVisualKey}
          needsSoundPrompt={needsSoundPrompt}
          prefersReducedMotion={Boolean(prefersReducedMotion)}
          soundGateAwaitingChoice={soundGateAwaitingChoice}
          videoRef={videoRef}
          videoStatus={videoStatus}
          videoUnmuted={videoUnmuted}
          onBackgroundImageError={handleBackgroundImageError}
          onBackgroundImageLoad={handleBackgroundImageLoad}
          onPosterError={markPosterUnavailable}
          onPosterLoad={markPosterReady}
          onVideoCanPlay={handleVideoCanPlay}
          onVideoEnded={handleBackgroundVideoEnded}
          onVideoError={handleVideoError}
          onVideoLoadedData={handleVideoLoadedData}
          onVideoLoadStart={handleVideoLoadStart}
          onVideoPlay={handleVideoPlay}
        />

        {!soundGateAwaitingChoice ? (
          <>
            <div className="absolute inset-0 bg-linear-to-t from-stone-950 via-transparent to-black/30" />
            <div className="absolute inset-0 z-10 pointer-events-none mix-blend-overlay opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIj48ZmlsdGVyIGlkPSJub2lzZSIgeD0iMCIgeT0iMCIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuNjUiIG51bU9jdGF2ZXM9IjMiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWx0ZXI9InVybCgjbm9pc2UpIiBvcGFjaXR5PSIxIi8+PC9zdmc+')] brightness-100 contrast-150" />
          </>
        ) : null}
      </div>

      <VnFilmSoundPromptOverlay
        allowSoundPromptChrome={allowSoundPromptChrome}
        backgroundVideoUrl={backgroundVideoUrl}
        sceneId={sceneId}
        showSoundPromptSpinner={showSoundPromptSpinner}
        soundGateAwaitingChoice={soundGateAwaitingChoice}
        soundPromptPhase={soundPromptPhase}
        t={t}
        onSoundAllow={handleSoundAllow}
        onSoundDeny={handleSoundDeny}
      />

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

      {showSplitBgAdmireLayer ? (
        <div
          className="fixed inset-0 z-[160] cursor-pointer touch-manipulation"
          role="button"
          tabIndex={0}
          aria-label="Show dialogue and continue"
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              revealChrome();
            }
          }}
          onClick={revealChrome}
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
        <VnLetterNarrativeLayer
          chromeRevealed={chromeRevealed}
          narrativeText={narrativeText}
          t={t}
          typedTextRef={typedTextRef}
          onNarrativeComplete={onNarrativeComplete}
          onSurfaceInteraction={handleSurfaceInteraction}
          onTokenClick={onTokenClick}
          onTokenEnter={onTokenEnter}
          onTokenLeave={onTokenLeave}
          onTypingChange={onTypingChange}
        />
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
          onTokenClick={onTokenClick}
          onTokenEnter={onTokenEnter}
          onTokenLeave={onTokenLeave}
        />
      ) : null}
      <AnimatePresence initial={false}>
        {!isLogLayout && !isFullscreen && !isLetterOverlay && chromeRevealed ? (
          <VnSplitNarrativeDock
            key={backgroundVisualKey}
            characterId={characterId}
            characterName={characterName}
            choicesSlot={choicesSlot}
            isThoughtLog={isThoughtLog}
            isTyping={isTyping}
            narrativeText={narrativeText}
            typedTextRef={typedTextRef}
            onNarrativeComplete={onNarrativeComplete}
            onSurfaceInteraction={handleSurfaceInteraction}
            onTokenClick={onTokenClick}
            onTokenEnter={onTokenEnter}
            onTokenLeave={onTokenLeave}
            onTypingChange={onTypingChange}
          />
        ) : null}
      </AnimatePresence>

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
