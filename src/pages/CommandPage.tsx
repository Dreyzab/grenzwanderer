import { useMemo, useState } from "react";
import { useReducer, useTable } from "spacetimedb/react";
import { reducers, tables } from "../shared/spacetime/bindings";
import { useIdentity } from "../shared/spacetime/useIdentity";
import type {
  CommandActor,
  CommandOrder,
  CommandTab,
} from "../features/command/model/types";

type TabId =
  | "home"
  | "vn"
  | "character"
  | "map"
  | "mind_palace"
  | "command"
  | "battle";

interface CommandPageProps {
  onNavigateTab: (tab: TabId) => void;
}

const createRequestId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `command-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
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

const parseOrders = (value: string | undefined): CommandOrder[] => {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((entry): entry is CommandOrder => {
      if (!entry || typeof entry !== "object") {
        return false;
      }

      const order = entry as Record<string, unknown>;
      return (
        typeof order.id === "string" &&
        typeof order.actorId === "string" &&
        typeof order.label === "string" &&
        typeof order.description === "string" &&
        typeof order.effectPreview === "string" &&
        typeof order.disabled === "boolean" &&
        (order.disabledReason === undefined ||
          typeof order.disabledReason === "string")
      );
    });
  } catch (_error) {
    return [];
  }
};

const normalizeReturnTab = (value: string): CommandTab =>
  value === "vn" ? "vn" : "map";

export const CommandPage = ({ onNavigateTab }: CommandPageProps) => {
  const [sessions, sessionsReady] = useTable(tables.myCommandSessions);
  const [members, membersReady] = useTable(tables.myCommandParty);
  const [history, historyReady] = useTable(tables.myCommandHistory);
  const issueCommand = useReducer(reducers.issueCommand);
  const resolveCommand = useReducer(reducers.resolveCommand);
  const closeCommandMode = useReducer(reducers.closeCommandMode);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeSession = useMemo(() => {
    const ownSessions = sessions.filter((row) => row.status !== "closed");
    if (ownSessions.length === 0) {
      return null;
    }

    return ownSessions.sort((left, right) =>
      String(right.updatedAt).localeCompare(String(left.updatedAt)),
    )[0];
  }, [sessions]);

  const activeMembers = useMemo<CommandActor[]>(() => {
    if (!activeSession) {
      return [];
    }

    return members
      .filter((row) => row.sessionKey === activeSession.sessionKey)
      .map((row) => ({
        actorId: row.actorId,
        label: row.label,
        role: row.role,
        availability:
          row.availability === "available"
            ? ("available" as const)
            : ("locked" as const),
        trust: row.trust,
        notes: unwrapOptionalString(row.notes),
        sortOrder: Number(row.sortOrder),
      }))
      .sort((left, right) => left.sortOrder - right.sortOrder);
  }, [activeSession, members]);

  const orders = useMemo(
    () => parseOrders(activeSession?.ordersJson),
    [activeSession?.ordersJson],
  );

  const recentHistory = useMemo(() => {
    if (!activeSession) {
      return [];
    }

    return history
      .filter((row) => row.sessionKey === activeSession.sessionKey)
      .sort((left, right) =>
        String(right.createdAt).localeCompare(String(left.createdAt)),
      )
      .slice(0, 3);
  }, [activeSession, history]);

  const isReady = sessionsReady && membersReady && historyReady;
  const isResolving =
    pendingOrderId !== null || activeSession?.phase === "resolving";
  const returnTab = normalizeReturnTab(activeSession?.returnTab ?? "map");
  const outcome =
    activeSession &&
    unwrapOptionalString(activeSession.resultTitle) &&
    unwrapOptionalString(activeSession.resultSummary)
      ? {
          title: unwrapOptionalString(activeSession.resultTitle)!,
          summary: unwrapOptionalString(activeSession.resultSummary)!,
        }
      : null;

  const handleIssueOrder = async (order: CommandOrder) => {
    if (!activeSession || order.disabled || isResolving) {
      return;
    }

    setPendingOrderId(order.id);
    setError(null);
    try {
      await issueCommand({
        requestId: createRequestId(),
        orderId: order.id,
      });
      await resolveCommand({
        requestId: createRequestId(),
      });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Command order failed.",
      );
    } finally {
      setPendingOrderId(null);
    }
  };

  const handleClose = async () => {
    if (!activeSession || isClosing) {
      onNavigateTab(returnTab);
      return;
    }

    setIsClosing(true);
    setError(null);
    try {
      await closeCommandMode({
        requestId: createRequestId(),
      });
      onNavigateTab(returnTab);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to close command mode.",
      );
    } finally {
      setIsClosing(false);
    }
  };

  if (!isReady) {
    return (
      <section className="panel-section">
        <article className="card compact">
          <strong>Command Mode</strong>
          <p>Synchronising bureau orders from SpacetimeDB...</p>
        </article>
      </section>
    );
  }

  if (!activeSession) {
    return (
      <section className="panel-section">
        <article className="card compact">
          <strong>Command Mode</strong>
          <p>
            No active command briefing is open. Start one from the agency hub or
            a story effect that issues `open_command_mode`.
          </p>
        </article>
      </section>
    );
  }

  return (
    <section className="panel-section">
      <article
        className="card compact"
        style={{ display: "grid", gap: "1rem" }}
      >
        <header style={{ display: "grid", gap: "0.5rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "0.75rem",
              flexWrap: "wrap",
            }}
          >
            <div>
              <span className="eyebrow">Command Mode</span>
              <h2 style={{ margin: "0.4rem 0 0" }}>{activeSession.title}</h2>
            </div>
            <span className="pill-label">
              Return: {returnTab === "vn" ? "Story" : "Map"}
            </span>
          </div>
          <p style={{ margin: 0, lineHeight: 1.65 }}>
            {activeSession.briefing}
          </p>
        </header>

        <section style={{ display: "grid", gap: "0.75rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "1rem",
            }}
          >
            <strong>Field Team</strong>
            <span className="eyebrow">{activeMembers.length} actors</span>
          </div>
          <div
            style={{
              display: "grid",
              gap: "0.8rem",
              gridTemplateColumns: "repeat(auto-fit, minmax(13rem, 1fr))",
            }}
          >
            {activeMembers.map((actor) => (
              <article
                key={actor.actorId}
                style={{
                  borderRadius: "1rem",
                  border: "1px solid rgba(212, 186, 128, 0.16)",
                  background: "rgba(255,255,255,0.02)",
                  padding: "0.95rem",
                  display: "grid",
                  gap: "0.4rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "0.75rem",
                    alignItems: "center",
                  }}
                >
                  <strong>{actor.label}</strong>
                  <span className="eyebrow">
                    {actor.availability === "available" ? "Ready" : "Locked"}
                  </span>
                </div>
                <span style={{ opacity: 0.76 }}>{actor.role}</span>
                <span style={{ fontSize: "0.92rem" }}>Trust {actor.trust}</span>
                {actor.notes ? (
                  <p style={{ margin: 0, opacity: 0.74, lineHeight: 1.55 }}>
                    {actor.notes}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        {outcome ? (
          <section
            style={{
              display: "grid",
              gap: "0.65rem",
              borderRadius: "1rem",
              border: "1px solid rgba(212, 186, 128, 0.18)",
              background: "rgba(216, 178, 92, 0.08)",
              padding: "1rem",
            }}
          >
            <strong>{outcome.title}</strong>
            <p style={{ margin: 0, lineHeight: 1.65 }}>{outcome.summary}</p>
          </section>
        ) : null}

        <section style={{ display: "grid", gap: "0.75rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "1rem",
            }}
          >
            <strong>Available Orders</strong>
            <span className="eyebrow">{activeSession.phase}</span>
          </div>
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {orders.map((order) => {
              const isPending = pendingOrderId === order.id;
              return (
                <button
                  key={order.id}
                  type="button"
                  disabled={
                    order.disabled ||
                    isResolving ||
                    activeSession.phase === "result" ||
                    isClosing
                  }
                  onClick={() => void handleIssueOrder(order)}
                  style={{
                    textAlign: "left",
                    borderRadius: "1rem",
                    border: "1px solid rgba(212, 186, 128, 0.16)",
                    background:
                      order.disabled || activeSession.phase === "result"
                        ? "rgba(255,255,255,0.03)"
                        : "linear-gradient(180deg, rgba(84, 48, 28, 0.72), rgba(43, 24, 14, 0.9))",
                    color:
                      order.disabled || activeSession.phase === "result"
                        ? "rgba(244, 236, 216, 0.6)"
                        : "#f6ecd6",
                    padding: "0.95rem 1rem",
                    display: "grid",
                    gap: "0.35rem",
                    cursor:
                      order.disabled || activeSession.phase === "result"
                        ? "not-allowed"
                        : "pointer",
                    opacity: isPending ? 0.72 : 1,
                  }}
                >
                  <strong>
                    {isPending ? `${order.label}...` : order.label}
                  </strong>
                  <span>{order.description}</span>
                  <span style={{ opacity: 0.76 }}>{order.effectPreview}</span>
                  {order.disabledReason ? (
                    <span style={{ opacity: 0.68 }}>
                      {order.disabledReason}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>

        {recentHistory.length > 0 ? (
          <section style={{ display: "grid", gap: "0.7rem" }}>
            <strong>Recent Orders</strong>
            {recentHistory.map((entry) => (
              <article
                key={entry.historyKey}
                style={{
                  borderRadius: "1rem",
                  border: "1px solid rgba(212, 186, 128, 0.1)",
                  background: "rgba(255,255,255,0.02)",
                  padding: "0.85rem 0.95rem",
                }}
              >
                <strong>{entry.title}</strong>
                <p
                  style={{
                    margin: "0.35rem 0 0",
                    opacity: 0.78,
                    lineHeight: 1.55,
                  }}
                >
                  {entry.summary}
                </p>
              </article>
            ))}
          </section>
        ) : null}

        {error ? (
          <div
            style={{
              borderRadius: "0.9rem",
              border: "1px solid rgba(187, 66, 66, 0.28)",
              background: "rgba(128, 28, 28, 0.16)",
              padding: "0.85rem 0.95rem",
            }}
          >
            {error}
          </div>
        ) : null}

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={() => void handleClose()}
            disabled={isClosing}
          >
            {activeSession.phase === "result"
              ? "Return to field"
              : "Exit command mode"}
          </button>
        </div>
      </article>
    </section>
  );
};
