import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  devLogger,
  isDevLoggerEnabled,
  safeStringify,
  type DevLogEntry,
} from "./devLogger";

const Z_BUTTON = 2147483000;
const Z_MODAL = 2147483001;

const categoryColor = (category: DevLogEntry["category"]): string => {
  switch (category) {
    case "error":
      return "#fca5a5";
    case "navigation":
      return "#93c5fd";
    case "user-action":
      return "#fcd34d";
    default:
      return "#e5e7eb";
  }
};

const buttonBase: CSSProperties = {
  padding: "6px 12px",
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
};

const btnPrimary: CSSProperties = {
  ...buttonBase,
  background: "#2563eb",
  color: "white",
  border: "1px solid #1d4ed8",
};

const btnSecondary: CSSProperties = {
  ...buttonBase,
  background: "transparent",
  color: "#9ca3af",
  border: "1px solid #374151",
  fontWeight: 500,
};

export const DebugOverlay = () => {
  const enabled = isDevLoggerEnabled();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [entries, setEntries] = useState<DevLogEntry[]>(() =>
    devLogger.getRecent(),
  );
  const [copyState, setCopyState] = useState<"idle" | "ok" | "err">("idle");
  const [allMode, setAllMode] = useState(false);
  const [persisted, setPersisted] = useState<DevLogEntry[] | null>(null);

  useEffect(() => {
    if (!enabled) return;
    return devLogger.subscribe(setEntries);
  }, [enabled]);

  useEffect(() => {
    if (!allMode) {
      setPersisted(null);
      return;
    }
    let cancelled = false;
    void devLogger.getPersisted(500).then((rows) => {
      if (!cancelled) setPersisted(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [allMode]);

  const visible = useMemo(
    () => (allMode && persisted ? persisted : entries),
    [allMode, persisted, entries],
  );
  const errorCount = useMemo(
    () => entries.filter((e) => e.category === "error").length,
    [entries],
  );

  if (!enabled) return null;

  const buildReport = () => ({
    description: description || "(no description)",
    capturedAt: new Date().toISOString(),
    sessionId: devLogger.getSessionId(),
    url: typeof window !== "undefined" ? window.location.href : "",
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    eventsCount: visible.length,
    events: visible,
  });

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(safeStringify(buildReport(), 2));
      setCopyState("ok");
      setTimeout(() => setCopyState("idle"), 1500);
    } catch {
      setCopyState("err");
      setTimeout(() => setCopyState("idle"), 1500);
    }
  };

  const onDownload = () => {
    const json = safeStringify(buildReport(), 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `debug-report-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const onClear = async () => {
    if (
      typeof window !== "undefined" &&
      !window.confirm("Очистить весь лог (включая прошлые сессии)?")
    ) {
      return;
    }
    await devLogger.clear();
    setPersisted([]);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-testid="dev-debug-button"
        style={{
          position: "fixed",
          bottom: 16,
          right: 16,
          zIndex: Z_BUTTON,
          padding: "8px 14px",
          borderRadius: 999,
          background: errorCount > 0 ? "#b91c1c" : "#1f2937",
          color: "#f9fafb",
          border: `1px solid ${errorCount > 0 ? "#dc2626" : "#4b5563"}`,
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        🐛 Debug{errorCount > 0 ? ` (${errorCount})` : ""}
      </button>

      {open && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            zIndex: Z_MODAL,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <div
            style={{
              background: "#111827",
              color: "#f9fafb",
              borderRadius: 12,
              border: "1px solid #374151",
              width: "min(900px, 100%)",
              maxHeight: "calc(100vh - 48px)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              fontFamily: "ui-sans-serif, system-ui, sans-serif",
              fontSize: 13,
            }}
          >
            <header
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid #374151",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <strong>Debug Report</strong>
              <button
                type="button"
                aria-label="Закрыть"
                onClick={() => setOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#9ca3af",
                  fontSize: 18,
                  cursor: "pointer",
                  padding: 4,
                }}
              >
                ✕
              </button>
            </header>

            <div
              style={{
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 12,
                overflow: "auto",
              }}
            >
              <label
                style={{ display: "flex", flexDirection: "column", gap: 4 }}
              >
                <span style={{ color: "#9ca3af" }}>Что случилось?</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Опишите шаги: что вы делали, что ожидали, что получили..."
                  style={{
                    background: "#1f2937",
                    color: "#f9fafb",
                    border: "1px solid #374151",
                    borderRadius: 6,
                    padding: 8,
                    resize: "vertical",
                    fontFamily: "inherit",
                    fontSize: 13,
                  }}
                />
              </label>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  flexWrap: "wrap",
                  color: "#9ca3af",
                }}
              >
                <span>Events: {visible.length}</span>
                <span>session: {devLogger.getSessionId().slice(0, 8)}</span>
                <label
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <input
                    type="checkbox"
                    checked={allMode}
                    onChange={(e) => setAllMode(e.target.checked)}
                  />
                  показать прошлые сессии (до 500)
                </label>
              </div>

              <div
                style={{
                  background: "#0b1220",
                  border: "1px solid #1f2937",
                  borderRadius: 6,
                  padding: 8,
                  maxHeight: 360,
                  overflow: "auto",
                  fontFamily: "ui-monospace, SFMono-Regular, monospace",
                  fontSize: 12,
                  lineHeight: 1.5,
                }}
              >
                {visible.length === 0 ? (
                  <div style={{ color: "#6b7280" }}>Нет событий</div>
                ) : (
                  visible.map((entry, idx) => (
                    <div
                      key={`${entry.timestamp}-${idx}`}
                      style={{
                        borderBottom: "1px dashed #1f2937",
                        padding: "4px 0",
                        color: categoryColor(entry.category),
                      }}
                    >
                      <span style={{ color: "#6b7280" }}>
                        {new Date(entry.timestamp).toISOString().slice(11, 23)}
                      </span>{" "}
                      <span style={{ fontWeight: 600 }}>
                        [{entry.category}]
                      </span>{" "}
                      <span>{entry.message}</span>
                      {entry.data !== undefined && entry.data !== null ? (
                        <div style={{ color: "#9ca3af", paddingLeft: 14 }}>
                          {safeStringify(entry.data)}
                        </div>
                      ) : null}
                      {entry.stack ? (
                        <pre
                          style={{
                            color: "#fda4af",
                            paddingLeft: 14,
                            margin: 0,
                            whiteSpace: "pre-wrap",
                            fontSize: 11,
                          }}
                        >
                          {entry.stack}
                        </pre>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>

            <footer
              style={{
                padding: "12px 16px",
                borderTop: "1px solid #374151",
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                justifyContent: "flex-end",
              }}
            >
              <button type="button" onClick={onClear} style={btnSecondary}>
                Очистить лог
              </button>
              <button type="button" onClick={onCopy} style={btnPrimary}>
                {copyState === "ok"
                  ? "✓ Скопировано"
                  : copyState === "err"
                    ? "✗ Ошибка копирования"
                    : "Скопировать"}
              </button>
              <button type="button" onClick={onDownload} style={btnPrimary}>
                Скачать .json
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
};
