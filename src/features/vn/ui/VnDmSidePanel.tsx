import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AI_DM_TURN_SOURCE_SIDE_PANEL,
  AI_PROPOSE_DM_TURN_KIND,
  type BeatDirectiveKind,
  type DmInnerVoiceInput,
  type DmTurnOption,
  type DmTurnProposal,
  type GenerateDmTurnPayload,
  type PlayerRemark,
  type RegenerationContext,
  type SessionCanonFact,
} from "../../ai/contracts";
import {
  readPsycheState,
  resolveOverallInnerVoiceSelection,
} from "../../../shared/game/innerVoiceModel";
import { INNER_VOICE_DEFINITIONS } from "../../../../data/innerVoiceContract";
import { getVoiceSkin } from "../../../../data/parliamentModules";
import { isParliamentVoiceVisible } from "../parliamentVisibility";
import { getVoicePresentation } from "../voicePresentation";
import {
  WITCH_ALCOHOL_AFTERTASTE_VAR,
  WITCH_BLOOD_CURSE_PRESSURE_VAR,
  WITCH_BLOOD_CURSE_TIER_VAR,
  WITCH_BLOOD_DEBT_VAR,
  WITCH_BLOOD_POWER_VAR,
} from "../../../shared/game/witchRules";
import type { AiRequest } from "../../../shared/spacetime/bindings";
import { createRequestId } from "../vnScreenUtils";
import { INTENT_VERBS, appendIntent } from "./intentVerbs";
import { PERIOD_EXPRESSIONS } from "./periodReferences";
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
  parliamentPresetId?: string;
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

type DmTab = "play" | "director" | "canon";
type DmViewMode = "simple" | "expanded";
type BeatMode = "append" | "replace";

interface BeatEntry {
  directive: BeatDirectiveKind;
  action: string;
  proposal: DmTurnProposal;
}

