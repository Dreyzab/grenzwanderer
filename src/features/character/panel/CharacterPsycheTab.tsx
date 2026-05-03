import { motion } from "framer-motion";
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
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_300px]">
        <SectionCard
          accent={C.amber}
          eyebrow="Inner Compass"
          title={profile.innerCompass.quadrantLabel}
        >
          <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div className="flex items-center justify-center">
              <div
                className="relative h-[220px] w-[220px] rounded-[1.2rem] border border-white/10 bg-black/25"
                data-testid="inner-compass"
              >
                <div className="absolute inset-x-4 top-1/2 h-px -translate-y-1/2 bg-white/12" />
                <div className="absolute inset-y-4 left-1/2 w-px -translate-x-1/2 bg-white/12" />
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
                <div
                  className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber-100 shadow-[0_0_18px_rgba(212,167,79,0.5)]"
                  style={{
                    left: `${profile.innerCompass.axisXPercent}%`,
                    top: `${100 - profile.innerCompass.axisYPercent}%`,
                    backgroundColor: C.amber,
                  }}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <InfoBlock
                  label="Axis X"
                  value={profile.innerCompass.axisXLabel}
                />
                <InfoBlock
                  label="Axis Y"
                  value={profile.innerCompass.axisYLabel}
                />
                <InfoBlock
                  label="Approach"
                  value={profile.innerCompass.approachLabel}
                />
              </div>

              <div className="rounded-[1rem] border border-white/8 bg-black/20 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <strong className="text-stone-100">Approach Drift</strong>
                  <span
                    className="text-[10px] uppercase tracking-[0.3em]"
                    style={{ color: C.amber, fontFamily: "var(--font-mono)" }}
                  >
                    {profile.innerCompass.approachLabel}
                  </span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full border border-white/8 bg-black/25">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-500 via-amber-400 to-emerald-400"
                    style={{
                      width: `${profile.innerCompass.approachPercent}%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                {profile.innerCompass.voices.map((voice) => (
                  <div
                    key={`${voice.role}-${voice.voiceId}`}
                    className="rounded-[1rem] border border-white/8 bg-black/20 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <strong
                        className="text-stone-100"
                        style={{ color: voice.accent }}
                      >
                        {voice.label}
                      </strong>
                      <span
                        className="text-[10px] uppercase tracking-[0.3em]"
                        style={{
                          color: voice.accent,
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {voice.role}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-stone-300">
                      {voice.worldview}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.24em] text-stone-500">
                      {voice.toneDescriptor}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          accent={C.brass}
          eyebrow="Field Check Reliability"
          title="Check Snapshot"
        >
          <div className="grid gap-3 sm:grid-cols-2">
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
          eyebrow="Inner Balance"
          title={profile.innerCompass.approachLabel}
        >
          <div className="space-y-4 text-sm text-stone-300">
            <p className="leading-relaxed text-stone-400">
              Your current moral vector is described qualitatively rather than
              numerically. The compass shows direction, not a score to min-max.
            </p>
            <div className="grid gap-3">
              <InfoBlock
                label="Dominant Voice"
                value={profile.innerCompass.voices[0]?.label ?? "Quiet"}
              />
              <InfoBlock
                label="Support Voice"
                value={profile.innerCompass.voices[1]?.label ?? "None"}
              />
              <InfoBlock
                label="Counter Voice"
                value={profile.innerCompass.voices[2]?.label ?? "None"}
              />
            </div>
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
