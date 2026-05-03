import { motion } from "framer-motion";
import type { VnStrings } from "../../features/i18n/uiStrings";
import type { SoundPromptPhase } from "./vnNarrativePanel.types";

interface VnFilmSoundPromptOverlayProps {
  allowSoundPromptChrome: boolean;
  backgroundVideoUrl?: string;
  sceneId?: string;
  showSoundPromptSpinner: boolean;
  soundGateAwaitingChoice: boolean;
  soundPromptPhase: SoundPromptPhase;
  t: VnStrings;
  onSoundAllow: () => void;
  onSoundDeny: () => void;
}

export const VnFilmSoundPromptOverlay = ({
  allowSoundPromptChrome,
  backgroundVideoUrl,
  sceneId,
  showSoundPromptSpinner,
  soundGateAwaitingChoice,
  soundPromptPhase,
  t,
  onSoundAllow,
  onSoundDeny,
}: VnFilmSoundPromptOverlayProps) => (
  <>
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
              onClick={onSoundAllow}
            >
              {t.enableSound}
            </button>
            <button
              type="button"
              className="flex-1 rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              onClick={onSoundDeny}
            >
              {t.withoutSound}
            </button>
          </div>
        </motion.div>
      </div>
    ) : null}
  </>
);
