import {
  forwardRef,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Beer,
  BookOpenText,
  ChevronRight,
  Sparkles,
  TriangleAlert,
  X,
} from "lucide-react";
import {
  originProfiles,
  type OriginProfileDefinition,
} from "../../character/originProfiles";
import { GameIcon } from "../../../shared/ui/icons/game-icons";

interface OriginSelectionScreenProps {
  disabled?: boolean;
  status?: string | null;
  onConfirmOrigin: (profileId: string) => void;
  onReset?: () => void;
  onCancel: () => void;
}

const C = {
  coal: "#0E0D0B",
  ink: "#171614",
  bone: "#F2E9D8",
  crimson: "#A61C2F",
  brass: "#B5852B",
  steel: "#4E5D6C",
  green: "#2E6B57",
} as const;

const SPRING = { type: "spring" as const, stiffness: 400, damping: 30 };
const CLIP_CARD =
  "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))";
const CLIP_BADGE =
  "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))";
const CLIP_BTN =
  "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))";

const FLAW_ICON_MAP = {
  sparkles: Sparkles,
  "triangle-alert": TriangleAlert,
  beer: Beer,
  "book-open-text": BookOpenText,
  star: Sparkles,
} as const;

const statusStrip = (
  status: string | null | undefined,
  onReset?: () => void,
) => {
  if (!status || status.trim().length === 0) {
    return null;
  }

  const isResetRequired = status.includes("resetProgress=true");

  return (
    <div
      className="mt-4 inline-flex flex-col gap-2 px-3 py-2 text-xs w-full"
      style={{
        color: "rgba(242, 233, 216, 0.9)",
        backgroundColor: isResetRequired
          ? "rgba(181, 133, 43, 0.15)"
          : "rgba(166, 28, 47, 0.12)",
        border: `1px solid ${isResetRequired ? "rgba(181, 133, 43, 0.3)" : "rgba(242, 233, 216, 0.08)"}`,
        clipPath: CLIP_BADGE,
      }}
    >
      <div className="flex items-center gap-2">
        {isResetRequired ? (
          <TriangleAlert size={14} />
        ) : (
          <AlertCircle size={14} />
        )}
        <span>{status}</span>
      </div>
      {isResetRequired && onReset && (
        <button
          type="button"
          onClick={onReset}
          className="mt-1 self-end px-2 py-1 text-[10px] uppercase font-bold transition-opacity hover:opacity-80"
          style={{
            backgroundColor: C.brass,
            color: C.coal,
            clipPath: CLIP_BADGE,
          }}
        >
          Reset and Retry
        </button>
      )}
    </div>
  );
};

const genderLabel = (
  gender: OriginProfileDefinition["dossier"]["gender"],
): string => (gender === "female" ? "F" : "M");

const formatXp = (requiredXp: number): string => `${requiredXp} XP`;

const getFlawIcon = (iconKey: string) => {
  const Icon =
    FLAW_ICON_MAP[iconKey as keyof typeof FLAW_ICON_MAP] ?? AlertCircle;
  return <Icon size={14} />;
};

