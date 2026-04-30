import { Suspense, lazy, useMemo } from "react";
import "../features/map/ui/mapExperience.css";
import { useUiLanguage } from "../shared/hooks/useUiLanguage";
import { getMapStrings } from "../features/i18n/uiStrings";
import { usePlayerFlags } from "../entities/player/hooks/usePlayerFlags";

const LazyMapView = lazy(async () => {
  const module = await import("../features/map/ui/MapView");
  return { default: module.MapView };
});

interface MapPageProps {
  onOpenVnScenario: (scenarioId: string) => void;
  initialPanel?: "qr";
}

export const MapPage = ({ onOpenVnScenario, initialPanel }: MapPageProps) => {
  const flags = usePlayerFlags();
  const uiLanguage = useUiLanguage(flags);
  const t = useMemo(() => getMapStrings(uiLanguage), [uiLanguage]);

  return (
    <Suspense
      fallback={
        <section className="gw-map-shell gw-map-shell--fallback">
          <article
            className="gw-map-empty-state gw-map-empty-state--loading"
            style={{
              padding: "1.4rem 1.5rem",
              borderRadius: "1rem",
              border: "1px solid rgba(214, 196, 144, 0.22)",
              background:
                "linear-gradient(160deg, rgba(58, 42, 28, 0.92), rgba(21, 17, 13, 0.96))",
              boxShadow:
                "0 20px 50px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 248, 220, 0.04)",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#d3b27a",
                fontFamily: "var(--font-mono)",
                fontSize: "0.74rem",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
              }}
            >
              {t.chamber}
            </p>
            <h3
              style={{
                margin: "0.45rem 0 0",
                color: "#f5e9ca",
                fontFamily: "var(--font-serif)",
                fontSize: "1.65rem",
              }}
            >
              {t.preparing}
            </h3>
            <p
              className="muted"
              style={{ margin: "0.8rem 0 0", color: "#d2c4a4" }}
            >
              {t.loading}
            </p>
          </article>
        </section>
      }
    >
      <LazyMapView
        onOpenVnScenario={onOpenVnScenario}
        initialPanel={initialPanel}
      />
    </Suspense>
  );
};
