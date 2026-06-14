import { useMemo, useState } from "react";
import {
  FEEDBACK_OUTPUT_LANGUAGES,
  parseFeedbackAnalysisReportV1,
  type FeedbackAnalysisReportV1,
  type FeedbackFinding,
  type FeedbackOutputLanguage,
} from "../../ai/contracts";
import type { FeedbackAnalysisReport } from "../../../shared/spacetime/bindings";
import { useFeedbackCenter, type FeedbackRunInput } from "./useFeedbackCenter";

const microsToLabel = (micros: bigint): string =>
  new Date(Number(micros / 1000n)).toLocaleString();

const localInputToMicros = (value: string): number | undefined => {
  if (!value) {
    return undefined;
  }
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms * 1000 : undefined;
};

const LANGUAGE_LABELS: Record<FeedbackOutputLanguage, string> = {
  en: "English",
  ru: "Русский",
  de: "Deutsch",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "В обработке",
  ready: "Готов",
  failed: "Ошибка",
};

const card: React.CSSProperties = {
  background: "#111827",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 10,
  padding: 16,
};

const field: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  fontSize: 12,
  color: "#94a3b8",
};

const input: React.CSSProperties = {
  padding: "6px 8px",
  borderRadius: 6,
  background: "#0b1120",
  color: "#e2e8f0",
  border: "1px solid rgba(255,255,255,0.15)",
  fontSize: 13,
};

const button: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 6,
  border: "none",
  background: "#0ea5e9",
  color: "#0b1120",
  fontWeight: 600,
  cursor: "pointer",
};

const FindingBlock = ({
  finding,
}: {
  finding: FeedbackFinding;
}): JSX.Element => (
  <div
    style={{
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 8,
      padding: 10,
      marginBottom: 8,
    }}
  >
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
      <strong>{finding.title}</strong>
      <span style={{ fontSize: 11, color: "#94a3b8" }}>
        {finding.severity} · {Math.round(finding.confidence * 100)}%
      </span>
    </div>
    <p style={{ fontSize: 13, margin: "6px 0" }}>{finding.detail}</p>
    {finding.affectedTargets.length > 0 ? (
      <p style={{ fontSize: 11, color: "#64748b" }}>
        Цели: {finding.affectedTargets.join(", ")}
      </p>
    ) : null}
    {finding.quotes.map((quote, index) => (
      <blockquote
        key={`${quote.evidenceId}-${index}`}
        style={{
          margin: "6px 0 0",
          padding: "4px 8px",
          borderLeft: "2px solid #38bdf8",
          fontSize: 12,
          color: "#cbd5e1",
        }}
      >
        «{quote.text}»{" "}
        <span style={{ color: "#64748b" }}>[{quote.evidenceId}]</span>
      </blockquote>
    ))}
  </div>
);

const Section = ({
  title,
  findings,
}: {
  title: string;
  findings: FeedbackFinding[];
}): JSX.Element | null =>
  findings.length > 0 ? (
    <section style={{ marginTop: 12 }}>
      <h4 style={{ margin: "0 0 6px" }}>{title}</h4>
      {findings.map((finding, index) => (
        <FindingBlock key={index} finding={finding} />
      ))}
    </section>
  ) : null;

