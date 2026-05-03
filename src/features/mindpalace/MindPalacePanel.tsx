import { useEffect, useMemo, useState } from "react";
import { useReducer, useTable } from "spacetimedb/react";
import { usePlayerBindings } from "../../entities/player/hooks/usePlayerBindings";
import { reducers, tables } from "../../shared/spacetime/bindings";
import { useIdentity } from "../../shared/spacetime/useIdentity";
import { MindBoardCanvas } from "../mindboard/MindBoardCanvas";
import {
  deriveHypothesisState,
  parseRequiredFactIds,
  parseRequiredVars,
} from "./model/readiness";

const createRequestId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `req-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
};

export const MindPalacePanel = () => {
  const { identityHex } = useIdentity();
  const { vars: varsByKey } = usePlayerBindings();

  const [mindCases] = useTable(tables.mindCase);
  const [mindHypotheses] = useTable(tables.mindHypothesis);
  const [playerMindFacts] = useTable(tables.myMindFacts);
  const [playerMindHypotheses] = useTable(tables.myMindHypotheses);
  const [playerMindCases] = useTable(tables.myMindCases);

  const startMindCase = useReducer(reducers.startMindCase);

  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [statusLine, setStatusLine] = useState("");
  const [error, setError] = useState<string | null>(null);

  const activeCases = useMemo(
    () =>
      [...mindCases]
        .filter((entry) => entry.isActive)
        .sort((left, right) => left.title.localeCompare(right.title)),
    [mindCases],
  );

  useEffect(() => {
    if (activeCases.length === 0) {
      setSelectedCaseId("");
      return;
    }
    if (
      selectedCaseId &&
      activeCases.some((entry) => entry.caseId === selectedCaseId)
    ) {
      return;
    }

    setSelectedCaseId(activeCases[0].caseId);
  }, [activeCases, selectedCaseId]);

  const myCase = useMemo(() => {
    if (!selectedCaseId) {
      return null;
    }

    return (
      playerMindCases.find((entry) => entry.caseId === selectedCaseId) ?? null
    );
  }, [playerMindCases, selectedCaseId]);

  const caseReadySummary = useMemo(() => {
    if (!selectedCaseId) {
      return { readyCount: 0, totalHypotheses: 0 };
    }

    const discoveredFactIds = new Set(
      playerMindFacts
        .filter((row) => row.caseId === selectedCaseId)
        .map((row) => row.factId),
    );

    const validatedHypothesisIds = new Set(
      playerMindHypotheses
        .filter(
          (row) => row.caseId === selectedCaseId && row.status === "validated",
        )
        .map((row) => row.hypothesisId),
    );

    const hypothesesForCase = mindHypotheses.filter(
      (entry) => entry.caseId === selectedCaseId,
    );

    let readyCount = 0;
    for (const hypothesis of hypothesesForCase) {
      if (validatedHypothesisIds.has(hypothesis.hypothesisId)) {
        continue;
      }

      const state = deriveHypothesisState({
        requiredFactIds: parseRequiredFactIds(hypothesis.requiredFactIdsJson),
        requiredVars: parseRequiredVars(hypothesis.requiredVarsJson),
        discoveredFactIds,
        varsByKey,
        validated: false,
      });
      if (state.ready) {
        readyCount += 1;
      }
    }

    return {
      readyCount,
      totalHypotheses: hypothesesForCase.length,
    };
  }, [
    mindHypotheses,
    playerMindFacts,
    playerMindHypotheses,
    selectedCaseId,
    varsByKey,
  ]);

  const caseCompletion =
    myCase?.status === "completed"
      ? "completed"
      : myCase?.status === "in_progress"
        ? "in progress"
        : "not started";

  const runAction = async (
    successLine: string,
    action: () => Promise<unknown>,
  ) => {
    setError(null);
    setIsBusy(true);
    try {
      await action();
      setStatusLine(successLine);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unexpected reducer failure",
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleStartCase = async () => {
    if (!selectedCaseId) {
      return;
    }

    await runAction("Mind case started", async () => {
      await startMindCase({
        requestId: createRequestId(),
        caseId: selectedCaseId,
      });
    });
  };

  return (
    <section className="panel-section h-full flex flex-col p-4 w-full h-[calc(100vh-64px)] max-h-[850px] mx-auto">
      <header className="panel-header shrink-0">
        <div>
          <h2 className="text-3xl font-newsreader text-red-100">
            The Conspiracy Board
          </h2>
          <p className="text-white/60">
            Connect evidence and form hypotheses to uncover the truth.
          </p>
        </div>
      </header>

      {activeCases.length > 0 ? (
        <article className="card shrink-0">
          <label className="field">
            Active case
            <select
              value={selectedCaseId}
              onChange={(event) => setSelectedCaseId(event.target.value)}
              disabled={isBusy}
            >
              {activeCases.map((entry) => (
                <option key={entry.caseId} value={entry.caseId}>
                  {entry.title}
                </option>
              ))}
            </select>
          </label>

          <div className="button-row">
            <button
              type="button"
              onClick={handleStartCase}
              disabled={
                !selectedCaseId || isBusy || myCase?.status === "in_progress"
              }
            >
              {myCase?.status === "in_progress" ? "Case Active" : "Start Case"}
            </button>
          </div>
          {selectedCaseId ? (
            <p className="text-xs text-white/70 mt-2">
              Ready hypotheses: {caseReadySummary.readyCount}/
              {caseReadySummary.totalHypotheses}
            </p>
          ) : null}
        </article>
      ) : (
        <article className="card warning">
          <p>No active mind cases were found.</p>
        </article>
      )}

      {selectedCaseId && myCase?.status === "in_progress" ? (
        <div className="flex-1 w-full min-h-[600px] border border-[#2b2b2b] mt-4 relative overflow-hidden ring-1 ring-black/50 shadow-2xl">
          <MindBoardCanvas caseId={selectedCaseId} />
        </div>
      ) : selectedCaseId ? (
        <article className="card warning mt-4">
          <p>
            This case is {caseCompletion}. The Conspiracy Board is only
            available for cases currently in progress.
          </p>
        </article>
      ) : null}

      <div aria-live="polite" aria-atomic="true" className="status-stack pb-4">
        {statusLine && <p className="status-line success">{statusLine}</p>}
        {error && <p className="status-line error">{error}</p>}
      </div>
    </section>
  );
};
