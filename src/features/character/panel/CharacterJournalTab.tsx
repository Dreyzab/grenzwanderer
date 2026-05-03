import { motion } from "framer-motion";
import type { getCharacterStrings } from "../../i18n/uiStrings";
import { C, TAB_TRANSITION } from "./characterPanel.theme";
import type {
  CharacterObservationEntry,
  CharacterQuestJournalEntry,
} from "./characterPanel.types";
import { getStatusTone } from "./characterPanel.utils";
import { SectionCard } from "./characterPanelPrimitives";

export const CharacterJournalTab = ({
  entityKnowledge,
  getObjectivePointLabel,
  observationEntries,
  questJournalEntries,
  t,
}: {
  entityKnowledge: Array<{
    id: string;
    label: string;
    veilLevel: number;
    observationCount: number;
    signatureIds: string[];
  }>;
  getObjectivePointLabel: (pointId: string) => string;
  observationEntries: CharacterObservationEntry[];
  questJournalEntries: CharacterQuestJournalEntry[];
  t: ReturnType<typeof getCharacterStrings>;
}) => (
  <motion.div
    animate={{ opacity: 1, y: 0 }}
    className="space-y-4"
    exit={{ opacity: 0, y: -10 }}
    initial={{ opacity: 0, y: 10 }}
    key="journal"
    transition={TAB_TRANSITION}
  >
    <div className="grid gap-4 xl:grid-cols-2">
      <SectionCard
        accent={C.brass}
        eyebrow="Quest Journal"
        title="Investigation Log"
      >
        {questJournalEntries.length === 0 ? (
          <p className="text-sm leading-relaxed text-stone-400">
            No quest catalog is available in active content.
          </p>
        ) : (
          <div className="space-y-3">
            {questJournalEntries.map((entry) => {
              const statusTone = getStatusTone(entry.status);

              return (
                <article
                  key={entry.id}
                  className="rounded-[1rem] border border-white/8 bg-black/20 px-4 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <strong className="text-stone-100">{entry.title}</strong>
                    <span
                      className="rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.3em]"
                      style={{
                        ...statusTone,
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {entry.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-stone-300">
                    Stage {entry.currentStage}
                    {entry.activeStage ? ` - ${entry.activeStage.title}` : ""}
                  </p>
                  {entry.activeStage ? (
                    <p className="mt-2 text-sm leading-relaxed text-stone-400">
                      {entry.activeStage.objectiveHint}
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </SectionCard>

      <SectionCard
        accent={C.crimson}
        eyebrow="Objective Points"
        title="Mapped Follow-Ups"
      >
        {questJournalEntries.length === 0 ? (
          <p className="text-sm leading-relaxed text-stone-400">
            Objectives become available after content publish.
          </p>
        ) : (
          <div className="space-y-3">
            {questJournalEntries.map((entry) => (
              <div
                key={`${entry.id}-points`}
                className="rounded-[1rem] border border-white/8 bg-black/20 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <strong className="text-stone-100">{entry.title}</strong>
                  <span
                    className="text-[10px] uppercase tracking-[0.3em]"
                    style={{ color: C.slate, fontFamily: "var(--font-mono)" }}
                  >
                    {entry.activeStage?.objectivePointIds?.length ?? 0} points
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-stone-400">
                  {entry.activeStage?.objectivePointIds
                    ?.map((pointId) => getObjectivePointLabel(pointId))
                    .join(", ") ?? "none"}
                </p>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>

    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_320px]">
      <SectionCard
        accent={C.amber}
        eyebrow={t.observationJournal}
        title="Anomalous Registry"
      >
        {observationEntries.length === 0 ? (
          <p className="text-sm leading-relaxed text-stone-400">
            No anomalous observations are archived yet. Rational casework
            remains your primary ledger until the veil leaves something you can
            actually file.
          </p>
        ) : (
          <div className="space-y-3">
            {observationEntries.map((entry) => (
              <article
                key={entry.id}
                className="rounded-[1rem] border border-white/8 bg-black/20 px-4 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <strong className="text-stone-100">{entry.title}</strong>
                  <span
                    className="rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.3em]"
                    style={{
                      borderColor: "rgba(212, 167, 79, 0.26)",
                      color: "#f4d18a",
                      backgroundColor: "rgba(181, 133, 43, 0.12)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {entry.kind}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-stone-300">
                  {entry.text}
                </p>
                {entry.rationalInterpretation ? (
                  <p className="mt-2 text-sm leading-relaxed text-stone-500">
                    Rational read: {entry.rationalInterpretation}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        accent={C.crimson}
        eyebrow="Entity Knowledge"
        title="Archetype Fragments"
      >
        {entityKnowledge.length === 0 ? (
          <p className="text-sm leading-relaxed text-stone-400">
            No archetype has enough corroborated traces to form a working file.
          </p>
        ) : (
          <div className="space-y-3">
            {entityKnowledge.map((entry) => (
              <div
                key={entry.id}
                className="rounded-[1rem] border border-white/8 bg-black/20 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <strong className="text-stone-100">{entry.label}</strong>
                  <span
                    className="text-[10px] uppercase tracking-[0.3em]"
                    style={{ color: C.amber, fontFamily: "var(--font-mono)" }}
                  >
                    Veil {entry.veilLevel}
                  </span>
                </div>
                <p className="mt-2 text-sm text-stone-300">
                  {entry.observationCount} observations
                </p>
                <p className="mt-2 text-sm leading-relaxed text-stone-500">
                  {entry.signatureIds.length > 0
                    ? `Signatures: ${entry.signatureIds.join(", ")}`
                    : "No stable signature tags yet."}
                </p>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  </motion.div>
);
