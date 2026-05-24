import React, { useMemo, type CSSProperties, type MouseEvent } from "react";
import type { RuntimeMapPoint } from "../types";
import {
  GenericIcon,
  HubIcon,
  LandmarkIcon,
  OccultIcon,
  QuestIcon,
} from "./MapPinIcons";
import { useUiLanguage } from "../../../shared/hooks/useUiLanguage";
import { getMapStrings } from "../../i18n/uiStrings";

interface DetectiveMapPinProps {
  point: RuntimeMapPoint;
  isSelected: boolean;
  isZoomedOut: boolean;
  onClick: () => void;
}

const ASSET_BASE = "/images/ui/markers";

const stateStyles = {
  locked: {
    accent: "#8a97aa",
    glow: "rgba(92, 104, 120, 0.42)",
    focus: "rgba(100, 116, 139, 0.22)",
  },
  discovered: {
    accent: "#d9a743",
    glow: "rgba(217, 167, 67, 0.42)",
    focus: "rgba(190, 135, 42, 0.18)",
  },
  visited: {
    accent: "#6cc36b",
    glow: "rgba(108, 195, 107, 0.4)",
    focus: "rgba(53, 123, 58, 0.18)",
  },
  completed: {
    accent: "#59b4de",
    glow: "rgba(89, 180, 222, 0.42)",
    focus: "rgba(33, 108, 151, 0.18)",
  },
} satisfies Record<
  RuntimeMapPoint["state"],
  { accent: string; glow: string; focus: string }
>;

type MarkerVisual = {
  kind: "photo" | "icon";
  src: string;
};

const resolveMarkerVisual = (point: RuntimeMapPoint): MarkerVisual => {
  if (point.image) {
    return { kind: "photo", src: point.image };
  }

  const category = point.category?.toUpperCase() ?? "";
  if (point.entitySignature) {
    return { kind: "icon", src: `${ASSET_BASE}/marker_gargoyle.webp` };
  }
  if (category === "HUB" || category.includes("SUPPORT")) {
    return { kind: "icon", src: `${ASSET_BASE}/marker_mosaic_anvil.webp` };
  }
  if (category === "EPHEMERAL") {
    return { kind: "icon", src: `${ASSET_BASE}/marker_wax_seal.webp` };
  }
  if (category === "SHADOW") {
    return { kind: "icon", src: `${ASSET_BASE}/marker_gargoyle.webp` };
  }
  if (
    point.isObjectiveActive ||
    category.includes("QUEST") ||
    category.includes("CRIME")
  ) {
    return { kind: "icon", src: `${ASSET_BASE}/marker_wax_seal.webp` };
  }
  if (category.includes("SECRET") || category.includes("OCCULT")) {
    return { kind: "icon", src: `${ASSET_BASE}/marker_gargoyle.webp` };
  }
  return { kind: "icon", src: `${ASSET_BASE}/marker_inkblot.webp` };
};

const resolveSvgIcon = (point: RuntimeMapPoint) => {
  const category = point.category?.toUpperCase() ?? "";
  if (point.entitySignature) return <OccultIcon />;
  if (category === "HUB" || category.includes("SUPPORT")) return <HubIcon />;
  if (category === "EPHEMERAL") return <QuestIcon />;
  if (category === "SHADOW") return <OccultIcon />;
  if (
    point.isObjectiveActive ||
    category.includes("QUEST") ||
    category.includes("CRIME")
  ) {
    return <QuestIcon />;
  }
  if (category.includes("SECRET") || category.includes("OCCULT")) {
    return <OccultIcon />;
  }
  if (point.image) {
    return <LandmarkIcon />;
  }
  return <GenericIcon />;
};

export const DetectiveMapPin = ({
  point,
  isSelected,
  isZoomedOut,
  onClick,
}: DetectiveMapPinProps) => {
  const language = useUiLanguage({});
  const mapStrings = getMapStrings(language);

  const style = stateStyles[point.state];
  const visual = resolveMarkerVisual(point);

  // Map state labels to i18n keys
  const localizedLabel = useMemo(() => {
    switch (point.state) {
      case "locked":
        return mapStrings.pin_states.locked;
      case "discovered":
        return mapStrings.pin_states.discovered;
      case "visited":
        return mapStrings.pin_states.visited;
      case "completed":
        return mapStrings.pin_states.completed;
      default:
        return "";
    }
  }, [point.state, mapStrings.pin_states]);

  const pointStyle = {
    "--gw-map-pin-accent": style.accent,
    "--gw-map-pin-glow": style.glow,
    "--gw-map-pin-focus": style.focus,
    "--gw-map-pin-size": visual.kind === "photo" ? "4rem" : "3.45rem",
    "--gw-map-pin-padding": visual.kind === "photo" ? "0.2rem" : "0",
    "--gw-map-pin-radius": visual.kind === "photo" ? "999px" : "0",
    "--gw-map-pin-overflow": visual.kind === "photo" ? "hidden" : "visible",
    "--gw-map-pin-border":
      visual.kind === "photo" ? "1px solid rgba(246, 233, 202, 0.24)" : "none",
    "--gw-map-pin-bg": isZoomedOut
      ? "transparent"
      : visual.kind === "photo"
        ? "linear-gradient(180deg, rgba(245, 233, 202, 0.2), rgba(21, 16, 13, 0.88)), rgba(21, 16, 13, 0.92)"
        : "transparent",
    "--gw-map-pin-shadow":
      visual.kind === "photo"
        ? "0 12px 24px rgba(0, 0, 0, 0.28), 0 0 0 1px rgba(255, 241, 201, 0.04)"
        : "none",
  } as CSSProperties;

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onClick();
  };

  const markerFilter =
    point.state === "locked"
      ? "grayscale(1) sepia(0.28) brightness(0.76)"
      : point.state === "completed"
        ? "opacity(0.86)"
        : visual.kind === "icon"
          ? "drop-shadow(0 12px 18px rgba(0, 0, 0, 0.32))"
          : undefined;

  return (
    <button
      type="button"
      aria-label={`${point.title} (${localizedLabel})`}
      className="gw-map-pin"
      data-state={point.state}
      data-selected={isSelected ? "true" : "false"}
      data-objective={point.isObjectiveActive ? "true" : "false"}
      data-category={point.category}
      data-visual={visual.kind}
      data-zoomed-out={isZoomedOut ? "true" : "false"}
      onClick={handleClick}
      style={pointStyle}
      title={point.title}
    >
      <span className="gw-map-pin__aura" aria-hidden="true" />
      <span className="gw-map-pin__focus-ring" aria-hidden="true" />
      {point.isObjectiveActive && (
        <span className="gw-map-pin__objective-ring" aria-hidden="true">
          <span className="gw-map-pin__objective-glyph" />
        </span>
      )}
      <span
        className="gw-map-pin__marker"
        style={{
          filter: markerFilter,
          color: isZoomedOut ? style.accent : "inherit",
        }}
      >
        <img
          src={visual.src}
          alt=""
          style={{
            width: "100%",
            height: "100%",
            objectFit: visual.kind === "photo" ? "cover" : "contain",
          }}
        />
        {isZoomedOut && resolveSvgIcon(point)}
      </span>
      {point.state === "completed" && (
        <span className="gw-map-pin__stamp" aria-hidden="true">
          {mapStrings.pin_states.closed}
        </span>
      )}
      <span className="gw-map-pin__tooltip" aria-hidden="true">
        {point.title}
      </span>
    </button>
  );
};
