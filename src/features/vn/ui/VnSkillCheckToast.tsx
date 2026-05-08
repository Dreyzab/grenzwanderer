import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import type { VnSkillCheckToastData } from "../vnScreenTypes";
import "./VnSkillCheckFeedback.css";

interface VnSkillCheckToastProps {
  toast: VnSkillCheckToastData | null;
  onClose: () => void;
}

export const VnSkillCheckToast = ({
  toast,
  onClose,
}: VnSkillCheckToastProps) => {
  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      onClose();
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [onClose, toast]);

  return (
    <AnimatePresence>
      {toast ? (
        <motion.aside
          key={toast.resultKey}
          className={[
            "vn-skill-toast",
            toast.passed ? "is-success" : "is-fail",
          ].join(" ")}
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, x: 18, y: -8, scale: 0.97 }}
          animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
          exit={{ opacity: 0, x: 14, y: -8, scale: 0.98 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <p className="vn-skill-toast__eyebrow">
            {toast.passed ? "Read the room" : "Pressure cracks"}
          </p>
          <p className="vn-skill-toast__title">{`${toast.voiceLabel} Check`}</p>
          {toast.choiceText ? (
            <p className="vn-skill-toast__meta">{toast.choiceText}</p>
          ) : null}
          <p className="vn-skill-toast__formula">
            {`Roll ${toast.roll} + ${toast.voiceLevel} vs DC ${toast.difficulty}`}
          </p>
          {toast.chancePercent !== undefined ? (
            <p className="vn-skill-toast__meta">{`Predicted chance ${toast.chancePercent}%`}</p>
          ) : null}
          <p className="vn-skill-toast__result">
            {toast.passed ? "Success" : "Fail"}
          </p>
          {toast.skillProgress ? (
            <div
              className={[
                "vn-skill-toast__progress",
                toast.skillProgress.rankUp ? "is-rank-up" : "",
              ].join(" ")}
            >
              <p className="vn-skill-toast__progress-title">
                {toast.skillProgress.rankUp
                  ? `${toast.skillProgress.skillLabel} rank up: ${toast.skillProgress.rankBefore.rank} -> ${toast.skillProgress.rankAfter.rank}`
                  : `${toast.skillProgress.skillLabel} practice +${toast.skillProgress.xpGained} XP`}
              </p>
              <p className="vn-skill-toast__progress-meta">
                {`${toast.skillProgress.rankAfter.rank} ${toast.skillProgress.rankAfter.progress} / ${toast.skillProgress.rankAfter.progressMax} | ${toast.skillProgress.totalXp} XP`}
              </p>
            </div>
          ) : null}
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
};
