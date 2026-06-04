import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Compass,
  Database,
  Calendar,
  AlertTriangle,
  Clock,
  ChevronRight,
  FileText,
  Bookmark,
  Layers,
  Inbox,
  Lock,
  Users,
} from "lucide-react";
import type { NpcDossierEntry } from "../../../shared/game/socialPresentation";
import type { getCharacterStrings } from "../../i18n/uiStrings";
import { C, TAB_TRANSITION } from "./characterPanel.theme";
import type {
  CharacterObservationEntry,
  CharacterQuestJournalEntry,
} from "./characterPanel.types";
import { getStatusTone } from "./characterPanel.utils";
import { SectionCard } from "./characterPanelPrimitives";
import {
  isOpenVikingDevEnabled,
  fetchOpenVikingFlavor,
  getProceduralDossierFallbackReflection,
} from "../../../shared/services/openviking_rag";

export const CharacterJournalTab = ({
  dossierEntries,
  entityKnowledge,
  getObjectivePointLabel,
  observationEntries,
  questJournalEntries,
  t,
}: {
  dossierEntries: NpcDossierEntry[];
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
}) => {
  const [filter, setFilter] = useState<"all" | "canon" | "procedural">("all");
  const [sortBy, setSortBy] = useState<"active" | "recent">("active");
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);

  // Reflections state
  const [reflections, setReflections] = useState<string | null>(null);
  // Dev-only retrieval provenance: which viking:// resources fed the flavour.
  const [provenance, setProvenance] = useState<string | null>(null);
  const [isRagFetching, setIsRagFetching] = useState<boolean>(false);
  const [isRagOffline, setIsRagOffline] = useState<boolean>(false);
  const [showAllSteps, setShowAllSteps] = useState<boolean>(false);

  // Sync Reflections based on selected procedural quest
  useEffect(() => {
    if (!selectedQuestId) {
      setReflections(null);
      setProvenance(null);
      setIsRagOffline(false);
      return;
    }

    const quest = questJournalEntries.find((q) => q.id === selectedQuestId);
    if (!quest || quest.kind !== "procedural") {
      setReflections(null);
      setProvenance(null);
      setIsRagOffline(false);
      return;
    }

    let active = true;
    setIsRagFetching(true);
    setIsRagOffline(false);
    setShowAllSteps(false); // Reset step collapse when switching cases
    setProvenance(null);

    const activeStep = quest.steps.find((s) => s.status === "active");
    const locationId = activeStep?.nodeId;
    const archetypeId = quest.archetypeId;

    fetchOpenVikingFlavor(locationId, archetypeId)
      .then((data) => {
        if (!active) return;
        if (data && (data.insights || data.fieldNotes)) {
          setReflections(data.insights || data.fieldNotes || null);
          setProvenance(data.fieldNotes ?? null);
          setIsRagOffline(false);
        } else {
          // Timeout or server offline -> fallback closed to local memories
          const fallback = getProceduralDossierFallbackReflection(
            quest.eligibilitySnapshot?.eventName || "case.entered",
            quest.archetypeId,
            quest.stateNamespace,
            locationId,
          );
          setReflections(fallback);
          if (isOpenVikingDevEnabled()) {
            setIsRagOffline(true);
          }
        }
      })
      .catch(() => {
        if (!active) return;
        const fallback = getProceduralDossierFallbackReflection(
          quest.eligibilitySnapshot?.eventName || "case.entered",
          quest.archetypeId,
          quest.stateNamespace,
          locationId,
        );
        setReflections(fallback);
        if (isOpenVikingDevEnabled()) {
          setIsRagOffline(true);
        }
      })
      .finally(() => {
        if (active) {
          setIsRagFetching(false);
        }
      });

    return () => {
      active = false;
    };
  }, [selectedQuestId, questJournalEntries]);

  // Filtering list
  const filteredEntries = useMemo(() => {
    return questJournalEntries.filter((entry) => {
      if (filter === "canon") return entry.kind === "canon";
      if (filter === "procedural") return entry.kind === "procedural";
      return true;
    });
  }, [questJournalEntries, filter]);

  // Sorting list
  const sortedEntries = useMemo(() => {
    const list = [...filteredEntries];
    if (sortBy === "active") {
      const statusWeight = {
        "In progress": 1,
        "Not started": 2,
        Completed: 3,
      };
      list.sort((a, b) => {
        const wA = statusWeight[a.status] || 9;
        const wB = statusWeight[b.status] || 9;
        if (wA !== wB) return wA - wB;

        const tA = a.kind === "procedural" ? a.createdAt : 0;
        const tB = b.kind === "procedural" ? b.createdAt : 0;
        return tB - tA;
      });
    } else {
      list.sort((a, b) => {
        const tA = a.kind === "procedural" ? a.createdAt : 1;
        const tB = b.kind === "procedural" ? b.createdAt : 1;
        return tB - tA;
      });
    }
    return list;
  }, [filteredEntries, sortBy]);

  // Get active quest details
  const selectedQuest = useMemo(() => {
    if (!selectedQuestId) return null;
    return questJournalEntries.find((q) => q.id === selectedQuestId) || null;
  }, [selectedQuestId, questJournalEntries]);

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
      exit={{ opacity: 0, y: -10 }}
      initial={{ opacity: 0, y: 10 }}
      key="journal"
      transition={TAB_TRANSITION}
    >
      {/* Upper Section: Asymmetric split on desktop (Ledger List vs. Dossier Details) */}
      <div className="grid gap-4 xl:grid-cols-[1.3fr_1.7fr] items-start">
        {/* LEFT COLUMN: The Case Ledger */}
        <SectionCard
          accent={C.brass}
          eyebrow="Quest Journal"
          title="Investigation Ledger"
        >
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-white/5 pb-3">
            {/* Filter group */}
            <div className="flex bg-stone-950/80 p-0.5 border border-stone-800 rounded-[2px]">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1 text-xs font-semibold tracking-wider transition-colors rounded-[1px] ${
                  filter === "all"
                    ? "bg-amber-800/20 border border-amber-700/30 text-amber-400 font-bold"
                    : "text-stone-400 hover:text-stone-200 border border-transparent"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("canon")}
                className={`px-3 py-1 text-xs font-semibold tracking-wider transition-colors rounded-[1px] ${
                  filter === "canon"
                    ? "bg-amber-800/20 border border-amber-700/30 text-amber-400 font-bold"
                    : "text-stone-400 hover:text-stone-200 border border-transparent"
                }`}
              >
                Canon
              </button>
              <button
                onClick={() => setFilter("procedural")}
                className={`px-3 py-1 text-xs font-semibold tracking-wider transition-colors rounded-[1px] ${
                  filter === "procedural"
                    ? "bg-amber-800/20 border border-amber-700/30 text-amber-400 font-bold"
                    : "text-stone-400 hover:text-stone-200 border border-transparent"
                }`}
              >
                CAS
              </button>
            </div>

            {/* Sort group */}
            <div className="flex bg-stone-950/80 p-0.5 border border-stone-800 rounded-[2px]">
              <button
                onClick={() => setSortBy("active")}
                className={`px-2.5 py-1 text-[10px] uppercase tracking-wider transition-colors rounded-[1px] ${
                  sortBy === "active"
                    ? "bg-amber-850/20 border border-amber-700/30 text-amber-400"
                    : "text-stone-500 hover:text-stone-300 border border-transparent"
                }`}
              >
                Active First
              </button>
              <button
                onClick={() => setSortBy("recent")}
                className={`px-2.5 py-1 text-[10px] uppercase tracking-wider transition-colors rounded-[1px] ${
                  sortBy === "recent"
                    ? "bg-amber-850/20 border border-amber-700/30 text-amber-400"
                    : "text-stone-500 hover:text-stone-300 border border-transparent"
                }`}
              >
                Newest Logged
              </button>
            </div>
          </div>

          {/* List display */}
          {sortedEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 border border-dashed border-stone-800/60 rounded-[0.5rem] bg-stone-950/10">
              <Inbox className="text-stone-600 mb-2" size={24} />
              <p className="text-sm leading-relaxed text-stone-500">
                No active entries match selected filter filters.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {sortedEntries.map((entry) => {
                const statusTone = getStatusTone(entry.status);
                const isSelected = selectedQuestId === entry.id;

                return (
                  <article
                    key={entry.id}
                    onClick={() => setSelectedQuestId(entry.id)}
                    className={`group cursor-pointer rounded-[0.25rem] border px-4 py-3.5 transition-all text-left relative overflow-hidden ${
                      isSelected
                        ? "border-amber-700/60 bg-amber-800/10 shadow-[0_0_12px_rgba(181,133,43,0.1)]"
                        : "border-white/5 bg-black/15 hover:border-stone-700 hover:bg-stone-900/30"
                    }`}
                  >
                    {/* Visual left highlight */}
                    {isSelected && (
                      <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-amber-500" />
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
                      <div className="flex items-center gap-2">
                        {entry.kind === "procedural" ? (
                          <span title="Procedural State Overlay">
                            <Layers size={13} className="text-amber-500/80" />
                          </span>
                        ) : (
                          <span title="Canonical Storyline">
                            <Bookmark size={13} className="text-stone-400/80" />
                          </span>
                        )}
                        <strong
                          className={`font-sans text-sm tracking-wide ${isSelected ? "text-amber-400" : "text-stone-200 group-hover:text-stone-100"}`}
                        >
                          {entry.title}
                        </strong>
                      </div>

                      <span
                        className="rounded-[2px] border px-2 py-0.5 text-[9px] uppercase tracking-[0.2em]"
                        style={{
                          borderColor: statusTone.borderColor,
                          color: statusTone.color,
                          backgroundColor: statusTone.backgroundColor,
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {entry.status}
                      </span>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-xs text-stone-400">
                      <span>
                        Stage {entry.currentStage}
                        {entry.kind === "canon" && entry.activeStage
                          ? ` - ${entry.activeStage.title}`
                          : ""}
                      </span>

                      <ChevronRight
                        size={14}
                        className={`transition-transform duration-200 ${
                          isSelected
                            ? "translate-x-1 text-amber-500"
                            : "text-stone-600 group-hover:translate-x-0.5 group-hover:text-stone-400"
                        }`}
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </SectionCard>

        {/* RIGHT COLUMN: Interactive Dossier Detail Panel */}
        <div className="w-full">
          <AnimatePresence mode="wait">
            {selectedQuest ? (
              <motion.div
                key={selectedQuest.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
              >
                <SectionCard
                  accent={
                    selectedQuest.kind === "procedural" ? C.amber : C.crimson
                  }
                  eyebrow={
                    selectedQuest.kind === "procedural"
                      ? "Runtime Case Overlay"
                      : "Canon Case dossier"
                  }
                  title={selectedQuest.title}
                  className="relative overflow-hidden border-amber-900/25 bg-[rgba(16,14,12,0.85)]"
                >
                  {/* Metadata Row */}
                  <div className="flex flex-wrap items-center gap-3 border-b border-stone-800 pb-3 mb-5">
                    <span className="rounded-[2px] border border-amber-700/30 bg-amber-800/10 px-2.5 py-0.5 text-[10px] uppercase font-mono tracking-widest text-amber-400">
                      {selectedQuest.kind === "canon"
                        ? "Canon Source"
                        : "CAS Procedural"}
                    </span>

                    {selectedQuest.kind === "procedural" && (
                      <>
                        <span className="text-[10px] text-stone-500 font-mono flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500/60" />
                          source: "runtime_overlay"
                        </span>

                        <span className="text-[10px] text-stone-500 font-mono">
                          ns: "{selectedQuest.stateNamespace}"
                        </span>
                      </>
                    )}
                  </div>

                  {/* Vertical step timeline */}
                  <div className="space-y-4">
                    <h4 className="text-xs uppercase tracking-[0.2em] text-stone-400 font-bold font-sans">
                      Investigation Timeline
                    </h4>

                    {/* Procedural quest steps */}
                    {selectedQuest.kind === "procedural" &&
                      selectedQuest.steps && (
                        <div className="mt-3">
                          {/* Progressive Disclosure toggle */}
                          {(() => {
                            const steps = selectedQuest.steps || [];
                            const activeIndex = steps.findIndex(
                              (s) => s.status === "active",
                            );
                            const maxSteps = 8;
                            const needsTruncation =
                              steps.length > maxSteps && !showAllSteps;

                            let visibleSteps = steps;
                            let hiddenCount = 0;

                            if (needsTruncation) {
                              const pivot =
                                activeIndex >= 0 ? activeIndex : steps.length;
                              const cutoff = Math.max(0, pivot - 3);
                              if (cutoff > 0) {
                                hiddenCount = cutoff;
                                visibleSteps = steps.slice(cutoff);
                              }
                            }

                            return (
                              <>
                                {hiddenCount > 0 && (
                                  <button
                                    onClick={() => setShowAllSteps(true)}
                                    className="flex items-center gap-2 text-xs text-stone-500 hover:text-stone-300 py-1.5 px-3 border border-stone-800/60 bg-stone-900/20 rounded-[2px] transition-colors mb-4 w-full justify-center select-none"
                                  >
                                    <Clock
                                      size={12}
                                      className="text-amber-600/70 animate-pulse"
                                    />
                                    <span>
                                      Show {hiddenCount} earlier completed event
                                      notes...
                                    </span>
                                  </button>
                                )}

                                <div className="relative border-l-2 border-stone-850 ml-3 pl-6 space-y-5 py-1">
                                  {visibleSteps.map((step) => {
                                    const isCompleted =
                                      step.status === "completed";
                                    const isActive = step.status === "active";
                                    const isFailed = step.status === "failed";
                                    const isPending =
                                      step.status === "pending" ||
                                      step.status === "tombstoned";

                                    let markerStyle =
                                      "border-stone-800 bg-stone-950 text-stone-600";
                                    if (isCompleted) {
                                      markerStyle =
                                        "border-amber-700/60 bg-stone-900 text-amber-500 shadow-[0_0_8px_rgba(181,133,43,0.15)]";
                                    } else if (isActive) {
                                      markerStyle =
                                        "border-amber-500 bg-stone-950 text-amber-400 shadow-[0_0_12px_rgba(212,167,79,0.35)]";
                                    } else if (isFailed) {
                                      markerStyle =
                                        "border-red-900 bg-stone-950 text-red-500";
                                    }

                                    return (
                                      <div
                                        key={step.id}
                                        className="relative group select-text"
                                      >
                                        {/* Node circle */}
                                        <span
                                          className={`absolute -left-[35px] top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full border transition-all ${markerStyle}`}
                                        >
                                          {isCompleted ? (
                                            <Check
                                              size={10}
                                              strokeWidth={3.5}
                                            />
                                          ) : isActive ? (
                                            <motion.span
                                              animate={{
                                                scale: [0.8, 1.2, 0.8],
                                              }}
                                              transition={{
                                                duration: 2,
                                                repeat: Infinity,
                                                ease: "easeInOut",
                                              }}
                                              className="h-1.5 w-1.5 rounded-full bg-amber-400"
                                            />
                                          ) : (
                                            <span className="h-1 w-1 rounded-full bg-stone-700" />
                                          )}
                                        </span>

                                        {/* Content */}
                                        <div
                                          className={`${isActive ? "opacity-100" : isPending ? "opacity-45" : "opacity-75 group-hover:opacity-100"} transition-opacity`}
                                        >
                                          <h5
                                            className={`text-xs font-semibold tracking-wide ${isActive ? "text-amber-400" : isCompleted ? "text-stone-300" : "text-stone-500"}`}
                                          >
                                            {step.title}
                                          </h5>
                                          <p className="text-[10px] text-stone-500 mt-0.5 font-mono">
                                            node: {step.nodeId || "none"} •{" "}
                                            {step.status}
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      )}

                    {/* Canon quest stage fallback */}
                    {selectedQuest.kind === "canon" && (
                      <div className="mt-3 relative border-l-2 border-stone-850 ml-3 pl-6 space-y-4 py-1">
                        {/* Completed milestones */}
                        {selectedQuest.currentStage > 1 && (
                          <div className="relative opacity-60">
                            <span className="absolute -left-[35px] top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full border border-amber-700/40 bg-stone-900 text-amber-600">
                              <Check size={10} strokeWidth={3} />
                            </span>
                            <h5 className="text-xs text-stone-400">
                              Earlier chapters completed
                            </h5>
                            <p className="text-[10px] text-stone-600 font-mono">
                              Stage 1 to {selectedQuest.currentStage - 1}
                            </p>
                          </div>
                        )}

                        {/* Active stage */}
                        {selectedQuest.activeStage ? (
                          <div className="relative">
                            <span className="absolute -left-[35px] top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full border border-amber-500 bg-stone-950 text-amber-400 shadow-[0_0_10px_rgba(212,167,79,0.3)]">
                              <motion.span
                                animate={{ opacity: [0.4, 1, 0.4] }}
                                transition={{ duration: 1.8, repeat: Infinity }}
                                className="h-1.5 w-1.5 rounded-full bg-amber-400"
                              />
                            </span>
                            <h5 className="text-xs font-semibold text-amber-400 tracking-wide">
                              {selectedQuest.activeStage.title}
                            </h5>
                            <p className="text-xs text-stone-300 mt-1 leading-relaxed italic">
                              "{selectedQuest.activeStage.objectiveHint}"
                            </p>
                          </div>
                        ) : (
                          <div className="text-xs text-stone-500">
                            No active stage metadata found.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Reflections / Dynamic Field notes */}
                  {selectedQuest.kind === "procedural" && (
                    <div className="relative mt-6 rounded-[2px] border border-amber-900/20 bg-stone-950/45 p-4 font-serif">
                      {/* Decorative Typewriter stamp */}
                      <div className="absolute right-4 top-4 select-none opacity-[0.08] pointer-events-none origin-bottom-right rotate-12 uppercase text-right tracking-[0.25em] font-sans font-black text-amber-500 text-2xl border-4 border-amber-500 p-2 rounded-[0.25rem]">
                        Field Recall
                      </div>

                      <div className="flex items-center justify-between gap-3 border-b border-stone-850 pb-2 mb-3">
                        <h4 className="font-sans text-xs uppercase tracking-[0.25em] text-amber-600/80 font-bold flex items-center gap-2">
                          <FileText size={11} />
                          <span>Field Notes & Reflections</span>
                        </h4>

                        {/* Live Context Dev Info */}
                        {isOpenVikingDevEnabled() && (
                          <div className="flex items-center gap-1.5 text-[9px] font-sans text-stone-500 bg-stone-900/60 px-2 py-0.5 border border-stone-800/80 rounded-[1px]">
                            <Database size={9} className="text-stone-400" />
                            <span>RAG Link</span>
                            {isRagFetching ? (
                              <span
                                className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"
                                title="Syncing OpenViking..."
                              />
                            ) : isRagOffline ? (
                              <span
                                className="h-1.5 w-1.5 rounded-full bg-red-650"
                                title="Offline - Fallback active"
                              />
                            ) : (
                              <span
                                className="h-1.5 w-1.5 rounded-full bg-emerald-600"
                                title="Connected"
                              />
                            )}
                          </div>
                        )}
                      </div>

                      {isRagFetching ? (
                        <div className="space-y-2 animate-pulse py-2">
                          <div className="h-2.5 bg-stone-900 rounded w-full" />
                          <div className="h-2.5 bg-stone-900 rounded w-5/6" />
                          <div className="h-2.5 bg-stone-900 rounded w-4/5" />
                        </div>
                      ) : (
                        <p className="text-xs leading-relaxed text-stone-300 italic select-all selection:bg-amber-950 selection:text-amber-200">
                          "{reflections || "No reflections logged yet."}"
                        </p>
                      )}

                      {isOpenVikingDevEnabled() &&
                        provenance &&
                        !isRagFetching && (
                          <div className="mt-3 border-t border-stone-850/70 pt-2 flex items-start gap-1.5 text-[9px] font-mono text-stone-500">
                            <Database
                              size={9}
                              className="text-stone-400 mt-0.5 shrink-0"
                            />
                            <span className="break-all leading-relaxed">
                              {provenance}
                            </span>
                          </div>
                        )}
                    </div>
                  )}

                  {/* Objective point list / navigation */}
                  <div className="mt-6 border-t border-stone-850 pt-4">
                    <h4 className="text-xs uppercase tracking-[0.2em] text-stone-400 font-bold font-sans flex items-center gap-2">
                      <Compass size={12} className="text-stone-500" />
                      <span>Mapped Objectives / Coordinates</span>
                    </h4>

                    {selectedQuest.kind === "canon" &&
                    selectedQuest.activeStage?.objectivePointIds ? (
                      <div className="mt-2.5 space-y-2">
                        {selectedQuest.activeStage.objectivePointIds.map(
                          (pointId) => (
                            <div
                              key={pointId}
                              className="flex items-center gap-2 rounded-[2px] border border-white/5 bg-black/10 px-3 py-2 text-xs text-stone-300"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                              <span>{getObjectivePointLabel(pointId)}</span>
                            </div>
                          ),
                        )}
                      </div>
                    ) : selectedQuest.kind === "procedural" &&
                      selectedQuest.steps ? (
                      <div className="mt-2.5 space-y-2">
                        {(() => {
                          const active = selectedQuest.steps.find(
                            (s) => s.status === "active",
                          );
                          if (!active) {
                            return (
                              <p className="text-xs text-stone-500">
                                No active locations mapped.
                              </p>
                            );
                          }
                          return (
                            <div className="flex items-center justify-between gap-2 rounded-[2px] border border-amber-900/15 bg-black/10 px-3 py-2 text-xs text-stone-300">
                              <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                <span>{active.title}</span>
                              </div>
                              <span className="text-[9px] font-mono uppercase text-stone-500">
                                Active Stage Point
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <p className="text-xs text-stone-500 mt-2">
                        No location maps linked to this file.
                      </p>
                    )}
                  </div>

                  {/* Filed from event metadata */}
                  {selectedQuest.kind === "procedural" &&
                    selectedQuest.eligibilitySnapshot && (
                      <div className="mt-6 border-t border-stone-850 pt-4">
                        <h4 className="text-xs uppercase tracking-[0.2em] text-stone-500 font-bold font-sans">
                          Filed from Event
                        </h4>
                        <div className="mt-2.5 grid grid-cols-2 gap-2 text-[10px] font-mono text-stone-500 bg-stone-950/20 p-2.5 rounded-[2px] border border-stone-900/60">
                          <div>
                            <span className="block text-stone-600 uppercase">
                              Trigger Event:
                            </span>
                            <span className="text-stone-300">
                              {selectedQuest.eligibilitySnapshot.eventName}
                            </span>
                          </div>
                          <div>
                            <span className="block text-stone-600 uppercase">
                              Rule Reference:
                            </span>
                            <span className="text-stone-300">
                              {selectedQuest.eligibilitySnapshot.triggerRuleId}
                            </span>
                          </div>
                          {selectedQuest.eligibilitySnapshot.caseId && (
                            <div>
                              <span className="block text-stone-600 uppercase">
                                Parent Case:
                              </span>
                              <span className="text-stone-300">
                                {selectedQuest.eligibilitySnapshot.caseId}
                              </span>
                            </div>
                          )}
                          {selectedQuest.eligibilitySnapshot.scenarioId && (
                            <div>
                              <span className="block text-stone-600 uppercase">
                                Scenario:
                              </span>
                              <span className="text-stone-300">
                                {selectedQuest.eligibilitySnapshot.scenarioId}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  {/* Closed without canon mutation stamp */}
                  {selectedQuest.status === "Completed" &&
                    selectedQuest.kind === "procedural" && (
                      <div className="mt-6 flex justify-center py-2 select-none pointer-events-none">
                        <div className="border-2 border-dashed border-amber-800/40 px-6 py-2.5 rounded-[2px] text-center rotate-[-1.5deg] bg-amber-900/5">
                          <span className="block text-[9px] font-sans uppercase tracking-[0.4em] text-amber-700/50 font-bold">
                            Registry Seal
                          </span>
                          <span className="block mt-1 font-serif italic text-amber-600/70 text-xs font-semibold tracking-wider">
                            "Closed without canon mutation"
                          </span>
                        </div>
                      </div>
                    )}
                </SectionCard>
              </motion.div>
            ) : (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <SectionCard
                  accent={C.slate}
                  eyebrow="Case dossier File"
                  title="Registry Ledger View"
                  className="border-dashed border-stone-800/60 bg-[rgba(12,10,9,0.38)]"
                >
                  <div className="flex flex-col items-center justify-center py-20 px-4 text-center select-none">
                    <div className="h-12 w-12 rounded-full border border-stone-850 flex items-center justify-center text-stone-600 mb-4 bg-stone-950/20">
                      <FileText size={20} className="stroke-[1.5]" />
                    </div>
                    <p className="text-xs uppercase tracking-[0.25em] text-stone-500 font-sans font-bold">
                      No Case Selected
                    </p>
                    <p className="mt-3 text-xs leading-relaxed text-stone-400 font-serif italic max-w-sm">
                      "Select an active canon storyline or procedural case file
                      overlay from the left ledger to retrieve diagnostic
                      traces, step timelines, and live context reflections."
                    </p>
                  </div>
                </SectionCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Field Dossiers: progressive NPC bios that fill in as you investigate */}
      <SectionCard
        accent={C.brass}
        eyebrow="Field Dossiers"
        title="People of Interest"
      >
        {dossierEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 border border-dashed border-stone-800/60 rounded-[0.5rem] bg-stone-950/10">
            <Users className="text-stone-600 mb-2" size={24} />
            <p className="text-sm leading-relaxed text-stone-500">
              No one is on file yet. Dossiers open as you meet people in the
              field and learn what they are hiding.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {dossierEntries.map((entry) => (
              <article
                key={entry.id}
                className="rounded-[0.25rem] border border-white/5 bg-black/15 px-4 py-3.5"
              >
                <div className="flex items-start gap-3">
                  {entry.portraitUrl ? (
                    <img
                      src={entry.portraitUrl}
                      alt=""
                      className="h-12 w-12 rounded-[2px] object-cover border border-stone-800 grayscale-[35%]"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-[2px] border border-stone-800 bg-stone-950/60 flex items-center justify-center text-stone-600">
                      <Users size={18} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <strong className="block text-sm tracking-wide text-stone-100">
                      {entry.displayName}
                    </strong>
                    <span className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 font-mono">
                      {entry.publicRole}
                    </span>
                  </div>
                </div>

                <p className="mt-2.5 text-xs leading-relaxed text-stone-300 font-serif">
                  {entry.summary}
                </p>

                {entry.revealedStages.length > 0 && (
                  <div className="mt-3 space-y-2.5 border-t border-stone-850 pt-3">
                    {entry.revealedStages.map((stage) => (
                      <div key={stage.heading}>
                        <h5 className="text-[10px] uppercase tracking-[0.2em] text-amber-500/80 font-bold font-sans">
                          {stage.heading}
                        </h5>
                        <p className="mt-1 text-xs leading-relaxed text-stone-300 font-serif">
                          {stage.text}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {entry.lockedStageCount > 0 && (
                  <div className="mt-3 flex items-center gap-1.5 text-[10px] text-stone-500 font-mono">
                    <Lock size={10} className="text-stone-600" />
                    <span>
                      {entry.lockedStageCount} insight
                      {entry.lockedStageCount > 1 ? "s" : ""} still to uncover
                    </span>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Lower Section: Anomalous Registry & Archetype Fragments */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_320px]">
        <SectionCard
          accent={C.amber}
          eyebrow={t.observationJournal}
          title="Anomalous Registry"
        >
          {observationEntries.length === 0 ? (
            <p className="text-sm leading-relaxed text-stone-400">
              No anomalous observations are archived yet. Rational casework
              remains your primary ledger until the veil leaves something you
              can actually file.
            </p>
          ) : (
            <div className="space-y-3">
              {observationEntries.map((entry) => (
                <article
                  key={entry.id}
                  className="rounded-[0.25rem] border border-white/5 bg-black/15 px-4 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <strong className="text-stone-100 text-sm tracking-wide">
                      {entry.title}
                    </strong>
                    <span
                      className="rounded-[2px] border px-2 py-0.5 text-[9px] uppercase tracking-[0.25em]"
                      style={{
                        borderColor: "rgba(212, 167, 79, 0.22)",
                        color: "#f4d18a",
                        backgroundColor: "rgba(181, 133, 43, 0.1)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {entry.kind}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-stone-300 font-serif">
                    {entry.text}
                  </p>
                  {entry.rationalInterpretation ? (
                    <p className="mt-2 text-[10px] leading-relaxed text-stone-500 font-mono">
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
              No archetype has enough corroborated traces to form a working
              file.
            </p>
          ) : (
            <div className="space-y-3">
              {entityKnowledge.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-[0.25rem] border border-white/5 bg-black/15 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <strong className="text-stone-100 text-sm tracking-wide">
                      {entry.label}
                    </strong>
                    <span
                      className="text-[9px] uppercase tracking-[0.2em]"
                      style={{ color: C.amber, fontFamily: "var(--font-mono)" }}
                    >
                      Veil {entry.veilLevel}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-stone-400">
                    {entry.observationCount} observations
                  </p>
                  <p className="mt-1.5 text-[10px] leading-relaxed text-stone-500 font-mono">
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
};