const ReportDetail = ({
  report,
  result,
  evidence,
  onReanalyze,
  onMarkReviewed,
  onSaveNote,
}: {
  report: FeedbackAnalysisReport;
  result: FeedbackAnalysisReportV1 | null;
  evidence: {
    evidenceId: string;
    kind: string;
    targetType: string;
    targetId: string;
    comment?: string;
    scoresJson: string;
  }[];
  onReanalyze: () => void;
  onMarkReviewed: () => void;
  onSaveNote: (note: string) => void;
}): JSX.Element => {
  const [note, setNote] = useState(report.developerNote ?? "");

  return (
    <div style={card}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3 style={{ margin: 0 }}>
          Отчёт v{report.version}{" "}
          <span style={{ fontSize: 12, color: "#94a3b8" }}>
            · {STATUS_LABELS[report.status] ?? report.status} ·{" "}
            {report.reviewState === "reviewed" ? "просмотрен" : "не просмотрен"}{" "}
            · {report.sourceCount} отзывов · {report.outputLanguage}
          </span>
        </h3>
        <div style={{ display: "flex", gap: 8 }}>
          {report.reviewState !== "reviewed" ? (
            <button type="button" style={button} onClick={onMarkReviewed}>
              Отметить просмотренным
            </button>
          ) : null}
          <button
            type="button"
            style={{ ...button, background: "#334155", color: "#e2e8f0" }}
            onClick={onReanalyze}
          >
            Повторный анализ
          </button>
        </div>
      </div>

      {report.status === "failed" ? (
        <p style={{ color: "#f87171" }}>
          Ошибка: {report.error ?? "неизвестно"}
        </p>
      ) : null}
      {report.status === "pending" ? (
        <p style={{ color: "#fbbf24" }}>Анализ выполняется…</p>
      ) : null}

      {result ? (
        <div style={{ marginTop: 8 }}>
          <p style={{ fontSize: 13 }}>
            <strong>Охват:</strong> {result.coverageSummary}
          </p>
          <p style={{ fontSize: 13 }}>
            <strong>Статистика:</strong> {result.ratingStatsSummary}
          </p>
          <Section title="Сильные стороны" findings={result.strengths} />
          <Section
            title="Тематические выводы"
            findings={result.thematicFindings}
          />
          <Section title="Расхождения мнений" findings={result.opinionSplits} />
          {result.dataGaps.length > 0 ? (
            <section style={{ marginTop: 12 }}>
              <h4 style={{ margin: "0 0 6px" }}>Пробелы данных</h4>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
                {result.dataGaps.map((gap, index) => (
                  <li key={index}>{gap}</li>
                ))}
              </ul>
            </section>
          ) : null}
          {result.followupQuestions.length > 0 ? (
            <section style={{ marginTop: 12 }}>
              <h4 style={{ margin: "0 0 6px" }}>Вопросы для исследования</h4>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
                {result.followupQuestions.map((question, index) => (
                  <li key={index}>{question}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      ) : null}

      <section style={{ marginTop: 16 }}>
        <h4 style={{ margin: "0 0 6px" }}>
          Исходные отзывы ({evidence.length})
        </h4>
        <div style={{ maxHeight: 220, overflowY: "auto" }}>
          {evidence.map((source) => (
            <div
              key={source.evidenceId}
              style={{ fontSize: 12, padding: "4px 0", color: "#cbd5e1" }}
            >
              <span style={{ color: "#64748b" }}>[{source.evidenceId}]</span>{" "}
              {source.kind} · {source.targetType}:{source.targetId} ·{" "}
              {source.scoresJson}
              {source.comment
                ? ` — «${source.comment}»`
                : " — (без комментария)"}
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 16 }}>
        <h4 style={{ margin: "0 0 6px" }}>Заметка разработчика</h4>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          style={{ ...input, width: "100%", resize: "vertical" }}
        />
        <button
          type="button"
          style={{ ...button, marginTop: 6 }}
          onClick={() => onSaveNote(note)}
        >
          Сохранить заметку
        </button>
      </section>
    </div>
  );
};

export const FeedbackCenter = (): JSX.Element => {
  const center = useFeedbackCenter();
  const [contentVersion, setContentVersion] = useState("");
  const [scenarioId, setScenarioId] = useState("");
  const [targetType, setTargetType] = useState("");
  const [targetId, setTargetId] = useState("");
  const [fromValue, setFromValue] = useState("");
  const [toValue, setToValue] = useState("");
  const [outputLanguage, setOutputLanguage] =
    useState<FeedbackOutputLanguage>("ru");
  const [selectedReportId, setSelectedReportId] = useState<bigint | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sortedReports = useMemo(
    () =>
      [...center.reports].sort((left, right) =>
        right.createdAt.microsSinceUnixEpoch >
        left.createdAt.microsSinceUnixEpoch
          ? 1
          : -1,
      ),
    [center.reports],
  );

  const selectedReport = useMemo(
    () =>
      selectedReportId === null
        ? null
        : (center.reports.find(
            (report) => report.reportId === selectedReportId,
          ) ?? null),
    [center.reports, selectedReportId],
  );

  const selectedResult = useMemo(
    () =>
      selectedReport?.resultJson
        ? parseFeedbackAnalysisReportV1(selectedReport.resultJson)
        : null,
    [selectedReport],
  );

  const selectedEvidence = useMemo(() => {
    if (!selectedReport) {
      return [];
    }
    return center.sources
      .filter((source) => source.reportId === selectedReport.reportId)
      .map((source) => ({
        evidenceId: source.evidenceId,
        kind: source.kind,
        targetType: source.targetType,
        targetId: source.targetId,
        comment: source.comment ?? undefined,
        scoresJson: source.scoresJson,
      }));
  }, [center.sources, selectedReport]);

  const runAction = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setBusy(false);
    }
  };

  const handleRun = () => {
    const payload: FeedbackRunInput = {
      contentVersion: contentVersion || undefined,
      scenarioId: scenarioId || undefined,
      targetType: targetType || undefined,
      targetId: targetId || undefined,
      fromMicros: localInputToMicros(fromValue),
      toMicros: localInputToMicros(toValue),
      outputLanguage,
    };
    void runAction(() => center.runAnalysis(payload));
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Feedback Center</h1>
      <p style={{ color: "#94a3b8", marginTop: 0 }}>
        Запуск анализа среза отзывов (≤100). Каждый запуск создаёт новую
        неизменяемую версию отчёта.
      </p>

      {error ? (
        <div
          style={{
            ...card,
            borderColor: "rgba(248,113,113,0.5)",
            color: "#fca5a5",
            marginBottom: 12,
          }}
        >
          {error}
        </div>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(280px, 360px) 1fr",
          gap: 16,
          alignItems: "start",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={card}>
            <h3 style={{ marginTop: 0 }}>Новый запуск</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <label style={field}>
                Версия контента
                <select
                  style={input}
                  value={contentVersion}
                  onChange={(event) => setContentVersion(event.target.value)}
                >
                  <option value="">Любая</option>
                  {center.contentVersions.map((version) => (
                    <option key={version.version} value={version.version}>
                      {version.version}
                      {version.isActive ? " (активная)" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label style={field}>
                Сценарий (id)
                <input
                  style={input}
                  value={scenarioId}
                  onChange={(event) => setScenarioId(event.target.value)}
                  placeholder="например, case01"
                />
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <label style={{ ...field, flex: 1 }}>
                  Тип цели
                  <input
                    style={input}
                    value={targetType}
                    onChange={(event) => setTargetType(event.target.value)}
                    placeholder="node"
                  />
                </label>
                <label style={{ ...field, flex: 1 }}>
                  Id цели
                  <input
                    style={input}
                    value={targetId}
                    onChange={(event) => setTargetId(event.target.value)}
                    placeholder="node_a"
                  />
                </label>
              </div>
              <label style={field}>
                С (период)
                <input
                  style={input}
                  type="datetime-local"
                  value={fromValue}
                  onChange={(event) => setFromValue(event.target.value)}
                />
              </label>
              <label style={field}>
                По (период)
                <input
                  style={input}
                  type="datetime-local"
                  value={toValue}
                  onChange={(event) => setToValue(event.target.value)}
                />
              </label>
              <label style={field}>
                Язык анализа
                <select
                  style={input}
                  value={outputLanguage}
                  onChange={(event) =>
                    setOutputLanguage(
                      event.target.value as FeedbackOutputLanguage,
                    )
                  }
                >
                  {FEEDBACK_OUTPUT_LANGUAGES.map((language) => (
                    <option key={language} value={language}>
                      {LANGUAGE_LABELS[language]}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                style={{ ...button, opacity: busy ? 0.6 : 1 }}
                disabled={busy}
                onClick={handleRun}
              >
                Запустить анализ
              </button>
            </div>
          </div>

          <div style={card}>
            <h3 style={{ marginTop: 0 }}>Отчёты ({sortedReports.length})</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {sortedReports.map((report) => {
                const active = report.reportId === selectedReportId;
                return (
                  <button
                    key={report.reportId.toString()}
                    type="button"
                    onClick={() => setSelectedReportId(report.reportId)}
                    style={{
                      textAlign: "left",
                      padding: "8px 10px",
                      borderRadius: 6,
                      cursor: "pointer",
                      border: active
                        ? "1px solid #38bdf8"
                        : "1px solid rgba(255,255,255,0.12)",
                      background: active
                        ? "rgba(14,165,233,0.15)"
                        : "transparent",
                      color: "#e2e8f0",
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                      v{report.version} ·{" "}
                      {STATUS_LABELS[report.status] ?? report.status}
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>
                      {report.sourceCount} отзывов ·{" "}
                      {microsToLabel(report.createdAt.microsSinceUnixEpoch)}
                      {report.reviewState === "reviewed" ? " · ✓" : ""}
                    </div>
                  </button>
                );
              })}
              {sortedReports.length === 0 ? (
                <p style={{ color: "#64748b", fontSize: 13 }}>
                  Отчётов пока нет.
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div>
          {selectedReport ? (
            <ReportDetail
              report={selectedReport}
              result={selectedResult}
              evidence={selectedEvidence}
              onReanalyze={() =>
                void runAction(() => center.reanalyze(selectedReport.reportId))
              }
              onMarkReviewed={() =>
                void runAction(() =>
                  center.markReviewed(selectedReport.reportId),
                )
              }
              onSaveNote={(note) =>
                void runAction(() =>
                  center.saveNote(selectedReport.reportId, note),
                )
              }
            />
          ) : (
            <div style={{ ...card, color: "#64748b" }}>
              Выберите отчёт слева или запустите новый анализ.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
