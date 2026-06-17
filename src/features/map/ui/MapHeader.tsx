import { ChevronDown } from "lucide-react";
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
  objectiveLabel: string | null;
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
  objectiveLabel,
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
            padding="0.85rem 1.15rem"
            className="gw-map-region-cartouche"
          >
            <h2 className="gw-map-desktop-title">{regionName}</h2>
          </CartouchePanel>

          <div className="gw-map-journal">
            <button
              type="button"
              className="gw-map-journal-trigger"
              aria-expanded={isLedgerOpen}
              aria-controls={compactHeaderId}
              onClick={onToggleLedger}
            >
              <span className="gw-map-journal-trigger__title">
                {mapStrings.journal}
              </span>
              <ChevronDown
                size={14}
                className="gw-map-journal-trigger__chevron"
                data-open={isLedgerOpen ? "true" : "false"}
                aria-hidden="true"
              />
              {objectiveLabel ? (
                <span className="gw-map-journal-trigger__objective">
                  {mapStrings.active_objectives}: {objectiveLabel}
                </span>
              ) : null}
              <span
                className="gw-map-journal-trigger__states"
                aria-hidden="true"
              >
                {MAP_POINT_STATES.map((state) => (
                  <span
                    key={state}
                    className="gw-map-journal-trigger__state"
                    data-state={state}
                  >
                    <span className="gw-map-status-dot gw-map-status-dot--compact" />
                    {pointStateSummary[state]}
                  </span>
                ))}
              </span>
            </button>

            {isLedgerOpen ? (
              <CartouchePanel
                label={mapStrings.ledger}
                padding="1.1rem 1.25rem"
                className="gw-map-ledger-drawer gw-map-ledger-drawer--desktop gw-map-cartouche-ink"
              >
                <div
                  id={compactHeaderId}
                  className="gw-map-ledger-drawer__frame"
                >
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
                        <span className="gw-map-ledger-grid__label">
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
                    {isCodeEntryOpen
                      ? mapStrings.hide_code
                      : mapStrings.redeem_code}
                  </button>
                  {isCodeEntryOpen ? codeEntryForm("desktop") : null}
                </div>
              </CartouchePanel>
            ) : null}
          </div>
        </>
      )}
    </header>
  );
};
