import { useMemo } from "react";
import { useTable } from "spacetimedb/react";
import { usePlayerFlags } from "../../entities/player/hooks/usePlayerFlags";
import { usePlayerVars } from "../../entities/player/hooks/usePlayerVars";
import { ENABLE_DEBUG_CONTENT_SEED } from "../../config";
import { useUiLanguage } from "../../shared/hooks/useUiLanguage";
import { tables } from "../../shared/spacetime/bindings";
import { useIdentity } from "../../shared/spacetime/useIdentity";
import { GameIcon } from "../../shared/ui/icons/game-icons";
import { getCharacterStrings } from "../i18n/uiStrings";
import { parseSnapshot } from "../vn/vnContent";
import { getOriginProfileByFlags } from "./originProfiles";
import { buildPsycheProfile } from "./psycheProfile";

const toLocale = (value: number): string =>
  Number.isInteger(value) ? value.toString() : value.toFixed(2);

const normalizeNumber = (value: number | bigint): number =>
  typeof value === "bigint" ? Number(value) : value;

export const CharacterPanel = () => {
  const { identityHex } = useIdentity();
  const myFlags = usePlayerFlags();
  const myVars = usePlayerVars();
  const [questRows] = useTable(tables.playerQuest);
  const [versions] = useTable(tables.contentVersion);
  const [snapshots] = useTable(tables.contentSnapshot);

  const profile = useMemo(
    () => buildPsycheProfile({ flags: myFlags, vars: myVars }),
    [myFlags, myVars],
  );
  const uiLanguage = useUiLanguage(myFlags);
  const t = useMemo(() => getCharacterStrings(uiLanguage), [uiLanguage]);
  const activeOrigin = useMemo(
    () => getOriginProfileByFlags(myFlags),
    [myFlags],
  );

  const activeVersion = useMemo(
    () => versions.find((entry) => entry.isActive) ?? null,
    [versions],
  );

  const activeSnapshot = useMemo(() => {
    if (!activeVersion) {
      return null;
    }

    const snapshotRow = snapshots.find(
      (entry) => entry.checksum === activeVersion.checksum,
    );
    if (!snapshotRow) {
      return null;
    }

    return parseSnapshot(snapshotRow.payloadJson);
  }, [activeVersion, snapshots]);

  const questStageById = useMemo(() => {
    const byId = new Map<string, number>();
    for (const row of questRows) {
      if (row.playerId.toHexString() !== identityHex) {
        continue;
      }
      byId.set(row.questId, normalizeNumber(row.stage));
    }
    return byId;
  }, [identityHex, questRows]);

  const pointTitleById = useMemo(() => {
    const byId = new Map<string, string>();
    for (const point of activeSnapshot?.map?.points ?? []) {
      byId.set(point.id, point.title);
    }
    return byId;
  }, [activeSnapshot?.map?.points]);

  const getObjectivePointLabel = (pointId: string): string => {
    const title = pointTitleById.get(pointId);
    if (title) {
      return title;
    }
    return ENABLE_DEBUG_CONTENT_SEED ? pointId : "Unknown objective point";
  };

  const questJournalEntries = useMemo(() => {
    const catalog = activeSnapshot?.questCatalog ?? [];

    return catalog.map((quest) => {
      const sortedStages = [...quest.stages].sort(
        (left, right) => left.stage - right.stage,
      );
      const currentStage = questStageById.get(quest.id) ?? 1;
      const activeStage =
        sortedStages.find((stage) => stage.stage === currentStage) ??
        sortedStages.find((stage) => stage.stage > currentStage) ??
        sortedStages[sortedStages.length - 1];
      const hasQuestRow = questStageById.has(quest.id);
      const isCompleted =
        hasQuestRow &&
        currentStage >= sortedStages[sortedStages.length - 1].stage;

      return {
        id: quest.id,
        title: quest.title,
        currentStage,
        activeStage,
        status: isCompleted
          ? "Completed"
          : hasQuestRow
            ? "In progress"
            : "Not started",
      };
    });
  }, [activeSnapshot?.questCatalog, questStageById]);

  const attributeCards: Array<{ key: string; icon: string; label: string }> = [
    { key: "attr_intellect", icon: "intellect", label: "Intellect" },
    { key: "attr_encyclopedia", icon: "intellect", label: "Encyclopedia" },
    { key: "attr_perception", icon: "spirit", label: "Perception" },
    { key: "attr_deception", icon: "shadow", label: "Deception" },
    { key: "attr_social", icon: "social", label: "Social" },
    { key: "attr_physical", icon: "physical", label: "Physical" },
    { key: "attr_psyche", icon: "psyche", label: "Psyche" },
    { key: "attr_spirit", icon: "spirit", label: "Spirit" },
    { key: "attr_shadow", icon: "shadow", label: "Shadow" },
  ];

  return (
    <section className="panel-section">
      <header className="panel-header">
        <div>
          <h2>{t.panelTitle}</h2>
          <p>
            {t.panelSubtitle} <code>player_var</code> / <code>player_flag</code>
            .
          </p>
        </div>
      </header>

      <div className="card-grid">
        {attributeCards.map((card) => (
          <article key={card.key} className="card compact">
            <div className="icon-row">
              <GameIcon name={card.icon} size={24} />
              <strong>{card.label}</strong>
            </div>
            <div className="stat-number">{toLocale(myVars[card.key] ?? 0)}</div>
          </article>
        ))}
      </div>

      <article className="card">
        <h3>{profile.alignment.label}</h3>
        <p>{profile.alignment.description}</p>
      </article>

      {activeOrigin ? (
        <article className="card">
          <h3>{t.originProfile}</h3>
          <p>{activeOrigin.label}</p>
          <p>{activeOrigin.summary}</p>
          <p>
            {`Flaw: ${activeOrigin.flawFlagKey.replace(/^flaw_/, "").replace(/_/g, " ")}`}
          </p>
          <p>
            {`Signature: ${activeOrigin.signatureAbilityFlagKey
              .replace(/^ability_/, "")
              .replace(/_/g, " ")}`}
          </p>
        </article>
      ) : null}

      <div className="card-grid two-col">
        <article className="card">
          <h3>Quest Journal</h3>
          {questJournalEntries.length === 0 ? (
            <p className="muted">
              No quest catalog is available in active content.
            </p>
          ) : (
            <ul className="unstyled-list">
              {questJournalEntries.map((entry) => (
                <li key={entry.id} className="secret-row">
                  <strong>{entry.title}</strong>
                  <span>
                    {entry.status} · Stage {entry.currentStage}
                    {entry.activeStage ? `: ${entry.activeStage.title}` : ""}
                  </span>
                  {entry.activeStage ? (
                    <span className="muted">
                      {entry.activeStage.objectiveHint}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="card">
          <h3>Objective Points</h3>
          {questJournalEntries.length === 0 ? (
            <p className="muted">
              Objectives become available after content publish.
            </p>
          ) : (
            <ul className="unstyled-list">
              {questJournalEntries.map((entry) => (
                <li key={`${entry.id}-points`} className="list-row">
                  <span>{entry.title}</span>
                  <strong>
                    {entry.activeStage?.objectivePointIds
                      ?.map((pointId) => getObjectivePointLabel(pointId))
                      .join(", ") ?? "none"}
                  </strong>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>

      <div className="card-grid two-col">
        <article className="card">
          <h3>{t.factionSignals}</h3>
          <ul className="unstyled-list">
            {profile.factionSignals.map((signal) => (
              <li key={signal.key} className="list-row">
                <span
                  className="dot"
                  style={{ backgroundColor: signal.color }}
                />
                <span>{signal.label}</span>
                <strong>{toLocale(signal.reputation)}</strong>
              </li>
            ))}
          </ul>
        </article>

        <article className="card">
          <h3>{t.checks}</h3>
          <ul className="unstyled-list">
            <li className="list-row">
              <span>Passed</span>
              <strong>{profile.checks.passed}</strong>
            </li>
            <li className="list-row">
              <span>Failed</span>
              <strong>{profile.checks.failed}</strong>
            </li>
            <li className="list-row">
              <span>Locked</span>
              <strong>{profile.checks.locked}</strong>
            </li>
            <li className="list-row">
              <span>Confidence</span>
              <strong>{profile.checks.confidencePercent}%</strong>
            </li>
          </ul>
        </article>
      </div>

      <div className="card-grid two-col">
        <article className="card">
          <h3>{t.secrets}</h3>
          <ul className="unstyled-list">
            {profile.secrets.map((secret) => (
              <li key={secret.id} className="secret-row">
                <strong>{secret.title}</strong>
                <span>{secret.unlocked ? "Unlocked" : secret.hint}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="card">
          <h3>{t.evolutionTracks}</h3>
          <ul className="unstyled-list">
            {profile.evolutionTracks.map((track) => (
              <li key={track.id} className="secret-row">
                <strong>
                  {track.title} ({track.progressPercent}%)
                </strong>
                <span>{track.note}</span>
              </li>
            ))}
          </ul>
        </article>
      </div>

      {ENABLE_DEBUG_CONTENT_SEED ? (
        <div className="card-grid two-col">
          <article className="card">
            <h3>Raw Flags</h3>
            <pre className="code-box">{JSON.stringify(myFlags, null, 2)}</pre>
          </article>
          <article className="card">
            <h3>Raw Vars</h3>
            <pre className="code-box">{JSON.stringify(myVars, null, 2)}</pre>
          </article>
        </div>
      ) : null}
    </section>
  );
};