interface RollResult {
  roll: number;
  passed: boolean;
  difficulty: number;
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

const rollD20 = (): number => 1 + Math.floor(Math.random() * 20);

const DIRECTIVE_META: Record<
  BeatDirectiveKind,
  { label: string; hint: string }
> = {
  atmosphere: { label: "Атмосфера", hint: "медленный сенсорный бит" },
  complication: { label: "Осложнение", hint: "ввести препятствие" },
  debate_options: { label: "Голоса + 3 варианта", hint: "бит-решение" },
};

const DIRECTIVE_ORDER: BeatDirectiveKind[] = [
  "atmosphere",
  "complication",
  "debate_options",
];

const TABS: { id: DmTab; label: string }[] = [
  { id: "play", label: "Игра" },
  { id: "director", label: "Режиссёр" },
  { id: "canon", label: "Канон" },
];

export const VnDmSidePanel = ({
  scenarioId,
  nodeId,
  narrativeResources,
  myFlags,
  myVars,
  parliamentPresetId,
  visibleFacts,
  activeRequest,
  activeProposal,
  enqueueAiRequest,
  onError,
}: VnDmSidePanelProps) => {
  const [collapsed, setCollapsed] = useState(true);
  const [viewMode, setViewMode] = useState<DmViewMode>("simple");
  const [activeTab, setActiveTab] = useState<DmTab>("play");
  const [actionText, setActionText] = useState("");
  const [remarkText, setRemarkText] = useState("");
  const [spendFateToken, setSpendFateToken] = useState(false);
  const [fortuneSpend, setFortuneSpend] = useState(0);
  const [sequence, setSequence] = useState<BeatDirectiveKind[]>([]);
  const [beats, setBeats] = useState<BeatEntry[]>([]);
  const [pendingBeat, setPendingBeat] = useState<{
    directive: BeatDirectiveKind;
    action: string;
    requestId: string;
    mode: BeatMode;
  } | null>(null);
  const [runIndex, setRunIndex] = useState(0);
  const [editingBeat, setEditingBeat] = useState<number | null>(null);
  const [regenOpen, setRegenOpen] = useState(false);
  const [regenNotes, setRegenNotes] = useState("");
  const [rolls, setRolls] = useState<Record<string, RollResult>>({});
  const [forks, setForks] = useState<DmTurnProposal[]>([]);
  const [forkContext, setForkContext] = useState<{
    action: string;
    prior?: string;
  } | null>(null);
  const [pendingFork, setPendingFork] = useState<{ requestId: string } | null>(
    null,
  );
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
  const innerVoiceSelection = useMemo(
    () => resolveOverallInnerVoiceSelection(myVars),
    [myVars],
  );
  const innerVoices = useMemo<DmInnerVoiceInput[]>(
    () =>
      innerVoiceSelection.ordered
        .filter((entry) =>
          isParliamentVoiceVisible(entry.voiceId, myFlags, parliamentPresetId),
        )
        .map((entry) => {
          const definition = INNER_VOICE_DEFINITIONS[entry.voiceId];
          const skin = getVoiceSkin(parliamentPresetId, entry.voiceId);
          return {
            voiceId: entry.voiceId,
            role: entry.role,
            stance: entry.stance,
            label: skin?.label ?? definition.label,
            worldview:
              skin?.persona?.coreDrive ??
              skin?.persona?.motto ??
              definition.worldview,
            toneDescriptor:
              skin?.persona?.speechPattern ?? definition.toneDescriptor,
          };
        }),
    [innerVoiceSelection, myFlags, parliamentPresetId],
  );
  const isPending =
    activeRequest?.status === "pending" ||
    activeRequest?.status === "processing";
  const canSpendFate = narrativeResources.fate > 0;

  const buildDmPayload = useCallback(
    (
      directive: BeatDirectiveKind,
      action: string,
      priorNarration?: string,
      regenerationContext?: RegenerationContext,
    ): GenerateDmTurnPayload | null => {
      if (!nodeId) {
        return null;
      }
      const trimmedAction = action.trim() || "Продолжай сцену.";
      const remark =
        remarkText.trim().length > 0
          ? { text: remarkText.trim(), visibility: "private_dm" as const }
          : undefined;
      const psyche = readPsycheState(myVars);
      return {
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
          dominantInnerVoiceId: innerVoiceSelection.dominant?.voiceId ?? null,
          activeInnerVoiceIds: innerVoices.map((voice) => voice.voiceId),
        },
        bloodCurse,
        activeSessionFacts: ledger.acceptedFacts,
        acceptedRemarks: ledger.acceptedRemarks,
        visibleFacts,
        activeFlags,
        innerVoices,
        priorNarration,
        beatDirective: { kind: directive },
        toneMode: resolveToneMode(nodeId, bloodCurse.pressure),
        locale: "ru",
        regenerationContext,
      };
    },
    [
      activeFlags,
      bloodCurse,
      fortuneSpend,
      innerVoiceSelection,
      innerVoices,
      ledger.acceptedFacts,
      ledger.acceptedRemarks,
      myVars,
      narrativeResources.fate,
      narrativeResources.fortune,
      narrativeResources.fortuneMod,
      narrativeResources.karma,
      nodeId,
      remarkText,
      scenarioId,
      spendFateToken,
      visibleFacts,
    ],
  );

  const fireBeat = useCallback(
    async (
      directive: BeatDirectiveKind,
      action: string,
      priorNarration?: string,
      mode: BeatMode = "append",
      regenerationContext?: RegenerationContext,
    ) => {
      if (spendFateToken && !canSpendFate) {
        onError("Недостаточно жетонов Рока.");
        return;
      }
      const payload = buildDmPayload(
        directive,
        action,
        priorNarration,
        regenerationContext,
      );
      if (!payload) {
        return;
      }
      const requestId = createRequestId();
      try {
        await enqueueAiRequest({
          requestId,
          kind: AI_PROPOSE_DM_TURN_KIND,
          payloadJson: JSON.stringify(payload),
        });
        setPendingBeat({
          directive,
          action: payload.actionText,
          requestId,
          mode,
        });
        setActiveTab("play");
      } catch (caughtError) {
        onError(
          caughtError instanceof Error
            ? caughtError.message
            : "Запрос к Мастеру не удался.",
        );
      }
    },
    [buildDmPayload, canSpendFate, enqueueAiRequest, onError, spendFateToken],
  );

