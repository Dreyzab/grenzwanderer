import { useMemo, useState } from "react";
import { useReducer, useTable } from "spacetimedb/react";
import { reducers, tables } from "../shared/spacetime/bindings";
import { useIdentity } from "../shared/spacetime/useIdentity";
import type {
  BattleCardView,
  BattleCombatantView,
  BattleReturnTab,
  BattleTab,
} from "../features/battle/model/types";
import { useUiLanguage } from "../shared/hooks/useUiLanguage";
import { getBattleStrings } from "../features/i18n/uiStrings";
import { usePlayerFlags } from "../entities/player/hooks/usePlayerFlags";

interface BattlePageProps {
  onNavigateTab: (tab: BattleTab) => void;
}

const createRequestId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `battle-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
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

const normalizeReturnTab = (value: string): BattleReturnTab => {
  if (value === "vn") {
    return value;
  }
  return "map";
};

const toCombatantView = (
  row: Record<string, unknown>,
): BattleCombatantView => ({
  combatantId: String(row.combatantId),
  side: row.side === "enemy" ? "enemy" : "player",
  label: String(row.label),
  subtitle: unwrapOptionalString(row.subtitle),
  portraitUrl: unwrapOptionalString(row.portraitUrl),
  resolve: Number(row.resolve),
  maxResolve: Number(row.maxResolve),
  ap: Number(row.ap),
  maxAp: Number(row.maxAp),
  block: Number(row.block),
  nextIntentLabel: unwrapOptionalString(row.nextIntentLabel),
  nextIntentSummary: unwrapOptionalString(row.nextIntentSummary),
});

const toCardView = (row: Record<string, unknown>): BattleCardView => ({
  instanceId: String(row.instanceId),
  label: String(row.label),
  description: String(row.description),
  effectPreview: String(row.effectPreview),
  costAp: Number(row.costAp),
  zoneOrder: Number(row.zoneOrder),
  isPlayable: Boolean(row.isPlayable),
  playableReason: unwrapOptionalString(row.playableReason),
});

export const BattlePage = ({ onNavigateTab }: BattlePageProps) => {
  const [sessions, sessionsReady] = useTable(tables.myBattleSessions);
  const [combatants, combatantsReady] = useTable(tables.myBattleCombatants);
  const [cards, cardsReady] = useTable(tables.myBattleCards);
  const [history, historyReady] = useTable(tables.myBattleHistory);
  const flags = usePlayerFlags();
  const uiLanguage = useUiLanguage(flags);
  const t = useMemo(() => getBattleStrings(uiLanguage), [uiLanguage]);
  const playBattleCard = useReducer(reducers.playBattleCard);
  const endBattleTurn = useReducer(reducers.endBattleTurn);
  const closeBattleMode = useReducer(reducers.closeBattleMode);
  const [pendingCardId, setPendingCardId] = useState<string | null>(null);
  const [isEndingTurn, setIsEndingTurn] = useState(false);
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

  const activeCombatants = useMemo(() => {
    if (!activeSession) {
      return [] as BattleCombatantView[];
    }

    return combatants
      .filter((row) => row.sessionKey === activeSession.sessionKey)
      .map((row) => toCombatantView(row as unknown as Record<string, unknown>))
      .sort((left, right) => left.side.localeCompare(right.side));
  }, [activeSession, combatants]);

  const activeCards = useMemo(() => {
    if (!activeSession) {
      return {
        deckCount: 0,
        discardCount: 0,
        hand: [] as BattleCardView[],
      };
    }

    const ownCards = cards
      .filter((row) => row.sessionKey === activeSession.sessionKey)
      .map((row) => row as unknown as Record<string, unknown>);

    return {
      deckCount: ownCards.filter((row) => row.zone === "deck").length,
      discardCount: ownCards.filter((row) => row.zone === "discard").length,
      hand: ownCards
        .filter((row) => row.zone === "hand")
        .map(toCardView)
        .sort((left, right) => left.zoneOrder - right.zoneOrder),
    };
  }, [activeSession, cards]);

  const recentHistory = useMemo(() => {
    if (!activeSession) {
      return [];
    }

    return history
      .filter((row) => row.sessionKey === activeSession.sessionKey)
      .sort((left, right) =>
        String(right.createdAt).localeCompare(String(left.createdAt)),
      )
      .slice(0, 8)
      .reverse();
  }, [activeSession, history]);

  const isReady =
    sessionsReady && combatantsReady && cardsReady && historyReady;
  const player =
    activeCombatants.find((entry) => entry.side === "player") ?? null;
  const enemy =
    activeCombatants.find((entry) => entry.side === "enemy") ?? null;
  const returnTab = normalizeReturnTab(activeSession?.returnTab ?? "map");
  const outcome =
    activeSession &&
    unwrapOptionalString(activeSession.resultTitle) &&
    unwrapOptionalString(activeSession.resultSummary)
      ? {
          resultType:
            activeSession.resultType === "defeat" ? "defeat" : "victory",
          title: unwrapOptionalString(activeSession.resultTitle)!,
          summary: unwrapOptionalString(activeSession.resultSummary)!,
        }
      : null;
  const isResolved = Boolean(outcome) || activeSession?.status === "resolved";

  const handlePlayCard = async (card: BattleCardView) => {
    if (!activeSession || !card.isPlayable || pendingCardId || isResolved) {
      return;
    }

    setPendingCardId(card.instanceId);
    setError(null);
    try {
      await playBattleCard({
        requestId: createRequestId(),
        instanceId: card.instanceId,
      });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : t.playFailed,
      );
    } finally {
      setPendingCardId(null);
    }
  };

  const handleEndTurn = async () => {
    if (!activeSession || isEndingTurn || isResolved) {
      return;
    }

    setIsEndingTurn(true);
    setError(null);
    try {
      await endBattleTurn({
        requestId: createRequestId(),
      });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : t.turnFailed,
      );
    } finally {
      setIsEndingTurn(false);
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
      await closeBattleMode({
        requestId: createRequestId(),
      });
      onNavigateTab(returnTab);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : t.closeFailed,
      );
    } finally {
      setIsClosing(false);
    }
  };

  if (!isReady) {
    return (
      <section className="panel-section">
        <article className="card compact">
          <strong>{t.modeTitle}</strong>
          <p>{t.syncingDuel}</p>
        </article>
      </section>
    );
  }

  if (!activeSession || !player || !enemy) {
    return (
      <section className="panel-section">
        <article className="card compact">
          <strong>{t.modeTitle}</strong>
          <p>{t.noActiveSession}</p>
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
              <span className="eyebrow">{t.modeTitle}</span>
              <h2 style={{ margin: "0.4rem 0 0" }}>{activeSession.title}</h2>
            </div>
            <span className="pill-label">
              {t.returnLabel}:{" "}
              {returnTab === "vn"
                ? t.story
                : returnTab === "dev"
                  ? t.debug
                  : t.map}
            </span>
          </div>
          <p style={{ margin: 0, lineHeight: 1.65 }}>
            {activeSession.briefing}
          </p>
        </header>

        <section
          style={{
            display: "grid",
            gap: "0.9rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(16rem, 1fr))",
          }}
        >
          {[enemy, player].map((combatant) => (
            <article
              key={combatant.combatantId}
              style={{
                borderRadius: "1rem",
                border: "1px solid rgba(212, 186, 128, 0.16)",
                background: "rgba(255,255,255,0.02)",
                padding: "1rem",
                display: "grid",
                gap: "0.5rem",
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
                <div>
                  <strong>{combatant.label}</strong>
                  {combatant.subtitle ? (
                    <div style={{ opacity: 0.7, fontSize: "0.92rem" }}>
                      {combatant.subtitle}
                    </div>
                  ) : null}
                </div>
                <span className="eyebrow">
                  {combatant.side === "enemy" ? t.opponent : t.player}
                </span>
              </div>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <span>
                  {activeSession.resolveLabel}: {combatant.resolve}/
                  {combatant.maxResolve}
                </span>
                <span>
                  {activeSession.blockLabel}: {combatant.block}
                </span>
                <span>
                  {activeSession.apLabel}: {combatant.ap}/{combatant.maxAp}
                </span>
              </div>
              {combatant.side === "enemy" && combatant.nextIntentLabel ? (
                <p style={{ margin: 0, lineHeight: 1.55 }}>
                  <strong>{t.intent}:</strong> {combatant.nextIntentLabel}
                  {combatant.nextIntentSummary
                    ? ` - ${combatant.nextIntentSummary}`
                    : ""}
                </p>
              ) : null}
            </article>
          ))}
        </section>

        <section
          style={{
            display: "grid",
            gap: "0.75rem",
            borderRadius: "1rem",
            border: "1px solid rgba(212, 186, 128, 0.12)",
            background: "rgba(255,255,255,0.02)",
            padding: "1rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "0.75rem",
              flexWrap: "wrap",
            }}
          >
            <strong>{t.hand}</strong>
            <span className="eyebrow">
              {t.deck} {activeCards.deckCount} | {t.discard}{" "}
              {activeCards.discardCount}
            </span>
          </div>
          <div
            style={{
              display: "grid",
              gap: "0.8rem",
              gridTemplateColumns: "repeat(auto-fit, minmax(13rem, 1fr))",
            }}
          >
            {activeCards.hand.map((card) => (
              <button
                key={card.instanceId}
                type="button"
                disabled={
                  !card.isPlayable || pendingCardId !== null || isResolved
                }
                onClick={() => void handlePlayCard(card)}
                style={{
                  textAlign: "left",
                  borderRadius: "1rem",
                  border: "1px solid rgba(212, 186, 128, 0.18)",
                  background: card.isPlayable
                    ? "rgba(216, 178, 92, 0.08)"
                    : "rgba(255,255,255,0.03)",
                  padding: "0.95rem",
                  display: "grid",
                  gap: "0.45rem",
                  opacity: pendingCardId === card.instanceId ? 0.7 : 1,
                  cursor: card.isPlayable ? "pointer" : "not-allowed",
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
                  <strong>{card.label}</strong>
                  <span className="pill-label">AP {card.costAp}</span>
                </div>
                <span style={{ opacity: 0.76 }}>{card.description}</span>
                <span className="eyebrow">{card.effectPreview}</span>
                {!card.isPlayable && card.playableReason ? (
                  <span style={{ color: "#f5b0a6", fontSize: "0.9rem" }}>
                    {card.playableReason}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gap: "0.75rem",
            borderRadius: "1rem",
            border: "1px solid rgba(212, 186, 128, 0.12)",
            background: "rgba(255,255,255,0.02)",
            padding: "1rem",
          }}
        >
          <strong>{t.recentTranscript}</strong>
          {recentHistory.length === 0 ? (
            <p style={{ margin: 0, opacity: 0.72 }}>{t.noExchanges}</p>
          ) : (
            <div style={{ display: "grid", gap: "0.55rem" }}>
              {recentHistory.map((entry) => (
                <div
                  key={entry.historyKey.toString()}
                  style={{
                    borderLeft: "2px solid rgba(212, 186, 128, 0.24)",
                    paddingLeft: "0.75rem",
                    lineHeight: 1.55,
                    opacity: 0.9,
                  }}
                >
                  {entry.message}
                </div>
              ))}
            </div>
          )}
        </section>

        {outcome ? (
          <section
            style={{
              display: "grid",
              gap: "0.65rem",
              borderRadius: "1rem",
              border: "1px solid rgba(212, 186, 128, 0.18)",
              background:
                outcome.resultType === "victory"
                  ? "rgba(88, 166, 120, 0.12)"
                  : "rgba(216, 122, 92, 0.12)",
              padding: "1rem",
            }}
          >
            <strong>{outcome.title}</strong>
            <p style={{ margin: 0, lineHeight: 1.6 }}>{outcome.summary}</p>
          </section>
        ) : null}

        {error ? (
          <p style={{ margin: 0, color: "#f5b0a6", fontWeight: 500 }}>
            {error}
          </p>
        ) : null}

        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            justifyContent: "flex-end",
            flexWrap: "wrap",
          }}
        >
          {!isResolved ? (
            <button
              type="button"
              onClick={() => void handleEndTurn()}
              disabled={isEndingTurn}
            >
              {isEndingTurn ? t.resolving : t.endTurn}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void handleClose()}
            disabled={isClosing}
          >
            {isResolved ? t.returnLabel : t.closeBattle}
          </button>
        </div>
      </article>
    </section>
  );
};
