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
      {items.map((entry) => {
        const total = entry.roll + entry.voiceLevel;
        return (
          <p
            key={entry.checkId}
            className={entry.passed ? "is-success" : "is-fail"}
          >
            {`[${entry.passed ? "OK" : "X"} ${entry.voiceLabel}] ${total} vs ${entry.difficulty}`}
          </p>
        );
      })}
    </div>
  );
};
