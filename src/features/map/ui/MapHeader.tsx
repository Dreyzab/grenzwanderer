import { CartouchePanel } from "./CartouchePanel";
import { MapCodeEntryForm } from "./MapCodeEntryForm";
import { MAP_POINT_STATES } from "../types";
import type { getMapStrings } from "../../i18n/uiStrings";

type MapStrings = ReturnType<typeof getMapStrings>;

export type MapPointStateKey = (typeof MAP_POINT_STATES)[number];

export interface MapHeaderProps {
  isCompactHud: boolean;
  regionName: string;
  mapStrings: MapStrings;
  stateLabels: Record<MapPointStateKey, string>;
  pointStateSummary: Record<MapPointStateKey, number>;
  ledgerItems: ReadonlyArray<readonly [string, string]>;
  compactSummaryItems: readonly string[];
  compactHeaderId: string;
  isReady: boolean;
  isLedgerOpen: boolean;
  isCodeEntryOpen: boolean;
  onToggleLedger: () => void;
  onToggleCodeEntry: () => void;
  codeValue: string;
  onCodeValueChange: (value: string) => void;
  onSubmitCode: () => void;
  isRedeemingCode: boolean;
  isNetworkConnected: boolean;
  codeStatus: string | null;
}

export const MapHeader = ({
  isCompactHud,
  regionName,
  mapStrings,
  stateLabels,
  pointStateSummary,
  ledgerItems,
  compactSummaryItems,
  compactHeaderId,
  isReady,
  isLedgerOpen,
  isCodeEntryOpen,
  onToggleLedger,
  onToggleCodeEntry,
  codeValue,
  onCodeValueChange,
  onSubmitCode,
  isRedeemingCode,
  isNetworkConnected,
  codeStatus,
}: MapHeaderProps) => {
  const codeEntryForm = (variant: "compact" | "desktop") => (
    <MapCodeEntryForm
      variant={variant}
      mapStrings={mapStrings}
      codeValue={codeValue}
      onCodeValueChange={onCodeValueChange}
      onSubmit={onSubmitCode}
      isRedeeming={isRedeemingCode}
      isNetworkConnected={isNetworkConnected}
      status={codeStatus}
    />
  );
  const ledgerStatus = (
    <div
      className="gw-map-ledger-status"
      data-sync-state={isReady ? "live" : "syncing"}
    >
      <span className="gw-map-status-dot" />
      {isReady ? mapStrings.live : mapStrings.syncing}
    </div>
  );

  return (
    <header
      className={`gw-map-header ${
        isCompactHud ? "gw-map-header--compact" : "gw-map-header--desktop"
      }`}
    >
      {isCompactHud ? (
        <>
          <CartouchePanel
            label="Plate XII · Cartography Chamber"
            padding="1rem 1.1rem"
            className="gw-map-compact-card gw-map-cartouche-full"
          >
            <div className="gw-map-compact-card__top">
              <div>
                <h2 className="gw-map-compact-card__title">{regionName}</h2>
              </div>
              <div className="gw-map-compact-header-layout">
                <button
                  type="button"
                  aria-expanded={isLedgerOpen}
                  aria-controls={compactHeaderId}
                  className="gw-map-compact-card__toggle"
                  onClick={onToggleLedger}
                >
                  {isLedgerOpen
                    ? mapStrings.close_ledger
                    : mapStrings.open_ledger}
                </button>
                <button
                  type="button"
                  className="gw-map-compact-card__toggle"
                  aria-expanded={isCodeEntryOpen}
                  onClick={onToggleCodeEntry}
                >
                  {isCodeEntryOpen
                    ? mapStrings.hide_code
                    : mapStrings.redeem_code}
                </button>
              </div>
            </div>

            <div className="gw-map-compact-card__summary">
              {compactSummaryItems.map((item) => (
                <span key={item} className="gw-map-compact-card__summary-pill">
                  {item}
                </span>
              ))}
            </div>

            <div className="gw-map-compact-card__states">
              {MAP_POINT_STATES.map((state) => (
                <span
                  key={state}
                  className="gw-map-compact-card__state-pill"
                  data-state={state}
                >
                  <span className="gw-map-status-dot gw-map-status-dot--compact" />
                  {stateLabels[state]}: {pointStateSummary[state]}
                </span>
              ))}
            </div>
          </CartouchePanel>

          {isLedgerOpen ? (
            <CartouchePanel
              label={mapStrings.ledger}
              padding="1rem 1.1rem"
              className="gw-map-ledger-drawer gw-map-cartouche-full gw-map-cartouche-ink"
            >
              <div id={compactHeaderId} className="gw-map-ledger-drawer__frame">
                <div className="gw-map-ledger-drawer__header">
                  <button
                    type="button"
                    aria-label="Dismiss ledger"
                    className="gw-map-ledger-drawer__toggle"
                    onClick={onToggleLedger}
                  >
                    {mapStrings.close_ledger}
                  </button>
                </div>

                <div className="gw-map-ledger-grid">
                  {ledgerItems.map(([label, value]) => (
                    <div key={label} className="gw-map-ledger-grid__item">
                      <span className="gw-map-ledger-grid__label">{label}</span>
                      <strong className="gw-map-ledger-value">{value}</strong>
                    </div>
                  ))}
                </div>

                {ledgerStatus}
              </div>
            </CartouchePanel>
          ) : null}

          {isCodeEntryOpen ? (
            <CartouchePanel
              label="QR Ledger"
              padding="1rem 1.1rem"
              className="gw-map-cartouche-full gw-map-cartouche-ink"
            >
              <div className="gw-map-ledger-drawer__frame">
                <div className="gw-map-ledger-drawer__header">
                  <button
                    type="button"
                    className="gw-map-ledger-drawer__toggle"
                    onClick={onToggleCodeEntry}
                  >
                    {mapStrings.close_ledger}
                  </button>
                </div>
                {codeEntryForm("compact")}
              </div>
            </CartouchePanel>
          ) : null}
        </>
      ) : (
        <>
          <CartouchePanel
            label="Plate XII · Cartography Chamber"
            padding="1.1rem 1.25rem"
          >
            <h2 className="gw-map-desktop-title">{regionName}</h2>
            <p className="gw-map-desktop-copy">
              A living city atlas layered over live Spacetime subscriptions.
              Travel, scenario starts, and objective focus still run on the
              current authoritative bindings.
            </p>
            <div className="gw-map-state-pill-row">
              {MAP_POINT_STATES.map((state) => (
                <span key={state} className="gw-map-pill" data-state={state}>
                  <span className="gw-map-status-dot" />
                  {stateLabels[state]}
                </span>
              ))}
            </div>
          </CartouchePanel>

          <CartouchePanel
            label={mapStrings.ledger}
            padding="1.1rem 1.25rem"
            className="gw-map-cartouche-ink"
          >
            <div className="gw-map-ledger-grid-desktop">
              {ledgerItems.map(([label, value]) => (
                <div key={label} className="gw-map-ledger-item-desktop">
                  <span className="gw-map-ledger-item-desktop__label">
                    {label}
                  </span>
                  <strong className="gw-map-ledger-value">{value}</strong>
                </div>
              ))}
            </div>
            {ledgerStatus}
            <button
              type="button"
              onClick={onToggleCodeEntry}
              className="gw-map-code-toggle"
            >
              {isCodeEntryOpen ? mapStrings.hide_code : mapStrings.redeem_code}
            </button>
            {isCodeEntryOpen ? codeEntryForm("desktop") : null}
          </CartouchePanel>
        </>
      )}
    </header>
  );
};
