import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HIGH_PRIORITY_BACKGROUND_IMAGE_PROPS } from "./vnNarrativePanelConstants";
import type { VideoStatus } from "./vnNarrativePanel.types";

interface VnNarrativeBackgroundVisualsProps {
  backgroundFadeDuration: number;
  backgroundImageUrl?: string;
  backgroundVideoPosterUrl?: string;
  backgroundVideoUrl?: string;
  backgroundVisualKey: string;
  needsSoundPrompt: boolean;
  prefersReducedMotion: boolean;
  soundGateAwaitingChoice: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
  videoStatus: VideoStatus;
  videoUnmuted: boolean;
  onBackgroundImageError: () => void;
  onBackgroundImageLoad: (
    event: React.SyntheticEvent<HTMLImageElement>,
  ) => void;
  onPosterError: () => void;
  onPosterLoad: () => void;
  onVideoCanPlay: () => void;
  onVideoEnded: () => void;
  onVideoError: () => void;
  onVideoLoadedData: () => void;
  onVideoLoadStart: () => void;
  onVideoPlay: () => void;
}

export const VnNarrativeBackgroundVisuals = ({
  backgroundFadeDuration,
  backgroundImageUrl,
  backgroundVideoPosterUrl,
  backgroundVideoUrl,
  backgroundVisualKey,
  needsSoundPrompt,
  prefersReducedMotion,
  soundGateAwaitingChoice,
  videoRef,
  videoStatus,
  videoUnmuted,
  onBackgroundImageError,
  onBackgroundImageLoad,
  onPosterError,
  onPosterLoad,
  onVideoCanPlay,
  onVideoEnded,
  onVideoError,
  onVideoLoadedData,
  onVideoLoadStart,
  onVideoPlay,
}: VnNarrativeBackgroundVisualsProps) => (
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
              decoding="async"
              onLoad={onPosterLoad}
              onError={onPosterError}
            />
          )}

        {backgroundVideoUrl ? (
          <video
            ref={videoRef}
            className={[
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ease-out motion-reduce:transition-none",
              soundGateAwaitingChoice ||
              (videoStatus !== "ready" &&
                videoStatus !== "playing" &&
                videoStatus !== "ended")
                ? "opacity-0"
                : "opacity-100",
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
            onLoadStart={onVideoLoadStart}
            onLoadedData={onVideoLoadedData}
            onCanPlay={onVideoCanPlay}
            onError={onVideoError}
            onPlay={onVideoPlay}
            onEnded={onVideoEnded}
          />
        ) : backgroundImageUrl ? (
          <img
            src={backgroundImageUrl}
            className="absolute inset-0 h-full w-full object-cover brightness-[0.62] sepia-[0.16] contrast-[1.05]"
            alt="Background"
            decoding="async"
            {...HIGH_PRIORITY_BACKGROUND_IMAGE_PROPS}
            onLoad={onBackgroundImageLoad}
            onError={onBackgroundImageError}
          />
        ) : null}
      </motion.div>
    )}
  </AnimatePresence>
);
