import { useMemo, useState } from "react";
import { useReducer, useTable } from "spacetimedb/react";
import {
  getAgencyStandingPresentation,
  getCareerRankLabel,
  getFavorPresentation,
  getTrustBandPresentation,
} from "../../../shared/game/socialPresentation";
import { getLocationCastPresentation } from "../../../shared/game/locationCastPresentation";
import {
  reducers,
  tables,
  type QuestInstance,
} from "../../../shared/spacetime/bindings";
import { useIdentity } from "../../../shared/spacetime/useIdentity";
import { useUiLanguage } from "../../../shared/hooks/useUiLanguage";
import { usePlayerBindings } from "../../../entities/player/hooks/usePlayerBindings";
import { CASE_CATALOG } from "../../../shared/vn-contract";
import type { QuestStepInstance } from "../../../shared/vn-contract";
import { parseSnapshot } from "../../vn/vnContent";
import type { RuntimeMapBinding, RuntimeMapPoint } from "../types";
import {
  collectCaseIdsFromMapConditions,
  findActiveHypothesisLens,
} from "../../mindpalace/focusLens";
import { findPrimaryInternalizedThought } from "../../mindpalace/thoughtCabinet";
import { derivePsychogeographicNote } from "../psychogeography";
import { getMapStrings } from "../../i18n/uiStrings";

type HubTab = "briefing" | "inventory" | "partners";

interface DetectiveHubProps {
  point: RuntimeMapPoint;
  currentLocationId: string | null;
  onRunBinding: (
    point: RuntimeMapPoint,
    binding: RuntimeMapBinding,
  ) => Promise<void>;
  onClose: () => void;
}

// Moved inside component for localization

const formatValue = (value: number | bigint): string =>
  typeof value === "bigint" ? value.toString() : String(value);

const getProceduralActionLabels = (language: string) => {
  if (language === "ru") {
    return {
      activeStep: "Активный шаг",
      advanceFile: "Продвинуть дело",
      advancingFile: "Продвигается...",
    };
  }
  if (language === "de") {
    return {
      activeStep: "Aktiver Schritt",
      advanceFile: "Akte fortsetzen",
      advancingFile: "Wird fortgesetzt...",
    };
  }
  return {
    activeStep: "Active step",
    advanceFile: "Advance file",
    advancingFile: "Advancing...",
  };
};

const parseQuestSteps = (
  row: Pick<QuestInstance, "stepsJson">,
): QuestStepInstance[] => {
  try {
    const parsed = JSON.parse(row.stepsJson);
    return Array.isArray(parsed) ? (parsed as QuestStepInstance[]) : [];
  } catch {
    return [];
  }
};

