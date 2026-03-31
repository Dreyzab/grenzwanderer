import React from "react";

export interface PassiveCheckDisplay {
  checkId: string;
  voiceLabel: string;
  personaLabel: string;
  interventionSummary: string;
  passed: boolean;
  difficulty: number;
  roll: number;
  voiceLevel: number;
}

export interface VnPassiveOverlayProps {
  items: PassiveCheckDisplay[];
}

export const VnPassiveOverlay: React.FC<VnPassiveOverlayProps> = ({
  items,
}) => {
  return (
    <div className="vn-passive-overlay">
      {items.map((item) => (
        <div
          key={item.checkId}
          className={`vn-passive-item ${item.passed ? "passed" : "failed"}`}
        >
          <div className="vn-passive-voice">
            {item.voiceLabel} ({item.personaLabel})
          </div>
          <div className="vn-passive-desc">{item.interventionSummary}</div>
          <div className="vn-passive-details">
            Roll: {item.roll} + {item.voiceLevel} vs {item.difficulty}
          </div>
          <div className="vn-passive-outcome">
            {item.passed ? "Check Passed" : "Unknown"}
          </div>
        </div>
      ))}
    </div>
  );
};
