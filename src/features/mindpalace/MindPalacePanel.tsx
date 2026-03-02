import { useEffect, useMemo, useState } from "react";
import { useReducer, useTable } from "spacetimedb/react";
import { usePlayerFlags } from "../../entities/player/hooks/usePlayerFlags";
import { usePlayerVars } from "../../entities/player/hooks/usePlayerVars";
import { reducers, tables } from "../../shared/spacetime/bindings";
import { useIdentity } from "../../shared/spacetime/useIdentity";

type RequiredVar = {
  key: string;
  op: "gte" | "lte" | "eq";
  value: number;
};

const createRequestId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `req-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
};

const parseRequiredFactIds = (requiredFactIdsJson: string): string[] => {
  try {
    const parsed = JSON.parse(requiredFactIdsJson);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((entry): entry is string => typeof entry === "string");
  } catch (_error) {
    return [];
  }
};

const parseRequiredVars = (requiredVarsJson: string): RequiredVar[] => {
  try {
    const parsed = JSON.parse(requiredVarsJson);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (entry): entry is RequiredVar =>
        typeof entry === "object" &&
        entry !== null &&
        "key" in entry &&
        "op" in entry &&
        "value" in entry &&
        typeof (entry as { key?: unknown }).key === "string" &&
        ((entry as { op?: unknown }).op === "gte" ||
          (entry as { op?: unknown }).op === "lte" ||
          (entry as { op?: unknown }).op === "eq") &&
        typeof (entry as { value?: unknown }).value === "number",
    );
  } catch (_error) {
    return [];
  }
};

const doesVarPass = (
  requiredVar: RequiredVar,
  currentValue: number,
): boolean => {
  if (requiredVar.op === "gte") {
    return currentValue >= requiredVar.value;
  }
  if (requiredVar.op === "lte") {
    return currentValue <= requiredVar.value;
  }

  return currentValue === requiredVar.value;
};

const formatVarCondition = (requiredVar: RequiredVar): string => {
  const symbol =
    requiredVar.op === "gte" ? ">=" : requiredVar.op === "lte" ? "<=" : "=";
  return `${requiredVar.key} ${symbol} ${requiredVar.value}`;
};

const focusFlagKey = (caseId: string, hypothesisId: string): string =>
  `mind_focus::${caseId}::${hypothesisId}`;

export const MindPalacePanel = () => {
  const { identityHex } = useIdentity();

  const [mindCases] = useTable(tables.mindCase);
  const [mindFacts] = useTable(tables.mindFact);
  const [mindHypotheses] = useTable(tables.mindHypothesis);
  const [playerMindCases] = useTable(tables.playerMindCase);
  const [playerMindFacts] = useTable(tables.playerMindFact);
  const [playerMindHypotheses] = useTable(tables.playerMindHypothesis);

  const startMindCase = useReducer(reducers.startMindCase);
  const discoverFact = useReducer(reducers.discoverFact);
  const validateHypothesis = useReducer(reducers.validateHypothesis);
  const setHypothesisFocus = useReducer(reducers.setHypothesisFocus);

  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [statusLine, setStatusLine] = useState("");
  const [error, setError] = useState<string | null>(null);

  const varsByKey = usePlayerVars();
  const flagsByKey = usePlayerFlags();

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
      playerMindCases.find(
        (entry) =>
          entry.playerId.toHexString() === identityHex &&
          entry.caseId === selectedCaseId,
      ) ?? null
    );
  }, [identityHex, playerMindCases, selectedCaseId]);

  const factsForCase = useMemo(
    () => mindFacts.filter((entry) => entry.caseId === selectedCaseId),
    [mindFacts, selectedCaseId],
  );

  const discoveredFactIds = useMemo(() => {
    const ids = new Set<string>();

    for (const row of playerMindFacts) {
      if (row.playerId.toHexString() !== identityHex) {
        continue;
      }
      if (row.caseId !== selectedCaseId) {
        continue;
      }

      ids.add(row.factId);
    }

    return ids;
  }, [identityHex, playerMindFacts, selectedCaseId]);

  const hypothesesForCase = useMemo(
    () => mindHypotheses.filter((entry) => entry.caseId === selectedCaseId),
    [mindHypotheses, selectedCaseId],
  );

  const playerHypothesisMap = useMemo(() => {
    const map = new Map<string, { status: string; validatedAt?: unknown }>();

    for (const row of playerMindHypotheses) {
      if (row.playerId.toHexString() !== identityHex) {
        continue;
      }
      if (row.caseId !== selectedCaseId) {
        continue;
      }

      map.set(row.hypothesisId, {
        status: row.status,
        validatedAt: row.validatedAt,
      });
    }

    return map;
  }, [identityHex, playerMindHypotheses, selectedCaseId]);

  const derivedHypotheses = useMemo(
    () =>
      hypothesesForCase.map((hypothesis) => {
        const requiredFactIds = parseRequiredFactIds(
          hypothesis.requiredFactIdsJson,
        );
        const requiredVars = parseRequiredVars(hypothesis.requiredVarsJson);

        const missingFacts = requiredFactIds.filter(
          (factId) => !discoveredFactIds.has(factId),
        );
        const failedVars = requiredVars.filter(
          (requiredVar) =>
            !doesVarPass(requiredVar, varsByKey[requiredVar.key] ?? 0),
        );

        const playerHypothesis = playerHypothesisMap.get(
          hypothesis.hypothesisId,
        );
        const validated = playerHypothesis?.status === "validated";
        const focused =
          flagsByKey[focusFlagKey(selectedCaseId, hypothesis.hypothesisId)] ??
          false;

        return {
          ...hypothesis,
          requiredFactIds,
          requiredVars,
          missingFacts,
          failedVars,
          validated,
          focused,
          ready: missingFacts.length === 0 && failedVars.length === 0,
        };
      }),
    [
      discoveredFactIds,
      flagsByKey,
      hypothesesForCase,
      playerHypothesisMap,
      selectedCaseId,
      varsByKey,
    ],
  );

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

  const handleDiscoverFact = async (factId: string) => {
    if (!selectedCaseId) {
      return;
    }

    await runAction(`Fact discovered: ${factId}`, async () => {
      await discoverFact({
        requestId: createRequestId(),
        caseId: selectedCaseId,
        factId,
      });
    });
  };

  const handleValidateHypothesis = async (hypothesisId: string) => {
    if (!selectedCaseId) {
      return;
    }

    await runAction(`Hypothesis validated: ${hypothesisId}`, async () => {
      await validateHypothesis({
        requestId: createRequestId(),
        caseId: selectedCaseId,
        hypothesisId,
      });
    });
  };

  const handleToggleFocus = async (hypothesisId: string, focused: boolean) => {
    if (!selectedCaseId) {
      return;
    }

    await runAction(`Hypothesis focus updated: ${hypothesisId}`, async () => {
      await setHypothesisFocus({
        caseId: selectedCaseId,
        hypothesisId,
        focused: !focused,
      });
    });
  };

  return (
    <section className="panel-section">
      <header className="panel-header">
        <div>
          <h2>Mind Palace</h2>
          <p>Server-authoritative deduction for one active case.</p>
        </div>
      </header>

      {activeCases.length > 0 ? (
        <article className="card">
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
              disabled={!selectedCaseId || isBusy}
            >
              Start Case
            </button>
          </div>
        </article>
      ) : (
        <article className="card warning">
          <p>
            No active mind cases were found in the published content. Publish
            `schemaVersion=2` snapshot with `mindPalace` payload.
          </p>
        </article>
      )}

      {selectedCaseId && (
        <div className="mind-grid two-col-grid">
          <article className="card">
            <h3>Case Progress</h3>
            <ul className="unstyled-list">
              <li className="list-row">
                <span>Status</span>
                <strong>{caseCompletion}</strong>
              </li>
              <li className="list-row">
                <span>Discovered facts</span>
                <strong>
                  {discoveredFactIds.size}/{factsForCase.length}
                </strong>
              </li>
              <li className="list-row">
                <span>Validated hypotheses</span>
                <strong>
                  {derivedHypotheses.filter((entry) => entry.validated).length}/
                  {derivedHypotheses.length}
                </strong>
              </li>
            </ul>
          </article>

          <article className="card">
            <h3>Vars Snapshot</h3>
            <pre className="code-box">{JSON.stringify(varsByKey, null, 2)}</pre>
          </article>
        </div>
      )}

      {selectedCaseId && (
        <article className="card">
          <h3>Facts</h3>
          <div className="mind-list">
            {factsForCase.map((fact) => {
              const discovered = discoveredFactIds.has(fact.factId);

              return (
                <div key={fact.factId} className="mind-item">
                  <div className="mind-item-header">
                    <strong>{fact.factId}</strong>
                    <span className={discovered ? "success" : "muted"}>
                      {discovered ? "discovered" : "not discovered"}
                    </span>
                  </div>
                  <p>{fact.text}</p>
                  <div className="button-row">
                    <button
                      type="button"
                      disabled={discovered || isBusy}
                      onClick={() => handleDiscoverFact(fact.factId)}
                    >
                      Discover (debug)
                    </button>
                  </div>
                </div>
              );
            })}
            {factsForCase.length === 0 && (
              <p className="muted">No facts configured for this case.</p>
            )}
          </div>
        </article>
      )}

      {selectedCaseId && (
        <article className="card">
          <h3>Hypotheses</h3>
          <div className="mind-list">
            {derivedHypotheses.map((hypothesis) => (
              <div key={hypothesis.hypothesisId} className="mind-item">
                <div className="mind-item-header">
                  <strong>{hypothesis.key}</strong>
                  <span className={hypothesis.validated ? "success" : "muted"}>
                    {hypothesis.validated ? "validated" : "pending"}
                  </span>
                </div>
                <p>{hypothesis.text}</p>
                <p className="muted">
                  Required facts:{" "}
                  {hypothesis.requiredFactIds.join(", ") || "none"}
                </p>
                <p className="muted">
                  Required vars:{" "}
                  {hypothesis.requiredVars.map(formatVarCondition).join(", ") ||
                    "none"}
                </p>
                {hypothesis.missingFacts.length > 0 && (
                  <p className="error">
                    Missing facts: {hypothesis.missingFacts.join(", ")}
                  </p>
                )}
                {hypothesis.failedVars.length > 0 && (
                  <p className="error">
                    Failed vars:{" "}
                    {hypothesis.failedVars.map(formatVarCondition).join(", ")}
                  </p>
                )}
                <div className="button-row">
                  <button
                    type="button"
                    onClick={() =>
                      handleValidateHypothesis(hypothesis.hypothesisId)
                    }
                    disabled={
                      !hypothesis.ready || hypothesis.validated || isBusy
                    }
                  >
                    Validate
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleToggleFocus(
                        hypothesis.hypothesisId,
                        hypothesis.focused,
                      )
                    }
                    disabled={isBusy}
                  >
                    {hypothesis.focused ? "Unfocus" : "Focus"}
                  </button>
                </div>
              </div>
            ))}
            {derivedHypotheses.length === 0 && (
              <p className="muted">No hypotheses configured for this case.</p>
            )}
          </div>
        </article>
      )}

      {statusLine && <p className="status-line success">{statusLine}</p>}
      {error && <p className="status-line error">{error}</p>}
      <p className="status-line muted">
        Facts can be discovered from VN choices via `discover_fact` effect;
        debug button is available for reducer smoke only.
      </p>
    </section>
  );
};