export const DetectiveHub = ({
  point,
  currentLocationId,
  onRunBinding,
  onClose,
}: DetectiveHubProps) => {
  const isCurrentLocation = currentLocationId === point.locationId;
  const { flags: myFlags, vars: myVars } = usePlayerBindings();
  const language = useUiLanguage(myFlags);
  const mapStrings = getMapStrings(language).hub;
  const proceduralActionLabels = useMemo(
    () => getProceduralActionLabels(language),
    [language],
  );

  const tabConfig: ReadonlyArray<{ id: HubTab; label: string }> = useMemo(
    () => [
      { id: "briefing", label: mapStrings.briefing },
      { id: "inventory", label: mapStrings.inventory },
      { id: "partners", label: mapStrings.partners },
    ],
    [mapStrings],
  );

  const { identityHex } = useIdentity();
  const [activeTab, setActiveTab] = useState<HubTab>("briefing");
  const [pendingBindingId, setPendingBindingId] = useState<string | null>(null);
  const [pendingQuestInstanceId, setPendingQuestInstanceId] = useState<
    string | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const advanceQuestInstance = useReducer(
    reducers.advanceQuestInstance,
  ) as (input: {
    requestId: string;
    instanceId: string;
    stepId?: string;
  }) => Promise<unknown>;

  const [inventoryRows] = useTable(tables.myPlayerInventory);
  const [relationshipRows] = useTable(tables.myRelationships);
  const [npcStateRows] = useTable(tables.myNpcState);
  const [npcFavorRows] = useTable(tables.myNpcFavors);
  const [agencyCareerRows] = useTable(tables.myAgencyCareer);
  const [flagRows] = useTable(tables.myPlayerFlags);
  const [questInstanceRows] = useTable(tables.myQuestInstances);
  const [versionRows] = useTable(tables.contentVersion);
  const [snapshotRows] = useTable(tables.contentSnapshot);

  const activeVersion = useMemo(
    () => versionRows.find((row) => row.isActive) ?? null,
    [versionRows],
  );

  const snapshot = useMemo(() => {
    if (!activeVersion) {
      return null;
    }
    const row =
      snapshotRows.find((entry) => entry.checksum === activeVersion.checksum) ??
      null;
    return row ? parseSnapshot(row.payloadJson) : null;
  }, [activeVersion, snapshotRows]);
  const activeLens = useMemo(
    () =>
      findActiveHypothesisLens(
        snapshot,
        myFlags,
        point.availableBindings.flatMap((binding) =>
          collectCaseIdsFromMapConditions(binding.conditions),
        ),
      ),
    [myFlags, point.availableBindings, snapshot],
  );
  const internalizedThought = useMemo(
    () => findPrimaryInternalizedThought(snapshot, myFlags, myVars),
    [myFlags, myVars, snapshot],
  );
  const psychogeographicNote = useMemo(
    () =>
      derivePsychogeographicNote({
        point,
        activeLens,
        internalizedThought,
        heat: myVars.heat ?? 0,
        tension: myVars.tension ?? 0,
        isCurrentLocation: currentLocationId === point.locationId,
      }),
    [
      activeLens,
      currentLocationId,
      internalizedThought,
      myVars.heat,
      myVars.tension,
      point,
    ],
  );

  const introCompleted = useMemo(
    () =>
      flagRows.some(
        (row) => row.key === "INTRO_COMPLETED" && row.value === true,
      ),
    [flagRows],
  );

  const inventoryItems = useMemo(
    () => inventoryRows.filter((row) => row.quantity > 0),
    [inventoryRows],
  );
  const activeQuestInstances = useMemo(() => {
    const titleByArchetypeId = new Map(
      CASE_CATALOG.questArchetypes.map((archetype) => [
        archetype.id,
        archetype.title,
      ]),
    );

    return questInstanceRows
      .filter((row) => row.status === "active" || row.status === "pending")
      .map((row) => {
        const steps = parseQuestSteps(row);
        const activeStep = steps.find((step) => step.status === "active");
        const completedStepCount = steps.filter(
          (step) => step.status === "completed",
        ).length;

        return {
          key: row.questInstanceKey,
          instanceId: row.instanceId,
          title: titleByArchetypeId.get(row.archetypeId) ?? row.archetypeId,
          status: row.status,
          activeStep,
          stepCount: steps.length,
          completedStepCount,
        };
      });
  }, [questInstanceRows]);
  const completedQuestInstances = useMemo(() => {
    const titleByArchetypeId = new Map(
      CASE_CATALOG.questArchetypes.map((archetype) => [
        archetype.id,
        archetype.title,
      ]),
    );

    return questInstanceRows
      .filter((row) => row.status === "completed")
      .map((row) => {
        const steps = parseQuestSteps(row);
        const completedStepCount = steps.filter(
          (step) => step.status === "completed",
        ).length;

        return {
          key: row.questInstanceKey,
          title: titleByArchetypeId.get(row.archetypeId) ?? row.archetypeId,
          status: row.status,
          stepCount: steps.length,
          completedStepCount,
        };
      });
  }, [questInstanceRows]);

  const companions = useMemo(() => {
    const trustByNpcId = new Map<string, number>();
    for (const row of relationshipRows) {
      trustByNpcId.set(row.characterId, row.value);
    }
    for (const row of npcStateRows) {
      trustByNpcId.set(row.npcId, row.trustScore);
    }

    const favorByNpcId = new Map<string, number>();
    for (const row of npcFavorRows) {
      favorByNpcId.set(
        row.npcId,
        typeof row.balance === "bigint" ? Number(row.balance) : row.balance,
      );
    }

    return (snapshot?.socialCatalog?.npcIdentities ?? [])
      .filter(
        (identity) =>
          trustByNpcId.has(identity.id) || favorByNpcId.has(identity.id),
      )
      .map((identity) => {
        const trust = trustByNpcId.get(identity.id) ?? 0;
        const favor = favorByNpcId.get(identity.id) ?? 0;
        return {
          id: identity.id,
          displayName: identity.displayName,
          publicRole: identity.publicRole,
          trustLabel: getTrustBandPresentation(trust).label,
          favorLabel: getFavorPresentation(favor).label,
        };
      });
  }, [
    npcFavorRows,
    npcStateRows,
    relationshipRows,
    snapshot?.socialCatalog?.npcIdentities,
  ]);
  const locationCast = useMemo(
    () => getLocationCastPresentation(point.locationId),
    [point.locationId],
  );

  const agencyCareer = useMemo(
    () => agencyCareerRows[0] ?? null,
    [agencyCareerRows],
  );
  const agencyStandingLabel = getAgencyStandingPresentation(
    agencyCareer?.standingScore ?? 0,
  ).label;
  const agencyRankLabel = getCareerRankLabel(
    snapshot?.socialCatalog,
    agencyCareer?.rankId,
  );

  const primaryBinding = point.primaryBinding;
  const secondaryBindings = useMemo(
    () =>
      point.availableBindings.filter(
        (binding) => binding.id !== primaryBinding?.id,
      ),
    [point.availableBindings, primaryBinding?.id],
  );
  const isBusy = pendingBindingId !== null;
  const isQuestAdvanceBusy = pendingQuestInstanceId !== null;

  const runBinding = async (binding: RuntimeMapBinding) => {
    setPendingBindingId(binding.id);
    setError(null);
    try {
      await onRunBinding(point, binding);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Action failed. Please retry.",
      );
    } finally {
      setPendingBindingId(null);
    }
  };

  const advanceProceduralFile = async (entry: {
    instanceId: string;
    activeStep?: QuestStepInstance;
  }) => {
    setPendingQuestInstanceId(entry.instanceId);
    setError(null);
    try {
      await advanceQuestInstance({
        requestId: `hub-advance-${entry.instanceId}-${Date.now()}`,
        instanceId: entry.instanceId,
        stepId: entry.activeStep?.id,
      });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : mapStrings.action_failed,
      );
    } finally {
      setPendingQuestInstanceId(null);
    }
  };

  return (
    <div className="gw-hub-overlay" onClick={onClose}>
      <aside
        className="gw-hub-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`hub-title-${point.id}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="gw-map-overlay-paper" />
        <div className="gw-map-panel__frame gw-hub-panel__frame">
          <button type="button" onClick={onClose} className="gw-hub-close-btn">
            {mapStrings.close}
          </button>

          <header className="gw-hub-header">
            <div>
              <p className="gw-hub-label-eyebrow">{mapStrings.agency_hub}</p>
              <h3 id={`hub-title-${point.id}`} className="gw-hub-title">
                {point.title}
              </h3>
            </div>
            <span
              className="gw-hub-status-badge"
              data-location-state={isCurrentLocation ? "current" : "route"}
            >
              <span className="gw-hub-status-dot" />
              {isCurrentLocation ? mapStrings.on_site : mapStrings.field_route}
            </span>
          </header>

          {activeLens ? (
            <div className="gw-hub-lens-tag">
              {mapStrings.active_lens}: {activeLens.hypothesisText}
            </div>
          ) : null}

          <section className="gw-hub-info-panel">
            <p className="gw-hub-label-eyebrow">{psychogeographicNote.title}</p>
            <p className="gw-hub-note-body">{psychogeographicNote.body}</p>
          </section>

          <nav className="gw-hub-tab-bar" aria-label="Hub tabs">
            {tabConfig.map((tab) => (
              <button
                key={tab.id}
                type="button"
                aria-pressed={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="gw-hub-tab"
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {activeTab === "briefing" ? (
            <section className="gw-hub-tab-panel">
              <p className="gw-hub-copy">
                {introCompleted
                  ? mapStrings.bureau_operational
                  : mapStrings.briefing_pending}
              </p>

              {locationCast ? (
                <section className="gw-hub-roster">
                  <div>
                    <div className="gw-hub-label-eyebrow">
                      {mapStrings.duty_roster}
                    </div>
                    <p className="gw-hub-copy gw-hub-copy--tight">
                      {locationCast.tone}
                    </p>
                  </div>

                  <div className="gw-hub-roster-grid">
                    <article className="gw-hub-roster-card">
                      <div className="gw-hub-label-eyebrow">
                        {mapStrings.scene_owner}
                      </div>
                      <strong className="gw-hub-person-name">
                        {locationCast.primaryNpc.displayName}
                      </strong>
                      <p className="gw-hub-person-role">
                        {locationCast.primaryNpc.publicRole}
                      </p>
                    </article>

                    <article className="gw-hub-roster-card">
                      <div className="gw-hub-label-eyebrow">
                        {mapStrings.support_desk}
                      </div>
                      <div className="gw-hub-support-list">
                        {locationCast.supportNpcs.map((npc) => (
                          <div key={npc.id}>
                            <strong className="gw-hub-support-name">
                              {npc.displayName}
                            </strong>
                            <span className="gw-hub-support-role">
                              {npc.publicRole}
                            </span>
                          </div>
                        ))}
                      </div>
                    </article>
                  </div>

                  <p className="gw-hub-copy gw-hub-copy--tight">
                    {locationCast.dramaticFunction}
                  </p>
                </section>
              ) : null}

              <div className="gw-hub-metrics-grid">
                {[
                  [
                    mapStrings.inventory_ready,
                    `${inventoryItems.length} ${mapStrings.entries}`,
                  ],
                  [
                    mapStrings.partners_file,
                    `${companions.length} ${mapStrings.contacts}`,
                  ],
                  [
                    mapStrings.procedural_files,
                    `${activeQuestInstances.length + completedQuestInstances.length} ${mapStrings.entries}`,
                  ],
                  [mapStrings.agency_rank, agencyRankLabel],
                  [mapStrings.agency_status, agencyStandingLabel],
                ].map(([label, value]) => (
                  <div key={label} className="gw-hub-grid-item">
                    <div className="gw-hub-label-eyebrow">{label}</div>
                    <div className="gw-hub-metric-value">{value}</div>
                  </div>
                ))}
              </div>

              {activeQuestInstances.length > 0 ? (
                <section className="gw-hub-content-section gw-hub-proc-files">
                  <div className="gw-hub-label-eyebrow">
                    {mapStrings.procedural_files}
                  </div>
                  <div className="gw-hub-proc-file-list">
                    {activeQuestInstances.map((entry) => (
                      <article key={entry.key} className="gw-hub-proc-file">
                        <div>
                          <h4 className="gw-hub-item-title">{entry.title}</h4>
                          <p className="gw-secondary-text">
                            {mapStrings.generated_case} / {entry.status}
                          </p>
                          {entry.activeStep ? (
                            <p className="gw-secondary-text gw-hub-proc-file__step">
                              {proceduralActionLabels.activeStep}:{" "}
                              {entry.activeStep.nodeId ?? entry.activeStep.id}
                            </p>
                          ) : null}
                        </div>
                        <div className="gw-hub-proc-file__controls">
                          <span className="gw-hub-proc-file__meta">
                            {entry.completedStepCount}/{entry.stepCount}{" "}
                            {mapStrings.steps_logged}
                          </span>
                          <button
                            type="button"
                            className="gw-hub-proc-file__advance"
                            disabled={
                              isQuestAdvanceBusy ||
                              entry.activeStep === undefined
                            }
                            onClick={() => void advanceProceduralFile(entry)}
                          >
                            {pendingQuestInstanceId === entry.instanceId
                              ? proceduralActionLabels.advancingFile
                              : proceduralActionLabels.advanceFile}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}

              {completedQuestInstances.length > 0 ? (
                <section className="gw-hub-content-section gw-hub-proc-files">
                  <div className="gw-hub-label-eyebrow">Closed files</div>
                  <div className="gw-hub-proc-file-list">
                    {completedQuestInstances.map((entry) => (
                      <article
                        key={entry.key}
                        className="gw-hub-proc-file"
                        data-status="completed"
                      >
                        <div>
                          <h4 className="gw-hub-item-title">{entry.title}</h4>
                          <p className="gw-secondary-text">
                            {mapStrings.generated_case} / {entry.status}
                          </p>
                        </div>
                        <span className="gw-hub-proc-file__meta">
                          {entry.completedStepCount}/{entry.stepCount}{" "}
                          {mapStrings.steps_logged}
                        </span>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}

              {primaryBinding ? (
                <div className="gw-hub-action-stack">
                  <div className="gw-hub-action-row">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => void runBinding(primaryBinding)}
                      className="gw-hub-primary-btn"
                    >
                      {pendingBindingId === primaryBinding.id
                        ? `${primaryBinding.label}...`
                        : introCompleted
                          ? mapStrings.review_briefing
                          : mapStrings.open_briefing}
                    </button>
                  </div>

                  {secondaryBindings.length > 0 ? (
                    <div className="gw-hub-secondary-grid">
                      {secondaryBindings.map((binding) => (
                        <button
                          key={binding.id}
                          type="button"
                          disabled={isBusy}
                          onClick={() => void runBinding(binding)}
                          className="gw-hub-secondary-btn"
                        >
                          <strong className="gw-hub-secondary-btn__label">
                            {pendingBindingId === binding.id
                              ? `${binding.label}...`
                              : binding.label}
                          </strong>
                          <span className="gw-hub-secondary-btn__hint">
                            {binding.intent === "travel"
                              ? "Travel or logistics action."
                              : "Auxiliary bureau action available from this hub."}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="gw-hub-empty-panel">
                  {mapStrings.no_briefing}
                </div>
              )}
            </section>
          ) : null}

          {activeTab === "inventory" ? (
            <section className="gw-hub-tab-panel">
              {inventoryItems.length === 0 ? (
                <div className="gw-hub-empty-panel">
                  {mapStrings.no_equipment}
                </div>
              ) : (
                inventoryItems.map((item) => (
                  <article
                    key={item.inventoryKey}
                    className="gw-hub-inventory-item"
                  >
                    <div>
                      <h4 className="gw-hub-item-title">{item.itemId}</h4>
                      <p className="gw-secondary-text">Filed for bureau use.</p>
                    </div>
                    <span className="gw-hub-quantity">
                      {mapStrings.qty} {formatValue(item.quantity)}
                    </span>
                  </article>
                ))
              )}
            </section>
          ) : null}

          {activeTab === "partners" ? (
            <section className="gw-hub-tab-panel">
              {companions.length === 0 ? (
                <div className="gw-hub-content-section">
                  {mapStrings.no_partners}
                </div>
              ) : (
                companions.map((companion) => (
                  <article key={companion.id} className="gw-hub-grid-item">
                    <div>
                      <h4 className="gw-hub-item-title">
                        {companion.displayName}
                      </h4>
                      <p className="gw-secondary-text">
                        {companion.publicRole}
                      </p>
                    </div>
                    <div className="gw-hub-partner-rating">
                      <span>{companion.trustLabel}</span>
                      <span className="gw-hub-partner-rating__favor">
                        {companion.favorLabel}
                      </span>
                    </div>
                  </article>
                ))
              )}
            </section>
          ) : null}

          <footer className="gw-hub-footer">
            <span>
              {mapStrings.location}:{" "}
              {currentLocationId === point.locationId
                ? mapStrings.here
                : point.locationId}
            </span>
            <span>
              {point.availableBindings.length} {mapStrings.bindings_available}
            </span>
          </footer>

          {error ? (
            <div className="gw-map-inline-note gw-hub-error-note">{error}</div>
          ) : null}
        </div>
      </aside>
    </div>
  );
};
