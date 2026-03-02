import { Suspense, lazy } from "react";

const LazyMapView = lazy(async () => {
  const module = await import("../features/map/ui/MapView");
  return { default: module.MapView };
});

interface MapPageProps {
  onOpenVnScenario: (scenarioId: string) => void;
}

export const MapPage = ({ onOpenVnScenario }: MapPageProps) => (
  <Suspense
    fallback={
      <section className="panel-section">
        <article className="card">
          <p className="muted">Loading map...</p>
        </article>
      </section>
    }
  >
    <LazyMapView onOpenVnScenario={onOpenVnScenario} />
  </Suspense>
);
