import { useMemo, type CSSProperties, type ReactNode } from "react";
import type { VnChoice, VnHubSchema, VnHubZone } from "../../types";
import "./VnHubSway.css";

interface VnHubSchemaProps {
  schema: VnHubSchema;
  /**
   * Visible hotspot choices for the current node, already filtered by
   * `isChoiceVisible`. Choices whose `hotspot.zoneId` doesn't match any
   * declared zone are ignored. When several choices target the same zone,
   * the highest `priority` wins (ties resolved by declaration order).
   */
  hotspotChoices: VnChoice[];
  currentZoneId: string | null;
  /** Zone id -> ordered visible npcId list, derived via evaluateOccupants. */
  visibleOccupantsByZoneId?: Record<string, string[]>;
  onZoneSelect: (choice: VnChoice) => void;
  isChoiceLocked?: (choice: VnChoice) => boolean;
  disabled?: boolean;
  /** Optional renderer for an occupant badge (e.g. portrait + tooltip). */
  renderOccupantBadge?: (npcId: string, zone: VnHubZone) => ReactNode;
}

interface ResolvedZone {
  zone: VnHubZone;
  choice: VnChoice | null;
  visibleOccupants: string[];
  isLocked: boolean;
}

const pickActiveChoice = (
  zoneId: string,
  candidates: VnChoice[],
): VnChoice | null => {
  let best: VnChoice | null = null;
  let bestPriority = Number.NEGATIVE_INFINITY;
  for (const candidate of candidates) {
    if (candidate.hotspot?.zoneId !== zoneId) {
      continue;
    }
    const priority = candidate.hotspot.priority ?? 0;
    if (best === null || priority > bestPriority) {
      best = candidate;
      bestPriority = priority;
    }
  }
  return best;
};

const getZoneAnchor = (svgPath: string): { x: number; y: number } => {
  const numbers = svgPath
    .match(/-?\d+(?:\.\d+)?/g)
    ?.map((entry) => Number(entry))
    .filter((entry) => Number.isFinite(entry));

  if (!numbers || numbers.length < 2) {
    return { x: 0, y: 0 };
  }

  const xs: number[] = [];
  const ys: number[] = [];
  for (let index = 0; index + 1 < numbers.length; index += 2) {
    xs.push(numbers[index]);
    ys.push(numbers[index + 1]);
  }

  if (xs.length === 0 || ys.length === 0) {
    return { x: numbers[0], y: numbers[1] };
  }

  return {
    x: (Math.min(...xs) + Math.max(...xs)) / 2,
    y: (Math.min(...ys) + Math.max(...ys)) / 2,
  };
};

const renderDefaultOccupantBadge = (npcId: string): ReactNode => {
  const initials = npcId
    .replace(/^npc_/, "")
    .split("_")
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
    .slice(0, 3);

  return (
    <div
      title={npcId}
      style={{
        minWidth: 34,
        height: 28,
        padding: "0 8px",
        borderRadius: 999,
        border: "1px solid rgba(255, 215, 120, 0.72)",
        background: "rgba(18, 22, 30, 0.88)",
        color: "#ffd778",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 11,
        fontWeight: 700,
        lineHeight: 1,
        fontFamily: "Inter, system-ui, sans-serif",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.32)",
      }}
    >
      {initials || "NPC"}
    </div>
  );
};

export function VnHubSchema({
  schema,
  hotspotChoices,
  currentZoneId,
  visibleOccupantsByZoneId,
  onZoneSelect,
  isChoiceLocked,
  disabled = false,
  renderOccupantBadge,
}: VnHubSchemaProps) {
  const resolvedZones = useMemo<ResolvedZone[]>(() => {
    return schema.zones.map((zone) => {
      const choice = pickActiveChoice(zone.id, hotspotChoices);
      return {
        zone,
        choice,
        visibleOccupants: visibleOccupantsByZoneId?.[zone.id] ?? [],
        isLocked: !choice || Boolean(choice && isChoiceLocked?.(choice)),
      };
    });
  }, [hotspotChoices, isChoiceLocked, schema.zones, visibleOccupantsByZoneId]);

  const aspectRatio = schema.aspectRatio > 0 ? schema.aspectRatio : 2;
  const containerStyle: CSSProperties = {
    position: "relative",
    width: "100%",
    aspectRatio: `${aspectRatio}`,
    maxWidth: "100%",
    userSelect: "none",
  };

  const overlayStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    pointerEvents: disabled ? "none" : "auto",
  };

  return (
    <div
      data-testid="vn-hub-schema"
      data-hub-id={schema.id}
      style={containerStyle}
    >
      <img
        src={schema.imageUrl}
        alt=""
        aria-hidden="true"
        draggable={false}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          pointerEvents: "none",
          userSelect: "none",
        }}
      />
      <svg
        viewBox={schema.viewBox}
        preserveAspectRatio="xMidYMid meet"
        role="group"
        aria-label="Train schema"
        style={overlayStyle}
      >
        {resolvedZones.map(({ zone, choice, visibleOccupants, isLocked }) => {
          const isCurrent = zone.id === currentZoneId;
          const isInteractive = !disabled && !isLocked && choice !== null;
          const anchor = getZoneAnchor(zone.svgPath);
          const badgeRenderer =
            renderOccupantBadge ?? renderDefaultOccupantBadge;

          return (
            <g
              key={zone.id}
              data-zone-id={zone.id}
              data-current={isCurrent ? "true" : undefined}
              data-has-choice={choice ? "true" : "false"}
            >
              <path
                d={zone.svgPath}
                role="button"
                tabIndex={isInteractive ? 0 : -1}
                aria-label={zone.label}
                aria-current={isCurrent ? "location" : undefined}
                aria-disabled={!isInteractive ? true : undefined}
                onClick={() => {
                  if (choice && isInteractive) {
                    onZoneSelect(choice);
                  }
                }}
                onKeyDown={(event) => {
                  if (!isInteractive) {
                    return;
                  }
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    if (choice) {
                      onZoneSelect(choice);
                    }
                  }
                }}
                style={{
                  pointerEvents: "visiblePainted",
                  cursor: isInteractive ? "pointer" : "default",
                  fill: isCurrent
                    ? "rgba(255, 215, 120, 0.18)"
                    : isInteractive
                      ? "rgba(255, 255, 255, 0.06)"
                      : "rgba(255, 255, 255, 0.025)",
                  stroke: isCurrent
                    ? "rgba(255, 215, 120, 0.85)"
                    : isInteractive
                      ? "rgba(255, 255, 255, 0.45)"
                      : "rgba(255, 255, 255, 0.22)",
                  strokeWidth: isCurrent ? 4 : 2,
                  transition: "fill 180ms ease, stroke 180ms ease",
                }}
              >
                <title>
                  {isCurrent ? `${zone.label} (you are here)` : zone.label}
                </title>
              </path>
              {visibleOccupants.map((npcId, index) => (
                <foreignObject
                  key={`${zone.id}::${npcId}`}
                  x={anchor.x - 70}
                  y={anchor.y - 24 + index * 42}
                  width={140}
                  height={34}
                  style={{ overflow: "visible", pointerEvents: "none" }}
                >
                  {badgeRenderer(npcId, zone)}
                </foreignObject>
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
