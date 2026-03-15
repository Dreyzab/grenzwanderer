import { useMemo, useState } from "react";
import { useTable } from "spacetimedb/react";
import {
  getAgencyStandingPresentation,
  getCareerRankLabel,
  getFavorPresentation,
  getTrustBandPresentation,
} from "../../../shared/game/socialPresentation";
import { getLocationCastPresentation } from "../../../shared/game/locationCastPresentation";
import { tables } from "../../../shared/spacetime/bindings";
import { useIdentity } from "../../../shared/spacetime/useIdentity";
import { usePlayerFlags } from "../../../entities/player/hooks/usePlayerFlags";
import { usePlayerVars } from "../../../entities/player/hooks/usePlayerVars";
import { parseSnapshot } from "../../vn/vnContent";
import type { RuntimeMapBinding, RuntimeMapPoint } from "../types";
import {
  collectCaseIdsFromMapConditions,
  findActiveHypothesisLens,
} from "../../mindpalace/focusLens";
import { findPrimaryInternalizedThought } from "../../mindpalace/thoughtCabinet";
import { derivePsychogeographicNote } from "../psychogeography";

type HubTab = "briefing" | "inventory" | "partners";

interface DetectiveHubProps {
  point: RuntimeMapPoint;
  currentLocationId: string | null;
  onRunBinding: (
    point: RuntimeMapPoint,
    binding: RuntimeMapBinding,
  ) => Promise<void>;
  onClose: () => void;
}

const TAB_CONFIG: ReadonlyArray<{ id: HubTab; label: string }> = [
  { id: "briefing", label: "Briefing" },
  { id: "inventory", label: "Inventory" },
  { id: "partners", label: "Partners" },
];

const formatValue = (value: number | bigint): string =>
  typeof value === "bigint" ? value.toString() : String(value);

