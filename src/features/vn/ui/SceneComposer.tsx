import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AI_CHARACTER_REACTION_SOURCE_VN_SCENE,
  AI_GENERATE_CHARACTER_REACTION_KIND,
  parseCharacterReactionProposal,
  trustToDisposition,
  type CharacterReactionProposal,
  type GenerateCharacterReactionPayload,
} from "../../ai/contracts";
import type { AiRequest } from "../../../shared/spacetime/bindings";
import { getCharacterPortrait } from "../characterAssets";
import { createRequestId } from "../vnScreenUtils";
import { INTENT_VERBS, appendIntent } from "./intentVerbs";
import {
  PERIOD_EXPRESSIONS,
  PERIOD_PAINTINGS,
  getPaintingById,
  paintingStyleNote,
} from "./periodReferences";
import {
  BACKGROUND_CATALOG,
  NPC_ROSTER,
  getBackgroundById,
  getNpcName,
} from "./sceneComposerCatalog";
import "./SceneComposer.css";

interface CastMember {
  npcId: string;
  topics: string[];
  memory: string[];
  trust: number;
}

interface SceneDraft {
  title: string;
  backgroundId: string | null;
  paintingRef: string | null;
  cast: CastMember[];
}

interface SceneComposerProps {
  scenarioId: string;
  enqueueAiRequest: (input: {
    requestId: string;
    kind: string;
    payloadJson: string;
  }) => Promise<unknown>;
  reactionRequests: readonly AiRequest[];
  onError?: (message: string) => void;
}

const emptyDraft = (): SceneDraft => ({
  title: "",
  backgroundId: null,
  paintingRef: null,
  cast: [],
});

const storageKeyFor = (scenarioId: string): string =>
  `grenzwanderer_scene_draft_${scenarioId}`;

const coerceMember = (value: unknown): CastMember | null => {
  if (typeof value === "string") {
    return { npcId: value, topics: [], memory: [], trust: 0 };
  }
  if (value && typeof value === "object") {
    const entry = value as Record<string, unknown>;
    if (typeof entry.npcId !== "string") {
      return null;
    }
    return {
      npcId: entry.npcId,
      topics: Array.isArray(entry.topics)
        ? entry.topics.filter((t): t is string => typeof t === "string")
        : [],
      memory: Array.isArray(entry.memory)
        ? entry.memory.filter((m): m is string => typeof m === "string")
        : [],
      trust: typeof entry.trust === "number" ? entry.trust : 0,
    };
  }
  return null;
};

const readDraft = (key: string): SceneDraft => {
  if (typeof window === "undefined") {
    return emptyDraft();
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return emptyDraft();
    }
    const parsed = JSON.parse(raw) as Partial<SceneDraft>;
    const cast = Array.isArray(parsed.cast)
      ? parsed.cast.map(coerceMember).filter((m): m is CastMember => m !== null)
      : [];
    return {
      title: typeof parsed.title === "string" ? parsed.title : "",
      backgroundId:
        typeof parsed.backgroundId === "string" ? parsed.backgroundId : null,
      paintingRef:
        typeof parsed.paintingRef === "string" ? parsed.paintingRef : null,
      cast,
    };
  } catch {
    return emptyDraft();
  }
};

