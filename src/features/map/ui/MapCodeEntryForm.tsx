import type { getMapStrings } from "../../i18n/uiStrings";

type MapStrings = ReturnType<typeof getMapStrings>;

export interface MapCodeEntryFormProps {
  variant: "compact" | "desktop";
  mapStrings: MapStrings;
  codeValue: string;
  onCodeValueChange: (value: string) => void;
  onSubmit: () => void;
  isRedeeming: boolean;
  isNetworkConnected: boolean;
  status: string | null;
}

export const MapCodeEntryForm = ({
  variant,
  mapStrings,
  codeValue,
  onCodeValueChange,
  onSubmit,
  isRedeeming,
  isNetworkConnected,
  status,
}: MapCodeEntryFormProps) => {
  const input = (
    <input
      value={codeValue}
      onChange={(event) => onCodeValueChange(event.target.value)}
      placeholder={mapStrings.enter_archived_code}
      className="gw-map-input-themed"
    />
  );
  const submitLabel = isRedeeming
    ? mapStrings.archiving
    : mapStrings.archive_lead;

  if (variant === "compact") {
    return (
      <div className="gw-map-code-entry-grid">
        {input}
        <button
          type="button"
          onClick={onSubmit}
          disabled={isRedeeming || !isNetworkConnected}
          className="gw-map-ledger-drawer__toggle gw-map-submit-inline"
        >
          {submitLabel}
        </button>
        {status ? <p className="gw-map-code-entry-status">{status}</p> : null}
      </div>
    );
  }

  return (
    <div className="gw-map-code-entry-panel">
      {input}
      <div className="gw-map-code-entry-actions">
        <button
          type="button"
          onClick={onSubmit}
          disabled={isRedeeming || !isNetworkConnected}
          className="gw-map-code-submit"
        >
          {submitLabel}
        </button>
        {status ? (
          <span className="gw-map-code-entry-status">{status}</span>
        ) : null}
      </div>
    </div>
  );
};
