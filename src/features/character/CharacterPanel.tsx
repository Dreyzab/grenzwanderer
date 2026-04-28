import { type ReactNode, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpenText,
  Brain,
  FileText,
  Fingerprint,
  type LucideIcon,
} from "lucide-react";
import { useTable } from "spacetimedb/react";
import {
  canonicalSkillVoiceIdFor,
  getCanonicalVoiceLabel,
  getCanonicalVoicePromptProfile,
  type CanonicalVoicePromptProfile,
} from "../../../data/voiceBridge";
import { usePlayerFlags } from "../../entities/player/hooks/usePlayerFlags";
import { usePlayerVars } from "../../entities/player/hooks/usePlayerVars";
import { ENABLE_DEBUG_CONTENT_SEED } from "../../config";
import {
  getAgencyStandingPresentation,
  getCareerRankLabel,
  getFactionCatalogForUi,
  getFavorPresentation,
  getRevealedFactionState,
  getTrendLabel,
  getTrustBandPresentation,
  isNpcIdentityRevealed,
} from "../../shared/game/socialPresentation";
import { useUiLanguage } from "../../shared/hooks/useUiLanguage";
import { tables } from "../../shared/spacetime/bindings";
import { useIdentity } from "../../shared/spacetime/useIdentity";
import { GameIcon } from "../../shared/ui/icons/game-icons";
import { getCharacterStrings } from "../i18n/uiStrings";
import {
  buildEntityKnowledge,
  formatObservationKindLabel,
  resolveUnlockedObservationEntries,
} from "../mysticism/model/mysticism";
import { parseSnapshot } from "../vn/vnContent";
import {
  CORE_CHARACTERISTICS,
  SPECIALIZED_BY_CORE,
  type CharacterAttributeDefinition,
  type CharacterTabId,
} from "./characterScreenModel";
import {
  getOriginProfileByFlags,
  getSelectedOriginTrack,
  type OriginProfileDefinition,
  type OriginTrackDefinition,
} from "./originProfiles";
import { buildPsycheProfile, type PsycheProfileData } from "./psycheProfile";
import {
  CharacterRadarChart,
  type CharacterRadarDatum,
} from "./ui/CharacterRadarChart";

const C = {
  coal: "#0E0D0B",
  ink: "#171614",
  bone: "#F2E9D8",
  crimson: "#A61C2F",
  brass: "#B5852B",
  amber: "#D4A74F",
  slate: "#8A97A8",
} as const;

const CLIP_CARD =
  "polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))";
const CLIP_PANEL =
  "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))";

const TAB_TRANSITION = { duration: 0.24, ease: "easeOut" as const };

// Tabs are now defined within the component to support localization

interface CharacterQuestJournalEntry {
  id: string;
  title: string;
  currentStage: number;
  activeStage?: {
    title: string;
    objectiveHint: string;
    objectivePointIds?: string[];
  };
  status: "Completed" | "In progress" | "Not started";
}

interface CharacterObservationEntry {
  id: string;
  kind: string;
  title: string;
  text: string;
  rationalInterpretation?: string;
  entityArchetypeId?: string;
}

interface CharacterContactEntry {
  id: string;
  displayName: string;
  publicRole: string;
  relationshipStatus: string;
  relationshipTone: "danger" | "warning" | "neutral" | "success" | "highlight";
  favorState: string;
  favorTone: "danger" | "warning" | "neutral" | "success" | "highlight";
  services: string[];
}

interface AgencyCareerSummary {
  rankLabel: string;
  standingLabel: string;
  standingTone: "danger" | "warning" | "neutral" | "success" | "highlight";
  trendLabel: string;
  criteriaSummary: string;
}

interface AttributeVoiceBridgeSummary {
  legacyVoiceId: string;
  canonicalVoiceId: string;
  canonicalLabel: string;
  iconName: string;
  promptProfile: CanonicalVoicePromptProfile | null;
}

interface CharacterSpecializedAttributeCard extends CharacterAttributeDefinition {
  value: number;
  voiceBridge: AttributeVoiceBridgeSummary | null;
}

interface CharacterAttributeCard extends CharacterAttributeDefinition {
  value: number;
  voiceBridge: AttributeVoiceBridgeSummary | null;
  specialized: CharacterSpecializedAttributeCard[];
}

interface CharacterVoiceBridgeRegistryEntry {
  sourceLabel: string;
  currentValue: number;
  accent: string;
  bridge: AttributeVoiceBridgeSummary & {
    promptProfile: CanonicalVoicePromptProfile;
  };
}

interface SectionCardProps {
  eyebrow: string;
  title: string;
  accent?: string;
  children: ReactNode;
  className?: string;
}

const toLocale = (value: number): string =>
  Number.isInteger(value) ? value.toString() : value.toFixed(2);

const normalizeNumber = (value: number | bigint): number =>
  typeof value === "bigint" ? Number(value) : value;

const unwrapOptionalString = (value: unknown): string | null => {
  if (typeof value === "string") {
    return value;
  }

  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === "object" && value !== null && "tag" in value) {
    const tagged = value as { tag?: string; value?: unknown };
    if (tagged.tag === "some" && typeof tagged.value === "string") {
      return tagged.value;
    }
  }

  return null;
};