export const DetectiveHub = ({
  point,
  currentLocationId,
  onRunBinding,
  onClose,
}: DetectiveHubProps) => {
  const { identityHex } = useIdentity();
  const myFlags = usePlayerFlags();
  const myVars = usePlayerVars();
  const [activeTab, setActiveTab] = useState<HubTab>("briefing");
  const [pendingBindingId, setPendingBindingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [inventoryRows] = useTable(tables.playerInventory);
  const [relationshipRows] = useTable(tables.playerRelationship);
  const [npcStateRows] = useTable(tables.playerNpcState);
  const [npcFavorRows] = useTable(tables.playerNpcFavor);
  const [agencyCareerRows] = useTable(tables.playerAgencyCareer);
  const [flagRows] = useTable(tables.playerFlag);
  const [versionRows] = useTable(tables.contentVersion);
  const [snapshotRows] = useTable(tables.contentSnapshot);

  const activeVersion = useMemo(
    () => versionRows.find((row) => row.isActive) ?? null,
    [versionRows],
  );

  const snapshot = useMemo(() => {
    if (!activeVersion) {
      return null;
    }
    const row =
      snapshotRows.find((entry) => entry.checksum === activeVersion.checksum) ??
      null;
    return row ? parseSnapshot(row.payloadJson) : null;
  }, [activeVersion, snapshotRows]);
  const activeLens = useMemo(
    () =>
      findActiveHypothesisLens(
        snapshot,
        myFlags,
        point.availableBindings.flatMap((binding) =>
          collectCaseIdsFromMapConditions(binding.conditions),
        ),
      ),
    [myFlags, point.availableBindings, snapshot],
  );
  const internalizedThought = useMemo(
    () => findPrimaryInternalizedThought(snapshot, myFlags, myVars),
    [myFlags, myVars, snapshot],
  );
  const psychogeographicNote = useMemo(
    () =>
      derivePsychogeographicNote({
        point,
        activeLens,
        internalizedThought,
        heat: myVars.heat ?? 0,
        tension: myVars.tension ?? 0,
        isCurrentLocation: currentLocationId === point.locationId,
      }),
    [
      activeLens,
      currentLocationId,
      internalizedThought,
      myVars.heat,
      myVars.tension,
      point,
    ],
  );

  const introCompleted = useMemo(
    () =>
      flagRows.some(
        (row) =>
          row.playerId.toHexString() === identityHex &&
          row.key === "INTRO_COMPLETED" &&
          row.value === true,
      ),
    [flagRows, identityHex],
  );

  const inventoryItems = useMemo(
    () =>
      inventoryRows.filter(
        (row) => row.playerId.toHexString() === identityHex && row.quantity > 0,
      ),
    [identityHex, inventoryRows],
  );

  const companions = useMemo(() => {
    const trustByNpcId = new Map<string, number>();
    for (const row of relationshipRows) {
      if (row.playerId.toHexString() !== identityHex) {
        continue;
      }
      trustByNpcId.set(row.characterId, row.value);
    }
    for (const row of npcStateRows) {
      if (row.playerId.toHexString() !== identityHex) {
        continue;
      }
      trustByNpcId.set(row.npcId, row.trustScore);
    }

    const favorByNpcId = new Map<string, number>();
    for (const row of npcFavorRows) {
      if (row.playerId.toHexString() !== identityHex) {
        continue;
      }
      favorByNpcId.set(
        row.npcId,
        typeof row.balance === "bigint" ? Number(row.balance) : row.balance,
      );
    }

    return (snapshot?.socialCatalog?.npcIdentities ?? [])
      .filter(
        (identity) =>
          trustByNpcId.has(identity.id) || favorByNpcId.has(identity.id),
      )
      .map((identity) => {
        const trust = trustByNpcId.get(identity.id) ?? 0;
        const favor = favorByNpcId.get(identity.id) ?? 0;
        return {
          id: identity.id,
          displayName: identity.displayName,
          publicRole: identity.publicRole,
          trustLabel: getTrustBandPresentation(trust).label,
          favorLabel: getFavorPresentation(favor).label,
        };
      });
  }, [
    identityHex,
    npcFavorRows,
    npcStateRows,
    relationshipRows,
    snapshot?.socialCatalog?.npcIdentities,
  ]);
  const locationCast = useMemo(
    () => getLocationCastPresentation(point.locationId),
    [point.locationId],
  );

  const agencyCareer = useMemo(
    () =>
      agencyCareerRows.find(
        (row) => row.playerId.toHexString() === identityHex,
      ) ?? null,
    [agencyCareerRows, identityHex],
  );
  const agencyStandingLabel = getAgencyStandingPresentation(
    agencyCareer?.standingScore ?? 0,
  ).label;
  const agencyRankLabel = getCareerRankLabel(
    snapshot?.socialCatalog,
    agencyCareer?.rankId,
  );

  const primaryBinding = point.primaryBinding;
  const secondaryBindings = useMemo(
    () =>
      point.availableBindings.filter(
        (binding) => binding.id !== primaryBinding?.id,
      ),
    [point.availableBindings, primaryBinding?.id],
  );
  const isBusy = pendingBindingId !== null;

  const runBinding = async (binding: RuntimeMapBinding) => {
    setPendingBindingId(binding.id);
    setError(null);
    try {
      await onRunBinding(point, binding);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Action failed. Please retry.",
      );
    } finally {
      setPendingBindingId(null);
    }
  };

  return (
    <div
      className="gw-map-modal"
      onClick={onClose}
      style={{ background: "rgba(7, 7, 7, 0.48)", backdropFilter: "blur(8px)" }}
    >
      <aside
        className="gw-map-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`hub-title-${point.id}`}
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "min(100%, 48rem)",
          borderRadius: "1.1rem",
          border: "1px solid rgba(168, 125, 74, 0.3)",
          background:
            "linear-gradient(180deg, rgba(247, 237, 214, 0.98), rgba(230, 214, 180, 0.96))",
          color: "#2e1a10",
          boxShadow:
            "0 30px 60px rgba(0, 0, 0, 0.35), inset 0 0 0 1px rgba(255, 249, 235, 0.18)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              'radial-gradient(circle at top left, rgba(223, 193, 126, 0.2), transparent 48%), url("/images/paper-texture.png")',
            backgroundSize: "auto, 240px",
            opacity: 0.24,
            pointerEvents: "none",
          }}
        />
        <div
          className="gw-map-panel__frame"
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            padding: "1.15rem",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              position: "absolute",
              top: "0.85rem",
              right: "0.85rem",
              zIndex: 2,
              border: "1px solid rgba(59, 37, 18, 0.14)",
              borderRadius: "999px",
              background: "rgba(255, 250, 241, 0.66)",
              color: "#3b2512",
              fontFamily: "var(--font-mono)",
              fontSize: "0.7rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              padding: "0.42rem 0.66rem",
              cursor: "pointer",
            }}
          >
            Close
          </button>

          <header
            style={{
              display: "flex",
              alignItems: "start",
              justifyContent: "space-between",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <div>
              <p
                style={{
                  margin: 0,
                  color: "#8c6841",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.74rem",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                }}
              >
                Agency Hub
              </p>
              <h3
                id={`hub-title-${point.id}`}
                style={{
                  margin: "0.4rem 0 0",
                  color: "#412719",
                  fontFamily: "var(--font-serif)",
                  fontSize: "clamp(1.5rem, 2.5vw, 2.15rem)",
                  lineHeight: 1.08,
                }}
              >
                {point.title}
              </h3>
            </div>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.45rem",
                padding: "0.5rem 0.72rem",
                borderRadius: "999px",
                border: "1px solid rgba(59, 37, 18, 0.12)",
                background: "rgba(255, 247, 232, 0.6)",
                color:
                  currentLocationId === point.locationId
                    ? "#347737"
                    : "#4a2c15",
                boxShadow:
                  currentLocationId === point.locationId
                    ? "0 0 0 0.18rem rgba(52, 119, 55, 0.18)"
                    : "0 0 0 0.18rem rgba(74, 44, 21, 0.08)",
                fontSize: "0.76rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              <span
                style={{
                  width: "0.62rem",
                  height: "0.62rem",
                  borderRadius: "999px",
                  background:
                    currentLocationId === point.locationId
                      ? "#347737"
                      : "#4a2c15",
                  boxShadow: `0 0 12px ${
                    currentLocationId === point.locationId
                      ? "#347737"
                      : "#4a2c15"
                  }`,
                }}
              />
              {currentLocationId === point.locationId
                ? "On site"
                : "Field route"}
            </span>
          </header>

          {activeLens ? (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.45rem",
                padding: "0.5rem 0.72rem",
                borderRadius: "999px",
                border: "1px solid rgba(55, 123, 174, 0.18)",
                background: "rgba(110, 181, 230, 0.12)",
                color: "#17405b",
                fontFamily: "var(--font-mono)",
                fontSize: "0.72rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Active Lens: {activeLens.hypothesisText}
            </div>
          ) : null}

          <section
            style={{
              padding: "0.9rem 0.95rem",
              borderRadius: "0.95rem",
              border: "1px solid rgba(59, 37, 18, 0.1)",
              background: "rgba(255, 247, 232, 0.46)",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#6d5744",
                fontFamily: "var(--font-mono)",
                fontSize: "0.68rem",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              {psychogeographicNote.title}
            </p>
            <p
              style={{
                margin: "0.35rem 0 0",
                color: "#3f2d1f",
                lineHeight: 1.65,
              }}
            >
              {psychogeographicNote.body}
            </p>
          </section>

          <nav className="gw-map-tabs" aria-label="Hub tabs">
            {TAB_CONFIG.map((tab) => (
              <button
                key={tab.id}
                type="button"
                aria-pressed={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  border: "1px solid rgba(59, 37, 18, 0.12)",
                  borderRadius: "0.95rem",
                  padding: "0.72rem 0.8rem",
                  background:
                    activeTab === tab.id
                      ? "linear-gradient(180deg, #4f2a17, #32190f)"
                      : "rgba(255, 249, 237, 0.48)",
                  color: activeTab === tab.id ? "#f9edd2" : "#4b3019",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.73rem",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {activeTab === "briefing" ? (
            <section
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.8rem",
              }}
            >
              <p style={{ margin: 0, color: "#3f2d1f", lineHeight: 1.7 }}>
                {introCompleted
                  ? "The bureau is operational. Review the latest notes, then head back into the city."
                  : "Your first briefing is still pending. Open the desk file to begin the current assignment."}
              </p>

              {locationCast ? (
                <section
                  style={{
                    display: "grid",
                    gap: "0.65rem",
                    padding: "0.85rem 0.95rem",
                    borderRadius: "0.95rem",
                    border: "1px solid rgba(59, 37, 18, 0.1)",
                    background: "rgba(255, 249, 237, 0.56)",
                  }}
                >
                  <div>
                    <div
                      style={{
                        marginBottom: "0.25rem",
                        color: "#6d5744",
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.68rem",
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                      }}
                    >
                      Duty Roster
                    </div>
                    <p
                      style={{ margin: 0, color: "#3f2d1f", lineHeight: 1.55 }}
                    >
                      {locationCast.tone}
                    </p>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gap: "0.65rem",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(13rem, 1fr))",
                    }}
                  >
                    <article
                      style={{
                        padding: "0.8rem 0.9rem",
                        borderRadius: "0.9rem",
                        border: "1px solid rgba(59, 37, 18, 0.1)",
                        background: "rgba(255, 250, 241, 0.56)",
                      }}
                    >
                      <div
                        style={{
                          marginBottom: "0.35rem",
                          color: "#6d5744",
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.68rem",
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                        }}
                      >
                        Scene Owner
                      </div>
                      <strong
                        style={{
                          display: "block",
                          color: "#2d1c12",
                          fontSize: "0.98rem",
                        }}
                      >
                        {locationCast.primaryNpc.displayName}
                      </strong>
                      <p style={{ margin: "0.18rem 0 0", color: "#5e4632" }}>
                        {locationCast.primaryNpc.publicRole}
                      </p>
                    </article>

                    <article
                      style={{
                        padding: "0.8rem 0.9rem",
                        borderRadius: "0.9rem",
                        border: "1px solid rgba(59, 37, 18, 0.1)",
                        background: "rgba(255, 250, 241, 0.56)",
                      }}
                    >
                      <div
                        style={{
                          marginBottom: "0.35rem",
                          color: "#6d5744",
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.68rem",
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                        }}
                      >
                        Support Desk
                      </div>
                      <div style={{ display: "grid", gap: "0.4rem" }}>
                        {locationCast.supportNpcs.map((npc) => (
                          <div key={npc.id}>
                            <strong
                              style={{
                                display: "block",
                                color: "#2d1c12",
                                fontSize: "0.92rem",
                              }}
                            >
                              {npc.displayName}
                            </strong>
                            <span
                              style={{ color: "#5e4632", fontSize: "0.88rem" }}
                            >
                              {npc.publicRole}
                            </span>
                          </div>
                        ))}
                      </div>
                    </article>
                  </div>

                  <p style={{ margin: 0, color: "#3f2d1f", lineHeight: 1.55 }}>
                    {locationCast.dramaticFunction}
                  </p>
                </section>
              ) : null}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: "0.7rem",
                }}
              >
                {[
                  ["Inventory ready", `${inventoryItems.length} entries`],
                  ["Partners on file", `${companions.length} contacts`],
                  ["Agency rank", agencyRankLabel],
                  ["Agency status", agencyStandingLabel],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    style={{
                      padding: "0.8rem 0.9rem",
                      borderRadius: "0.9rem",
                      border: "1px solid rgba(59, 37, 18, 0.1)",
                      background: "rgba(255, 250, 241, 0.56)",
                    }}
                  >
                    <div
                      style={{
                        marginBottom: "0.35rem",
                        color: "#6d5744",
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.68rem",
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                      }}
                    >
                      {label}
                    </div>
                    <div style={{ color: "#2d1c12", fontWeight: 700 }}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>

              {primaryBinding ? (
                <div style={{ display: "grid", gap: "0.75rem" }}>
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => void runBinding(primaryBinding)}
                      style={{
                        border: "1px solid rgba(59, 37, 18, 0.14)",
                        borderRadius: "0.95rem",
                        padding: "0.9rem 1rem",
                        background: "linear-gradient(180deg, #5b1f1b, #3f1714)",
                        color: "#f8eeda",
                        fontFamily: "var(--font-display)",
                        fontSize: "0.95rem",
                        fontWeight: 700,
                        cursor: isBusy ? "not-allowed" : "pointer",
                        opacity: isBusy ? 0.68 : 1,
                      }}
                    >
                      {pendingBindingId === primaryBinding.id
                        ? `${primaryBinding.label}...`
                        : introCompleted
                          ? "Review latest briefing"
                          : "Open briefing"}
                    </button>
                  </div>

                  {secondaryBindings.length > 0 ? (
                    <div
                      style={{
                        display: "grid",
                        gap: "0.65rem",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(12rem, 1fr))",
                      }}
                    >
                      {secondaryBindings.map((binding) => (
                        <button
                          key={binding.id}
                          type="button"
                          disabled={isBusy}
                          onClick={() => void runBinding(binding)}
                          style={{
                            textAlign: "left",
                            border: "1px solid rgba(59, 37, 18, 0.1)",
                            borderRadius: "0.95rem",
                            padding: "0.82rem 0.9rem",
                            background: "rgba(255, 249, 237, 0.72)",
                            color: "#3b2512",
                            cursor: isBusy ? "not-allowed" : "pointer",
                            opacity: isBusy ? 0.72 : 1,
                          }}
                        >
                          <strong
                            style={{
                              display: "block",
                              marginBottom: "0.18rem",
                            }}
                          >
                            {pendingBindingId === binding.id
                              ? `${binding.label}...`
                              : binding.label}
                          </strong>
                          <span
                            style={{
                              fontSize: "0.84rem",
                              color: "#6b5440",
                              lineHeight: 1.5,
                            }}
                          >
                            {binding.intent === "travel"
                              ? "Travel or logistics action."
                              : "Auxiliary bureau action available from this hub."}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div
                  style={{
                    padding: "0.82rem 0.95rem",
                    borderRadius: "0.9rem",
                    border: "1px solid rgba(59, 37, 18, 0.1)",
                    background: "rgba(255, 249, 237, 0.58)",
                    color: "#5c4635",
                    lineHeight: 1.55,
                  }}
                >
                  No briefing action is currently available.
                </div>
              )}
            </section>
          ) : null}

          {activeTab === "inventory" ? (
            <section
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.8rem",
              }}
            >
              {inventoryItems.length === 0 ? (
                <div
                  style={{
                    padding: "0.82rem 0.95rem",
                    borderRadius: "0.9rem",
                    border: "1px solid rgba(59, 37, 18, 0.1)",
                    background: "rgba(255, 249, 237, 0.58)",
                    color: "#5c4635",
                    lineHeight: 1.55,
                  }}
                >
                  No field equipment is currently registered.
                </div>
              ) : (
                inventoryItems.map((item) => (
                  <article
                    key={item.inventoryKey}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "0.75rem",
                      padding: "0.85rem 0.95rem",
                      borderRadius: "0.95rem",
                      border: "1px solid rgba(59, 37, 18, 0.1)",
                      background: "rgba(255, 250, 241, 0.58)",
                    }}
                  >
                    <div>
                      <h4
                        style={{
                          margin: "0 0 0.18rem",
                          color: "#2f1c11",
                          fontFamily: "var(--font-serif)",
                          fontSize: "1rem",
                        }}
                      >
                        {item.itemId}
                      </h4>
                      <p
                        style={{
                          margin: 0,
                          color: "#695240",
                          fontSize: "0.9rem",
                        }}
                      >
                        Filed for bureau use.
                      </p>
                    </div>
                    <span
                      style={{
                        color: "#3f2815",
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.78rem",
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                      }}
                    >
                      Qty {formatValue(item.quantity)}
                    </span>
                  </article>
                ))
              )}
            </section>
          ) : null}

          {activeTab === "partners" ? (
            <section
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.8rem",
              }}
            >
              {companions.length === 0 ? (
                <div
                  style={{
                    padding: "0.82rem 0.95rem",
                    borderRadius: "0.9rem",
                    border: "1px solid rgba(59, 37, 18, 0.1)",
                    background: "rgba(255, 249, 237, 0.58)",
                    color: "#5c4635",
                    lineHeight: 1.55,
                  }}
                >
                  No partners are currently assigned to the bureau.
                </div>
              ) : (
                companions.map((companion) => (
                  <article
                    key={companion.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "0.75rem",
                      padding: "0.85rem 0.95rem",
                      borderRadius: "0.95rem",
                      border: "1px solid rgba(59, 37, 18, 0.1)",
                      background: "rgba(255, 250, 241, 0.58)",
                    }}
                  >
                    <div>
                      <h4
                        style={{
                          margin: "0 0 0.18rem",
                          color: "#2f1c11",
                          fontFamily: "var(--font-serif)",
                          fontSize: "1rem",
                        }}
                      >
                        {companion.displayName}
                      </h4>
                      <p
                        style={{
                          margin: 0,
                          color: "#695240",
                          fontSize: "0.9rem",
                        }}
                      >
                        {companion.publicRole}
                      </p>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.2rem",
                        alignItems: "flex-end",
                        color: "#3f2815",
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.78rem",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                      }}
                    >
                      <span>{companion.trustLabel}</span>
                      <span style={{ color: "#6b4a24" }}>
                        {companion.favorLabel}
                      </span>
                    </div>
                  </article>
                ))
              )}
            </section>
          ) : null}

          <footer
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              gap: "0.7rem",
              color: "#5d4737",
              fontSize: "0.84rem",
            }}
          >
            <span>
              Location:{" "}
              {currentLocationId === point.locationId
                ? "Here"
                : point.locationId}
            </span>
            <span>{point.availableBindings.length} map bindings available</span>
          </footer>

          {error ? (
            <div
              style={{
                padding: "0.82rem 0.95rem",
                borderRadius: "0.9rem",
                border: "1px solid rgba(161, 32, 32, 0.16)",
                background: "rgba(255, 235, 226, 0.86)",
                color: "#85231f",
                lineHeight: 1.55,
              }}
            >
              {error}
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
};
