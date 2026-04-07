import { useMemo } from "react";
import { useTable } from "spacetimedb/react";
import { APP_VERSION } from "../config";
import { tables } from "../shared/spacetime/bindings";
import { useIdentity } from "../shared/spacetime/useIdentity";

const ONE_SECOND_MICROS = 1_000_000n;
const ONE_MINUTE_MICROS = 60n * ONE_SECOND_MICROS;
const FIFTEEN_MINUTES_MICROS = 15n * ONE_MINUTE_MICROS;
const NINETY_SECONDS_MICROS = 90n * ONE_SECOND_MICROS;
const ONE_DAY_MICROS = 24n * 60n * ONE_MINUTE_MICROS;
const EMPTY_ROWS: any[] = [];

const TELEMETRY_EVENT_LABELS: Record<string, string> = {
  scenario_started: "Scenarios started",
  choice_recorded: "Choices recorded",
  transition_rejected: "VN rejections",
  map_interaction_rejected: "Map rejects",
  ai_request_enqueued: "AI enqueued",
  ai_request_delivered: "AI delivered",
};

const TELEMETRY_EVENT_ORDER = [
  "scenario_started",
  "choice_recorded",
  "transition_rejected",
  "map_interaction_rejected",
  "ai_request_enqueued",
  "ai_request_delivered",
];

const timestampMicros = (
  value: { microsSinceUnixEpoch: bigint } | null | undefined,
): bigint => value?.microsSinceUnixEpoch ?? 0n;

const timestampToDateTime = (
  value: { microsSinceUnixEpoch: bigint } | null | undefined,
): string => {
  const micros = timestampMicros(value);
  if (micros === 0n) {
    return "n/a";
  }

  return new Date(Number(micros / 1000n)).toLocaleString();
};

const unwrapOptionalString = (value: unknown): string | null => {
  if (typeof value === "string") {
    return value;
  }

  if (!value || typeof value !== "object" || !("tag" in value)) {
    return null;
  }

  const tagged = value as { tag?: string; value?: unknown };
  return tagged.tag === "some" && typeof tagged.value === "string"
    ? tagged.value
    : null;
};

const identityLabel = (identityHex: string): string => {
  if (!identityHex) {
    return "unknown";
  }

  return `${identityHex.slice(0, 8)}...${identityHex.slice(-4)}`;
};

const formatTabLabel = (tabId: string): string =>
  tabId
    .split("_")
    .map((segment) =>
      segment.length > 0 ? segment[0].toUpperCase() + segment.slice(1) : "",
    )
    .join(" ");

const formatMetricValue = (value: number, unit: string): string => {
  if (!Number.isFinite(value)) {
    return unit ? `n/a ${unit}` : "n/a";
  }

  const rendered =
    Math.abs(value) >= 100
      ? value.toFixed(0)
      : Math.abs(value) >= 10
        ? value.toFixed(1)
        : value.toFixed(2);
  return unit ? `${rendered} ${unit}` : rendered;
};

const metricTone = (status: string): string => {
  const normalized = status.trim().toLowerCase();
  if (normalized === "ok" || normalized === "healthy") {
    return "ok";
  }
  if (
    normalized === "warning" ||
    normalized === "warn" ||
    normalized === "degraded"
  ) {
    return "warn";
  }
  if (
    normalized === "critical" ||
    normalized === "error" ||
    normalized === "down"
  ) {
    return "critical";
  }
  return "muted";
};

