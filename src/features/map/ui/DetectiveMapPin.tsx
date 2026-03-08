import type { CSSProperties, MouseEvent } from "react";
import type { RuntimeMapPoint } from "../types";
import {
  GenericIcon,
  HubIcon,
  LandmarkIcon,
  OccultIcon,
  QuestIcon,
} from "./MapPinIcons";

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
    label: "Locked",
  },
  discovered: {
    accent: "#d9a743",
    glow: "rgba(217, 167, 67, 0.42)",
    focus: "rgba(190, 135, 42, 0.18)",
    label: "Discovered",
  },
  visited: {
    accent: "#6cc36b",
    glow: "rgba(108, 195, 107, 0.4)",
    focus: "rgba(53, 123, 58, 0.18)",
    label: "Visited",
  },
  completed: {
    accent: "#59b4de",
    glow: "rgba(89, 180, 222, 0.42)",
    focus: "rgba(33, 108, 151, 0.18)",
    label: "Completed",
  },
} satisfies Record<
  RuntimeMapPoint["state"],
  { accent: string; glow: string; focus: string; label: string }
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
  const style = stateStyles[point.state];
  const visual = resolveMarkerVisual(point);
  const pointStyle = {
    "--gw-map-pin-accent": style.accent,
    "--gw-map-pin-glow": style.glow,
    "--gw-map-pin-focus": style.focus,
    "--gw-map-pin-center": visual.kind === "photo" ? "2rem" : "1.7rem",
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
      aria-label={`${point.title} (${style.label})`}
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
      <span
        className="gw-map-pin__aura"
        aria-hidden="true"
        style={{
          width: "4.5rem",
          height: "4.5rem",
          borderRadius: "999px",
          background: style.glow,
          filter: "blur(18px)",
        }}
      />
      <span
        className="gw-map-pin__focus-ring"
        aria-hidden="true"
        style={{
          width: "4.9rem",
          height: "4.9rem",
          borderRadius: "999px",
          border: "1px solid rgba(246, 233, 202, 0.2)",
          boxShadow: `0 0 0 0.18rem ${style.focus}`,
        }}
      />
      {point.isObjectiveActive ? (
        <span
          className="gw-map-pin__objective-ring"
          aria-hidden="true"
          style={{
            width: "5.3rem",
            height: "5.3rem",
            borderRadius: "999px",
            border: `1px dashed ${style.accent}`,
            opacity: 0.78,
          }}
        >
          <span
            className="gw-map-pin__objective-glyph"
            style={{
              position: "absolute",
              top: "-0.32rem",
              left: "50%",
              width: "0.8rem",
              height: "0.8rem",
              transform: "translateX(-50%)",
              borderRadius: "999px",
              background: style.accent,
              boxShadow: "0 0 0 0.16rem rgba(21, 16, 13, 0.76)",
            }}
          />
        </span>
      ) : null}
      <span
        className="gw-map-pin__marker"
        style={{
          position: "relative",
          zIndex: 1,
          display: "grid",
          placeItems: "center",
          width: visual.kind === "photo" ? "4rem" : "3.45rem",
          height: visual.kind === "photo" ? "4rem" : "3.45rem",
          padding: visual.kind === "photo" ? "0.2rem" : 0,
          borderRadius: visual.kind === "photo" ? "999px" : undefined,
          overflow: visual.kind === "photo" ? "hidden" : "visible",
          border:
            visual.kind === "photo"
              ? "1px solid rgba(246, 233, 202, 0.24)"
              : undefined,
          background: isZoomedOut
            ? "transparent"
            : visual.kind === "photo"
              ? "linear-gradient(180deg, rgba(245, 233, 202, 0.2), rgba(21, 16, 13, 0.88)), rgba(21, 16, 13, 0.92)"
              : undefined,
          boxShadow:
            visual.kind === "photo"
              ? "0 12px 24px rgba(0, 0, 0, 0.28), 0 0 0 1px rgba(255, 241, 201, 0.04)"
              : undefined,
          filter: markerFilter,
          transition:
            "transform 160ms ease, filter 160ms ease, opacity 160ms ease, width 220ms ease, height 220ms ease, background 220ms ease",
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
            borderRadius: visual.kind === "photo" ? "999px" : undefined,
          }}
        />
        {isZoomedOut && resolveSvgIcon(point)}
      </span>
      {point.state === "completed" ? (
        <span
          className="gw-map-pin__stamp"
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "1.3rem",
            left: "50%",
            zIndex: 2,
            padding: "0.18rem 0.42rem",
            borderRadius: "999px",
            border: "1px solid rgba(78, 15, 15, 0.25)",
            background: "rgba(158, 32, 32, 0.88)",
            color: "#fff4ec",
            fontFamily: "var(--font-mono)",
            fontSize: "0.54rem",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            transform: "translateX(-50%) rotate(-10deg)",
          }}
        >
          Closed
        </span>
      ) : null}
      <span
        className="gw-map-pin__tooltip"
        aria-hidden="true"
        style={{
          position: "relative",
          zIndex: 1,
          marginTop: "0.62rem",
          padding: "0.28rem 0.62rem",
          borderRadius: "999px",
          border: "1px solid rgba(255, 239, 206, 0.18)",
          background: "rgba(18, 14, 10, 0.88)",
          color: "#f8eed7",
          fontFamily: "var(--font-serif)",
          fontSize: "0.74rem",
          letterSpacing: "0.06em",
          whiteSpace: "nowrap",
        }}
      >
        {point.title}
      </span>
    </button>
  );
};
