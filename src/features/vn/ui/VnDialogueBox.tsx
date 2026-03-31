import React from "react";

export interface VnDialogueBoxProps {
  characterName?: string;
  body: string;
  isAutoContinue?: boolean;
}

export const VnDialogueBox: React.FC<VnDialogueBoxProps> = ({
  characterName,
  body,
  isAutoContinue,
}) => {
  return (
    <div className="vn-dialogue-box">
      {characterName && (
        <div className="vn-character-name">{characterName}</div>
      )}
      <div className="vn-narrative-text">{body}</div>
      {isAutoContinue && (
        <div className="vn-continue-hint">Tap to continue...</div>
      )}
    </div>
  );
};