export const SceneComposer = ({
  scenarioId,
  enqueueAiRequest,
  reactionRequests,
  onError,
}: SceneComposerProps) => {
  const [open, setOpen] = useState(false);
  const storageKey = storageKeyFor(scenarioId);
  const [draft, setDraft] = useState<SceneDraft>(() => readDraft(storageKey));
  const [selectedNpcId, setSelectedNpcId] = useState<string | null>(null);
  const [topicDraft, setTopicDraft] = useState("");
  const [memoryDraft, setMemoryDraft] = useState("");
  const [eventText, setEventText] = useState("");
  const [pendingReaction, setPendingReaction] = useState<{
    requestId: string;
    npcId: string;
    event: string;
  } | null>(null);
  const [reaction, setReaction] = useState<{
    npcId: string;
    event: string;
    proposal: CharacterReactionProposal;
  } | null>(null);
  const [roundEventText, setRoundEventText] = useState("");
  const [round, setRound] = useState<
    { npcId: string; proposal: CharacterReactionProposal }[]
  >([]);
  const [roundQueue, setRoundQueue] = useState<string[]>([]);
  const [roundPending, setRoundPending] = useState<{
    requestId: string;
    npcId: string;
  } | null>(null);

  useEffect(() => {
    setDraft(readDraft(storageKey));
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(storageKey, JSON.stringify(draft));
  }, [draft, storageKey]);

  // Capture the reaction once its request completes.
  useEffect(() => {
    if (!pendingReaction) {
      return;
    }
    const match = reactionRequests.find(
      (entry) => entry.requestId === pendingReaction.requestId,
    );
    if (!match || match.status !== "completed") {
      return;
    }
    const proposal = parseCharacterReactionProposal(match.responseJson);
    if (proposal) {
      setReaction({
        npcId: pendingReaction.npcId,
        event: pendingReaction.event,
        proposal,
      });
    }
    setPendingReaction(null);
  }, [pendingReaction, reactionRequests]);

  const selectedBackground = useMemo(
    () => getBackgroundById(draft.backgroundId),
    [draft.backgroundId],
  );
  const selectedPainting = useMemo(
    () => getPaintingById(draft.paintingRef),
    [draft.paintingRef],
  );
  const availableRoster = useMemo(
    () => NPC_ROSTER.filter((e) => !draft.cast.some((m) => m.npcId === e.id)),
    [draft.cast],
  );
  const selectedMember = useMemo(
    () => draft.cast.find((m) => m.npcId === selectedNpcId) ?? null,
    [draft.cast, selectedNpcId],
  );

  const updateMember = useCallback(
    (npcId: string, patch: (member: CastMember) => CastMember) =>
      setDraft((current) => ({
        ...current,
        cast: current.cast.map((m) => (m.npcId === npcId ? patch(m) : m)),
      })),
    [],
  );

  const addNpc = useCallback((npcId: string) => {
    setDraft((current) =>
      current.cast.some((m) => m.npcId === npcId)
        ? current
        : {
            ...current,
            cast: [
              ...current.cast,
              { npcId, topics: [], memory: [], trust: 0 },
            ],
          },
    );
    setSelectedNpcId(npcId);
  }, []);

  const removeNpc = useCallback((npcId: string) => {
    setDraft((current) => ({
      ...current,
      cast: current.cast.filter((m) => m.npcId !== npcId),
    }));
    setSelectedNpcId((current) => (current === npcId ? null : current));
  }, []);

  const buildReactionPayload = useCallback(
    (
      member: CastMember,
      eventTextValue: string,
    ): GenerateCharacterReactionPayload => ({
      source: AI_CHARACTER_REACTION_SOURCE_VN_SCENE,
      characterId: member.npcId,
      scenarioId,
      eventText: selectedPainting
        ? `${paintingStyleNote(selectedPainting)} ${eventTextValue}`
        : eventTextValue,
      visibleFacts: selectedBackground
        ? [`Сцена: ${selectedBackground.label}`]
        : [],
      relationshipState: {
        trust: member.trust,
        disposition: trustToDisposition(member.trust),
      },
      topics: member.topics,
      npcMemory: member.memory,
    }),
    [scenarioId, selectedBackground, selectedPainting],
  );

  const askNpc = useCallback(async () => {
    if (!selectedMember || eventText.trim().length === 0) {
      return;
    }
    const requestId = createRequestId();
    const payload = buildReactionPayload(selectedMember, eventText.trim());
    try {
      setReaction(null);
      await enqueueAiRequest({
        requestId,
        kind: AI_GENERATE_CHARACTER_REACTION_KIND,
        payloadJson: JSON.stringify(payload),
      });
      setPendingReaction({
        requestId,
        npcId: selectedMember.npcId,
        event: eventText.trim(),
      });
    } catch (caughtError) {
      onError?.(
        caughtError instanceof Error
          ? caughtError.message
          : "Не удалось спросить NPC.",
      );
    }
  }, [
    buildReactionPayload,
    enqueueAiRequest,
    eventText,
    onError,
    selectedMember,
  ]);

  const rememberReaction = useCallback(() => {
    if (!reaction) {
      return;
    }
    const entry = `Со мной говорили: «${reaction.event}» — я ответил (${reaction.proposal.reactionType}): «${reaction.proposal.text}».`;
    updateMember(reaction.npcId, (member) => ({
      ...member,
      memory: [...member.memory, entry],
    }));
  }, [reaction, updateMember]);

  const fireRoundReaction = useCallback(
    async (
      npcId: string,
      priorRound: { npcId: string; proposal: CharacterReactionProposal }[],
    ) => {
      const member = draft.cast.find((m) => m.npcId === npcId);
      if (!member) {
        return;
      }
      const requestId = createRequestId();
      // Set pending synchronously so the advance effect cannot double-fire.
      setRoundPending({ requestId, npcId });
      const priorSummary =
        priorRound.length > 0
          ? ` [Уже прозвучало в сцене: ${priorRound
              .map((r) => `${getNpcName(r.npcId)}: «${r.proposal.text}»`)
              .join("; ")}]`
          : "";
      const payload = buildReactionPayload(
        member,
        `${roundEventText.trim()}${priorSummary}`,
      );
      try {
        await enqueueAiRequest({
          requestId,
          kind: AI_GENERATE_CHARACTER_REACTION_KIND,
          payloadJson: JSON.stringify(payload),
        });
      } catch (caughtError) {
        onError?.(
          caughtError instanceof Error
            ? caughtError.message
            : "Сцена прервалась.",
        );
        setRoundPending(null);
        setRoundQueue([]);
      }
    },
    [
      buildReactionPayload,
      draft.cast,
      enqueueAiRequest,
      onError,
      roundEventText,
    ],
  );

  const playScene = useCallback(() => {
    if (draft.cast.length === 0 || roundEventText.trim().length === 0) {
      return;
    }
    setRound([]);
    setRoundPending(null);
    setRoundQueue(draft.cast.map((member) => member.npcId));
  }, [draft.cast, roundEventText]);

  // Round capture: record the current speaker's reaction when it completes.
  useEffect(() => {
    if (!roundPending) {
      return;
    }
    const match = reactionRequests.find(
      (entry) => entry.requestId === roundPending.requestId,
    );
    if (!match || match.status !== "completed") {
      return;
    }
    const proposal = parseCharacterReactionProposal(match.responseJson);
    const npcId = roundPending.npcId;
    setRoundPending(null);
    if (proposal) {
      setRound((current) => [...current, { npcId, proposal }]);
    }
  }, [roundPending, reactionRequests]);

  // Round advance: when idle and speakers remain, fire the next in order.
  useEffect(() => {
    if (roundPending || roundQueue.length === 0) {
      return;
    }
    const [head, ...rest] = roundQueue;
    setRoundQueue(rest);
    void fireRoundReaction(head, round);
  }, [roundPending, roundQueue, round, fireRoundReaction]);

  const isPlayingScene = roundPending !== null || roundQueue.length > 0;

  const isAsking =
    pendingReaction !== null &&
    !reactionRequests.some(
      (entry) =>
        entry.requestId === pendingReaction.requestId &&
        entry.status === "completed",
    );

  if (!open) {
    return (
      <button
        type="button"
        className="scene-composer__launch"
        data-testid="scene-composer-launch"
        onClick={() => setOpen(true)}
      >
        🎬 Сцена
      </button>
    );
  }

  return (
    <div className="scene-composer" data-testid="scene-composer">
      <div className="scene-composer__sheet">
        <header className="scene-composer__header">
          <div>
            <p className="scene-composer__eyebrow">Композитор сцены</p>
            <input
              className="scene-composer__title"
              placeholder="Название сцены…"
              value={draft.title}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
            />
          </div>
          <button type="button" onClick={() => setOpen(false)}>
            Закрыть
          </button>
        </header>

        <div className="scene-composer__preview" data-testid="scene-preview">
          {selectedBackground ? (
            <img
              className="scene-composer__preview-bg"
              src={selectedBackground.url}
              alt={selectedBackground.label}
            />
          ) : (
            <div className="scene-composer__preview-empty">
              Выберите фон ниже
            </div>
          )}
          <div className="scene-composer__preview-cast">
            {draft.cast.map((member) => {
              const portrait = getCharacterPortrait(member.npcId);
              return (
                <figure
                  key={member.npcId}
                  className="scene-composer__preview-npc"
                >
                  {portrait ? (
                    <img src={portrait} alt={getNpcName(member.npcId)} />
                  ) : (
                    <span className="scene-composer__preview-npc-fallback">
                      {getNpcName(member.npcId).charAt(0)}
                    </span>
                  )}
                  <figcaption>{getNpcName(member.npcId)}</figcaption>
                </figure>
              );
            })}
          </div>
        </div>

        <section className="scene-composer__section">
          <h3>Фон</h3>
          <div className="scene-composer__bg-grid">
            {BACKGROUND_CATALOG.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className="scene-composer__bg-tile"
                data-selected={entry.id === draft.backgroundId}
                title={entry.label}
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    backgroundId: entry.id,
                  }))
                }
              >
                <img src={entry.url} alt={entry.label} loading="lazy" />
                <span>{entry.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="scene-composer__section">
          <h3>Стиль эпохи</h3>
          <select
            className="scene-composer__painting"
            value={draft.paintingRef ?? ""}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                paintingRef: event.target.value || null,
              }))
            }
          >
            <option value="">— без референса —</option>
            {PERIOD_PAINTINGS.map((painting) => (
              <option key={painting.id} value={painting.id}>
                {painting.title} — {painting.artist}, {painting.year}
              </option>
            ))}
          </select>
          {selectedPainting ? (
            <p className="scene-composer__painting-hint">
              {selectedPainting.hint}
            </p>
          ) : (
            <p className="scene-composer__hint">
              Картина-референс задаёт тон и образность для генерации реакций.
            </p>
          )}
        </section>

        <section className="scene-composer__section">
          <h3>Состав ({draft.cast.length})</h3>
          {draft.cast.length > 0 ? (
            <div className="scene-composer__cast">
              {draft.cast.map((member) => {
                const portrait = getCharacterPortrait(member.npcId);
                return (
                  <button
                    key={member.npcId}
                    type="button"
                    className="scene-composer__cast-card"
                    data-selected={member.npcId === selectedNpcId}
                    onClick={() => setSelectedNpcId(member.npcId)}
                  >
                    {portrait ? (
                      <img src={portrait} alt={getNpcName(member.npcId)} />
                    ) : (
                      <span className="scene-composer__cast-fallback">
                        {getNpcName(member.npcId).charAt(0)}
                      </span>
                    )}
                    <span className="scene-composer__cast-name">
                      {getNpcName(member.npcId)}
                    </span>
                    <span className="scene-composer__cast-meta">
                      {member.topics.length}т · {member.memory.length}п
                    </span>
                    <span
                      className="scene-composer__cast-remove"
                      role="button"
                      tabIndex={0}
                      aria-label={`Убрать ${getNpcName(member.npcId)}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        removeNpc(member.npcId);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.stopPropagation();
                          removeNpc(member.npcId);
                        }
                      }}
                    >
                      ×
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="scene-composer__hint">
              Добавьте персонажей в сцену из ростера ниже.
            </p>
          )}

          <div className="scene-composer__roster">
            {availableRoster.map((entry) => {
              const portrait = getCharacterPortrait(entry.id);
              return (
                <button
                  key={entry.id}
                  type="button"
                  className="scene-composer__roster-chip"
                  onClick={() => addNpc(entry.id)}
                >
                  {portrait ? (
                    <img src={portrait} alt={entry.name} loading="lazy" />
                  ) : null}
                  + {entry.name}
                </button>
              );
            })}
          </div>
        </section>

        {draft.cast.length > 0 ? (
          <section className="scene-composer__section">
            <h3>Круглый стол</h3>
            <textarea
              className="scene-composer__round-event"
              placeholder="Событие сцены — на него по очереди отреагирует весь состав…"
              value={roundEventText}
              onChange={(event) => setRoundEventText(event.target.value)}
            />
            <button
              type="button"
              className="scene-composer__play"
              disabled={roundEventText.trim().length === 0 || isPlayingScene}
              onClick={playScene}
            >
              ▶ Сыграть сцену
            </button>
            {round.length > 0 || roundPending ? (
              <div className="scene-composer__round" data-testid="scene-round">
                {round.map((entry, index) => (
                  <div key={index} className="scene-composer__round-line">
                    <span className="scene-composer__round-name">
                      {getNpcName(entry.npcId)}
                    </span>
                    <span className="scene-composer__round-type">
                      {entry.proposal.reactionType}
                    </span>
                    <p>{entry.proposal.text}</p>
                  </div>
                ))}
                {roundPending ? (
                  <p className="scene-composer__hint">
                    {getNpcName(roundPending.npcId)} отвечает…
                  </p>
                ) : null}
              </div>
            ) : null}
          </section>
        ) : null}

        {selectedMember ? (
          <section
            className="scene-composer__editor"
            data-testid="scene-npc-editor"
          >
            <h3>{getNpcName(selectedMember.npcId)} — темы и память</h3>

            <label className="scene-composer__trust">
              Доверие: {selectedMember.trust} (
              {trustToDisposition(selectedMember.trust)})
              <input
                type="range"
                min={-50}
                max={50}
                value={selectedMember.trust}
                onChange={(event) =>
                  updateMember(selectedMember.npcId, (m) => ({
                    ...m,
                    trust: Number(event.target.value),
                  }))
                }
              />
            </label>

            <div className="scene-composer__lists">
              <div className="scene-composer__list">
                <h4>Темы интереса</h4>
                <ul>
                  {selectedMember.topics.map((topic, index) => (
                    <li key={`${topic}-${index}`}>
                      {topic}
                      <button
                        type="button"
                        aria-label="Удалить тему"
                        onClick={() =>
                          updateMember(selectedMember.npcId, (m) => ({
                            ...m,
                            topics: m.topics.filter((_, i) => i !== index),
                          }))
                        }
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="scene-composer__add">
                  <input
                    placeholder="Новая тема…"
                    value={topicDraft}
                    onChange={(event) => setTopicDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && topicDraft.trim()) {
                        updateMember(selectedMember.npcId, (m) => ({
                          ...m,
                          topics: [...m.topics, topicDraft.trim()],
                        }));
                        setTopicDraft("");
                      }
                    }}
                  />
                  <button
                    type="button"
                    disabled={topicDraft.trim().length === 0}
                    onClick={() => {
                      updateMember(selectedMember.npcId, (m) => ({
                        ...m,
                        topics: [...m.topics, topicDraft.trim()],
                      }));
                      setTopicDraft("");
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="scene-composer__list">
                <h4>Память (что знает он)</h4>
                <ul>
                  {selectedMember.memory.map((entry, index) => (
                    <li key={`${entry}-${index}`}>
                      {entry}
                      <button
                        type="button"
                        aria-label="Удалить запись памяти"
                        onClick={() =>
                          updateMember(selectedMember.npcId, (m) => ({
                            ...m,
                            memory: m.memory.filter((_, i) => i !== index),
                          }))
                        }
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="scene-composer__add">
                  <input
                    placeholder="Что помнит NPC…"
                    value={memoryDraft}
                    onChange={(event) => setMemoryDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && memoryDraft.trim()) {
                        updateMember(selectedMember.npcId, (m) => ({
                          ...m,
                          memory: [...m.memory, memoryDraft.trim()],
                        }));
                        setMemoryDraft("");
                      }
                    }}
                  />
                  <button
                    type="button"
                    disabled={memoryDraft.trim().length === 0}
                    onClick={() => {
                      updateMember(selectedMember.npcId, (m) => ({
                        ...m,
                        memory: [...m.memory, memoryDraft.trim()],
                      }));
                      setMemoryDraft("");
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="scene-composer__ask">
              <h4>Спросить {getNpcName(selectedMember.npcId)}</h4>
              <div className="scene-composer__intents">
                {INTENT_VERBS.map((verb) => (
                  <button
                    key={verb.id}
                    type="button"
                    className="scene-composer__intent"
                    onClick={() =>
                      setEventText((current) =>
                        appendIntent(current, verb.phrase),
                      )
                    }
                  >
                    {verb.label}
                  </button>
                ))}
              </div>
              <div className="scene-composer__intents">
                {PERIOD_EXPRESSIONS.map((expr) => (
                  <button
                    key={expr.id}
                    type="button"
                    className="scene-composer__intent scene-composer__expr"
                    title="Выражение эпохи"
                    onClick={() =>
                      setEventText((current) =>
                        appendIntent(current, expr.text),
                      )
                    }
                  >
                    «{expr.text}»
                  </button>
                ))}
              </div>
              <textarea
                placeholder="Что происходит / что вы говорите NPC…"
                value={eventText}
                onChange={(event) => setEventText(event.target.value)}
              />
              <button
                type="button"
                disabled={eventText.trim().length === 0 || isAsking}
                onClick={() => void askNpc()}
              >
                {isAsking ? "NPC думает…" : "Спросить NPC"}
              </button>
              {reaction && reaction.npcId === selectedMember.npcId ? (
                <div
                  className="scene-composer__reaction"
                  data-testid="scene-reaction"
                >
                  <span className="scene-composer__reaction-type">
                    {reaction.proposal.reactionType}
                  </span>
                  <p>{reaction.proposal.text}</p>
                  <button
                    type="button"
                    className="scene-composer__remember"
                    onClick={rememberReaction}
                  >
                    + В память {getNpcName(selectedMember.npcId)}
                  </button>
                </div>
              ) : null}
            </div>
          </section>
        ) : (
          <p className="scene-composer__hint">
            Выберите персонажа в составе, чтобы задать его темы, память и
            спросить его.
          </p>
        )}

        <footer className="scene-composer__footer">
          Сцена и память сохраняются локально. Реакция NPC заземлена на его
          память и темы.
        </footer>
      </div>
    </div>
  );
};