const getGenderLabel = (
  gender: OriginProfileDefinition["dossier"]["gender"],
): string => (gender === "female" ? "F" : "M");

const getStatusTone = (status: CharacterQuestJournalEntry["status"]) => {
  if (status === "Completed") {
    return {
      borderColor: "rgba(52, 211, 153, 0.35)",
      color: "#86efac",
      backgroundColor: "rgba(6, 78, 59, 0.18)",
    };
  }

  if (status === "In progress") {
    return {
      borderColor: "rgba(212, 167, 79, 0.35)",
      color: "#fcd34d",
      backgroundColor: "rgba(120, 53, 15, 0.18)",
    };
  }

  return {
    borderColor: "rgba(138, 151, 168, 0.22)",
    color: "#cbd5e1",
    backgroundColor: "rgba(23, 22, 20, 0.3)",
  };
};

const getSocialTone = (
  tone: CharacterContactEntry["relationshipTone"],
): { borderColor: string; color: string; backgroundColor: string } => {
  if (tone === "highlight") {
    return {
      borderColor: "rgba(212, 167, 79, 0.34)",
      color: "#fcd34d",
      backgroundColor: "rgba(120, 53, 15, 0.18)",
    };
  }
  if (tone === "success") {
    return {
      borderColor: "rgba(52, 211, 153, 0.28)",
      color: "#86efac",
      backgroundColor: "rgba(6, 78, 59, 0.18)",
    };
  }
  if (tone === "warning") {
    return {
      borderColor: "rgba(251, 191, 36, 0.28)",
      color: "#fcd34d",
      backgroundColor: "rgba(120, 53, 15, 0.18)",
    };
  }
  if (tone === "danger") {
    return {
      borderColor: "rgba(248, 113, 113, 0.28)",
      color: "#fca5a5",
      backgroundColor: "rgba(127, 29, 29, 0.18)",
    };
  }
  return {
    borderColor: "rgba(255, 255, 255, 0.08)",
    color: "#e2e8f0",
    backgroundColor: "rgba(0, 0, 0, 0.18)",
  };
};

const SectionCard = ({
  eyebrow,
  title,
  accent = C.brass,
  children,
  className = "",
}: SectionCardProps) => (
  <article
    className={`rounded-[1.2rem] border border-white/8 bg-[rgba(16,14,12,0.68)] p-5 shadow-[0_18px_55px_rgba(0,0,0,0.28)] backdrop-blur-sm ${className}`}
    style={{ clipPath: CLIP_CARD }}
  >
    <p
      className="text-[10px] uppercase tracking-[0.3em]"
      style={{ color: accent, fontFamily: "var(--font-mono)" }}
    >
      {eyebrow}
    </p>
    <h3
      className="mt-2 text-xl font-semibold tracking-[0.04em] text-stone-100"
      style={{ fontFamily: "var(--font-display)" }}
    >
      {title}
    </h3>
    <div className="mt-4">{children}</div>
  </article>
);

const DossierTabButton = ({
  active,
  icon: Icon,
  id,
  label,
  onClick,
}: {
  active: boolean;
  icon: LucideIcon;
  id: CharacterTabId;
  label: string;
  onClick: (tabId: CharacterTabId) => void;
}) => (
  <button
    aria-controls={`character-tabpanel-${id}`}
    aria-selected={active}
    className={`relative overflow-hidden rounded-[1rem] border px-4 py-3 text-left transition-colors ${
      active
        ? "border-amber-700/50 text-stone-100"
        : "border-stone-700/60 text-stone-400 hover:border-stone-500/70 hover:text-stone-200"
    }`}
    id={`character-tab-${id}`}
    onClick={() => onClick(id)}
    role="tab"
    style={{
      clipPath: CLIP_CARD,
      backgroundColor: active
        ? "rgba(181, 133, 43, 0.14)"
        : "rgba(23, 22, 20, 0.55)",
    }}
    type="button"
  >
    {active ? (
      <motion.span
        aria-hidden="true"
        className="absolute inset-0"
        layoutId="character-dossier-tab-glow"
        style={{
          background:
            "linear-gradient(140deg, rgba(181, 133, 43, 0.22), rgba(181, 133, 43, 0.04))",
        }}
      />
    ) : null}

    <span className="relative z-10 flex items-center gap-3">
      <span
        className="flex h-10 w-10 items-center justify-center rounded-[0.8rem] border"
        style={{
          borderColor: active
            ? "rgba(212, 167, 79, 0.32)"
            : "rgba(138, 151, 168, 0.22)",
          backgroundColor: active
            ? "rgba(166, 28, 47, 0.16)"
            : "rgba(12, 10, 9, 0.75)",
        }}
      >
        <Icon size={18} strokeWidth={2.2} />
      </span>
      <span>
        <span
          className="block text-[10px] uppercase tracking-[0.3em]"
          style={{
            color: active ? "#f4d18a" : "#7c8797",
            fontFamily: "var(--font-mono)",
          }}
        >
          {t.dossier}
        </span>
        <span className="mt-0.5 block text-sm font-semibold">{label}</span>
      </span>
    </span>
  </button>
);

