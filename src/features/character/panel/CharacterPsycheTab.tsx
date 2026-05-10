import { motion } from "framer-motion";
import {
  INNER_VOICE_DEFINITIONS,
  INNER_VOICE_IDS,
} from "../../../../data/innerVoiceContract";
import type { getCharacterStrings } from "../../i18n/uiStrings";
import type { PsycheProfileData } from "../psycheProfile";
import { C, TAB_TRANSITION } from "./characterPanel.theme";
import { InfoBlock, MetricBox, SectionCard } from "./characterPanelPrimitives";

export const CharacterPsycheTab = ({
  profile,
  t,
}: {
  profile: PsycheProfileData;
  t: ReturnType<typeof getCharacterStrings>;
}) => {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
      exit={{ opacity: 0, y: -10 }}
      initial={{ opacity: 0, y: 10 }}
      key="psyche"
      transition={TAB_TRANSITION}
    >
      <SectionCard
        accent={C.amber}
        eyebrow="Inner Compass 2.0"
        title={profile.innerCompass.quadrantLabel}
      >
        <div className="space-y-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_1fr]">
            <div className="flex items-center justify-center p-4">
              <div
                className="relative aspect-square w-full max-w-[400px] rounded-[1.5rem] border border-white/10 bg-black/25"
                data-testid="inner-compass"
              >
                <div className="absolute left-4 top-3 text-[10px] uppercase tracking-[0.24em] text-stone-500">
                  Individualist
                </div>
                <div className="absolute right-4 top-3 text-[10px] uppercase tracking-[0.24em] text-stone-500">
                  Collective
                </div>
                <div className="absolute bottom-3 left-4 text-[10px] uppercase tracking-[0.24em] text-stone-500">
                  Machiavellian
                </div>
                <div className="absolute bottom-3 right-4 text-[10px] uppercase tracking-[0.24em] text-stone-500">
                  Altruist
                </div>

                <svg
                  viewBox="0 0 100 100"
                  className="absolute inset-0 h-full w-full overflow-visible p-8"
                >
                  {/* Grid Lines */}
                  <line
                    x1="50"
                    y1="0"
                    x2="50"
                    y2="100"
                    stroke="rgba(255,255,255,0.08)"
                    strokeDasharray="2,2"
                  />
                  <line
                    x1="0"
                    y1="50"
                    x2="100"
                    y2="50"
                    stroke="rgba(255,255,255,0.08)"
                    strokeDasharray="2,2"
                  />

                  {/* Patron Voices */}
                  {INNER_VOICE_IDS.map((voiceId) => {
                    const def = INNER_VOICE_DEFINITIONS[voiceId];
                    const cx = (def.homePoint.x + 100) / 2;
                    const cy = 100 - (def.homePoint.y + 100) / 2;

                    const activeVoice = profile.innerCompass.voices.find(
                      (v) => v.voiceId === voiceId,
                    );
                    const isActive = !!activeVoice;

                    return (
                      <g key={voiceId} transform={`translate(${cx}, ${cy})`}>
                        <circle
                          r={isActive ? 2.5 : 1.5}
                          fill={def.palette.accent}
                          opacity={isActive ? 1 : 0.25}
                        />
                        {isActive && (
                          <circle
                            r={5}
                            fill="none"
                            stroke={def.palette.accent}
                            strokeWidth={0.5}
                            opacity={0.6}
                          />
                        )}
                        <text
                          y={-4.5}
                          textAnchor="middle"
                          fill={
                            isActive
                              ? def.palette.text
                              : "rgba(255,255,255,0.3)"
                          }
                          fontSize="2.8"
                          fontFamily="var(--font-mono)"
                          className="uppercase tracking-widest"
                          style={{
                            filter: isActive
                              ? `drop-shadow(0 0 4px ${def.palette.accent})`
                              : "none",
                          }}
                        >
                          {def.label}
                        </text>
                      </g>
                    );
                  })}

                  {/* Player Position */}
                  <circle
                    cx={profile.innerCompass.axisXPercent}
                    cy={100 - profile.innerCompass.axisYPercent}
                    r="2.5"
                    fill={C.amber}
                    stroke="rgba(0,0,0,0.8)"
                    strokeWidth="0.5"
                    className="shadow-[0_0_18px_rgba(212,167,79,0.8)]"
                  />
                </svg>
              </div>
            </div>

            <div className="flex flex-col justify-center space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <InfoBlock
                  label="Axis X"
                  value={profile.innerCompass.axisXLabel}
                />
                <InfoBlock
                  label="Axis Y"
                  value={profile.innerCompass.axisYLabel}
                />
                <InfoBlock
                  className="sm:col-span-2 lg:col-span-1 xl:col-span-2"
                  label="Approach"
                  value={profile.innerCompass.approachLabel}
                />
              </div>

              <div className="rounded-[1rem] border border-white/8 bg-black/20 px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <strong className="text-stone-100">Approach Drift</strong>
                  <span
                    className="text-[10px] uppercase tracking-[0.3em]"
                    style={{ color: C.amber, fontFamily: "var(--font-mono)" }}
                  >
                    {profile.innerCompass.approachLabel}
                  </span>
                </div>
                <div className="mt-4 h-2.5 overflow-hidden rounded-full border border-white/8 bg-black/40">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-500 via-amber-400 to-emerald-400"
                    style={{
                      width: `${profile.innerCompass.approachPercent}%`,
                    }}
                  />
                </div>
                <p className="mt-4 text-xs leading-relaxed text-stone-400">
                  The approach vector determines whether you act preemptively or
                  wait for the board to change. Your current moral vector is
                  calculated via coordinate proximity.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {profile.innerCompass.voices.map((voice) => (
              <div
                key={`${voice.role}-${voice.voiceId}`}
                className="flex flex-col justify-between rounded-[1rem] border border-white/5 bg-black/20 p-5 shadow-sm"
                style={{
                  boxShadow: `0 0 30px ${voice.accent}0A inset`,
                  borderColor: `${voice.accent}30`,
                }}
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <strong
                      className="text-base font-medium"
                      style={{ color: voice.accent }}
                    >
                      {voice.label}
                    </strong>
                    <span
                      className="rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.3em]"
                      style={{
                        color: voice.accent,
                        borderColor: `${voice.accent}40`,
                        backgroundColor: `${voice.accent}10`,
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {voice.role}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span
                      className="rounded-sm px-1.5 py-0.5 text-[9px] uppercase tracking-[0.2em]"
                      style={{
                        backgroundColor:
                          voice.stance === "supports"
                            ? "rgba(52, 211, 153, 0.15)"
                            : "rgba(248, 113, 113, 0.15)",
                        color:
                          voice.stance === "supports" ? "#34d399" : "#f87171",
                      }}
                    >
                      {voice.stance}
                    </span>
                    <span className="text-[10px] text-stone-500 uppercase tracking-widest font-mono">
                      Resonance: {(voice.resonance * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-stone-200">
                    "{voice.reasoning}"
                  </p>
                </div>
                <div className="mt-6 border-t border-white/5 pt-4">
                  <p className="text-xs leading-relaxed text-stone-400">
                    <span className="mb-1.5 block text-[9px] uppercase tracking-[0.2em] text-stone-500">
                      Worldview
                    </span>
                    {voice.worldview}
                  </p>
                  <p className="mt-2 text-[10px] uppercase tracking-[0.24em] text-stone-600">
                    {voice.toneDescriptor}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_300px]">
        <SectionCard
          accent={C.crimson}
          eyebrow="Alignment"
          title={profile.alignment.label}
        >
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-stone-300">
              {profile.alignment.description}
            </p>
            <div className="space-y-3">
              {profile.factionSignals.map((signal) => (
                <div key={signal.factionId} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-stone-200">{signal.label}</span>
                    <strong style={{ color: signal.color }}>
                      {signal.stateLabel}
                    </strong>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full border border-white/8 bg-black/20">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${signal.intensityPercent}%`,
                        backgroundColor: `${signal.color}99`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-stone-500">{signal.trendLabel}</p>
                  {signal.provenanceNote ? (
                    <p className="text-[11px] leading-relaxed text-stone-500">
                      {signal.provenanceNote}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        <SectionCard
          accent={C.brass}
          eyebrow="Field Check Reliability"
          title="Check Snapshot"
        >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <MetricBox
              label="Passed"
              tone="success"
              value={profile.checks.passed}
            />
            <MetricBox
              label="Failed"
              tone="danger"
              value={profile.checks.failed}
            />
            <MetricBox
              label="Locked"
              tone="neutral"
              value={profile.checks.locked}
            />
            <MetricBox
              label="Confidence"
              tone="warning"
              value={`${profile.checks.confidencePercent}%`}
            />
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_300px]">
        <SectionCard
          accent={C.amber}
          eyebrow="Awakening"
          title={profile.mysticism.bandLabel}
        >
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-stone-300">
              {profile.mysticism.bandDescription}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <MetricBox
                label="Awakening"
                tone="warning"
                value={`${profile.mysticism.awakeningLevel}/100`}
              />
              <MetricBox
                label="Rationalism"
                tone="neutral"
                value={`${profile.mysticism.rationalism}/100`}
              />
              <MetricBox
                label="Exposure"
                tone="danger"
                value={profile.mysticism.mysticExposure}
              />
              <MetricBox
                label="Sight Mode"
                tone="success"
                value={profile.mysticism.sightModeLabel}
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard
          accent={C.crimson}
          eyebrow="Counterweight"
          title="Rational Buffer"
        >
          <div className="space-y-3 text-sm text-stone-300">
            <p className="leading-relaxed text-stone-400">
              Rationalist choices do not erase anomalies. They absorb part of
              incoming awakening pressure and keep the investigative frame
              stable long enough for a grounded interpretation.
            </p>
            <MetricBox
              label="Buffer"
              tone="neutral"
              value={profile.mysticism.rationalistBuffer}
            />
            <p className="leading-relaxed text-stone-500">
              Active mode: {profile.mysticism.sightModeLabel}. Higher sight
              modes inherit lower visibility layers, but never replace
              evidence-first play.
            </p>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard
          accent={C.crimson}
          eyebrow="Secrets"
          title="Knowledge Registry"
        >
          <div className="space-y-3">
            {profile.secrets.map((secret) => (
              <div
                key={secret.id}
                className="rounded-[1rem] border px-4 py-3"
                style={{
                  borderColor: secret.unlocked
                    ? "rgba(52, 211, 153, 0.25)"
                    : "rgba(255, 255, 255, 0.08)",
                  backgroundColor: secret.unlocked
                    ? "rgba(6, 78, 59, 0.18)"
                    : "rgba(0, 0, 0, 0.16)",
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <strong
                    className={
                      secret.unlocked ? "text-emerald-100" : "text-stone-300"
                    }
                  >
                    {secret.unlocked ? secret.title : "Classified Entry"}
                  </strong>
                  <span
                    className="text-[10px] uppercase tracking-[0.3em]"
                    style={{
                      color: secret.unlocked ? "#86efac" : "#8A97A8",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {secret.unlocked ? "Unlocked" : "Locked"}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-stone-400">
                  {secret.unlocked
                    ? "This file is now available in your active knowledge registry."
                    : secret.hint}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          accent={C.brass}
          eyebrow="Evolution"
          title="Long Arc Tracks"
        >
          <div className="space-y-3">
            {profile.evolutionTracks.map((track) => (
              <div
                key={track.id}
                className="rounded-[1rem] border border-white/8 bg-black/20 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <strong className="text-stone-200">{track.title}</strong>
                  <span
                    className="text-[10px] uppercase tracking-[0.3em]"
                    style={{ color: C.amber, fontFamily: "var(--font-mono)" }}
                  >
                    {track.progressPercent}%
                  </span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full border border-white/8 bg-black/25">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-700 via-amber-500 to-amber-300"
                    style={{ width: `${track.progressPercent}%` }}
                  />
                </div>
                <p className="mt-3 text-sm leading-relaxed text-stone-400">
                  {track.note}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </motion.div>
  );
};
