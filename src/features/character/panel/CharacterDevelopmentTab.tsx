import { motion } from "framer-motion";
import { GameIcon } from "../../../shared/ui/icons/game-icons";
import {
  CharacterRadarChart,
  type CharacterRadarDatum,
} from "../ui/CharacterRadarChart";
import { C, CLIP_CARD, TAB_TRANSITION } from "./characterPanel.theme";
import type { PatronVoiceCard } from "./characterPanel.types";
import { toLocale } from "./characterPanel.utils";
import { SectionCard } from "./characterPanelPrimitives";

const roleLabelById = {
  method: "Method",
  compatibility: "Legacy",
} as const;

export const CharacterDevelopmentTab = ({
  patronVoiceCards,
  radarData,
}: {
  patronVoiceCards: PatronVoiceCard[];
  radarData: CharacterRadarDatum[];
}) => (
  <motion.div
    animate={{ opacity: 1, y: 0 }}
    className="space-y-4"
    exit={{ opacity: 0, y: -10 }}
    initial={{ opacity: 0, y: 10 }}
    key="development"
    transition={TAB_TRANSITION}
  >
    <SectionCard
      accent={C.amber}
      eyebrow="Development Diagram"
      title="Patron Voice Radar"
    >
      <CharacterRadarChart data={radarData} />
    </SectionCard>

    <SectionCard accent={C.crimson} eyebrow="Parliament" title="Patron Voices">
      <div className="grid gap-4 xl:grid-cols-2">
        {patronVoiceCards.map((voice) => (
          <article
            key={voice.voiceId}
            className="rounded-[1.2rem] border bg-[rgba(16,14,12,0.68)] p-5 shadow-[0_18px_55px_rgba(0,0,0,0.28)]"
            data-testid={`patron-voice-${voice.voiceId}`}
            style={{
              borderColor: `${voice.palette.accent}30`,
              boxShadow: `0 18px 55px rgba(0,0,0,0.28), 0 0 32px ${voice.palette.glow}`,
              clipPath: CLIP_CARD,
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-[0.9rem] border"
                  style={{
                    borderColor: `${voice.palette.accent}55`,
                    backgroundColor: voice.palette.accentSoft,
                  }}
                >
                  <GameIcon
                    name={voice.iconName}
                    size={24}
                    style={{ color: voice.palette.accent }}
                  />
                </span>
                <div>
                  <p
                    className="text-[10px] uppercase tracking-[0.3em]"
                    style={{
                      color: voice.palette.accent,
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {`Rank ${voice.dominanceRank}`}
                  </p>
                  <h3 className="mt-1 text-xl font-semibold text-stone-100">
                    {voice.label}
                  </h3>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                    {`Voice rank ${voice.voiceRank}`}
                  </p>
                </div>
              </div>
              <strong
                className="text-3xl font-black"
                style={{
                  color: voice.palette.accent,
                  fontFamily: "var(--font-display)",
                }}
              >
                {toLocale(voice.influence)}
              </strong>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-stone-300">
              {voice.worldview}
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.24em] text-stone-500">
              {voice.toneDescriptor}
            </p>

            <div className="mt-5 space-y-2">
              {voice.methods.map((method) => (
                <div
                  key={method.id}
                  className="grid gap-3 rounded-[0.95rem] border border-white/8 bg-black/20 px-3 py-3 sm:grid-cols-[minmax(0,1fr)_auto]"
                  data-testid={`method-voice-${method.id}`}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <GameIcon
                      name={method.iconName}
                      size={18}
                      style={{ color: voice.palette.accent }}
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-stone-100">
                          {method.labelRu}
                        </span>
                        <span
                          className="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.22em]"
                          style={{
                            borderColor: `${voice.palette.accent}35`,
                            color: voice.palette.accent,
                            backgroundColor: `${voice.palette.accent}12`,
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          {roleLabelById[method.progressionRole]}
                        </span>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-stone-500">
                        {method.descriptionRu}
                      </p>
                      {method.unlockedPerks.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {method.unlockedPerks.map((perk) => (
                            <span
                              key={perk.id}
                              className="rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]"
                              style={{
                                borderColor: `${voice.palette.accent}32`,
                                color: voice.palette.text,
                                backgroundColor: `${voice.palette.accent}10`,
                              }}
                              title={perk.description}
                            >
                              {perk.title}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      {method.nextPerk ? (
                        <p className="mt-2 text-[11px] leading-relaxed text-stone-500">
                          Next perk:{" "}
                          <span
                            className="font-semibold"
                            style={{ color: voice.palette.accent }}
                          >
                            {method.nextPerk.title}
                          </span>
                        </p>
                      ) : (
                        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                          Mastered perk track
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="min-w-[8.5rem] self-start sm:text-right">
                    <div className="flex items-center gap-2 sm:justify-end">
                      <span
                        className="flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-sm font-black"
                        style={{
                          borderColor: `${voice.palette.accent}45`,
                          color: voice.palette.accent,
                          backgroundColor: `${voice.palette.accent}14`,
                          fontFamily: "var(--font-display)",
                        }}
                      >
                        {method.rankState.rank}
                      </span>
                      <span className="text-xs font-medium text-stone-300">
                        {method.rankState.progress} /{" "}
                        {method.rankState.progressMax}
                      </span>
                    </div>
                    <div
                      aria-label={`${method.label} rank progress`}
                      aria-valuemax={method.rankState.progressMax}
                      aria-valuemin={0}
                      aria-valuenow={method.rankState.progress}
                      className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"
                      role="progressbar"
                    >
                      <span
                        className="block h-full rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (method.rankState.progress /
                              method.rankState.progressMax) *
                              100,
                          )}%`,
                          backgroundColor: voice.palette.accent,
                        }}
                      />
                    </div>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-stone-500">
                      {toLocale(method.rankState.totalXp)} XP
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </SectionCard>
  </motion.div>
);
