import type { ReactNode } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import type { CharacterTabId } from "../characterScreenModel";
import type { getCharacterStrings } from "../../i18n/uiStrings";
import { C, CLIP_CARD } from "./characterPanel.theme";

interface SectionCardProps {
  eyebrow: string;
  title: string;
  accent?: string;
  children: ReactNode;
  className?: string;
}

export const SectionCard = ({
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

export const DossierTabButton = ({
  active,
  icon: Icon,
  id,
  label,
  onClick,
  t,
}: {
  active: boolean;
  icon: LucideIcon;
  id: CharacterTabId;
  label: string;
  onClick: (tabId: CharacterTabId) => void;
  t: ReturnType<typeof getCharacterStrings>;
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

export const InfoBlock = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
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

export const MetricBox = ({
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
