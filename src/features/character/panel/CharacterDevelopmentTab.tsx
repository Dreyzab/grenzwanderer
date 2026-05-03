import { motion } from "framer-motion";
import type { getCharacterStrings } from "../../i18n/uiStrings";
import { GameIcon } from "../../../shared/ui/icons/game-icons";
import {
  CharacterRadarChart,
  type CharacterRadarDatum,
} from "../ui/CharacterRadarChart";
import { C, CLIP_CARD, TAB_TRANSITION } from "./characterPanel.theme";
import type {
  AttributeVoiceBridgeSummary,
  CharacterAttributeCard,
  CharacterVoiceBridgeRegistryEntry,
} from "./characterPanel.types";
import { toLocale } from "./characterPanel.utils";
import { InfoBlock, SectionCard } from "./characterPanelPrimitives";

export const CharacterDevelopmentTab = ({
  attributes,
  primaryVoiceBridgeEntries,
  radarData,
  secondaryVoiceBridgeEntries,
  t,
}: {
  attributes: CharacterAttributeCard[];
  primaryVoiceBridgeEntries: CharacterVoiceBridgeRegistryEntry[];
  radarData: CharacterRadarDatum[];
  secondaryVoiceBridgeEntries: Array<{
    accent: string;
    sourceLabel: string;
    currentValue: number;
    bridge: AttributeVoiceBridgeSummary;
  }>;
  t: ReturnType<typeof getCharacterStrings>;
}) => (
  <motion.div
    animate={{ opacity: 1, y: 0 }}
    className="space-y-4"
    exit={{ opacity: 0, y: -10 }}
    initial={{ opacity: 0, y: 10 }}
    key="development"
    transition={TAB_TRANSITION}
  >
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_320px]">
      <SectionCard
        accent={C.amber}
        eyebrow="Development Diagram"
        title="Core Characteristic Radar"
      >
        <div className="space-y-4">
          <p className="max-w-2xl text-sm leading-relaxed text-stone-400">
            The radar shows the six primary characteristics only. Specialized
            branches stay nested under their parent traits so the screen keeps a
            clear hierarchy.
          </p>
          <CharacterRadarChart data={radarData} />
        </div>
      </SectionCard>

      <SectionCard
        accent={C.brass}
        eyebrow="Structure"
        title="Core vs Specialized"
      >
        <div className="space-y-3 text-sm text-stone-300">
          <p className="leading-relaxed text-stone-400">
            Core characteristics define the overall investigative profile.
            Specialized attributes remain attached to their parent domain rather
            than becoming a detached second stat layer.
          </p>
          <div className="grid gap-2">
            {attributes.map((attribute) => (
              <div
                key={attribute.key}
                className="flex items-center justify-between rounded-[0.9rem] border border-white/8 bg-black/20 px-3 py-2"
              >
                <span className="flex items-center gap-2 text-sm text-stone-200">
                  <GameIcon
                    name={attribute.icon}
                    size={18}
                    style={{ color: attribute.accent }}
                  />
                  {attribute.label}
                </span>
                <strong style={{ color: attribute.accent }}>
                  {toLocale(attribute.value)}
                </strong>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>
    </div>

    <SectionCard
      accent={C.crimson}
      eyebrow="Voice Bridge"
      title="Legacy Attributes -> Canonical Voices"
    >
      <div className="space-y-4">
        <p className="max-w-3xl text-sm leading-relaxed text-stone-400">
          AI prompts and passive voice presentation now normalize legacy runtime
          attributes into the canon Inner Parliament registry. The first-wave
          lore masks below are the prompt source of truth for the player's
          voice-driven reads.
        </p>

        {primaryVoiceBridgeEntries.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-3">
            {primaryVoiceBridgeEntries.map((entry) => (
              <article
                key={entry.bridge.canonicalVoiceId}
                className="rounded-[1rem] border border-white/8 bg-black/20 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-[0.9rem] border"
                      style={{
                        borderColor: `${entry.accent}55`,
                        backgroundColor: `${entry.accent}14`,
                      }}
                    >
                      <GameIcon
                        name={entry.bridge.iconName}
                        size={22}
                        style={{ color: entry.accent }}
                      />
                    </span>
                    <div>
                      <p
                        className="text-[10px] uppercase tracking-[0.3em]"
                        style={{
                          color: entry.accent,
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {entry.bridge.promptProfile.department}
                      </p>
                      <h4 className="mt-1 text-lg font-semibold text-stone-100">
                        {entry.bridge.canonicalLabel}
                      </h4>
                    </div>
                  </div>
                  <strong
                    className="text-2xl font-black"
                    style={{
                      color: entry.accent,
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    {toLocale(entry.currentValue)}
                  </strong>
                </div>

                <p
                  className="mt-3 text-[10px] uppercase tracking-[0.28em]"
                  style={{ color: C.slate, fontFamily: "var(--font-mono)" }}
                >
                  {`${entry.bridge.legacyVoiceId} -> ${entry.bridge.canonicalVoiceId}`}
                </p>
                <blockquote className="mt-3 border-l-2 border-white/10 pl-3 text-sm italic text-stone-200">
                  "{entry.bridge.promptProfile.motto}"
                </blockquote>
                <p className="mt-3 text-sm leading-relaxed text-stone-300">
                  {entry.bridge.promptProfile.manners}
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <InfoBlock
                    label="Speech"
                    value={entry.bridge.promptProfile.speechPattern}
                  />
                  <InfoBlock
                    label="Vocabulary"
                    value={entry.bridge.promptProfile.vocabulary}
                  />
                </div>
                <p className="mt-3 text-sm leading-relaxed text-stone-400">
                  {entry.bridge.promptProfile.philosophy}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-stone-500">
                  Blind spot: {entry.bridge.promptProfile.blindSpot}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-stone-500">
                  Stress pattern: {entry.bridge.promptProfile.stressPattern}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {entry.bridge.promptProfile.checkRoles.map((role) => (
                    <span
                      key={role}
                      className="rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.24em]"
                      style={{
                        borderColor: `${entry.accent}44`,
                        color: entry.accent,
                        backgroundColor: `${entry.accent}12`,
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {role.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-stone-500">
            No canonical voice bridges are active for the current character.
          </p>
        )}

        {secondaryVoiceBridgeEntries.length > 0 ? (
          <div className="space-y-2">
            <p
              className="text-[10px] uppercase tracking-[0.3em]"
              style={{ color: C.slate, fontFamily: "var(--font-mono)" }}
            >
              Additional normalized branches
            </p>
            <div className="flex flex-wrap gap-2">
              {secondaryVoiceBridgeEntries.map((entry) => (
                <span
                  key={entry.bridge.legacyVoiceId}
                  className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-black/20 px-3 py-1.5 text-xs text-stone-300"
                >
                  <GameIcon
                    name={entry.bridge.iconName}
                    size={14}
                    style={{ color: entry.accent || C.slate }}
                  />
                  {`${entry.bridge.legacyVoiceId} -> ${entry.bridge.canonicalLabel} (${toLocale(entry.currentValue)})`}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </SectionCard>

    <div className="grid gap-4 xl:grid-cols-2">
      {attributes.map((attribute) => (
        <article
          key={attribute.key}
          className="rounded-[1.2rem] border border-white/8 bg-[rgba(16,14,12,0.68)] p-5 shadow-[0_18px_55px_rgba(0,0,0,0.28)]"
          data-testid={`core-attr-${attribute.key}`}
          style={{ clipPath: CLIP_CARD }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span
                className="flex h-11 w-11 items-center justify-center rounded-[0.9rem] border"
                style={{
                  borderColor: `${attribute.accent}55`,
                  backgroundColor: `${attribute.accent}14`,
                }}
              >
                <GameIcon
                  name={attribute.icon}
                  size={22}
                  style={{ color: attribute.accent }}
                />
              </span>
              <div>
                <p
                  className="text-[10px] uppercase tracking-[0.3em]"
                  style={{
                    color: attribute.accent,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  Core Characteristic
                </p>
                <h3 className="mt-1 text-xl font-semibold text-stone-100">
                  {attribute.label}
                </h3>
              </div>
            </div>
            <strong
              className="text-3xl font-black"
              style={{
                color: attribute.accent,
                fontFamily: "var(--font-display)",
              }}
            >
              {toLocale(attribute.value)}
            </strong>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-stone-400">
            {attribute.description}
          </p>

          {attribute.voiceBridge ? (
            <div className="mt-4 rounded-[1rem] border border-white/8 bg-black/20 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-stone-200">
                  <GameIcon
                    name={attribute.voiceBridge.iconName}
                    size={16}
                    style={{ color: attribute.accent }}
                  />
                  <strong>{attribute.voiceBridge.canonicalLabel}</strong>
                </div>
                <span
                  className="text-[10px] uppercase tracking-[0.3em]"
                  style={{
                    color: attribute.accent,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  Voice Bridge
                </span>
              </div>
              <p className="mt-2 text-xs uppercase tracking-[0.24em] text-stone-500">
                {`${attribute.voiceBridge.legacyVoiceId} -> ${attribute.voiceBridge.canonicalVoiceId}`}
              </p>
              {attribute.voiceBridge.promptProfile ? (
                <>
                  <p className="mt-2 text-sm leading-relaxed text-stone-300">
                    {attribute.voiceBridge.promptProfile.motto}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-stone-500">
                    {attribute.voiceBridge.promptProfile.speechPattern};{" "}
                    {attribute.voiceBridge.promptProfile.vocabulary}
                  </p>
                </>
              ) : null}
            </div>
          ) : null}

          {attribute.specialized.length > 0 ? (
            <div className="mt-5 space-y-2">
              <p
                className="text-[10px] uppercase tracking-[0.3em]"
                style={{ color: C.slate, fontFamily: "var(--font-mono)" }}
              >
                Specialized Focus
              </p>
              {attribute.specialized.map((specialized) => (
                <div
                  key={specialized.key}
                  className="flex items-center justify-between rounded-[0.95rem] border border-white/8 bg-black/20 px-3 py-2.5"
                >
                  <div className="flex items-center gap-3">
                    <GameIcon
                      name={specialized.icon}
                      size={18}
                      style={{ color: specialized.accent }}
                    />
                    <div>
                      <div className="text-sm font-medium text-stone-100">
                        {specialized.label}
                      </div>
                      <div className="text-xs text-stone-500">
                        {specialized.description}
                      </div>
                      {specialized.voiceBridge ? (
                        <div className="mt-1 text-[11px] text-stone-400">
                          {`Canonical voice: ${specialized.voiceBridge.canonicalLabel}`}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <strong
                    className="text-lg"
                    style={{ color: specialized.accent }}
                  >
                    {toLocale(specialized.value)}
                  </strong>
                </div>
              ))}
            </div>
          ) : null}
        </article>
      ))}
    </div>
  </motion.div>
);
