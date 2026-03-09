import { useId, useMemo, useState } from "react";
import { useTable } from "spacetimedb/react";
import {
  getAgencyStandingPresentation,
  getCareerRankLabel,
  getNpcDisplayName,
  getTrustBandPresentation,
} from "../../../shared/game/socialPresentation";
import { tables } from "../../../shared/spacetime/bindings";
import { parseSnapshot } from "../../vn/vnContent";
import type { SocialCatalogSnapshot } from "../../vn/types";
import type { RuntimeMapBinding, RuntimeMapPoint } from "../types";

interface CaseCardProps {
  point: RuntimeMapPoint;
  currentLocationId: string | null;
  onRunBinding: (
    point: RuntimeMapPoint,
    binding: RuntimeMapBinding,
  ) => Promise<void>;
  onClose: () => void;
}

const toErrorMessage = (error: unknown): string => {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("conditions_failed")) {
    return "Action is currently locked by conditions.";
  }
  if (message.includes("binding_not_found")) {
    return "Action is no longer available.";
  }
  if (message.includes("scenario_missing")) {
    return "Scenario is missing in the active snapshot.";
  }
  if (message.includes("start_blocked_by_route")) {
    return "Scenario start is blocked by route rules.";
  }
  if (message.includes("map_not_available")) {
    return "Map data is unavailable in this snapshot.";
  }
  return "Action failed. Please retry.";
};

const toneByState: Record<
  RuntimeMapPoint["state"],
  { color: string; glow: string }
> = {
  locked: { color: "#697789", glow: "rgba(105, 119, 137, 0.18)" },
  discovered: { color: "#b7851c", glow: "rgba(183, 133, 28, 0.18)" },
  visited: { color: "#347737", glow: "rgba(52, 119, 55, 0.18)" },
  completed: { color: "#216c97", glow: "rgba(33, 108, 151, 0.18)" },
};

const describeSocialCondition = (
  condition: NonNullable<RuntimeMapBinding["conditions"]>[number],
  socialCatalog?: SocialCatalogSnapshot,
): string | null => {
  if (condition.type === "logic_or") {
    const nested = condition.conditions
      .map((entry) => describeSocialCondition(entry, socialCatalog))
      .filter((entry): entry is string => entry !== null);
    return nested.length > 0 ? nested.join(" or ") : null;
  }
  if (condition.type === "logic_and") {
    const nested = condition.conditions
      .map((entry) => describeSocialCondition(entry, socialCatalog))
      .filter((entry): entry is string => entry !== null);
    return nested.length > 0 ? nested.join(" and ") : null;
  }
  if (condition.type === "logic_not") {
    const nested = describeSocialCondition(condition.condition, socialCatalog);
    return nested ? `Not: ${nested}` : null;
  }
  if (condition.type === "relationship_gte") {
    return `${getNpcDisplayName(socialCatalog, condition.characterId)}: ${getTrustBandPresentation(condition.value).label}`;
  }
  if (condition.type === "favor_balance_gte") {
    return `${getNpcDisplayName(socialCatalog, condition.npcId)} owes you a favor`;
  }
  if (condition.type === "agency_standing_gte") {
    return `Agency standing: ${getAgencyStandingPresentation(condition.value).label}`;
  }
  if (condition.type === "career_rank_gte") {
    return `Rank: ${getCareerRankLabel(socialCatalog, condition.rankId)}`;
  }
  if (condition.type === "rumor_state_is") {
    const rumorTitle =
      socialCatalog?.rumors.find((entry) => entry.id === condition.rumorId)
        ?.title ?? condition.rumorId.replace(/_/g, " ");
    return `Rumor ${rumorTitle} must be ${condition.status}`;
  }
  return null;
};

const describeSocialCost = (
  binding: RuntimeMapBinding | undefined | null,
  socialCatalog?: SocialCatalogSnapshot,
): string | null => {
  const favorCost = binding?.actions.find(
    (action) => action.type === "change_favor_balance" && action.delta < 0,
  );
  if (
    favorCost &&
    favorCost.type === "change_favor_balance" &&
    favorCost.delta < 0
  ) {
    return `Cost: you will owe ${getNpcDisplayName(socialCatalog, favorCost.npcId)} a favor`;
  }
  return null;
};