export const OriginSelectionScreen = ({
  disabled = false,
  status,
  onConfirmOrigin,
  onReset,
  onCancel,
}: OriginSelectionScreenProps) => {
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    null,
  );
  const detailRef = useRef<HTMLDivElement | null>(null);

  const selectedProfile = useMemo(
    () =>
      selectedProfileId
        ? (originProfiles.find((profile) => profile.id === selectedProfileId) ??
          null)
        : null,
    [selectedProfileId],
  );

  const handleConfirm = useCallback(() => {
    if (!selectedProfile || disabled) {
      return;
    }
    onConfirmOrigin(selectedProfile.id);
  }, [disabled, onConfirmOrigin, selectedProfile]);

  useEffect(() => {
    if (!selectedProfile || !detailRef.current) {
      return;
    }
    if (typeof detailRef.current.scrollTo === "function") {
      detailRef.current.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    detailRef.current.scrollTop = 0;
  }, [selectedProfile]);

  return (
    <div
      className="origin-selection-overlay fixed inset-0 z-[65] overflow-hidden bg-black"
      role="dialog"
      aria-modal="true"
      aria-labelledby="origin-selection-title"
    >
      <AnimatePresence mode="wait">
        {!selectedProfile ? (
          <OriginListView
            key="origin-list"
            disabled={disabled}
            status={status}
            onCancel={onCancel}
            onReset={onReset}
            onSelect={setSelectedProfileId}
          />
        ) : (
          <OriginDetailView
            key={`origin-detail-${selectedProfile.id}`}
            ref={detailRef}
            disabled={disabled}
            profile={selectedProfile}
            status={status}
            onBack={() => setSelectedProfileId(null)}
            onCancel={onCancel}
            onReset={() => onReset?.()}
            onConfirm={handleConfirm}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const OriginListView = ({
  disabled,
  status,
  onCancel,
  onReset,
  onSelect,
}: {
  disabled: boolean;
  status?: string | null;
  onCancel: () => void;
  onReset?: () => void;
  onSelect: (profileId: string) => void;
}) => (
  <motion.section
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0, x: -60 }}
    transition={{ duration: 0.35 }}
    className="origin-selection-shell flex h-[100dvh] max-h-[100dvh] min-h-0 flex-col relative overflow-hidden select-none"
    style={{ backgroundColor: C.coal }}
  >
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background: `
          radial-gradient(ellipse 80% 40% at 50% 0%, ${C.crimson}08, transparent),
          linear-gradient(180deg, ${C.ink} 0%, ${C.coal} 30%)
        `,
      }}
    />
    <div
      className="absolute inset-0 pointer-events-none opacity-[0.03]"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")",
      }}
    />

    <button
      type="button"
      aria-label="Close origin selection"
      className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center border text-stone-100 transition-opacity hover:opacity-80"
      style={{
        borderColor: `${C.steel}45`,
        backgroundColor: `${C.coal}B8`,
        clipPath: CLIP_BADGE,
      }}
      onClick={onCancel}
    >
      <X size={16} />
    </button>

    <header className="relative z-10 shrink-0 px-5 pb-4 pt-[max(env(safe-area-inset-top),1.5rem)] text-center">
      <div
        className="mb-3 text-[9px] uppercase tracking-[0.4em]"
        style={{ color: C.bone, opacity: 0.4, fontFamily: "var(--font-mono)" }}
      >
        FREIBURG POLICE DEPARTMENT · 1905
      </div>

      <div
        className="mx-auto mb-4 h-px w-12"
        style={{ backgroundColor: C.crimson }}
      />

      <p
        className="mb-2 text-xs uppercase tracking-[0.32em]"
        style={{ color: C.bone, opacity: 0.45, fontFamily: "var(--font-mono)" }}
      >
        Freiburg 1905
      </p>
      <h2
        id="origin-selection-title"
        className="text-2xl font-black uppercase leading-tight tracking-tight sm:text-3xl"
        style={{
          fontFamily: "var(--font-display)",
          color: C.bone,
          textShadow: `0 0 40px ${C.crimson}30`,
        }}
      >
        Select Origin
      </h2>
      <p
        className="mx-auto mt-2 max-w-[300px] text-xs italic leading-relaxed sm:max-w-[360px]"
        style={{ color: `${C.bone}66`, fontFamily: "var(--font-serif)" }}
      >
        Choose the dossier you want to open. Your origin determines your opening
        route, flaw, and baseline investigative strengths.
      </p>

      {statusStrip(status, onReset)}

      <div className="relative mt-4 h-px w-full overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(90deg, transparent, ${C.crimson}60 20%, ${C.brass}40 50%, ${C.steel}40 80%, transparent)`,
          }}
        />
      </div>
    </header>

    <main className="relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 pb-8">
      <div className="mx-auto flex max-w-md flex-col gap-3">
        {originProfiles.map((profile, index) => (
          <DossierCard
            key={profile.id}
            disabled={disabled}
            index={index}
            profile={profile}
            onSelect={() => onSelect(profile.id)}
          />
        ))}
      </div>
    </main>

    <footer className="relative z-10 shrink-0 px-4 pb-[max(env(safe-area-inset-bottom),1rem)] pt-2">
      <div className="mx-auto flex max-w-md justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-[11px] uppercase tracking-[0.2em] transition-opacity hover:opacity-80"
          style={{
            color: `${C.bone}88`,
            fontFamily: "var(--font-mono)",
            border: `1px solid ${C.steel}35`,
            backgroundColor: `${C.ink}C8`,
            clipPath: CLIP_BADGE,
          }}
        >
          Back
        </button>
      </div>
    </footer>
  </motion.section>
);

