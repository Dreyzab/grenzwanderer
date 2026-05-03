import { useEffect, useMemo, useState } from "react";
import { useReducer, useTable } from "spacetimedb/react";
import { usePlayerBindings } from "../../entities/player/hooks/usePlayerBindings";
import { ENABLE_AI } from "../../config";
import { reducers, tables } from "../../shared/spacetime/bindings";
import { useIdentity } from "../../shared/spacetime/useIdentity";
import {
  AI_DIALOGUE_SOURCE_SKILL_CHECK,
  AI_GENERATE_DIALOGUE_KIND,
} from "../ai/contracts";
import {
  getNodeById,
  getScenarioById,
  isChoiceAvailable,
  parseSnapshot,
} from "./vnContent";
import type { VnSnapshot } from "./types";

const createRequestId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `req-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
};

export const VnPilotPanel = () => {
  const { identityHex } = useIdentity();
  const [versions] = useTable(tables.contentVersion);
  const [snapshots] = useTable(tables.contentSnapshot);
  const [sessions] = useTable(tables.myVnSessions);

  const startScenario = useReducer(reducers.startScenario);
  const recordChoice = useReducer(reducers.recordChoice);
  const enqueueAiRequest = useReducer(reducers.enqueueAiRequest);

  const [selectedScenarioId, setSelectedScenarioId] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusLine, setStatusLine] = useState("");

  const { flags: myFlags, vars: myVars } = usePlayerBindings();

  const activeVersion = useMemo(
    () => versions.find((entry) => entry.isActive) ?? null,
    [versions],
  );

  const snapshot = useMemo<VnSnapshot | null>(() => {
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

  useEffect(() => {
    if (!snapshot || snapshot.scenarios.length === 0) {
      return;
    }
    if (selectedScenarioId.length > 0) {
      return;
    }
    setSelectedScenarioId(snapshot.scenarios[0].id);
  }, [selectedScenarioId, snapshot]);

  const mySession = useMemo(() => {
    if (!selectedScenarioId) {
      return null;
    }

    return (
      sessions.find((entry) => entry.scenarioId === selectedScenarioId) ?? null
    );
  }, [selectedScenarioId, sessions]);

  const currentNode = useMemo(() => {
    if (!snapshot || !selectedScenarioId) {
      return null;
    }

    const scenario = getScenarioById(snapshot, selectedScenarioId);
    if (!scenario) {
      return null;
    }

    if (!mySession) {
      return getNodeById(snapshot, scenario.startNodeId);
    }

    return getNodeById(snapshot, mySession.nodeId);
  }, [mySession, selectedScenarioId, snapshot]);

  const selectedScenario = useMemo(() => {
    if (!snapshot || !selectedScenarioId) {
      return null;
    }
    return getScenarioById(snapshot, selectedScenarioId);
  }, [selectedScenarioId, snapshot]);

  const probeSkillChoice = useMemo(
    () => currentNode?.choices.find((choice) => choice.skillCheck) ?? null,
    [currentNode],
  );

  const runAction = async (label: string, action: () => Promise<unknown>) => {
    setError(null);
    setIsBusy(true);
    try {
      await action();
      setStatusLine(label);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Unexpected action failure";
      setError(message);
    } finally {
      setIsBusy(false);
    }
  };

  const handleStartScenario = async () => {
    if (!selectedScenarioId) {
      return;
    }

    await runAction("Scenario started", async () => {
      await startScenario({
        requestId: createRequestId(),
        scenarioId: selectedScenarioId,
      });
    });
  };

  const handleRecordChoice = async (choiceId: string) => {
    if (!selectedScenarioId) {
      return;
    }

    await runAction(`Choice applied: ${choiceId}`, async () => {
      await recordChoice({
        requestId: createRequestId(),
        scenarioId: selectedScenarioId,
        choiceId,
      });
    });
  };

  const handleAiProbe = async () => {
    const probeSkill = probeSkillChoice?.skillCheck ?? null;
    if (
      !ENABLE_AI ||
      !selectedScenarioId ||
      !currentNode ||
      !probeSkillChoice ||
      !probeSkill
    ) {
      return;
    }

    const voiceLevel = Math.max(0, Math.round(myVars[probeSkill.voiceId] ?? 0));
    const difficulty = Math.max(1, probeSkill.difficulty);

    await runAction("AI request enqueued", async () => {
      await enqueueAiRequest({
        requestId: createRequestId(),
        kind: AI_GENERATE_DIALOGUE_KIND,
        payloadJson: JSON.stringify({
          source: AI_DIALOGUE_SOURCE_SKILL_CHECK,
          scenarioId: selectedScenarioId,
          nodeId: currentNode.id,
          checkId: probeSkill.id,
          choiceId: probeSkillChoice.id,
          voiceId: probeSkill.voiceId,
          choiceText: probeSkillChoice.text,
          passed: true,
          roll: difficulty,
          difficulty,
          voiceLevel,
          locationName: selectedScenario?.title ?? selectedScenarioId,
          narrativeText: currentNode.body,
        }),
      });
    });
  };

  return (
    <section className="panel-section">
      <header className="panel-header">
        <div>
          <h2>VN Pilot</h2>
          <p>
            Active content:{" "}
            <strong>{activeVersion ? activeVersion.version : "none"}</strong>
          </p>
        </div>
        <div className="button-row">
          <button
            onClick={handleAiProbe}
            disabled={
              !ENABLE_AI || !activeVersion || isBusy || !probeSkillChoice
            }
            title={
              !ENABLE_AI
                ? "AI is disabled by feature flag"
                : probeSkillChoice
                  ? "Enqueue supported generate_dialogue debug request"
                  : "Current node has no active skill-check choice for AI probe"
            }
          >
            AI Probe
          </button>
        </div>
      </header>

      <article className="card">
        <label className="field">
          Scenario
          <select
            value={selectedScenarioId}
            onChange={(event) => setSelectedScenarioId(event.target.value)}
            disabled={!snapshot || isBusy}
          >
            {snapshot?.scenarios.map((scenario) => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.title}
              </option>
            ))}
          </select>
        </label>

        <div className="button-row">
          <button
            onClick={handleStartScenario}
            disabled={!selectedScenario || !activeVersion || isBusy}
          >
            Start Scenario
          </button>
        </div>
      </article>

      {!snapshot && (
        <article className="card warning">
          <p>
            No active content snapshot is available.
            {
              " Publish via CLI with 'bun run content:release -- --version X.Y.Z'."
            }
          </p>
        </article>
      )}

      {snapshot && currentNode && (
        <article className="card">
          <h3>{currentNode.title}</h3>
          <p>{currentNode.body}</p>

          <div className="choice-grid">
            {currentNode.choices.map((choice) => {
              const available = isChoiceAvailable(choice, myFlags, myVars);
              return (
                <button
                  key={choice.id}
                  onClick={() => handleRecordChoice(choice.id)}
                  disabled={isBusy || !available || !mySession}
                  title={
                    !mySession
                      ? "Start the scenario first"
                      : available
                        ? choice.id
                        : "Choice conditions are not satisfied"
                  }
                >
                  <span>{choice.text}</span>
                  <code>{choice.id}</code>
                </button>
              );
            })}
            {currentNode.choices.length === 0 && (
              <p className="muted">This node has no outbound choices.</p>
            )}
          </div>

          {mySession?.completedAt && (
            <p className="success">Scenario marked as completed on server.</p>
          )}
        </article>
      )}

      {statusLine && <p className="status-line success">{statusLine}</p>}
      {error && <p className="status-line error">{error}</p>}
      {!ENABLE_AI && (
        <p className="status-line muted">
          AI reducers are available on server, but client AI actions are
          disabled by default (VITE_ENABLE_AI=false).
        </p>
      )}
    </section>
  );
};
