import { useEffect, useMemo, useState } from "react";
import type {
  ContentRatingInput,
  ContentRatingTargetType,
  QualityRatings,
} from "./useQualityRatings";
import { resolveOverallVerdict, VERDICT_COLOR, VERDICT_LABEL } from "./verdict";

export interface RatingTarget {
  type: ContentRatingTargetType;
  id: string;
  label: string;
}

const AXES: {
  key: keyof Pick<
    ContentRatingInput,
    "visualScore" | "scenicScore" | "textScore" | "overallScore"
  >;
  label: string;
}[] = [
  { key: "visualScore", label: "Визуал" },
  { key: "scenicScore", label: "Сцена" },
  { key: "textScore", label: "Текст" },
  { key: "overallScore", label: "Итого" },
];

const SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

interface VnRatingOverlayProps {
  targets: readonly RatingTarget[];
  scenarioId?: string;
  contentVersion?: string;
  ratings: QualityRatings;
  onClose: () => void;
}

export const VnRatingOverlay = ({
  targets,
  scenarioId,
  contentVersion,
  ratings,
  onClose,
}: VnRatingOverlayProps): JSX.Element => {
  const targetKey = (target: RatingTarget): string =>
    `${target.type}:${target.id}`;

  const [selectedKey, setSelectedKey] = useState<string>(
    targets[0] ? targetKey(targets[0]) : "",
  );

  const selectedTarget = useMemo(
    () =>
      targets.find((target) => targetKey(target) === selectedKey) ?? targets[0],
    [selectedKey, targets],
  );

  const existing = selectedTarget
    ? ratings.getContentRating(selectedTarget.type, selectedTarget.id)
    : undefined;

  const [visualScore, setVisualScore] = useState<number | undefined>();
  const [scenicScore, setScenicScore] = useState<number | undefined>();
  const [textScore, setTextScore] = useState<number | undefined>();
  const [overallScore, setOverallScore] = useState<number | undefined>();
  const [comment, setComment] = useState<string>("");
  const [busy, setBusy] = useState(false);

  // Hydrate the form whenever the selected target (or its stored rating) changes.
  useEffect(() => {
    setVisualScore(existing?.visualScore ?? undefined);
    setScenicScore(existing?.scenicScore ?? undefined);
    setTextScore(existing?.textScore ?? undefined);
    setOverallScore(existing?.overallScore ?? undefined);
    setComment(existing?.comment ?? "");
  }, [
    existing?.visualScore,
    existing?.scenicScore,
    existing?.textScore,
    existing?.overallScore,
    existing?.comment,
    selectedTarget?.id,
  ]);

  const axisValue: Record<string, number | undefined> = {
    visualScore,
    scenicScore,
    textScore,
    overallScore,
  };
  const axisSetter: Record<string, (value: number | undefined) => void> = {
    visualScore: setVisualScore,
    scenicScore: setScenicScore,
    textScore: setTextScore,
    overallScore: setOverallScore,
  };

  const verdict = resolveOverallVerdict(overallScore);

  const handleSubmit = async () => {
    if (!selectedTarget) {
      return;
    }
    setBusy(true);
    try {
      await ratings.submitContentRating({
        targetType: selectedTarget.type,
        targetId: selectedTarget.id,
        scenarioId,
        contentVersion,
        visualScore,
        scenicScore,
        textScore,
        overallScore,
        comment: comment.trim() || undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTarget) {
      return;
    }
    setBusy(true);
    try {
      await ratings.removeContentRating(selectedTarget.type, selectedTarget.id);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      data-testid="vn-rating-overlay"
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        width: 320,
        maxHeight: "70vh",
        overflowY: "auto",
        zIndex: 1000,
        padding: 14,
        borderRadius: 10,
        background: "#0b1120",
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
        color: "#e2e8f0",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <strong style={{ fontSize: 14 }}>Оценка контента</strong>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: "transparent",
            color: "#94a3b8",
            border: "none",
            cursor: "pointer",
            fontSize: 16,
          }}
          aria-label="Закрыть"
        >
          ✕
        </button>
      </div>

      <label style={{ fontSize: 12, color: "#94a3b8" }}>
        Цель оценки
        <select
          value={selectedTarget ? targetKey(selectedTarget) : ""}
          onChange={(event) => setSelectedKey(event.target.value)}
          style={{
            width: "100%",
            marginTop: 4,
            padding: "6px 8px",
            borderRadius: 6,
            background: "#111827",
            color: "#e2e8f0",
            border: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          {targets.map((target) => (
            <option key={targetKey(target)} value={targetKey(target)}>
              {target.label}
            </option>
          ))}
        </select>
      </label>

      <div
        style={{
          marginTop: 12,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {AXES.map((axis) => (
          <div key={axis.key}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12,
                marginBottom: 4,
              }}
            >
              <span>{axis.label}</span>
              <span style={{ color: "#64748b" }}>
                {axisValue[axis.key] ?? "—"}/10
              </span>
            </div>
            <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              {SCORES.map((score) => {
                const active = axisValue[axis.key] === score;
                return (
                  <button
                    key={score}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      axisSetter[axis.key](active ? undefined : score)
                    }
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 4,
                      cursor: "pointer",
                      fontSize: 11,
                      fontWeight: 600,
                      border: active
                        ? "1px solid #38bdf8"
                        : "1px solid rgba(255,255,255,0.12)",
                      background: active ? "#0ea5e9" : "transparent",
                      color: active ? "#0b1120" : "#cbd5e1",
                    }}
                  >
                    {score}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div
        data-testid="vn-rating-verdict"
        data-verdict={verdict}
        style={{
          marginTop: 12,
          padding: "4px 10px",
          borderRadius: 999,
          display: "inline-block",
          fontSize: 12,
          fontWeight: 600,
          color: "#0b1120",
          background: VERDICT_COLOR[verdict],
        }}
      >
        {VERDICT_LABEL[verdict]}
      </div>

      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder="Комментарий / инструкции для переделки"
        rows={3}
        style={{
          width: "100%",
          marginTop: 12,
          padding: 8,
          borderRadius: 6,
          resize: "vertical",
          background: "#111827",
          color: "#e2e8f0",
          border: "1px solid rgba(255,255,255,0.15)",
          fontSize: 12,
        }}
      />

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button
          type="button"
          disabled={busy || !selectedTarget}
          onClick={() => void handleSubmit()}
          style={{
            flex: 1,
            padding: "8px 0",
            borderRadius: 6,
            cursor: busy ? "default" : "pointer",
            border: "none",
            background: "#0ea5e9",
            color: "#0b1120",
            fontWeight: 600,
          }}
        >
          {existing ? "Обновить" : "Сохранить"}
        </button>
        {existing ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleDelete()}
            style={{
              padding: "8px 12px",
              borderRadius: 6,
              cursor: busy ? "default" : "pointer",
              border: "1px solid rgba(239,68,68,0.5)",
              background: "transparent",
              color: "#f87171",
              fontWeight: 600,
            }}
          >
            Удалить
          </button>
        ) : null}
      </div>
    </div>
  );
};