const DossierCard = ({
  disabled,
  index,
  profile,
  onSelect,
}: {
  disabled: boolean;
  index: number;
  profile: OriginProfileDefinition;
  onSelect: () => void;
}) => (
  <motion.button
    type="button"
    disabled={disabled}
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ ...SPRING, delay: index * 0.1 + 0.15 }}
    whileHover={disabled ? undefined : { scale: 1.015, x: 4 }}
    whileTap={disabled ? undefined : { scale: 0.98 }}
    onClick={onSelect}
    className="group relative w-full cursor-pointer text-left focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
    style={{ clipPath: CLIP_CARD }}
  >
    <div
      className="absolute bottom-0 left-0 top-0 z-10 w-[3px]"
      style={{ backgroundColor: profile.dossier.accentColor }}
    />

    <div
      className="relative flex items-stretch overflow-hidden transition-colors"
      style={{
        backgroundColor: C.ink,
        border: `1px solid ${C.steel}20`,
      }}
    >
      <div className="relative h-24 w-20 shrink-0 overflow-hidden">
        <div
          className="absolute inset-0 scale-110 bg-cover bg-center opacity-70 transition-opacity duration-300 group-hover:opacity-90"
          style={{ backgroundImage: `url('${profile.dossier.avatarUrl}')` }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(90deg, transparent 30%, ${C.ink} 100%)`,
          }}
        />
        <div
          className="absolute bottom-1 left-1 px-1 py-0.5 text-[7px] uppercase"
          style={{
            color: `${C.bone}50`,
            backgroundColor: `${C.coal}90`,
            border: `1px solid ${C.steel}20`,
            fontFamily: "var(--font-mono)",
          }}
        >
          1905
        </div>
      </div>

      <div className="min-w-0 flex-1 px-3 py-2.5">
        <div
          className="mb-0.5 text-[8px] uppercase tracking-[0.3em]"
          style={{
            color: profile.dossier.accentColor,
            fontFamily: "var(--font-mono)",
          }}
        >
          {profile.label}
        </div>

        <div className="flex items-start justify-between gap-3">
          <h3
            className="truncate text-base font-extrabold uppercase leading-tight"
            style={{ color: C.bone, fontFamily: "var(--font-display)" }}
          >
            {profile.dossier.characterName}
          </h3>
          <ChevronRight
            size={18}
            className="mt-0.5 shrink-0"
            style={{ color: `${profile.dossier.accentColor}CC` }}
          />
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span
            className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[8px] uppercase tracking-wider"
            style={{
              backgroundColor: `${profile.dossier.accentColor}18`,
              color: profile.dossier.accentColor,
              border: `1px solid ${profile.dossier.accentColor}30`,
              clipPath: CLIP_BADGE,
              fontFamily: "var(--font-mono)",
            }}
          >
            <Sparkles size={10} />
            {profile.signature.title}
          </span>
          <span
            className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[8px] uppercase tracking-wider"
            style={{
              backgroundColor: `${C.crimson}15`,
              color: `${C.crimson}CC`,
              border: `1px solid ${C.crimson}25`,
              clipPath: CLIP_BADGE,
              fontFamily: "var(--font-mono)",
            }}
          >
            {getFlawIcon(profile.flaw.icon)}
            {profile.flaw.title}
          </span>
        </div>
      </div>

      <div className="hidden max-w-[120px] items-center px-3 sm:flex">
        <p
          className="line-clamp-3 text-[10px] italic leading-snug"
          style={{ color: `${C.bone}44`, fontFamily: "var(--font-serif)" }}
        >
          "{profile.dossier.quote}"
        </p>
      </div>

      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `linear-gradient(90deg, ${profile.dossier.accentColor}08, transparent 60%)`,
        }}
      />
    </div>
  </motion.button>
);

interface OriginDetailViewProps {
  disabled: boolean;
  profile: OriginProfileDefinition;
  status?: string | null;
  onBack: () => void;
  onCancel: () => void;
  onReset?: () => void;
  onConfirm: () => void;
}

const OriginDetailView = forwardRef<HTMLDivElement, OriginDetailViewProps>(
  function OriginDetailView(
    { disabled, profile, status, onBack, onCancel, onReset, onConfirm },
    ref,
  ) {
    const accent = profile.dossier.accentColor;

    return (
      <motion.section
        ref={ref}
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 60 }}
        transition={{ duration: 0.35 }}
        className="origin-selection-shell relative flex min-h-[100dvh] flex-col overflow-y-auto select-none"
        style={{ backgroundColor: C.coal }}
      >
        <div
          className="sticky top-0 z-20 px-5 py-3"
          style={{
            backgroundColor: `${C.coal}EE`,
            backdropFilter: "blur(12px)",
            borderBottom: `1px solid ${C.steel}15`,
          }}
        >
          <div className="mx-auto flex w-full max-w-3xl items-center justify-between">
            <button
              type="button"
              onClick={onBack}
              className="px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] transition-opacity hover:opacity-80"
              style={{ color: `${C.bone}CC`, fontFamily: "var(--font-mono)" }}
            >
              {"<- BACK"}
            </button>
            <div
              className="text-[10px] uppercase tracking-[0.3em]"
              style={{ color: `${C.bone}80`, fontFamily: "var(--font-mono)" }}
            >
              ORIGIN SELECTION
            </div>
            <button
              type="button"
              onClick={onCancel}
              aria-label="Close origin selection"
              className="flex h-9 w-9 items-center justify-center transition-opacity hover:opacity-80"
              style={{
                color: C.bone,
                border: `1px solid ${C.steel}25`,
                backgroundColor: `${C.ink}C0`,
                clipPath: CLIP_BADGE,
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="relative max-h-[45vh] w-full shrink-0 overflow-hidden aspect-[4/3]">
          <div
            className="absolute inset-0 bg-cover bg-top"
            style={{ backgroundImage: `url('${profile.dossier.avatarUrl}')` }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `
              linear-gradient(180deg, transparent 30%, ${C.coal} 95%),
              linear-gradient(0deg, transparent 60%, ${C.coal}40 100%)
            `,
            }}
          />
          <div
            className="absolute bottom-0 left-0 right-0 h-[2px]"
            style={{
              background: `linear-gradient(90deg, ${accent}, transparent 70%)`,
            }}
          />

          <div className="absolute bottom-4 left-0 right-0 px-5">
            <div className="mx-auto w-full max-w-3xl">
              <div
                className="mb-1 text-[10px] uppercase tracking-[0.3em]"
                style={{ color: accent, fontFamily: "var(--font-mono)" }}
              >
                {`THE ${profile.id.toUpperCase()}`}
              </div>
              <h2
                className="text-3xl font-black uppercase leading-none tracking-tight sm:text-4xl"
                style={{
                  color: C.bone,
                  fontFamily: "var(--font-display)",
                  textShadow: "0 2px 20px rgba(0,0,0,0.6)",
                }}
              >
                {profile.dossier.characterName}
              </h2>
              <div
                className="mt-1 text-xs uppercase tracking-[0.15em]"
                style={{ color: `${C.bone}AA`, fontFamily: "var(--font-mono)" }}
              >
                {`${profile.dossier.cityOrigin} · ${genderLabel(profile.dossier.gender)}, age ${profile.dossier.age}`}
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 mx-auto mt-2 flex w-full max-w-3xl flex-col gap-5 px-5 pb-[120px]">
          {statusStrip(status, onReset)}

          <div
            className="relative px-4 py-3"
            style={{
              backgroundColor: `${accent}0A`,
              borderLeft: `2px solid ${accent}40`,
            }}
          >
            <div
              className="mb-2 text-[10px] uppercase tracking-[0.3em]"
              style={{ color: `${accent}CC`, fontFamily: "var(--font-mono)" }}
            >
              THE FREIBURG DOSSIER
            </div>
            <p
              className="text-base italic leading-relaxed"
              style={{ color: `${C.bone}CC`, fontFamily: "var(--font-serif)" }}
            >
              "{profile.dossier.quote}"
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {profile.statEffects.map((stat) => (
              <div
                key={stat.key}
                className="inline-flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-[0.18em]"
                style={{
                  clipPath: CLIP_BADGE,
                  backgroundColor: `${accent}1F`,
                  border: `1px solid ${accent}40`,
                  color: C.bone,
                  fontFamily: "var(--font-mono)",
                }}
              >
                <GameIcon name={stat.key.replace(/^attr_/, "")} size={14} />
                <span>{`${stat.key.replace(/^attr_/, "").replace(/_/g, " ")} +${stat.value}`}</span>
              </div>
            ))}
          </div>

          <Section
            label="SIGNATURE ABILITY"
            accent={C.brass}
            icon={<Sparkles size={14} />}
          >
            <div className="mb-1 text-base font-bold" style={{ color: C.bone }}>
              {profile.signature.title}
            </div>
            <p
              className="text-sm leading-relaxed"
              style={{ color: `${C.bone}CC` }}
            >
              {profile.signature.description}
            </p>
            <div
              className="mt-2 inline-block px-2 py-1 text-[10px] uppercase tracking-wider"
              style={{
                backgroundColor: `${C.brass}1F`,
                color: C.brass,
                border: `1px solid ${C.brass}40`,
                clipPath: CLIP_BADGE,
                fontFamily: "var(--font-mono)",
              }}
            >
              {profile.signature.passiveLabel}
            </div>
          </Section>

          <Section
            label="FATAL FLAW"
            accent={C.crimson}
            icon={getFlawIcon(profile.flaw.icon)}
          >
            <div
              className="mb-1 text-base font-bold"
              style={{ color: C.crimson }}
            >
              {profile.flaw.title}
            </div>
            <p
              className="text-sm leading-relaxed"
              style={{ color: `${C.bone}CC` }}
            >
              {profile.flaw.description}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <div
                className="px-2 py-1 text-[10px] uppercase tracking-wider"
                style={{
                  backgroundColor: `${C.crimson}1F`,
                  color: `${C.crimson}EE`,
                  border: `1px solid ${C.crimson}40`,
                  clipPath: CLIP_BADGE,
                  fontFamily: "var(--font-mono)",
                }}
              >
                {`CHECK: ${profile.flaw.checkVoice.toUpperCase()} DC ${profile.flaw.dc}`}
              </div>
              <div
                className="px-2 py-1 text-[10px] uppercase tracking-wider"
                style={{
                  backgroundColor: `${C.steel}1F`,
                  color: `${C.bone}CC`,
                  border: `1px solid ${C.steel}40`,
                  clipPath: CLIP_BADGE,
                  fontFamily: "var(--font-mono)",
                }}
              >
                {profile.flaw.durationLabel}
              </div>
            </div>
          </Section>

          <Section
            label="ADVANCEMENT PATHS"
            accent={C.steel}
            icon={<ChevronRight size={14} />}
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {profile.tracks.map((track) => (
                <div
                  key={track.id}
                  className="px-3 py-3"
                  style={{
                    backgroundColor: `${C.steel}0A`,
                    border: `1px solid ${C.steel}18`,
                    clipPath: CLIP_BADGE,
                  }}
                >
                  <div
                    className="mb-0.5 text-sm font-bold uppercase"
                    style={{ color: C.bone, fontFamily: "var(--font-display)" }}
                  >
                    {track.title}
                  </div>
                  <div
                    className="text-[10px] uppercase tracking-wide"
                    style={{
                      color: `${C.steel}DD`,
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {track.focus}
                  </div>
                  <p
                    className="mt-2 text-sm leading-relaxed"
                    style={{ color: `${C.bone}BB` }}
                  >
                    {track.description}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {track.steps.map((step, index) => (
                      <div key={`${track.id}-${step.voice}-${step.requiredXp}`}>
                        <div className="flex items-center gap-1.5">
                          <div
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: accent }}
                          />
                          <GameIcon
                            name={step.voice}
                            size={12}
                            className="opacity-90"
                          />
                          <span
                            className="text-[10px] uppercase"
                            style={{
                              color: `${C.bone}AA`,
                              fontFamily: "var(--font-mono)",
                            }}
                          >
                            {formatXp(step.requiredXp)}
                          </span>
                          {index < track.steps.length - 1 ? (
                            <span
                              className="mx-0.5 text-[10px]"
                              style={{
                                color: `${C.steel}88`,
                                fontFamily: "var(--font-mono)",
                              }}
                            >
                              {"->"}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div
                    className="mt-3 text-xs italic"
                    style={{ color: `${C.bone}CC` }}
                  >
                    {`-> ${track.finalAbilityTitle}`}
                  </div>
                  <p
                    className="mt-1 text-xs leading-relaxed"
                    style={{ color: `${C.bone}AA` }}
                  >
                    {track.finalAbilityDescription}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        </div>

        <div
          className="fixed bottom-0 left-0 right-0 z-30 px-5 pb-[max(env(safe-area-inset-bottom),1rem)] pt-3 pointer-events-none"
          style={{
            background: `linear-gradient(180deg, transparent, ${C.coal}EE 20%, ${C.coal} 100%)`,
          }}
        >
          <div className="pointer-events-auto mx-auto w-full max-w-3xl">
            <motion.button
              type="button"
              disabled={disabled}
              whileHover={disabled ? undefined : { scale: 1.02 }}
              whileTap={disabled ? undefined : { scale: 0.97 }}
              onClick={onConfirm}
              className="w-full cursor-pointer py-4 text-sm font-extrabold uppercase tracking-[0.2em] transition-all disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "15px",
                backgroundColor: accent,
                color: C.bone,
                clipPath: CLIP_BTN,
                border: `1px solid ${accent}`,
                boxShadow: `0 0 30px ${accent}30`,
              }}
            >
              BEGIN INVESTIGATION
            </motion.button>
          </div>
        </div>
      </motion.section>
    );
  },
);

const Section = ({
  label,
  accent,
  icon,
  children,
}: {
  label: string;
  accent: string;
  icon: ReactNode;
  children: ReactNode;
}) => (
  <div
    className="px-4 py-3"
    style={{
      backgroundColor: `${accent}06`,
      border: `1px solid ${accent}15`,
      clipPath: CLIP_CARD,
    }}
  >
    <div className="mb-2 flex items-center gap-2">
      <span style={{ color: accent }}>{icon}</span>
      <div
        className="text-[11px] font-semibold uppercase tracking-[0.3em]"
        style={{ color: accent, fontFamily: "var(--font-mono)" }}
      >
        {label}
      </div>
    </div>
    {children}
  </div>
);