const InfoBlock = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-[0.95rem] border border-white/8 bg-black/20 px-3 py-2.5">
    <div
      className="text-[10px] uppercase tracking-[0.28em] text-stone-500"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      {label}
    </div>
    <div className="mt-1 text-sm text-stone-100">{value}</div>
  </div>
);

const MetricBox = ({
  label,
  tone,
  value,
}: {
  label: string;
  tone: "success" | "danger" | "neutral" | "warning";
  value: number | string;
}) => {
  const toneMap = {
    success: {
      backgroundColor: "rgba(6, 78, 59, 0.18)",
      borderColor: "rgba(52, 211, 153, 0.28)",
      color: "#86efac",
    },
    danger: {
      backgroundColor: "rgba(127, 29, 29, 0.18)",
      borderColor: "rgba(248, 113, 113, 0.28)",
      color: "#fca5a5",
    },
    neutral: {
      backgroundColor: "rgba(0, 0, 0, 0.18)",
      borderColor: "rgba(255, 255, 255, 0.08)",
      color: "#e2e8f0",
    },
    warning: {
      backgroundColor: "rgba(120, 53, 15, 0.18)",
      borderColor: "rgba(251, 191, 36, 0.28)",
      color: "#fcd34d",
    },
  } as const;

  return (
    <div className="rounded-[1rem] border px-3 py-3" style={toneMap[tone]}>
      <div
        className="text-xl font-bold"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {value}
      </div>
      <div
        className="mt-1 text-[10px] uppercase tracking-[0.28em] text-stone-500"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {label}
      </div>
    </div>
  );
};

const buildAttributeVoiceBridge = (
  attribute: CharacterAttributeDefinition,
): AttributeVoiceBridgeSummary | null => {
  const canonicalVoiceId = canonicalSkillVoiceIdFor(attribute.key);
  const promptProfile = getCanonicalVoicePromptProfile(attribute.key);

  if (canonicalVoiceId === attribute.key && !promptProfile) {
    return null;
  }

  return {
    legacyVoiceId: attribute.key,
    canonicalVoiceId,
    canonicalLabel: getCanonicalVoiceLabel(attribute.key),
    iconName:
      canonicalVoiceId.startsWith("attr_") ||
      canonicalVoiceId.startsWith("inner_")
        ? attribute.icon
        : canonicalVoiceId,
    promptProfile,
  };
};