export const AdminPage = () => {
  const { identityHex } = useIdentity();
  const [profiles, profilesReady] = useTable(tables.playerProfile);
  const [versions, versionsReady] = useTable(tables.contentVersion);

  const presenceRows = EMPTY_ROWS;
  const presenceReady = true;
  const auditRows = EMPTY_ROWS;
  const auditReady = true;
  const externalMetrics = EMPTY_ROWS;
  const externalMetricsReady = true;
  const telemetryAggregates = EMPTY_ROWS;
  const telemetryReady = true;

  const nowMicros = BigInt(Date.now()) * 1000n;
  const isReady = profilesReady && versionsReady;

  const profilesByIdentity = useMemo(() => {
    const next = new Map<string, string>();

    for (const profile of profiles) {
      const nickname = unwrapOptionalString(profile.nickname);
      if (!nickname) {
        continue;
      }

      next.set(profile.playerId.toHexString(), nickname);
    }

    return next;
  }, [profiles]);

  const onlinePresence = useMemo(() => {
    const cutoffMicros = nowMicros - NINETY_SECONDS_MICROS;

    return presenceRows
      .filter((row) => timestampMicros(row.lastSeenAt) >= cutoffMicros)
      .sort((left, right) =>
        timestampMicros(right.lastSeenAt) > timestampMicros(left.lastSeenAt)
          ? 1
          : -1,
      );
  }, [nowMicros, presenceRows]);

  const activeVersion = useMemo(() => {
    const active = versions.find((row) => row.isActive);
    if (active) {
      return active;
    }

    return (
      [...versions].sort((left, right) =>
        timestampMicros(right.publishedAt) > timestampMicros(left.publishedAt)
          ? 1
          : -1,
      )[0] ?? null
    );
  }, [versions]);

  const auditStats = useMemo(() => {
    const cutoffMicros = nowMicros - ONE_DAY_MICROS;
    const last24h = auditRows.filter(
      (row) => timestampMicros(row.createdAt) >= cutoffMicros,
    );

    return {
      total: auditRows.length,
      last24h: last24h.length,
    };
  }, [auditRows, nowMicros]);

  const telemetryPulse = useMemo(() => {
    const cutoff15m = nowMicros - FIFTEEN_MINUTES_MICROS;
    const cutoff24h = nowMicros - ONE_DAY_MICROS;
    const counts = new Map<string, { last15m: number; last24h: number }>();

    for (const row of telemetryAggregates) {
      const bucketMicros = timestampMicros(row.bucketStart);
      if (bucketMicros < cutoff24h) {
        continue;
      }

      const count = Number(row.count);
      const existing = counts.get(row.eventName) ?? { last15m: 0, last24h: 0 };
      existing.last24h += count;
      if (bucketMicros >= cutoff15m) {
        existing.last15m += count;
      }
      counts.set(row.eventName, existing);
    }

    return TELEMETRY_EVENT_ORDER.map((eventName) => ({
      eventName,
      label: TELEMETRY_EVENT_LABELS[eventName] ?? eventName,
      last15m: counts.get(eventName)?.last15m ?? 0,
      last24h: counts.get(eventName)?.last24h ?? 0,
    }));
  }, [nowMicros, telemetryAggregates]);

  const telemetryCounts = useMemo(
    () => new Map(telemetryPulse.map((row) => [row.eventName, row])),
    [telemetryPulse],
  );

  const recentAudit = useMemo(
    () =>
      [...auditRows]
        .sort((left, right) =>
          timestampMicros(right.createdAt) > timestampMicros(left.createdAt)
            ? 1
            : -1,
        )
        .slice(0, 12),
    [auditRows],
  );

  const metricFeed = useMemo(
    () =>
      [...externalMetrics].sort((left, right) =>
        timestampMicros(right.updatedAt) > timestampMicros(left.updatedAt)
          ? 1
          : -1,
      ),
    [externalMetrics],
  );

  const degradedMetricCount = useMemo(
    () => metricFeed.filter((row) => metricTone(row.status) !== "ok").length,
    [metricFeed],
  );

  return (
    <section className="panel-section admin-page h-full overflow-y-auto w-full p-4">
      <div className="panel-header">
        <div>
          <h2>Control Room</h2>
          <p>
            Audit trail, presence and compact health signals pulled from the
            live module state.
          </p>
        </div>
        <div className="meta-block admin-meta-block">
          <span>Viewer: {identityLabel(identityHex)}</span>
          <span>Build: {APP_VERSION}</span>
        </div>
      </div>

      {!isReady ? (
        <article className="card placeholder-card">
          <h3>Loading admin projections</h3>
          <p className="muted">Waiting for live tables to synchronize.</p>
        </article>
      ) : (
        <>
          <div className="card-grid">
            <article className="card">
              <h3>Online Now</h3>
              <p className="stat-number">{onlinePresence.length}</p>
              <p className="muted">
                {presenceRows.length} tracked identities with a 90s heartbeat
                window.
              </p>
            </article>

            <article className="card">
              <h3>Active Content</h3>
              <p className="stat-number">
                {activeVersion ? activeVersion.version : "n/a"}
              </p>
              <p className="muted">
                Published {timestampToDateTime(activeVersion?.publishedAt)}
              </p>
            </article>

            <article className="card">
              <h3>AI Enqueued 24h</h3>
              <p className="stat-number">
                {telemetryCounts.get("ai_request_enqueued")?.last24h ?? 0}
              </p>
              <p className="muted">
                {telemetryCounts.get("ai_request_enqueued")?.last15m ?? 0} in
                the last 15 minutes
              </p>
            </article>

            <article className="card">
              <h3>AI Delivered 24h</h3>
              <p className="stat-number">
                {telemetryCounts.get("ai_request_delivered")?.last24h ?? 0}
              </p>
              <p className="muted">
                {telemetryCounts.get("ai_request_delivered")?.last15m ?? 0} in
                the last 15 minutes
              </p>
            </article>

            <article className="card">
              <h3>External Alerts</h3>
              <p className="stat-number">{degradedMetricCount}</p>
              <p className="muted">
                {metricFeed.length} external metric summaries ingested
              </p>
            </article>

            <article className="card">
              <h3>Audit Events 24h</h3>
              <p className="stat-number">{auditStats.last24h}</p>
              <p className="muted">{auditStats.total} rows retained overall</p>
            </article>
          </div>

          <div className="card-grid two-col">
            <article className="card">
              <div className="panel-header">
                <div>
                  <h3>Telemetry Pulse</h3>
                  <p>
                    Recent gameplay and ops flow counts from minute buckets.
                  </p>
                </div>
              </div>

              <div className="admin-table">
                <div className="admin-table-row admin-table-row--header">
                  <span>Event</span>
                  <span>15m</span>
                  <span>24h</span>
                </div>
                {telemetryPulse.map((row) => (
                  <div key={row.eventName} className="admin-table-row">
                    <span>{row.label}</span>
                    <span>{row.last15m}</span>
                    <span>{row.last24h}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="card">
              <div className="panel-header">
                <div>
                  <h3>External Metrics</h3>
                  <p>
                    Summary rows intended for Sentry or worker-fed health
                    checks.
                  </p>
                </div>
              </div>

              {metricFeed.length === 0 ? (
                <p className="muted">No external metrics ingested yet.</p>
              ) : (
                <ul className="unstyled-list admin-feed">
                  {metricFeed.slice(0, 8).map((row) => (
                    <li key={row.metricKey} className="admin-feed-row">
                      <div className="admin-feed-main">
                        <div className="icon-row">
                          <span
                            className={`admin-status-chip admin-status-chip--${metricTone(
                              row.status,
                            )}`}
                          >
                            {row.status}
                          </span>
                          <strong>{row.label}</strong>
                        </div>
                        <p>{row.summary}</p>
                        <span className="muted">
                          {row.source} · {timestampToDateTime(row.updatedAt)}
                        </span>
                      </div>
                      <div className="admin-feed-side">
                        <strong>
                          {row.hasValue
                            ? formatMetricValue(row.value, row.unit)
                            : "n/a"}
                        </strong>
                        {row.linkUrl ? (
                          <a
                            href={row.linkUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open
                          </a>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </div>

          <div className="card-grid two-col">
            <article className="card">
              <div className="panel-header">
                <div>
                  <h3>Presence Feed</h3>
                  <p>Latest active identities and their current surface.</p>
                </div>
              </div>

              {onlinePresence.length === 0 ? (
                <p className="muted">
                  No active presence rows in the last 90 seconds.
                </p>
              ) : (
                <ul className="unstyled-list admin-feed">
                  {onlinePresence.slice(0, 10).map((row) => {
                    const actorHex = row.playerId.toHexString();
                    const nickname = profilesByIdentity.get(actorHex);

                    return (
                      <li key={actorHex} className="admin-feed-row">
                        <div className="admin-feed-main">
                          <div className="icon-row">
                            <strong>
                              {nickname ?? identityLabel(actorHex)}
                            </strong>
                            <span className="muted">
                              {formatTabLabel(row.currentTab)}
                            </span>
                          </div>
                          <p>{actorHex}</p>
                          <span className="muted">
                            Seen {timestampToDateTime(row.lastSeenAt)}
                          </span>
                        </div>
                        <div className="admin-feed-side">
                          <strong>{row.appVersion}</strong>
                          <span className="muted">
                            {row.buildCommit.slice(0, 8) || "unknown"}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </article>

            <article className="card">
              <div className="panel-header">
                <div>
                  <h3>Recent Audit Log</h3>
                  <p>
                    Admin and worker mutations that should stay easy to inspect.
                  </p>
                </div>
              </div>

              {recentAudit.length === 0 ? (
                <p className="muted">No audit events recorded yet.</p>
              ) : (
                <ul className="unstyled-list admin-feed">
                  {recentAudit.map((row) => (
                    <li key={row.auditId.toString()} className="admin-feed-row">
                      <div className="admin-feed-main">
                        <div className="icon-row">
                          <strong>{row.action}</strong>
                          <span className="muted">{row.actorRole}</span>
                        </div>
                        <p>{row.summary}</p>
                        <span className="muted">
                          {identityLabel(row.actorIdentity.toHexString())} ·{" "}
                          {row.subjectType}
                          {row.subjectId ? `:${row.subjectId}` : ""} ·{" "}
                          {timestampToDateTime(row.createdAt)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </div>
        </>
      )}
    </section>
  );
};
