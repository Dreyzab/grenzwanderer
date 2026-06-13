import React from "react";
import type { VnChoice } from "../types";
import {
  formatSkillCheckDifficulty,
  getSkillCheckVoicePalette,
} from "../skillCheckPalette";
import { getVoicePresentation } from "../voicePresentation";

interface VnChoiceListProps {
  choices: VnChoice[];
  parliamentPresetId?: string;
  onChoiceSelect: (choice: VnChoice) => void;
  disabled?: boolean;
}

export const VnChoiceList: React.FC<VnChoiceListProps> = ({
  choices,
  parliamentPresetId,
  onChoiceSelect,
  disabled,
}) => {
  return (
    <div className="vn-choices">
      {choices.map((choice) => {
        const check = choice.skillCheck;
        const palette = check ? getSkillCheckVoicePalette(check.voiceId) : null;

        return (
          <button
            key={choice.id}
            onClick={() => onChoiceSelect(choice)}
            disabled={disabled}
            className={`vn-choice-item ${check ? "is-skill-check" : ""}`}
            style={
              palette
                ? ({
                    "--accent": palette.accent,
                    "--accent-soft": palette.accentSoft,
                    "--glow": palette.glow,
                    "--glow-strong": palette.glowStrong,
                    "--text-color": palette.text,
                  } as React.CSSProperties)
                : undefined
            }
          >
            {check && (
              <span className="skill-badge">
                [{getVoicePresentation(check.voiceId, parliamentPresetId).label}
                : {formatSkillCheckDifficulty(check.difficulty)}]
              </span>
            )}
            <span className="choice-text">{choice.text}</span>
          </button>
        );
      })}
    </div>
  );
};