const ProfileTab = ({
  activeOrigin,
  alignment,
  agencyCareer,
  contacts,
  debugEnabled,
  flags,
  playerNickname,
  panelSubtitle,
  selectedTrack,
  vars,
}: {
  activeOrigin: OriginProfileDefinition | null;
  alignment: PsycheProfileData["alignment"];
  agencyCareer: AgencyCareerSummary;
  contacts: CharacterContactEntry[];
  debugEnabled: boolean;
  flags: Record<string, boolean>;
  playerNickname: string | null;
  panelSubtitle: string;
  selectedTrack: OriginTrackDefinition | null;
  vars: Record<string, number>;
  t: ReturnType<typeof getCharacterStrings>;
}) => {
  const dossierAccent = activeOrigin?.dossier.accentColor ?? C.brass;

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
      exit={{ opacity: 0, y: -10 }}
      initial={{ opacity: 0, y: 10 }}
      key="profile"
      transition={TAB_TRANSITION}
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.9fr)]">
        <SectionCard
          accent={dossierAccent}
          eyebrow={t.originProfile}
          title={activeOrigin?.label ?? "Field Identity Pending"}
        >
          {activeOrigin ? (
            <div className="space-y-4 text-sm text-stone-300">
              <p className="leading-relaxed text-stone-300">
                {activeOrigin.summary}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoBlock
                  label={t.identity}
                  value={activeOrigin.dossier.characterName}
                />
                <InfoBlock
                  label={t.nickname}
                  value={playerNickname?.trim() || "Unassigned"}
                />
                <InfoBlock
                  label={t.biometrics}
                  value={`${getGenderLabel(activeOrigin.dossier.gender)} / ${activeOrigin.dossier.age}`}
                />
                <InfoBlock
                  label={t.originCity}
                  value={activeOrigin.dossier.cityOrigin}
                />
                <InfoBlock
                  label={t.specialization}
                  value={selectedTrack?.title ?? "Undeclared"}
                />
                <InfoBlock label={t.scenario} value={activeOrigin.scenarioId} />
              </div>
              <blockquote
                className="rounded-[1rem] border border-white/8 bg-black/20 px-4 py-3 italic text-stone-300"
                style={{
                  borderLeftColor: dossierAccent,
                  borderLeftWidth: "3px",
                }}
              >
                "{activeOrigin.dossier.quote}"
              </blockquote>
            </div>
          ) : (
            <p className="leading-relaxed text-stone-400">
              No origin dossier is active yet. The screen still reflects live
              player flags, variables, and active content state.
            </p>
          )}
        </SectionCard>

        <SectionCard
          accent={C.crimson}
          eyebrow="Agency Standing"
          title={agencyCareer.rankLabel}
        >
          <div className="space-y-4 text-sm text-stone-300">
            <p className="leading-relaxed text-stone-300">
              {panelSubtitle} Agency recognition now tracks rank, standing, and
              qualifying milestones rather than a second XP bar.
            </p>
            <p className="leading-relaxed text-stone-400">
              {agencyCareer.standingLabel}. {agencyCareer.trendLabel}. Alignment
              remains {alignment.label.toLowerCase()}.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoBlock label={t.rank} value={agencyCareer.rankLabel} />
              <InfoBlock
                label={t.standing}
                value={agencyCareer.standingLabel}
              />
              <InfoBlock label={t.trend} value={agencyCareer.trendLabel} />
              <InfoBlock
                label={t.serviceCriteria}
                value={agencyCareer.criteriaSummary}
              />
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        accent={C.amber}
        eyebrow={t.contactNetwork}
        title={`${contacts.length} ${t.activeFiles}`}
      >
        {contacts.length === 0 ? (
          <p className="text-sm leading-relaxed text-stone-400">
            No pilot contacts have moved into your network yet.
          </p>
        ) : (
          <div className="grid gap-3 xl:grid-cols-2">
            {contacts.map((contact) => (
              <article
                key={contact.id}
                className="rounded-[1rem] border border-white/8 bg-black/20 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-base font-semibold text-stone-100">
                      {contact.displayName}
                    </h4>
                    <p className="mt-1 text-sm text-stone-400">
                      {contact.publicRole}
                    </p>
                  </div>
                  <span
                    className="rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.28em]"
                    style={getSocialTone(contact.relationshipTone)}
                  >
                    {contact.relationshipStatus}
                  </span>
                </div>
                <p
                  className="mt-3 inline-flex rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.24em]"
                  style={getSocialTone(contact.favorTone)}
                >
                  {contact.favorState}
                </p>
                <p className="mt-3 text-xs leading-relaxed text-stone-500">
                  {contact.services.length > 0
                    ? `Services: ${contact.services.join(", ")}`
                    : "No published services yet."}
                </p>
              </article>
            ))}
          </div>
        )}
      </SectionCard>

      {activeOrigin ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <SectionCard
            accent={activeOrigin.dossier.accentColor}
            eyebrow={t.signature}
            title={activeOrigin.signature.title}
          >
            <div className="space-y-3 text-sm text-stone-300">
              <p className="leading-relaxed">
                {activeOrigin.signature.description}
              </p>
              <span
                className="inline-flex rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.3em]"
                style={{
                  borderColor: "rgba(181, 133, 43, 0.35)",
                  color: "#f4d18a",
                  backgroundColor: "rgba(181, 133, 43, 0.12)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {activeOrigin.signature.passiveLabel}
              </span>
            </div>
          </SectionCard>

          <SectionCard
            accent={C.crimson}
            eyebrow={t.flaw}
            title={activeOrigin.flaw.title}
          >
            <div className="space-y-3 text-sm text-stone-300">
              <p className="leading-relaxed">{activeOrigin.flaw.description}</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <InfoBlock
                  label={t.checkVoice}
                  value={activeOrigin.flaw.checkVoice}
                />
                <InfoBlock
                  label={t.dc}
                  value={activeOrigin.flaw.dc.toString()}
                />
                <InfoBlock
                  label={t.duration}
                  value={activeOrigin.flaw.durationLabel}
                />
              </div>
            </div>
          </SectionCard>
        </div>
      ) : null}

      {debugEnabled ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <SectionCard accent={C.slate} eyebrow="Debug" title="Raw Flags">
            <pre className="max-h-[280px] overflow-auto rounded-[1rem] border border-white/8 bg-black/30 p-3 text-xs text-stone-200">
              {JSON.stringify(flags, null, 2)}
            </pre>
          </SectionCard>
          <SectionCard accent={C.slate} eyebrow="Debug" title="Raw Vars">
            <pre className="max-h-[280px] overflow-auto rounded-[1rem] border border-white/8 bg-black/30 p-3 text-xs text-stone-200">
              {JSON.stringify(vars, null, 2)}
            </pre>
          </SectionCard>
        </div>
      ) : null}
    </motion.div>
  );
};

