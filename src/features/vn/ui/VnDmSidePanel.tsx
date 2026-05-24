import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AI_DM_TURN_SOURCE_SIDE_PANEL,
  AI_PROPOSE_DM_TURN_KIND,
  type DmTurnProposal,
  type GenerateDmTurnPayload,
  type PlayerRemark,
  type SessionCanonFact,
} from "../../ai/contracts";
import { readPsycheState } from "../../../shared/game/innerVoiceModel";
import {
  WITCH_ALCOHOL_AFTERTASTE_VAR,
  WITCH_BLOOD_CURSE_PRESSURE_VAR,
  WITCH_BLOOD_CURSE_TIER_VAR,
  WITCH_BLOOD_DEBT_VAR,
  WITCH_BLOOD_POWER_VAR,
} from "../../../shared/game/witchRules";
import type { AiRequest } from "../../../shared/spacetime/bindings";
import { createRequestId } from "../vnScreenUtils";
import "./VnDmSidePanel.css";

interface VnDmSidePanelLedger {
  acceptedFacts: SessionCanonFact[];
  acceptedRemarks: PlayerRemark[];
}

interface VnDmSidePanelProps {
  scenarioId: string;
  nodeId?: string;
  narrativeResources: {
    fate: number;
    fortune: number;
    fortuneMod: number;
    karma: number;
  };
  myFlags: Record<string, boolean>;
  myVars: Record<string, number>;
  visibleFacts: readonly string[];
  activeRequest: AiRequest | null;
  activeProposal: DmTurnProposal | null;
  enqueueAiRequest: (input: {
    requestId: string;
    kind: string;
    payloadJson: string;
  }) => Promise<unknown>;
  onError: (message: string) => void;
}

const emptyLedger = (): VnDmSidePanelLedger => ({
  acceptedFacts: [],
  acceptedRemarks: [],
});

const readLedger = (key: string): VnDmSidePanelLedger => {
  if (typeof window === "undefined") {
    return emptyLedger();
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return emptyLedger();
    }
    const parsed = JSON.parse(raw) as Partial<VnDmSidePanelLedger>;
    return {
      acceptedFacts: Array.isArray(parsed.acceptedFacts)
        ? parsed.acceptedFacts
        : [],
      acceptedRemarks: Array.isArray(parsed.acceptedRemarks)
        ? parsed.acceptedRemarks
        : [],
    };
  } catch {
    return emptyLedger();
  }
};

const writeLedger = (key: string, ledger: VnDmSidePanelLedger): void => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(key, JSON.stringify(ledger));
};

const requestIdOf = (request: AiRequest | null): string =>
  request?.requestId ?? "";

const resolveToneMode = (
  nodeId: string | undefined,
  bloodPressure: number,
): GenerateDmTurnPayload["toneMode"] => {
  if (
    bloodPressure >= 50 ||
    (nodeId?.includes("estate") ?? false) ||
    (nodeId?.includes("ghost") ?? false) ||
    (nodeId?.includes("evidence") ?? false)
  ) {
    return bloodPressure >= 50 ? "threat" : "gothic_mystery";
  }
  return "safe_chekhovian";
};

