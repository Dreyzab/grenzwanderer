import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CalendarClock, MapPin, Package, Sparkles, User } from "lucide-react";
import type { VnStrings } from "../../i18n/uiStrings";
import type { JournalToastData } from "../hooks/useVnTutorialState";
import type { FactCategory } from "../data/factRegistry";
import "./VnJournalEntryToast.css";

interface VnJournalEntryToastProps {
  toast: JournalToastData | null;
  t: VnStrings;
  onDismiss: () => void;
}

const TOAST_DURATION_MS = 3200;

const categoryIcon: Record<FactCategory, typeof MapPin> = {
  location: MapPin,
  person: User,
  object: Package,
  event: CalendarClock,
};

const categoryLabel: Record<FactCategory, string> = {
  location: "Location",
  person: "Person",
  object: "Object",
  event: "Event",
};

export const VnJournalEntryToast = ({
  toast,
  t,
  onDismiss,
}: VnJournalEntryToastProps) => {
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(onDismiss, TOAST_DURATION_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [toast, onDismiss]);

  return (
    <AnimatePresence>
      {toast ? (
        <motion.div
          key={toast.id}
          className="vn-journal-toast"
          initial={
            prefersReducedMotion
              ? { opacity: 0 }
              : { opacity: 0, y: 40, scale: 0.92 }
          }
          animate={
            prefersReducedMotion
              ? { opacity: 1 }
              : { opacity: 1, y: 0, scale: 1 }
          }
          exit={
            prefersReducedMotion
              ? { opacity: 0 }
              : { opacity: 0, y: -20, scale: 0.95 }
          }
          transition={{ duration: 0.44, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          role="status"
          aria-live="polite"
        >
          <div className="vn-journal-toast__recorded">
            {t.journalEntryRecorded}
          </div>
          <div
            className={[
              "vn-journal-toast__icon",
              `vn-journal-toast__icon--${toast.fact.category}`,
            ].join(" ")}
          >
            {(() => {
              const Icon = categoryIcon[toast.fact.category];
              return <Icon size={20} strokeWidth={2} />;
            })()}
          </div>

          <div className="vn-journal-toast__content">
            <span className="vn-journal-toast__category">
              {categoryLabel[toast.fact.category]}
            </span>
            <span className="vn-journal-toast__name">
              {toast.fact.displayName}
            </span>
            <span className="vn-journal-toast__desc">
              {toast.fact.shortDescription}
            </span>
            <span className="vn-journal-toast__hint">
              {t.journalEntryOpenHint}
            </span>
          </div>

          <div className="vn-journal-toast__xp">
            <Sparkles
              size={14}
              strokeWidth={2.2}
              className="vn-journal-toast__xp-icon"
            />
            +{toast.fact.xpReward}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
