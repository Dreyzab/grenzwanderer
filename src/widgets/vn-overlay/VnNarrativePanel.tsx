import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
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
import { VnVisualSequenceLayer } from "./VnVisualSequenceLayer";
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
  hasVisibleChoices,
  backgroundImageUrl,
  backgroundFocusPath,
  backgroundVideoUrl,
  backgroundVideoPosterUrl,
  backgroundVideoSoundPrompt,
  visualSequence,
  nextVisualUrls,
  narrativeLayout,
  narrativePresentation,
  logState,
  logSnapshot,
  playerProfile,
  parliamentPresetId,
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
  onVisualSequenceEnded,
  videoPlaybackComplete,
  suppressImmersiveSurfaceOverlay = false,
  tokenStateByPayload,
  showTutorialTooltip = false,
  onDismissTutorialTooltip,
  children,
}) => {
  const effectiveNarrativeLayout =
    narrativeLayout ??
    (narrativePresentation === "letter" ? "letter_overlay" : "split");
  const isFullscreen = effectiveNarrativeLayout === "fullscreen";
  const isLetterOverlay = effectiveNarrativeLayout === "letter_overlay";
  const isLogLayout = effectiveNarrativeLayout === "log";
  const isThoughtLog = effectiveNarrativeLayout === "thought_log";
  const hasVisualSequence = Boolean(visualSequence?.frames.length);
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
  /** Letter overlay: blocks surface continue until chrome is revealed and settled. */
  const [letterRevealSettled, setLetterRevealSettled] =
    useState(!isLetterOverlay);

  /**
   * Log scenes reveal the dock as soon as the background is ready so typed text
   * can grow the sheet smoothly. Per-node override via letterOverlayRevealDelayMs.
   */
  const LOG_AUTO_REVEAL_MS = 0;
  const resolvedAutoRevealMs =
    letterOverlayRevealDelayMs ??
    (isLogLayout && !needsSoundPrompt ? LOG_AUTO_REVEAL_MS : undefined);

  const sceneTransition = useVnSceneTransition({
    visualKey: backgroundVisualKey,
    layout: effectiveNarrativeLayout,
    hasImage: Boolean(backgroundImageUrl),
    hasVideo: Boolean(backgroundVideoUrl),
    needsSoundPrompt,
    revealMode: resolvedAutoRevealMs == null ? "tap" : "auto",
    autoRevealAfterMs: resolvedAutoRevealMs,
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
  usePrefetchVnVisuals(nextVisualUrls, isVisualReady, { maxPrefetch: 12 });
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

  useLayoutEffect(() => {
    if (!isLetterOverlay || !chromeRevealed) {
      return;
    }
    setLetterRevealSettled(true);
  }, [chromeRevealed, isLetterOverlay, sceneId]);

  const handleSurfaceInteraction = useCallback(() => {
    if (!chromeRevealed) {
      revealChrome();
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
    !isLogLayout &&
    !hasVisualSequence &&
    !chromeRevealed &&
    (!needsSoundPrompt || soundPromptPhase === "playing");

  const showImmersiveSurfaceOverlay =
    isFullscreen &&
    !isLogLayout &&
    !hasVisualSequence &&
    !suppressImmersiveSurfaceOverlay;

  const showNarrativeDock =
    !isLogLayout &&
    !isLetterOverlay &&
    !hasVisualSequence &&
    chromeRevealed &&
    (!isFullscreen || Boolean(narrativeText.trim()) || Boolean(choicesSlot));

  const showLogBackgroundContinueLayer =
    !hasVisualSequence && isLogLayout && chromeRevealed;

  return (
    <div className="fixed inset-0 z-40 flex flex-col overflow-hidden bg-black font-serif text-stone-200 select-none">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <VnNarrativeBackgroundVisuals
          backgroundFadeDuration={backgroundFadeDuration}
          backgroundFocusPath={backgroundFocusPath}
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

      {hasVisualSequence && visualSequence && isVisualReady ? (
        <VnVisualSequenceLayer
          key={sceneId ?? visualSequence.frames[0]?.imageUrl}
          sequence={visualSequence}
          skipLabel={t.skipMemory}
          prefersReducedMotion={Boolean(prefersReducedMotion)}
          onComplete={onVisualSequenceEnded}
        />
      ) : null}

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

      {!hasVisualSequence && !isImmersive && chromeRevealed && (
        <div className="absolute top-0 inset-x-0 p-6 pt-12 flex justify-between items-start z-100 bg-linear-to-b from-black/90 via-black/40 to-transparent pb-32 pointer-events-none border-t-0 border-l-0 border-r-0 border-b-0">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-ember-500/90 uppercase tracking-[0.2em] text-[10px] font-bold">
              <MapPin size={12} className="text-ember-500" />
              <span>{t.currentLocation}</span>
            </div>
            <h1 className="text-4xl font-display text-white font-bold tracking-tight drop-shadow-2xl opacity-90 m-0">
              {locationName}
            </h1>
            <div className="h-px w-24 bg-linear-to-r from-ember-500/50 to-transparent mt-1" />
          </div>
        </div>
      )}

      {!hasVisualSequence && showVideoLoadingState ? (
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
      {!hasVisualSequence && isLetterOverlay ? (
        <>
          <VnLetterNarrativeLayer
            chromeRevealed={chromeRevealed}
            hasVisibleChoices={hasVisibleChoices}
            narrativeText={narrativeText}
            t={t}
            typedTextRef={typedTextRef}
            tokenStateByPayload={tokenStateByPayload}
            showTutorialTooltip={showTutorialTooltip}
            onDismissTutorialTooltip={onDismissTutorialTooltip}
            onNarrativeComplete={onNarrativeComplete}
            onSurfaceInteraction={handleSurfaceInteraction}
            onTokenClick={onTokenClick}
            onTokenEnter={onTokenEnter}
            onTokenLeave={onTokenLeave}
            onTypingChange={onTypingChange}
          />
          {chromeRevealed &&
          displayedLetterRevealSettled &&
          hasVisibleChoices &&
          choicesSlot &&
          !isTyping ? (
            <div
              className="absolute inset-x-0 bottom-0 z-120 px-4 pb-[calc(1.5rem+4rem+env(safe-area-inset-bottom))] sm:px-8 pointer-events-auto"
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              <div className="mx-auto w-full max-w-[44rem]">{choicesSlot}</div>
            </div>
          ) : null}
        </>
      ) : null}

      {!hasVisualSequence && isLogLayout && chromeRevealed && logState ? (
        <>
          {showLogBackgroundContinueLayer ? (
            <div
              className="absolute inset-x-0 top-0 bottom-[30vh] z-[145] cursor-pointer touch-manipulation"
              role="button"
              tabIndex={-1}
              aria-label="Continue narrative"
              onClick={handleSurfaceInteraction}
            />
          ) : null}
          <VnLogBottomSheet
            sceneGroupId={sceneGroupId ?? null}
            state={logState}
            snapshot={logSnapshot ?? null}
            playerProfile={playerProfile}
            parliamentPresetId={parliamentPresetId}
            typedTextRef={typedTextRef}
            choicesSlot={choicesSlot}
            onTypingChange={onTypingChange}
            onSegmentComplete={onNarrativeComplete}
            onSurfaceTap={handleSurfaceInteraction}
            onTokenClick={onTokenClick}
            onTokenEnter={onTokenEnter}
            onTokenLeave={onTokenLeave}
          />
        </>
      ) : null}
      <AnimatePresence initial={false}>
        {showNarrativeDock ? (
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

      {showImmersiveSurfaceOverlay ? (
        <div
          className="absolute inset-0 z-128 cursor-pointer touch-manipulation"
          onClick={handleSurfaceInteraction}
          aria-hidden="true"
        />
      ) : null}
    </div>
  );
};