export const VnDmSidePanel = ({
  scenarioId,
  nodeId,
  narrativeResources,
  myFlags,
  myVars,
  visibleFacts,
  activeRequest,
  activeProposal,
  enqueueAiRequest,
  onError,
}: VnDmSidePanelProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [actionText, setActionText] = useState("");
  const [remarkText, setRemarkText] = useState("");
  const [spendFateToken, setSpendFateToken] = useState(false);
  const [fortuneSpend, setFortuneSpend] = useState(0);
  const [dismissedRequestId, setDismissedRequestId] = useState("");
  const storageKey = `grenzwanderer_dm_session_ledger_${scenarioId}`;
  const [ledger, setLedger] = useState<VnDmSidePanelLedger>(() =>
    readLedger(storageKey),
  );

  useEffect(() => {
    setLedger(readLedger(storageKey));
  }, [storageKey]);

  useEffect(() => {
    writeLedger(storageKey, ledger);
  }, [ledger, storageKey]);

  const bloodCurse = useMemo(
    () => ({
      tier: Math.trunc(myVars[WITCH_BLOOD_CURSE_TIER_VAR] ?? 1),
      pressure: Math.trunc(myVars[WITCH_BLOOD_CURSE_PRESSURE_VAR] ?? 0),
      power: Math.trunc(myVars[WITCH_BLOOD_POWER_VAR] ?? 0),
      debt: Math.trunc(myVars[WITCH_BLOOD_DEBT_VAR] ?? 0),
      alcoholAftertaste: Math.trunc(myVars[WITCH_ALCOHOL_AFTERTASTE_VAR] ?? 0),
    }),
    [myVars],
  );
  const activeFlags = useMemo(
    () =>
      Object.entries(myFlags)
        .filter(([, value]) => value)
        .map(([key]) => key)
        .sort(),
    [myFlags],
  );
  const activeRequestId = requestIdOf(activeRequest);
  const visibleProposal =
    activeRequestId && activeRequestId !== dismissedRequestId
      ? activeProposal
      : null;
  const isPending =
    activeRequest?.status === "pending" ||
    activeRequest?.status === "processing";
  const canSpendFate = narrativeResources.fate > 0;

  const handleAskDm = useCallback(async () => {
    const trimmedAction = actionText.trim();
    if (!nodeId || trimmedAction.length === 0) {
      return;
    }
    if (spendFateToken && !canSpendFate) {
      onError("Not enough Fate tokens.");
      return;
    }

    const remark =
      remarkText.trim().length > 0
        ? {
            text: remarkText.trim(),
            visibility: "private_dm" as const,
          }
        : undefined;
    const psyche = readPsycheState(myVars);
    const payload: GenerateDmTurnPayload = {
      source: AI_DM_TURN_SOURCE_SIDE_PANEL,
      scenarioId,
      nodeId,
      actionText: trimmedAction,
      remark,
      spendFateToken,
      fortuneSpend,
      moveTags: spendFateToken ? ["investigation"] : [],
      resources: {
        fate: narrativeResources.fate,
        fortune: narrativeResources.fortune,
        fortuneMod: narrativeResources.fortuneMod,
        karma: narrativeResources.karma,
      },
      psyche: {
        ...psyche,
        dominantInnerVoiceId: null,
        activeInnerVoiceIds: [],
      },
      bloodCurse,
      activeSessionFacts: ledger.acceptedFacts,
      acceptedRemarks: ledger.acceptedRemarks,
      visibleFacts,
      activeFlags,
      toneMode: resolveToneMode(nodeId, bloodCurse.pressure),
      locale: "ru",
    };

    try {
      setDismissedRequestId("");
      await enqueueAiRequest({
        requestId: createRequestId(),
        kind: AI_PROPOSE_DM_TURN_KIND,
        payloadJson: JSON.stringify(payload),
      });
    } catch (caughtError) {
      onError(
        caughtError instanceof Error
          ? caughtError.message
          : "DM turn request failed.",
      );
    }
  }, [
    actionText,
    activeFlags,
    bloodCurse,
    canSpendFate,
    enqueueAiRequest,
    fortuneSpend,
    ledger.acceptedFacts,
    ledger.acceptedRemarks,
    myVars,
    narrativeResources.fate,
    narrativeResources.fortune,
    narrativeResources.fortuneMod,
    narrativeResources.karma,
    nodeId,
    onError,
    remarkText,
    scenarioId,
    spendFateToken,
    visibleFacts,
  ]);

  const handleAccept = useCallback(() => {
    if (!visibleProposal) {
      return;
    }
    setLedger((current) => {
      const factsById = new Map(
        current.acceptedFacts.map((fact) => [fact.id, fact]),
      );
      for (const fact of visibleProposal.sessionFacts) {
        factsById.set(fact.id, { ...fact, status: "accepted" });
      }
      const nextRemarks = [...current.acceptedRemarks];
      if (remarkText.trim().length > 0) {
        nextRemarks.push({
          text: remarkText.trim(),
          visibility: "private_dm",
        });
      }
      return {
        acceptedFacts: [...factsById.values()],
        acceptedRemarks: nextRemarks,
      };
    });
    setDismissedRequestId(activeRequestId);
  }, [activeRequestId, remarkText, visibleProposal]);

  const handleSaveNote = useCallback(() => {
    const trimmed = remarkText.trim();
    if (trimmed.length === 0) {
      return;
    }
    setLedger((current) => ({
      ...current,
      acceptedRemarks: [
        ...current.acceptedRemarks,
        { text: trimmed, visibility: "private_dm" },
      ],
    }));
    setRemarkText("");
  }, [remarkText]);

  if (collapsed) {
    return (
      <button
        className="vn-dm-panel__tab"
        data-testid="vn-dm-panel-toggle"
        type="button"
        onClick={() => setCollapsed(false)}
      >
        DM
      </button>
    );
  }

  return (
    <aside className="vn-dm-panel" data-testid="vn-dm-panel">
      <header className="vn-dm-panel__header">
        <div>
          <p className="vn-dm-panel__eyebrow">Tabletop DM</p>
          <h2>Session Canon</h2>
        </div>
        <button type="button" onClick={() => setCollapsed(true)}>
          Hide
        </button>
      </header>

      <dl className="vn-dm-panel__stats">
        <div>
          <dt>Fate</dt>
          <dd>{narrativeResources.fate}</dd>
        </div>
        <div>
          <dt>Fortune</dt>
          <dd>
            {narrativeResources.fortune} / {narrativeResources.fortuneMod}
          </dd>
        </div>
        <div>
          <dt>Karma</dt>
          <dd>{narrativeResources.karma}</dd>
        </div>
        <div>
          <dt>Blood</dt>
          <dd>
            T{bloodCurse.tier} {bloodCurse.pressure}
          </dd>
        </div>
      </dl>

      <section className="vn-dm-panel__ledger">
        <h3>Facts</h3>
        {ledger.acceptedFacts.length > 0 ? (
          <ul>
            {ledger.acceptedFacts.map((fact) => (
              <li key={fact.id}>{fact.text}</li>
            ))}
          </ul>
        ) : (
          <p>No accepted session facts.</p>
        )}
        <h3>Remarks</h3>
        {ledger.acceptedRemarks.length > 0 ? (
          <ul>
            {ledger.acceptedRemarks.map((remark, index) => (
              <li key={`${remark.text}-${index}`}>{remark.text}</li>
            ))}
          </ul>
        ) : (
          <p>No accepted remarks.</p>
        )}
      </section>

      <label className="vn-dm-panel__field">
        Action
        <textarea
          data-testid="vn-dm-action"
          value={actionText}
          onChange={(event) => setActionText(event.target.value)}
        />
      </label>
      <label className="vn-dm-panel__field">
        Remark
        <textarea
          data-testid="vn-dm-remark"
          value={remarkText}
          onChange={(event) => setRemarkText(event.target.value)}
        />
      </label>

      <div className="vn-dm-panel__controls">
        <label>
          <input
            checked={spendFateToken}
            disabled={!canSpendFate}
            type="checkbox"
            onChange={(event) => setSpendFateToken(event.target.checked)}
          />
          Spend Fate
        </label>
        <label>
          Fortune
          <input
            min={0}
            max={Math.max(0, narrativeResources.fortune)}
            type="number"
            value={fortuneSpend}
            onChange={(event) =>
              setFortuneSpend(
                Math.max(0, Math.trunc(Number(event.target.value) || 0)),
              )
            }
          />
        </label>
      </div>

      <div className="vn-dm-panel__actions">
        <button
          type="button"
          disabled={!nodeId || actionText.trim().length === 0 || isPending}
          onClick={() => void handleAskDm()}
        >
          Ask DM
        </button>
        <button
          type="button"
          disabled={!visibleProposal}
          onClick={handleAccept}
        >
          Accept proposal
        </button>
        <button
          type="button"
          disabled={!visibleProposal}
          onClick={() => setDismissedRequestId(activeRequestId)}
        >
          Reject
        </button>
        <button
          type="button"
          disabled={remarkText.trim().length === 0}
          onClick={handleSaveNote}
        >
          Save as note
        </button>
      </div>

      {isPending ? (
        <p className="vn-dm-panel__status">DM is thinking...</p>
      ) : null}
      {visibleProposal ? (
        <section className="vn-dm-panel__proposal">
          <h3>Proposal</h3>
          <p>{visibleProposal.narration}</p>
          {visibleProposal.sessionFacts.length > 0 ? (
            <ul>
              {visibleProposal.sessionFacts.map((fact) => (
                <li key={fact.id}>{fact.text}</li>
              ))}
            </ul>
          ) : null}
          {visibleProposal.risks.length > 0 ? (
            <p className="vn-dm-panel__risks">
              {visibleProposal.risks.join(" ")}
            </p>
          ) : null}
        </section>
      ) : null}
    </aside>
  );
};
