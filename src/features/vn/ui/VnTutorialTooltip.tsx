import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BookMarked } from "lucide-react";
import type { VnStrings } from "../../i18n/uiStrings";
import "./VnTutorialTooltip.css";

interface VnTutorialTooltipProps {
  visible: boolean;
  onDismiss: () => void;
  t: VnStrings;
}

export const VnTutorialTooltip = ({
  visible,
  onDismiss,
  t,
}: VnTutorialTooltipProps) => {
  const prefersReducedMotion = useReducedMotion();

  // Simple parser to wrap parts of the string in the highlight span if needed.
  // For now, we'll just use the localized strings directly.
  // In the future, we could use a more sophisticated approach for nested tags.

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="vn-tutorial-tooltip"
          initial={
            prefersReducedMotion
              ? { opacity: 0 }
              : { opacity: 0, scale: 0.88, y: 8 }
          }
          animate={
            prefersReducedMotion
              ? { opacity: 1 }
              : { opacity: 1, scale: 1, y: 0 }
          }
          exit={
            prefersReducedMotion
              ? { opacity: 0 }
              : { opacity: 0, scale: 0.92, y: 6 }
          }
          transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          role="tooltip"
          aria-live="assertive"
        >
          <div className="vn-tutorial-tooltip__header">
            <span className="vn-tutorial-tooltip__icon">
              <BookMarked size={15} strokeWidth={2.2} />
            </span>
            <span className="vn-tutorial-tooltip__badge">
              {t.tutorialTitle}
            </span>
          </div>
          <p className="vn-tutorial-tooltip__body">{t.tutorialBody}</p>
          <span className="vn-tutorial-tooltip__hint">{t.tutorialHint}</span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