  const fireFork = useCallback(
    async (action: string, priorNarration?: string) => {
      if (spendFateToken && !canSpendFate) {
        onError("Недостаточно жетонов Рока.");
        return;
      }
      const payload = buildDmPayload("debate_options", action, priorNarration);
      if (!payload) {
        return;
      }
      const requestId = createRequestId();
      try {
        await enqueueAiRequest({
          requestId,
          kind: AI_PROPOSE_DM_TURN_KIND,
          payloadJson: JSON.stringify(payload),
        });
        setPendingFork({ requestId });
        setActiveTab("play");
      } catch (caughtError) {
        onError(
          caughtError instanceof Error
            ? caughtError.message
            : "Запрос к Мастеру не удался.",
        );
      }
    },
    [buildDmPayload, canSpendFate, enqueueAiRequest, onError, spendFateToken],
  );

  // Capture each beat's proposal exactly once, when its own request completes.
  useEffect(() => {
    if (!pendingBeat) {
      return;
    }
    if (
      requestIdOf(activeRequest) !== pendingBeat.requestId ||
      isPending ||
      !activeProposal
    ) {
      return;
    }
    const entry: BeatEntry = {
      directive: pendingBeat.directive,
      action: pendingBeat.action,
      proposal: activeProposal,
    };
    setBeats((current) =>
      pendingBeat.mode === "replace" && current.length > 0
        ? [...current.slice(0, -1), entry]
        : [...current, entry],
    );
    setPendingBeat(null);
  }, [pendingBeat, activeRequest, activeProposal, isPending]);

  // Capture each fork alternative as its own request completes.
  useEffect(() => {
    if (!pendingFork) {
      return;
    }
    if (
      requestIdOf(activeRequest) !== pendingFork.requestId ||
      isPending ||
      !activeProposal
    ) {
      return;
    }
    const proposal = activeProposal;
    setForks((current) => [...current, proposal]);
    setPendingFork(null);
  }, [pendingFork, activeRequest, activeProposal, isPending]);

  const lastBeat = beats.length > 0 ? beats[beats.length - 1] : null;
  const lastNarration = lastBeat?.proposal.narration;
  const hasNextBeat = runIndex < sequence.length;
  const isForking = forkContext !== null || pendingFork !== null;

  const startFork = useCallback(() => {
    setForks([]);
    setForkContext({ action: actionText, prior: lastNarration });
    void fireFork(actionText, lastNarration);
  }, [actionText, lastNarration, fireFork]);

  const anotherFork = useCallback(() => {
    if (!forkContext) {
      return;
    }
    void fireFork(forkContext.action, forkContext.prior);
  }, [forkContext, fireFork]);

  const pickFork = useCallback(
    (proposal: DmTurnProposal) => {
      const action = forkContext?.action.trim() || "Продолжай сцену.";
      setBeats((current) => [
        ...current,
        { directive: "debate_options", action, proposal },
      ]);
      setForks([]);
      setForkContext(null);
      setPendingFork(null);
    },
    [forkContext],
  );

  const cancelFork = useCallback(() => {
    setForks([]);
    setForkContext(null);
    setPendingFork(null);
  }, []);

  const runSequence = useCallback(() => {
    if (sequence.length === 0) {
      return;
    }
    setBeats([]);
    setRunIndex(1);
    void fireBeat(sequence[0], actionText, undefined);
  }, [sequence, actionText, fireBeat]);

  const runNextBeat = useCallback(() => {
    if (runIndex >= sequence.length) {
      return;
    }
    const directive = sequence[runIndex];
    setRunIndex(runIndex + 1);
    void fireBeat(directive, actionText, lastNarration);
  }, [runIndex, sequence, actionText, lastNarration, fireBeat]);