export const CaseCard = ({
  point,
  currentLocationId,
  onRunBinding,
  onClose,
}: CaseCardProps) => {
  const [versionRows] = useTable(tables.contentVersion);
  const [snapshotRows] = useTable(tables.contentSnapshot);
  const titleId = useId();
  const [pendingBindingId, setPendingBindingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const primaryBinding = point.primaryBinding;
  const travelBinding =
    point.travelBinding && point.travelBinding.id !== primaryBinding?.id
      ? point.travelBinding
      : null;
  const isBusy = pendingBindingId !== null;
  const isCurrentLocation = currentLocationId === point.locationId;
  const stateLabel =
    point.state.charAt(0).toUpperCase() + point.state.slice(1).toLowerCase();
  const heroImage =
    point.image ?? "/images/locations/location_placeholder.webp";
  const tone = toneByState[point.state];
  const visibilityModesLabel = point.visibilityModes?.join(" / ");
  const activeVersion = useMemo(
    () => versionRows.find((row) => row.isActive) ?? null,
    [versionRows],
  );
  const socialCatalog = useMemo(() => {
    if (!activeVersion) {
      return undefined;
    }
    const row =
      snapshotRows.find((entry) => entry.checksum === activeVersion.checksum) ??
      null;
    return row ? parseSnapshot(row.payloadJson)?.socialCatalog : undefined;
  }, [activeVersion, snapshotRows]);
  const socialRequirements = useMemo(
    () =>
      (point.bindings ?? [])
        .flatMap((binding) => binding.conditions ?? [])
        .map((condition) => describeSocialCondition(condition, socialCatalog))
        .filter((entry): entry is string => entry !== null)
        .slice(0, 3),
    [point.bindings, socialCatalog],
  );
  const socialCost = useMemo(
    () => describeSocialCost(primaryBinding, socialCatalog),
    [primaryBinding, socialCatalog],
  );
  const fallbackRoute =
    point.availableBindings.find((binding) => binding.id !== primaryBinding?.id)
      ?.label ??
    (socialRequirements.length > 0
      ? "Alternative lead or evidence route"
      : null);

  const runBinding = async (binding: RuntimeMapBinding) => {
    setPendingBindingId(binding.id);
    setError(null);
    try {
      await onRunBinding(point, binding);
    } catch (caughtError) {
      setError(toErrorMessage(caughtError));
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
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "min(100%, 43rem)",
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
            padding: "1.15rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
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
                Field Dossier
              </p>
              <h3
                id={titleId}
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
                color: tone.color,
                boxShadow: `0 0 0 0.18rem ${tone.glow}`,
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
                  background: tone.color,
                  boxShadow: `0 0 12px ${tone.color}`,
                }}
              />
              {stateLabel}
            </span>
          </header>

          <div
            style={{
              position: "relative",
              overflow: "hidden",
              minHeight: "12rem",
              borderRadius: "0.95rem",
              border: "1px solid rgba(59, 37, 18, 0.1)",
              background: "rgba(31, 23, 18, 0.92)",
            }}
          >
            <img
              src={heroImage}
              alt={point.title}
              style={{
                display: "block",
                width: "100%",
                height: "100%",
                minHeight: "12rem",
                objectFit: "cover",
                filter: "sepia(0.32) saturate(0.88) brightness(0.92)",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, transparent, rgba(11, 10, 9, 0.72)), linear-gradient(120deg, rgba(229, 201, 150, 0.18), transparent 40%)",
              }}
            />
            <div
              style={{
                position: "absolute",
                right: "0.85rem",
                bottom: "0.85rem",
                zIndex: 1,
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "flex-end",
                gap: "0.45rem",
              }}
            >
              {[point.id, point.category ?? "Field location"].map((entry) => (
                <span
                  key={entry}
                  style={{
                    padding: "0.32rem 0.55rem",
                    borderRadius: "999px",
                    border: "1px solid rgba(255, 239, 206, 0.14)",
                    background: "rgba(16, 13, 10, 0.8)",
                    color: "#faefda",
                    fontSize: "0.68rem",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  {entry}
                </span>
              ))}
            </div>
          </div>

          <p style={{ margin: 0, color: "#3f2d1f", lineHeight: 1.7 }}>
            {point.description ?? "Awaiting updated field notes for this site."}
          </p>

          <dl
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: "0.7rem",
              margin: 0,
            }}
          >
            {[
              ["Location", point.locationId],
              ["Bindings", String(point.availableBindings.length)],
              [
                "Travel state",
                isCurrentLocation ? "On site" : "Travel required",
              ],
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
                <dt
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
                </dt>
                <dd style={{ margin: 0, color: "#2d1c12", fontWeight: 700 }}>
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          {socialRequirements.length > 0 || socialCost || fallbackRoute ? (
            <section
              style={{
                display: "grid",
                gap: "0.65rem",
                padding: "0.9rem 1rem",
                borderRadius: "0.95rem",
                border: "1px solid rgba(59, 37, 18, 0.12)",
                background: "rgba(255, 249, 237, 0.56)",
              }}
            >
              {socialRequirements.length > 0 ? (
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
                    Social Requirement
                  </div>
                  <p style={{ margin: 0, color: "#2d1c12", lineHeight: 1.55 }}>
                    {socialRequirements.join(" / ")}
                  </p>
                </div>
              ) : null}

              {socialCost ? (
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
                    Social Cost
                  </div>
                  <p style={{ margin: 0, color: "#2d1c12", lineHeight: 1.55 }}>
                    {socialCost}
                  </p>
                </div>
              ) : null}

              {fallbackRoute ? (
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
                    Fallback Route
                  </div>
                  <p style={{ margin: 0, color: "#2d1c12", lineHeight: 1.55 }}>
                    {fallbackRoute}
                  </p>
                </div>
              ) : null}
            </section>
          ) : null}

          {point.entitySignature ||
          point.rumorHookId ||
          visibilityModesLabel ? (
            <div
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
                Distortion Read
              </p>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.45rem",
                  marginTop: "0.6rem",
                }}
              >
                {point.entitySignature ? (
                  <span
                    style={{
                      padding: "0.32rem 0.55rem",
                      borderRadius: "999px",
                      border: "1px solid rgba(91, 31, 27, 0.14)",
                      background: "rgba(91, 31, 27, 0.08)",
                      color: "#5b1f1b",
                      fontSize: "0.72rem",
                    }}
                  >
                    Signature: {point.entitySignature}
                  </span>
                ) : null}
                {visibilityModesLabel ? (
                  <span
                    style={{
                      padding: "0.32rem 0.55rem",
                      borderRadius: "999px",
                      border: "1px solid rgba(59, 37, 18, 0.12)",
                      background: "rgba(255, 255, 255, 0.34)",
                      color: "#412719",
                      fontSize: "0.72rem",
                    }}
                  >
                    Sight: {visibilityModesLabel}
                  </span>
                ) : null}
                {point.rumorHookId ? (
                  <span
                    style={{
                      padding: "0.32rem 0.55rem",
                      borderRadius: "999px",
                      border: "1px solid rgba(59, 37, 18, 0.12)",
                      background: "rgba(255, 255, 255, 0.34)",
                      color: "#412719",
                      fontSize: "0.72rem",
                    }}
                  >
                    Rumor hook: {point.rumorHookId}
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="gw-map-button-row">
            <button
              type="button"
              disabled={!primaryBinding || isBusy}
              onClick={() => {
                if (!primaryBinding) {
                  return;
                }
                void runBinding(primaryBinding);
              }}
              style={{
                border: "1px solid rgba(59, 37, 18, 0.14)",
                borderRadius: "0.95rem",
                padding: "0.9rem 1rem",
                background: "linear-gradient(180deg, #5b1f1b, #3f1714)",
                color: "#f8eeda",
                fontFamily: "var(--font-display)",
                fontSize: "0.95rem",
                fontWeight: 700,
                cursor: !primaryBinding || isBusy ? "not-allowed" : "pointer",
                opacity: !primaryBinding || isBusy ? 0.68 : 1,
              }}
            >
              {primaryBinding
                ? pendingBindingId === primaryBinding.id
                  ? `${primaryBinding.label}...`
                  : primaryBinding.label
                : "No actions"}
            </button>

            {travelBinding ? (
              <button
                type="button"
                disabled={
                  isBusy ||
                  !point.canTravel ||
                  (travelBinding.hasTravelAction && isCurrentLocation)
                }
                onClick={() => void runBinding(travelBinding)}
                style={{
                  border: "1px solid rgba(59, 37, 18, 0.14)",
                  borderRadius: "0.95rem",
                  padding: "0.9rem 1rem",
                  background: "linear-gradient(180deg, #f8f0dc, #ead8b3)",
                  color: "#2b1d13",
                  fontFamily: "var(--font-display)",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  cursor:
                    isBusy ||
                    !point.canTravel ||
                    (travelBinding.hasTravelAction && isCurrentLocation)
                      ? "not-allowed"
                      : "pointer",
                  opacity:
                    isBusy ||
                    !point.canTravel ||
                    (travelBinding.hasTravelAction && isCurrentLocation)
                      ? 0.68
                      : 1,
                }}
              >
                {pendingBindingId === travelBinding.id
                  ? `${travelBinding.label}...`
                  : travelBinding.hasTravelAction && isCurrentLocation
                    ? "Here"
                    : travelBinding.label}
              </button>
            ) : null}
          </div>

          {!point.canStartScenario ? (
            <p
              style={{
                margin: 0,
                padding: "0.82rem 0.95rem",
                borderRadius: "0.9rem",
                border: "1px solid rgba(59, 37, 18, 0.1)",
                background: "rgba(255, 249, 237, 0.58)",
                color: "#5c4635",
                lineHeight: 1.55,
              }}
            >
              Scenario action is not available for this point.
            </p>
          ) : null}

          {error ? (
            <p
              style={{
                margin: 0,
                padding: "0.82rem 0.95rem",
                borderRadius: "0.9rem",
                border: "1px solid rgba(161, 32, 32, 0.16)",
                background: "rgba(255, 235, 226, 0.86)",
                color: "#85231f",
                lineHeight: 1.55,
              }}
            >
              {error}
            </p>
          ) : null}
        </div>
      </aside>
    </div>
  );
};