const DevelopmentTab = ({
  attributes,
  primaryVoiceBridgeEntries,
  radarData,
  secondaryVoiceBridgeEntries,
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

const PsycheTab = ({ profile }: { profile: PsycheProfileData }) => {
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

const JournalTab = ({
  entityKnowledge,
  getObjectivePointLabel,
  observationEntries,
  questJournalEntries,
}: {
  entityKnowledge: Array<{
    id: string;
    label: string;
    veilLevel: number;
    observationCount: number;
    signatureIds: string[];
  }>;
  getObjectivePointLabel: (pointId: string) => string;
  observationEntries: CharacterObservationEntry[];
  questJournalEntries: CharacterQuestJournalEntry[];
}) => (
  <motion.div
    animate={{ opacity: 1, y: 0 }}
    className="space-y-4"
    exit={{ opacity: 0, y: -10 }}
    initial={{ opacity: 0, y: 10 }}
    key="journal"
    transition={TAB_TRANSITION}
  >
    <div className="grid gap-4 xl:grid-cols-2">
      <SectionCard
        accent={C.brass}
        eyebrow="Quest Journal"
        title="Investigation Log"
      >
        {questJournalEntries.length === 0 ? (
          <p className="text-sm leading-relaxed text-stone-400">
            No quest catalog is available in active content.
          </p>
        ) : (
          <div className="space-y-3">
            {questJournalEntries.map((entry) => {
              const statusTone = getStatusTone(entry.status);

              return (
                <article
                  key={entry.id}
                  className="rounded-[1rem] border border-white/8 bg-black/20 px-4 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <strong className="text-stone-100">{entry.title}</strong>
                    <span
                      className="rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.3em]"
                      style={{
                        ...statusTone,
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {entry.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-stone-300">
                    Stage {entry.currentStage}
                    {entry.activeStage ? ` - ${entry.activeStage.title}` : ""}
                  </p>
                  {entry.activeStage ? (
                    <p className="mt-2 text-sm leading-relaxed text-stone-400">
                      {entry.activeStage.objectiveHint}
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </SectionCard>

      <SectionCard
        accent={C.crimson}
        eyebrow="Objective Points"
        title="Mapped Follow-Ups"
      >
        {questJournalEntries.length === 0 ? (
          <p className="text-sm leading-relaxed text-stone-400">
            Objectives become available after content publish.
          </p>
        ) : (
          <div className="space-y-3">
            {questJournalEntries.map((entry) => (
              <div
                key={`${entry.id}-points`}
                className="rounded-[1rem] border border-white/8 bg-black/20 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <strong className="text-stone-100">{entry.title}</strong>
                  <span
                    className="text-[10px] uppercase tracking-[0.3em]"
                    style={{ color: C.slate, fontFamily: "var(--font-mono)" }}
                  >
                    {entry.activeStage?.objectivePointIds?.length ?? 0} points
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-stone-400">
                  {entry.activeStage?.objectivePointIds
                    ?.map((pointId) => getObjectivePointLabel(pointId))
                    .join(", ") ?? "none"}
                </p>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>

    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_320px]">
      <SectionCard
        accent={C.amber}
        eyebrow={t.observationJournal}
        title="Anomalous Registry"
      >
        {observationEntries.length === 0 ? (
          <p className="text-sm leading-relaxed text-stone-400">
            No anomalous observations are archived yet. Rational casework
            remains your primary ledger until the veil leaves something you can
            actually file.
          </p>
        ) : (
          <div className="space-y-3">
            {observationEntries.map((entry) => (
              <article
                key={entry.id}
                className="rounded-[1rem] border border-white/8 bg-black/20 px-4 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <strong className="text-stone-100">{entry.title}</strong>
                  <span
                    className="rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.3em]"
                    style={{
                      borderColor: "rgba(212, 167, 79, 0.26)",
                      color: "#f4d18a",
                      backgroundColor: "rgba(181, 133, 43, 0.12)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {entry.kind}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-stone-300">
                  {entry.text}
                </p>
                {entry.rationalInterpretation ? (
                  <p className="mt-2 text-sm leading-relaxed text-stone-500">
                    Rational read: {entry.rationalInterpretation}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        accent={C.crimson}
        eyebrow="Entity Knowledge"
        title="Archetype Fragments"
      >
        {entityKnowledge.length === 0 ? (
          <p className="text-sm leading-relaxed text-stone-400">
            No archetype has enough corroborated traces to form a working file.
          </p>
        ) : (
          <div className="space-y-3">
            {entityKnowledge.map((entry) => (
              <div
                key={entry.id}
                className="rounded-[1rem] border border-white/8 bg-black/20 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <strong className="text-stone-100">{entry.label}</strong>
                  <span
                    className="text-[10px] uppercase tracking-[0.3em]"
                    style={{ color: C.amber, fontFamily: "var(--font-mono)" }}
                  >
                    Veil {entry.veilLevel}
                  </span>
                </div>
                <p className="mt-2 text-sm text-stone-300">
                  {entry.observationCount} observations
                </p>
                <p className="mt-2 text-sm leading-relaxed text-stone-500">
                  {entry.signatureIds.length > 0
                    ? `Signatures: ${entry.signatureIds.join(", ")}`
                    : "No stable signature tags yet."}
                </p>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  </motion.div>
);

export const CharacterPanel = () => {
  const { identityHex } = useIdentity();
  const myFlags = usePlayerFlags();
  const myVars = usePlayerVars();
  const [playerProfileRows] = useTable(tables.myPlayerProfile);
  const [questRows] = useTable(tables.myQuests);
  const [npcStateRows] = useTable(tables.myNpcState);
  const [npcFavorRows] = useTable(tables.myNpcFavors);
  const [factionSignalRows] = useTable(tables.myFactionSignals);
  const [agencyCareerRows] = useTable(tables.myAgencyCareer);
  const [versions] = useTable(tables.contentVersion);
  const [snapshots] = useTable(tables.contentSnapshot);
  const [activeTab, setActiveTab] = useState<CharacterTabId>("profile");
  const uiLanguage = useUiLanguage(myFlags);
  const t = useMemo(() => getCharacterStrings(uiLanguage), [uiLanguage]);
  const dossierTabs = useMemo<
    Array<{
      id: CharacterTabId;
      icon: LucideIcon;
      label: string;
    }>
  >(
    () => [
      { id: "profile", icon: FileText, label: t.tabs.profile },
      { id: "development", icon: Brain, label: t.tabs.development },
      { id: "psyche", icon: Fingerprint, label: t.tabs.psyche },
      { id: "journal", icon: BookOpenText, label: t.tabs.journal },
    ],
    [t],
  );
  const activeOrigin = useMemo(
    () => getOriginProfileByFlags(myFlags),
    [myFlags],
  );
  const selectedTrack = useMemo(
    () => (activeOrigin ? getSelectedOriginTrack(activeOrigin, myFlags) : null),
    [activeOrigin, myFlags],
  );
  const playerNickname = useMemo(
    () => unwrapOptionalString(playerProfileRows[0]?.nickname),
    [playerProfileRows],
  );

  const activeVersion = useMemo(
    () => versions.find((entry) => entry.isActive) ?? null,
    [versions],
  );

  const activeSnapshot = useMemo(() => {
    if (!activeVersion) {
      return null;
    }

    const snapshotRow = snapshots.find(
      (entry) => entry.checksum === activeVersion.checksum,
    );
    if (!snapshotRow) {
      return null;
    }

    return parseSnapshot(snapshotRow.payloadJson);
  }, [activeVersion, snapshots]);

  const socialCatalog = activeSnapshot?.socialCatalog;
  const factionCatalog = useMemo(
    () => getFactionCatalogForUi(socialCatalog),
    [socialCatalog],
  );

  const factionSignalState = useMemo(
    () =>
      factionSignalRows.map((row) => ({
        factionId: row.factionId,
        value: row.value,
        trend: row.trend,
      })),
    [factionSignalRows],
  );

  const socialRelationshipState = useMemo(() => {
    const trustByNpcId = new Map<string, number>();
    for (const row of npcStateRows) {
      trustByNpcId.set(row.npcId, row.trustScore);
    }

    const favorByNpcId = new Map<string, number>();
    for (const row of npcFavorRows) {
      favorByNpcId.set(row.npcId, normalizeNumber(row.balance));
    }

    return {
      trustByNpcId,
      favorByNpcId,
    };
  }, [npcFavorRows, npcStateRows]);

  const revealedFactionState = useMemo(
    () =>
      getRevealedFactionState({
        socialCatalog,
        flags: myFlags,
        trustByNpcId: socialRelationshipState.trustByNpcId,
        favorByNpcId: socialRelationshipState.favorByNpcId,
        factionSignals: factionSignalState,
      }),
    [factionSignalState, myFlags, socialCatalog, socialRelationshipState],
  );

  const profile = useMemo(
    () =>
      buildPsycheProfile({
        flags: myFlags,
        vars: myVars,
        factionCatalog,
        factionSignals: factionSignalState,
        revealedFactionIds: revealedFactionState.revealedFactionIds,
        revealedFactionReasons: revealedFactionState.revealReasons,
      }),
    [factionCatalog, factionSignalState, myFlags, myVars, revealedFactionState],
  );

  const agencyCareerRow = useMemo(
    () => agencyCareerRows[0] ?? null,
    [agencyCareerRows],
  );

  const agencyCareerSummary = useMemo<AgencyCareerSummary>(() => {
    const standingScore = agencyCareerRow?.standingScore ?? 0;
    const standingPresentation = getAgencyStandingPresentation(standingScore);
    const completedCriteria = [
      agencyCareerRow?.rumorCriterionComplete,
      agencyCareerRow?.sourceCriterionComplete,
      agencyCareerRow?.cleanClosureCriterionComplete,
    ].filter(Boolean).length;

    return {
      rankLabel: getCareerRankLabel(socialCatalog, agencyCareerRow?.rankId),
      standingLabel: standingPresentation.label,
      standingTone: standingPresentation.tone,
      trendLabel: getTrendLabel(agencyCareerRow?.standingTrend),
      criteriaSummary: `${completedCriteria}/3 logged`,
    };
  }, [agencyCareerRow, socialCatalog]);

  const questStageById = useMemo(() => {
    const byId = new Map<string, number>();
    for (const row of questRows) {
      byId.set(row.questId, normalizeNumber(row.stage));
    }
    return byId;
  }, [questRows]);

  const pointTitleById = useMemo(() => {
    const byId = new Map<string, string>();
    for (const point of activeSnapshot?.map?.points ?? []) {
      byId.set(point.id, point.title);
    }
    return byId;
  }, [activeSnapshot?.map?.points]);

  const contactEntries = useMemo<CharacterContactEntry[]>(() => {
    const serviceLabelById = new Map<string, string>();
    for (const service of socialCatalog?.services ?? []) {
      serviceLabelById.set(service.id, service.label);
    }

    return (socialCatalog?.npcIdentities ?? [])
      .filter((identity) =>
        isNpcIdentityRevealed(
          identity,
          myFlags,
          socialRelationshipState.trustByNpcId,
          socialRelationshipState.favorByNpcId,
        ),
      )
      .map((identity) => {
        const trustPresentation = getTrustBandPresentation(
          socialRelationshipState.trustByNpcId.get(identity.id) ?? 0,
        );
        const favorPresentation = getFavorPresentation(
          socialRelationshipState.favorByNpcId.get(identity.id) ?? 0,
        );
        return {
          id: identity.id,
          displayName: identity.displayName,
          publicRole: identity.publicRole,
          relationshipStatus: trustPresentation.label,
          relationshipTone: trustPresentation.tone,
          favorState: favorPresentation.label,
          favorTone: favorPresentation.tone,
          services: (identity.serviceIds ?? []).map(
            (serviceId) => serviceLabelById.get(serviceId) ?? serviceId,
          ),
        };
      })
      .sort((left, right) => left.displayName.localeCompare(right.displayName));
  }, [
    myFlags,
    socialRelationshipState,
    socialCatalog?.npcIdentities,
    socialCatalog?.services,
  ]);

  const getObjectivePointLabel = (pointId: string): string => {
    const title = pointTitleById.get(pointId);
    if (title) {
      return title;
    }
    return ENABLE_DEBUG_CONTENT_SEED ? pointId : "Unknown objective point";
  };

  const questJournalEntries = useMemo<CharacterQuestJournalEntry[]>(() => {
    const catalog = activeSnapshot?.questCatalog ?? [];

    return catalog.map((quest) => {
      const sortedStages = [...quest.stages].sort(
        (left, right) => left.stage - right.stage,
      );
      const currentStage = questStageById.get(quest.id) ?? 1;
      const activeStage =
        sortedStages.find((stage) => stage.stage === currentStage) ??
        sortedStages.find((stage) => stage.stage > currentStage) ??
        sortedStages[sortedStages.length - 1];
      const hasQuestRow = questStageById.has(quest.id);
      const isCompleted =
        hasQuestRow &&
        currentStage >= sortedStages[sortedStages.length - 1].stage;

      return {
        id: quest.id,
        title: quest.title,
        currentStage,
        activeStage,
        status: isCompleted
          ? "Completed"
          : hasQuestRow
            ? "In progress"
            : "Not started",
      };
    });
  }, [activeSnapshot?.questCatalog, questStageById]);

  const observationEntries = useMemo<CharacterObservationEntry[]>(
    () =>
      resolveUnlockedObservationEntries(activeSnapshot, myFlags).map(
        (entry) => ({
          id: entry.id,
          kind: formatObservationKindLabel(entry.kind),
          title: entry.title,
          text: entry.text,
          rationalInterpretation: entry.rationalInterpretation,
          entityArchetypeId: entry.entityArchetypeId,
        }),
      ),
    [activeSnapshot, myFlags],
  );

  const entityKnowledge = useMemo(
    () =>
      buildEntityKnowledge(
        activeSnapshot?.mysticism?.entityArchetypes,
        resolveUnlockedObservationEntries(activeSnapshot, myFlags),
      ),
    [activeSnapshot, myFlags],
  );

  const attributeCards = useMemo<CharacterAttributeCard[]>(
    () =>
      CORE_CHARACTERISTICS.map((attribute) => ({
        ...attribute,
        value: myVars[attribute.key] ?? 0,
        voiceBridge: buildAttributeVoiceBridge(attribute),
        specialized: (SPECIALIZED_BY_CORE[attribute.key] ?? []).map(
          (specialized) => ({
            ...specialized,
            value: myVars[specialized.key] ?? 0,
            voiceBridge: buildAttributeVoiceBridge(specialized),
          }),
        ),
      })),
    [myVars],
  );

  const primaryVoiceBridgeEntries = useMemo<
    CharacterVoiceBridgeRegistryEntry[]
  >(
    () =>
      attributeCards
        .filter(
          (
            attribute,
          ): attribute is CharacterAttributeCard & {
            voiceBridge: AttributeVoiceBridgeSummary & {
              promptProfile: CanonicalVoicePromptProfile;
            };
          } =>
            attribute.voiceBridge !== null &&
            attribute.voiceBridge.promptProfile !== null,
        )
        .map((attribute) => ({
          sourceLabel: attribute.label,
          currentValue: attribute.value,
          accent: attribute.accent,
          bridge: attribute.voiceBridge,
        })),
    [attributeCards],
  );

  const secondaryVoiceBridgeEntries = useMemo(
    () =>
      attributeCards.flatMap((attribute) =>
        attribute.specialized
          .filter((specialized) => specialized.voiceBridge !== null)
          .map((specialized) => ({
            sourceLabel: specialized.label,
            currentValue: specialized.value,
            bridge: specialized.voiceBridge!,
            accent: specialized.accent,
          })),
      ),
    [attributeCards],
  );

  const radarData = useMemo<CharacterRadarDatum[]>(
    () =>
      attributeCards.map((attribute) => ({
        key: attribute.key,
        label: attribute.label,
        icon: attribute.icon,
        color: attribute.accent,
        value: attribute.value,
      })),
    [attributeCards],
  );

  return (
    <section className="panel-section pb-24">
      <div
        className="relative overflow-hidden rounded-[1.75rem] border border-white/8 text-stone-100 shadow-[0_25px_80px_rgba(0,0,0,0.36)]"
        style={{
          clipPath: CLIP_PANEL,
          background: `
            radial-gradient(circle at 20% 18%, rgba(166, 28, 47, 0.18), transparent 34%),
            radial-gradient(circle at 82% 0%, rgba(181, 133, 43, 0.12), transparent 28%),
            linear-gradient(150deg, ${C.coal} 0%, ${C.ink} 55%, #111217 100%)
          `,
        }}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.045]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.88' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.45'/%3E%3C/svg%3E\")",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(242, 233, 216, 0.4), transparent)",
          }}
        />

        <div className="relative z-10 flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
          <header className="flex flex-col gap-4 border-b border-white/8 pb-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p
                className="text-[10px] uppercase tracking-[0.38em]"
                style={{ color: C.slate, fontFamily: "var(--font-mono)" }}
              >
                Freiburg Character Dossier
              </p>
              <h2
                className="mt-2 text-3xl font-black uppercase leading-tight tracking-tight sm:text-4xl"
                style={{ color: C.bone, fontFamily: "var(--font-display)" }}
              >
                {t.panelTitle}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-stone-400">
                {t.panelSubtitle}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span
                className="inline-flex rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.32em]"
                style={{
                  color: activeOrigin?.dossier.accentColor ?? C.amber,
                  borderColor: `${activeOrigin?.dossier.accentColor ?? C.amber}55`,
                  backgroundColor: "rgba(0, 0, 0, 0.18)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {activeOrigin?.label ?? "No origin"}
              </span>
              <span
                className="inline-flex rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.32em]"
                style={{
                  color: C.bone,
                  borderColor: "rgba(242, 233, 216, 0.16)",
                  backgroundColor: "rgba(255, 255, 255, 0.04)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {agencyCareerSummary.rankLabel}
              </span>
              <span
                className="inline-flex rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.32em]"
                style={{
                  color: C.amber,
                  borderColor: "rgba(212, 167, 79, 0.24)",
                  backgroundColor: "rgba(181, 133, 43, 0.08)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {agencyCareerSummary.standingLabel}
              </span>
            </div>
          </header>

          <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)]">
            <nav
              aria-label="Character dossier sections"
              className="flex gap-2 overflow-x-auto pb-1 xl:flex-col xl:overflow-visible"
              role="tablist"
            >
              {dossierTabs.map((tab) => (
                <DossierTabButton
                  key={tab.id}
                  active={activeTab === tab.id}
                  icon={tab.icon}
                  id={tab.id}
                  label={tab.label}
                  onClick={setActiveTab}
                />
              ))}
            </nav>

            <div
              className="min-w-0 rounded-[1.4rem] border border-white/8 bg-[rgba(10,9,7,0.46)] p-4 sm:p-6"
              style={{ clipPath: CLIP_PANEL }}
            >
              <AnimatePresence mode="wait">
                {activeTab === "profile" ? (
                  <div
                    aria-labelledby="character-tab-profile"
                    id="character-tabpanel-profile"
                    role="tabpanel"
                  >
                    <ProfileTab
                      activeOrigin={activeOrigin}
                      alignment={profile.alignment}
                      agencyCareer={agencyCareerSummary}
                      contacts={contactEntries}
                      debugEnabled={ENABLE_DEBUG_CONTENT_SEED}
                      flags={myFlags}
                      playerNickname={playerNickname}
                      panelSubtitle={t.panelSubtitle}
                      selectedTrack={selectedTrack}
                      vars={myVars}
                      t={t}
                    />
                  </div>
                ) : null}

                {activeTab === "development" ? (
                  <div
                    aria-labelledby="character-tab-development"
                    id="character-tabpanel-development"
                    role="tabpanel"
                  >
                    <DevelopmentTab
                      attributes={attributeCards}
                      primaryVoiceBridgeEntries={primaryVoiceBridgeEntries}
                      radarData={radarData}
                      secondaryVoiceBridgeEntries={secondaryVoiceBridgeEntries}
                    />
                  </div>
                ) : null}

                {activeTab === "psyche" ? (
                  <div
                    aria-labelledby="character-tab-psyche"
                    id="character-tabpanel-psyche"
                    role="tabpanel"
                  >
                    <PsycheTab profile={profile} />
                  </div>
                ) : null}

                {activeTab === "journal" ? (
                  <div
                    aria-labelledby="character-tab-journal"
                    id="character-tabpanel-journal"
                    role="tabpanel"
                  >
                    <JournalTab
                      entityKnowledge={entityKnowledge}
                      getObjectivePointLabel={getObjectivePointLabel}
                      observationEntries={observationEntries}
                      questJournalEntries={questJournalEntries}
                    />
                  </div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