  const handleAskDm = useCallback(() => {
    setSequence([]);
    setRunIndex(0);
    setBeats([]);
    void fireBeat("debate_options", actionText, undefined);
  }, [actionText, fireBeat]);

  const handleChooseOption = useCallback(
    (option: DmTurnOption, priorNarration: string) => {
      setActionText(option.label);
      void fireBeat("debate_options", option.label, priorNarration);
    },
    [fireBeat],
  );

  const addDirective = useCallback(
    (directive: BeatDirectiveKind) =>
      setSequence((current) => [...current, directive]),
    [],
  );

  const clearTape = useCallback(() => {
    setBeats([]);
    setPendingBeat(null);
    setRunIndex(0);
    setRolls({});
  }, []);

  const undoLastBeat = useCallback(() => {
    setBeats((current) => current.slice(0, -1));
    setEditingBeat(null);
    setRegenOpen(false);
  }, []);

  const editBeatNarration = useCallback((index: number, text: string) => {
    setBeats((current) =>
      current.map((beat, i) =>
        i === index
          ? { ...beat, proposal: { ...beat.proposal, narration: text } }
          : beat,
      ),
    );
  }, []);

  const regenerateLastBeat = useCallback(() => {
    if (!lastBeat) {
      return;
    }
    const notes = regenNotes.trim();
    const priorForLast =
      beats.length >= 2
        ? beats[beats.length - 2].proposal.narration
        : undefined;
    const regenerationContext: RegenerationContext = {
      previousOutput: lastBeat.proposal.narration,
      authorFeedback:
        notes || "Устрани слабые места и усиль сцену, сохранив канон.",
    };
    setRegenOpen(false);
    setRegenNotes("");
    void fireBeat(
      lastBeat.directive,
      lastBeat.action,
      priorForLast,
      "replace",
      regenerationContext,
    );
  }, [beats, fireBeat, lastBeat, regenNotes]);

  const rollCheck = useCallback(
    (beatIndex: number, checkId: string, difficulty: number) => {
      const roll = rollD20();
      setRolls((current) => ({
        ...current,
        [`${beatIndex}:${checkId}`]: {
          roll,
          difficulty,
          passed: roll >= difficulty,
        },
      }));
    },
    [],
  );

  const continueFromRoll = useCallback(
    (beat: BeatEntry, label: string, result: RollResult) => {
      const action = `Результат проверки «${label}»: ${
        result.passed ? "успех" : "провал"
      } (бросок ${result.roll} против СЛ ${result.difficulty}).`;
      setActionText(action);
      void fireBeat("debate_options", action, beat.proposal.narration);
    },
    [fireBeat],
  );

