import { useCallback, useEffect, useState } from "react";
import type { DialogueLineKey } from "./lineKey";
import { resolveDialogueVerdict } from "./verdict";

const SCORES = [1, 2, 3, 4, 5] as const;

const VERDICT_HINT: Record<number, string> = {
  1: "Заменить",
  2: "Переосмыслить",
  3: "Переосмыслить",
  4: "Переосмыслить",
  5: "Сохранить",
};

interface VnDialogueRatingProps {
  speakerLabel: string;
  text: string;
  line: DialogueLineKey;
  currentScore: number | undefined;
  currentComment?: string;
  onRate: (line: DialogueLineKey, score: number, comment?: string) => void;
  onClear: (line: DialogueLineKey) => void;
  onSaveComment: (
    line: DialogueLineKey,
    score: number,
    comment?: string,
  ) => void;
}

export const VnDialogueRating = ({
  speakerLabel,
  text,
  line,
  currentScore,
  currentComment,
  onRate,
  onClear,
  onSaveComment,
}: VnDialogueRatingProps): JSX.Element => {
  const [draftComment, setDraftComment] = useState<string>("");

  useEffect(() => {
    setDraftComment(currentComment ?? "");
  }, [currentComment, line.lineKey]);

  const handleRate = useCallback(
    (score: number) => {
      if (currentScore === score) {
        onClear(line);
      } else {
        onRate(line, score, draftComment.trim() || undefined);
      }
    },
    [currentScore, draftComment, line, onClear, onRate],
  );

  const handleSaveComment = useCallback(() => {
    if (currentScore === undefined) {
      return;
    }
    onSaveComment(line, currentScore, draftComment.trim() || undefined);
  }, [currentScore, draftComment, line, onSaveComment]);

  const verdict = resolveDialogueVerdict(currentScore);
  const commentDirty = draftComment.trim() !== (currentComment ?? "");

  return (
    <div
      data-testid="vn-dialogue-rating"
      data-line-key={line.lineKey}
      data-verdict={verdict}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        padding: "6px 8px",
        borderRadius: 6,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div style={{ fontSize: 12, color: "#cbd5e1" }}>
        <strong style={{ color: "#e2e8f0" }}>{speakerLabel}</strong>
        <span style={{ marginLeft: 6, opacity: 0.8 }}>
          {text.length > 90 ? `${text.slice(0, 90)}…` : text}
        </span>
      </div>
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        {SCORES.map((score) => {
          const active = currentScore === score;
          return (
            <button
              key={score}
              type="button"
              title={VERDICT_HINT[score]}
              aria-pressed={active}
              onClick={() => handleRate(score)}
              style={{
                width: 26,
                height: 26,
                borderRadius: 4,
                cursor: "pointer",
                border: active
                  ? "1px solid #38bdf8"
                  : "1px solid rgba(255,255,255,0.15)",
                background: active ? "#0ea5e9" : "transparent",
                color: active ? "#0b1120" : "#cbd5e1",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {score}
            </button>
          );
        })}
        {currentScore !== undefined ? (
          <span style={{ marginLeft: 6, fontSize: 11, color: "#94a3b8" }}>
            {VERDICT_HINT[currentScore]}
          </span>
        ) : null}
      </div>
      {currentScore !== undefined ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <textarea
            value={draftComment}
            onChange={(event) => setDraftComment(event.target.value)}
            placeholder="Комментарий / инструкции для переделки"
            rows={2}
            style={{
              width: "100%",
              padding: 6,
              borderRadius: 6,
              resize: "vertical",
              background: "#111827",
              color: "#e2e8f0",
              border: "1px solid rgba(255,255,255,0.15)",
              fontSize: 11,
            }}
          />
          <button
            type="button"
            disabled={!commentDirty}
            onClick={handleSaveComment}
            style={{
              alignSelf: "flex-start",
              padding: "4px 10px",
              borderRadius: 4,
              cursor: commentDirty ? "pointer" : "default",
              border: "none",
              background: commentDirty ? "#0ea5e9" : "rgba(255,255,255,0.08)",
              color: commentDirty ? "#0b1120" : "#64748b",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            Сохранить
          </button>
        </div>
      ) : null}
    </div>
  );
};
