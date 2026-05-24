import { LoaderCircle, Route, X } from "lucide-react";
import type { JourneyReport } from "../hooks/useMapJourney";
import { useUiLanguage } from "../../../shared/hooks/useUiLanguage";
import { getMapStrings } from "../../i18n/uiStrings";

interface JourneyReportModalProps {
  report: JourneyReport | null;
  onClose: () => void;
}

const formatDistance = (
  meters: number,
  units: { km: string; m: string },
): string =>
  meters >= 1_000
    ? `${(meters / 1_000).toFixed(2)} ${units.km}`
    : `${Math.round(meters)} ${units.m}`;

export const JourneyReportModal = ({
  report,
  onClose,
}: JourneyReportModalProps) => {
  const language = useUiLanguage({});
  const mapStrings = getMapStrings(language);

  if (!report) {
    return null;
  }

  const isLoading = report.status === "loading";
  const title =
    report.reason === "interaction"
      ? mapStrings.report.paused
      : mapStrings.report.complete;

  return (
    <div className="gw-map-modal" role="dialog" aria-modal="true">
      <div className="gw-map-modal__backdrop" onClick={onClose} />
      <article className="gw-map-panel gw-map-journey-report">
        <div className="gw-map-panel__frame">
          <header className="gw-map-journey-report__header">
            <div>
              <p className="gw-map-journey-report__eyebrow">
                {mapStrings.report.title}
              </p>
              <h3>{isLoading ? mapStrings.report.loading : title}</h3>
            </div>
            <button
              type="button"
              className="gw-map-icon-button"
              onClick={onClose}
              aria-label={mapStrings.report.close_action}
            >
              <X size={18} />
            </button>
          </header>

          {isLoading ? (
            <div className="gw-map-journey-report__loading">
              <LoaderCircle size={24} />
              <span>{mapStrings.report.loading_sub}</span>
            </div>
          ) : (
            <>
              <div className="gw-map-journey-report__stats">
                <div>
                  <span>{mapStrings.report.distance}</span>
                  <strong>
                    {formatDistance(report.totalDistanceMeters, {
                      km: mapStrings.report.km,
                      m: mapStrings.report.m,
                    })}
                  </strong>
                </div>
                <div>
                  <span>{mapStrings.report.time}</span>
                  <strong>
                    {Math.round(report.elapsedGameMinutes)}{" "}
                    {mapStrings.report.min}
                  </strong>
                </div>
                <div>
                  <span>{mapStrings.report.discoveries}</span>
                  <strong>{report.discoveries.length}</strong>
                </div>
              </div>

              <div className="gw-map-journey-report__section">
                <Route size={18} />
                <span>
                  {mapStrings.report.final_stop}:{" "}
                  {report.finalWaypoint?.label ?? mapStrings.report.open_street}
                </span>
              </div>

              {report.discoveries.length > 0 ? (
                <ul className="gw-map-journey-report__discoveries">
                  {report.discoveries.map((entry) => (
                    <li key={entry.point.id}>
                      <strong>{entry.point.title}</strong>
                      <span>
                        {entry.point.isSearchZone
                          ? mapStrings.report.search_revealed
                          : mapStrings.report.marker_revealed}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="gw-map-journey-report__empty">
                  {mapStrings.report.empty}
                </p>
              )}
            </>
          )}
        </div>
      </article>
    </div>
  );
};
