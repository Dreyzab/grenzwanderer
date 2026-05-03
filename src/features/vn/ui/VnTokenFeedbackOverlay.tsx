import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  BookOpenText,
  FileSearch,
  NotebookPen,
  PackageCheck,
  Sparkles,
} from "lucide-react";
import "./VnTokenFeedbackOverlay.css";

export type VnTokenFeedbackVariant =
  | "clue"
  | "fact"
  | "lead"
  | "item"
  | "unknown";

export interface VnTokenFeedback {
  id: number;
  label: string;
  variant: VnTokenFeedbackVariant;
  x: number;
  y: number;
}

interface VnTokenFeedbackOverlayProps {
  feedback: VnTokenFeedback | null;
}

const variantIcon = {
  clue: FileSearch,
  fact: BookOpenText,
  lead: NotebookPen,
  item: PackageCheck,
  unknown: Sparkles,
} as const;

const variantCaption: Record<VnTokenFeedbackVariant, string> = {
  clue: "Evidence",
  fact: "Fact",
  lead: "Noted",
  item: "Inventory",
  unknown: "Marked",
};

export const VnTokenFeedbackOverlay = ({
  feedback,
}: VnTokenFeedbackOverlayProps) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {feedback ? (
        <motion.div
          key={feedback.id}
          className={[
            "vn-token-feedback",
            `vn-token-feedback--${feedback.variant}`,
          ].join(" ")}
          style={{ left: feedback.x, top: feedback.y }}
          initial={
            prefersReducedMotion
              ? { opacity: 0 }
              : { opacity: 0, scale: 0.82, y: 10 }
          }
          animate={
            prefersReducedMotion
              ? { opacity: 1 }
              : { opacity: 1, scale: 1, y: -24 }
          }
          exit={
            prefersReducedMotion
              ? { opacity: 0 }
              : { opacity: 0, scale: 0.92, y: -44 }
          }
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden="true"
        >
          <span className="vn-token-feedback__burst" />
          <span className="vn-token-feedback__icon">
            {(() => {
              const Icon = variantIcon[feedback.variant];
              return <Icon size={18} strokeWidth={2.2} />;
            })()}
          </span>
          <span className="vn-token-feedback__copy">
            <span className="vn-token-feedback__caption">
              {variantCaption[feedback.variant]}
            </span>
            <span className="vn-token-feedback__label">{feedback.label}</span>
          </span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
