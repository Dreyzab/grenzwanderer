import React from "react";
import type { VnSkillCheckResolveState } from "../hooks/useVnSkillChecks";

export interface VnSkillCheckOverlayProps {
  resolve: VnSkillCheckResolveState;
}

export const VnSkillCheckOverlay: React.FC<VnSkillCheckOverlayProps> = ({
  resolve,
}) => {
  return (
    <div className={`vn-skill-overlay ${resolve.phase}`}>
      <div className="vn-skill-check-card">
        <h2>{resolve.voiceLabel} Check</h2>
        <div className="vn-check-difficulty">Target: {resolve.difficulty}</div>
        <div className="vn-dice-roll">
          {resolve.phase === "rolling" ? (
            <span className="rolling-animation">Rolling...</span>
          ) : (
            <span
              className={`roll-result ${resolve.passed ? "passed" : "failed"}`}
            >
              {resolve.roll}
            </span>
          )}
        </div>
        <div className="vn-skill-bonus">Bonus: +{resolve.voiceLevel}</div>
        <div className="vn-check-outcome">
          {resolve.phase === "result" && (
            <div
              className={resolve.passed ? "outcome-success" : "outcome-failure"}
            >
              {resolve.passed ? "Success!" : "Failure"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