  const handleAccept = useCallback(() => {
    if (!lastBeat) {
      return;
    }
    setLedger((current) => {
      const factsById = new Map(
        current.acceptedFacts.map((fact) => [fact.id, fact]),
      );
      for (const fact of lastBeat.proposal.sessionFacts) {
        factsById.set(fact.id, { ...fact, status: "accepted" });
      }
      const nextRemarks = [...current.acceptedRemarks];
      if (remarkText.trim().length > 0) {
        nextRemarks.push({ text: remarkText.trim(), visibility: "private_dm" });
      }
      return {
        acceptedFacts: [...factsById.values()],
        acceptedRemarks: nextRemarks,
      };
    });
  }, [lastBeat, remarkText]);

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
        Мастер
      </button>
    );
  }

  const renderBeat = (beat: BeatEntry, beatIndex: number) => {
    const proposal = beat.proposal;
    const isLast = beatIndex === beats.length - 1;
    return (
      <section
        key={beatIndex}
        className="vn-dm-panel__proposal"
        data-directive={beat.directive}
      >
        <div className="vn-dm-panel__beat-head">
          <h3>{DIRECTIVE_META[beat.directive].label}</h3>
          <div className="vn-dm-panel__beat-tools">
            <button
              type="button"
              title="Править текст"
              onClick={() =>
                setEditingBeat((current) =>
                  current === beatIndex ? null : beatIndex,
                )
              }
            >
              ✎
            </button>
            {isLast ? (
              <>
                <button
                  type="button"
                  title="Перегенерировать"
                  disabled={isPending}
                  onClick={() => setRegenOpen((open) => !open)}
                >
                  ↻
                </button>
                <button
                  type="button"
                  title="Отменить бит"
                  onClick={undoLastBeat}
                >
                  ↶
                </button>
              </>
            ) : null}
          </div>
        </div>

        {editingBeat === beatIndex ? (
          <textarea
            className="vn-dm-panel__beat-edit"
            value={proposal.narration}
            onChange={(event) =>
              editBeatNarration(beatIndex, event.target.value)
            }
          />
        ) : (
          <p>{proposal.narration}</p>
        )}

        {isLast && regenOpen ? (
          <div className="vn-dm-panel__regen" data-testid="vn-dm-regen">
            <textarea
              placeholder="Что улучшить / слабые места…"
              value={regenNotes}
              onChange={(event) => setRegenNotes(event.target.value)}
            />
            <button
              type="button"
              disabled={isPending}
              onClick={regenerateLastBeat}
            >
              ↻ Перегенерировать
            </button>
          </div>
        ) : null}

        {proposal.innerVoiceDialogue &&
        proposal.innerVoiceDialogue.length > 0 ? (
          <div className="vn-dm-panel__voices" data-testid="vn-dm-voices">
            {proposal.innerVoiceDialogue.map((entry, index) => {
              const presentation = getVoicePresentation(
                entry.voiceId,
                parliamentPresetId,
              );
              return (
                <p
                  key={`${entry.voiceId}-${index}`}
                  className="vn-dm-panel__voice-line"
                  data-stance={entry.stance}
                  style={{ borderColor: presentation.palette.accent }}
                >
                  <span
                    className="vn-dm-panel__voice-name"
                    style={{ color: presentation.palette.accent }}
                  >
                    {presentation.label}
                    {entry.stance === "opposes" ? " ✕" : ""}
                  </span>
                  {entry.line}
                </p>
              );
            })}
          </div>
        ) : null}

        {proposal.checks.length > 0 ? (
          <div className="vn-dm-panel__checks" data-testid="vn-dm-checks">
            {proposal.checks.map((check) => {
              const result = rolls[`${beatIndex}:${check.id}`];
              return (
                <div key={check.id} className="vn-dm-panel__check">
                  <span className="vn-dm-panel__check-label">
                    {check.label} · СЛ {check.difficulty}
                  </span>
                  {result ? (
                    <span
                      className="vn-dm-panel__check-result"
                      data-passed={result.passed}
                    >
                      🎲 {result.roll} — {result.passed ? "успех" : "провал"}
                      {isLast ? (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() =>
                            continueFromRoll(beat, check.label, result)
                          }
                        >
                          продолжить
                        </button>
                      ) : null}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        rollCheck(beatIndex, check.id, check.difficulty)
                      }
                    >
                      🎲 Бросок
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : null}

        {isLast && proposal.options && proposal.options.length > 0 ? (
          <div className="vn-dm-panel__options" data-testid="vn-dm-options">
            {proposal.options.map((option) => (
              <button
                key={option.id}
                type="button"
                className="vn-dm-panel__option"
                disabled={isPending}
                onClick={() => handleChooseOption(option, proposal.narration)}
              >
                <span className="vn-dm-panel__option-label">
                  {option.label}
                </span>
                {option.detail ? (
                  <span className="vn-dm-panel__option-detail">
                    {option.detail}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        ) : null}

        {proposal.sessionFacts.length > 0 ? (
          <ul>
            {proposal.sessionFacts.map((fact) => (
              <li key={fact.id}>{fact.text}</li>
            ))}
          </ul>
        ) : null}
        {proposal.risks.length > 0 ? (
          <p className="vn-dm-panel__risks">{proposal.risks.join(" ")}</p>
        ) : null}
      </section>
    );
  };

  return (
    <aside
      className="vn-dm-panel"
      data-mode={viewMode}
      data-testid="vn-dm-panel"
    >
      <header className="vn-dm-panel__header">
        <div>
          <p className="vn-dm-panel__eyebrow">Настольный Мастер</p>
          <h2>Канон сессии</h2>
        </div>
        <div className="vn-dm-panel__header-actions">
          <button
            type="button"
            data-testid="vn-dm-view-toggle"
            title={viewMode === "simple" ? "Расширить" : "Сузить"}
            onClick={() =>
              setViewMode((mode) => (mode === "simple" ? "expanded" : "simple"))
            }
          >
            {viewMode === "simple" ? "⤢ Шире" : "⤡ Уже"}
          </button>
          <button
            type="button"
            data-testid="vn-dm-hide"
            onClick={() => setCollapsed(true)}
          >
            Свернуть
          </button>
        </div>
      </header>

      <dl className="vn-dm-panel__stats">
        <div>
          <dt>Рок</dt>
          <dd>{narrativeResources.fate}</dd>
        </div>
        <div>
          <dt>Фортуна</dt>
          <dd>
            {narrativeResources.fortune} / {narrativeResources.fortuneMod}
          </dd>
        </div>
        <div>
          <dt>Карма</dt>
          <dd>{narrativeResources.karma}</dd>
        </div>
        <div>
          <dt>Кровь</dt>
          <dd>
            T{bloodCurse.tier} {bloodCurse.pressure}
          </dd>
        </div>
      </dl>

      <nav className="vn-dm-panel__tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            data-active={tab.id === activeTab}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.id === "canon" &&
            ledger.acceptedFacts.length + ledger.acceptedRemarks.length > 0
              ? ` (${ledger.acceptedFacts.length + ledger.acceptedRemarks.length})`
              : ""}
          </button>
        ))}
      </nav>

      {activeTab === "play" ? (
        <>
          {beats.length > 0 ? (
            <div className="vn-dm-panel__tape" data-testid="vn-dm-tape">
              {beats.map(renderBeat)}
            </div>
          ) : (
            <p className="vn-dm-panel__hint">
              Опишите действие и спросите Мастера, либо соберите цепочку во
              вкладке «Режиссёр».
            </p>
          )}

          {isPending ? (
            <p className="vn-dm-panel__status">Мастер думает…</p>
          ) : null}

          {hasNextBeat && !isPending && beats.length > 0 ? (
            <button
              type="button"
              className="vn-dm-panel__next-beat"
              data-testid="vn-dm-next-beat"
              onClick={runNextBeat}
            >
              ▸ Следующий бит: {DIRECTIVE_META[sequence[runIndex]].label}
            </button>
          ) : null}

          {isForking ? (
            <div className="vn-dm-panel__forks" data-testid="vn-dm-forks">
              <div className="vn-dm-panel__forks-head">
                <span>Развилка — выберите продолжение</span>
                <div>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={anotherFork}
                  >
                    + ещё
                  </button>
                  <button type="button" onClick={cancelFork}>
                    отмена
                  </button>
                </div>
              </div>
              {forks.map((proposal, index) => (
                <div key={index} className="vn-dm-panel__fork">
                  <p>{proposal.narration}</p>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => pickFork(proposal)}
                  >
                    Выбрать вариант {index + 1}
                  </button>
                </div>
              ))}
              {pendingFork ? (
                <p className="vn-dm-panel__status">Генерация варианта…</p>
              ) : null}
            </div>
          ) : null}

          <div className="vn-dm-panel__intents" data-testid="vn-dm-intents">
            {INTENT_VERBS.map((verb) => (
              <button
                key={verb.id}
                type="button"
                className="vn-dm-panel__intent"
                onClick={() =>
                  setActionText((current) => appendIntent(current, verb.phrase))
                }
              >
                {verb.label}
              </button>
            ))}
          </div>
          <div className="vn-dm-panel__intents">
            {PERIOD_EXPRESSIONS.map((expr) => (
              <button
                key={expr.id}
                type="button"
                className="vn-dm-panel__intent vn-dm-panel__expr"
                title="Выражение эпохи"
                onClick={() =>
                  setActionText((current) => appendIntent(current, expr.text))
                }
              >
                «{expr.text}»
              </button>
            ))}
          </div>
          <label className="vn-dm-panel__field">
            Действие
            <textarea
              data-testid="vn-dm-action"
              value={actionText}
              onChange={(event) => setActionText(event.target.value)}
            />
          </label>
          <label className="vn-dm-panel__field">
            Заметка (приватно Мастеру)
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
                data-testid="vn-dm-spend-fate"
                type="checkbox"
                onChange={(event) => setSpendFateToken(event.target.checked)}
              />
              Потратить Рок
            </label>
            <label>
              Фортуна
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
              data-testid="vn-dm-ask"
              disabled={!nodeId || isPending}
              onClick={() => void handleAskDm()}
            >
              Спросить Мастера
            </button>
            <button
              type="button"
              data-testid="vn-dm-fork"
              disabled={!nodeId || isPending || isForking}
              onClick={startFork}
            >
              Развилка
            </button>
            <button
              type="button"
              data-testid="vn-dm-accept"
              disabled={!lastBeat}
              onClick={handleAccept}
            >
              Принять
            </button>
            <button
              type="button"
              data-testid="vn-dm-reject"
              disabled={beats.length === 0}
              onClick={clearTape}
            >
              Сбросить
            </button>
          </div>
        </>
      ) : null}

      {activeTab === "director" ? (
        <section className="vn-dm-panel__director" data-testid="vn-dm-director">
          <h3>Цепочка битов</h3>
          <div className="vn-dm-panel__chips">
            {DIRECTIVE_ORDER.map((directive) => (
              <button
                key={directive}
                type="button"
                className="vn-dm-panel__chip"
                title={DIRECTIVE_META[directive].hint}
                onClick={() => addDirective(directive)}
              >
                + {DIRECTIVE_META[directive].label}
              </button>
            ))}
          </div>
          {sequence.length > 0 ? (
            <ol className="vn-dm-panel__sequence" data-testid="vn-dm-sequence">
              {sequence.map((directive, index) => (
                <li key={`${directive}-${index}`} data-done={index < runIndex}>
                  {DIRECTIVE_META[directive].label}
                </li>
              ))}
            </ol>
          ) : (
            <p className="vn-dm-panel__hint">
              Соберите порядок битов, затем запустите цепочку.
            </p>
          )}
          <div className="vn-dm-panel__director-actions">
            <button
              type="button"
              disabled={sequence.length === 0 || isPending || !nodeId}
              onClick={runSequence}
            >
              ▶ Запустить
            </button>
            <button
              type="button"
              disabled={sequence.length === 0}
              onClick={() => setSequence([])}
            >
              Очистить
            </button>
          </div>
        </section>
      ) : null}

      {activeTab === "canon" ? (
        <section className="vn-dm-panel__ledger">
          <h3>Факты</h3>
          {ledger.acceptedFacts.length > 0 ? (
            <ul>
              {ledger.acceptedFacts.map((fact) => (
                <li key={fact.id}>{fact.text}</li>
              ))}
            </ul>
          ) : (
            <p>Принятых фактов сессии нет.</p>
          )}
          <h3>Заметки</h3>
          {ledger.acceptedRemarks.length > 0 ? (
            <ul>
              {ledger.acceptedRemarks.map((remark, index) => (
                <li key={`${remark.text}-${index}`}>{remark.text}</li>
              ))}
            </ul>
          ) : (
            <p>Сохранённых заметок нет.</p>
          )}
          <button
            type="button"
            className="vn-dm-panel__save-note"
            disabled={remarkText.trim().length === 0}
            onClick={handleSaveNote}
          >
            Сохранить заметку из поля «Заметка»
          </button>
        </section>
      ) : null}
    </aside>
  );
};
