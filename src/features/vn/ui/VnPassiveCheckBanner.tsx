import { AnimatePresence, motion } from "framer-motion";
import "./VnSkillCheckFeedback.css";

export interface PassiveCheckDisplay {
  checkId: string;
  voiceLabel: string;
  passed: boolean;
  difficulty: number;
  roll: number;
  voiceLevel: number;
}

interface VnPassiveCheckBannerProps {
  items: PassiveCheckDisplay[];
}

export const VnPassiveCheckBanner = ({ items }: VnPassiveCheckBannerProps) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="vn-passive-banner" role="status" aria-live="polite">
      <AnimatePresence initial={false}>
        {items.map((entry) => {
          const total = entry.roll + entry.voiceLevel;
          return (
            <motion.article
              key={entry.checkId}
              className={[
                "vn-passive-card",
                entry.passed ? "is-success" : "is-fail",
              ].join(" ")}
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <p className="vn-passive-card__eyebrow">Passive Check</p>
              <div className="vn-passive-card__row">
                <p className="vn-passive-card__voice">{entry.voiceLabel}</p>
                <p className="vn-passive-card__result">
                  {entry.passed ? "Success" : "Fail"}
                </p>
              </div>
              <p className="vn-passive-card__formula">
                {`${total} vs DC ${entry.difficulty}`}
              </p>
            </motion.article>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
