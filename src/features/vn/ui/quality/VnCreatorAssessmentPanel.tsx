import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion, useDragControls } from "framer-motion";
import { ChevronRight } from "lucide-react";
import type { VnNode, VnScenario } from "../../types";
import {
  expandNarratorParagraphs,
  parseSpeakerSegments,
} from "../../log/speakerParser";
import { useI18n } from "../../../i18n/I18nContext";
import { resolveVnNodeText } from "../../../i18n/vnContentTranslations";
import { buildDialogueLineKey } from "./lineKey";
import { useQualityRatings } from "./useQualityRatings";
import { VnDialogueRating } from "./VnDialogueRating";
import { VnRatingOverlay, type RatingTarget } from "./VnRatingOverlay";

interface VnCreatorAssessmentPanelProps {
  node: VnNode | null;
  scenario: VnScenario | null;
  contentVersion?: string;
}

/**
 * Creator-only assessment surface. Gated by the caller (DEV or witch). Lets a
 * director grade the current node/scene/scenario/case on a 1-10 scale and rate
 * each dialogue line 1-5. All writes go to SpacetimeDB via {@link useQualityRatings}.
 */
export const VnCreatorAssessmentPanel = ({
  node,
  scenario,
  contentVersion,
}: VnCreatorAssessmentPanelProps): JSX.Element | null => {
  const ratings = useQualityRatings();
  const { language, dictionary } = useI18n();
  const [panelExpanded, setPanelExpanded] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [linesOpen, setLinesOpen] = useState(false);

  const contentRef = useRef<HTMLDivElement | null>(null);
  const dragControls = useDragControls();
  const [collapseX, setCollapseX] = useState(0);

  // Parse like useNarrativeLog, then split narrator blocks on paragraph breaks so
  // each visible prose beat can be rated independently in the creator panel.
  const segments = useMemo(() => {
    if (!node) {
      return [];
    }
    const resolvedBody = resolveVnNodeText(
      language,
      node.scenarioId,
      node.id,
      "body",
      node.body,
      dictionary,
    );
    return expandNarratorParagraphs(
      parseSpeakerSegments(resolvedBody, dictionary),
    );
  }, [node, language, dictionary]);

  const targets = useMemo<RatingTarget[]>(() => {
    if (!node) {
      return [];
    }
    const entries: RatingTarget[] = [
      { type: "node", id: node.id, label: `Узел: ${node.id}` },
    ];
    if (node.sceneGroupId) {
      entries.push({
        type: "scene_group",
        id: node.sceneGroupId,
        label: `Сцена: ${node.sceneGroupId}`,
      });
    }
    if (scenario) {
      entries.push({
        type: "scenario",
        id: scenario.id,
        label: `Сценарий: ${scenario.id}`,
      });
      if (scenario.packId) {
        entries.push({
          type: "case",
          id: scenario.packId,
          label: `Дело: ${scenario.packId}`,
        });
      }
    }
    return entries;
  }, [node, scenario]);

  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content) {
      return;
    }

    const update = () => {
      setCollapseX(Math.round(content.getBoundingClientRect().width));
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(content);
    return () => ro.disconnect();
  }, [segments.length, linesOpen, panelExpanded]);

  if (!node) {
    return null;
  }

  const panelCollapsed = !panelExpanded;
  const xAnimated =
    panelCollapsed && collapseX > 0 ? -collapseX : panelCollapsed ? "-100%" : 0;

  return (
    <>
      <div
        data-testid="vn-creator-assessment"
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-0 z-[999] flex touch-none items-center"
      >
        <motion.button
          type="button"
          onPointerDown={(event) => dragControls.start(event)}
          onTap={() => setPanelExpanded((expanded) => !expanded)}
          className="group relative z-10 flex h-10 w-5 shrink-0 items-center justify-center rounded-r-lg border-y border-r border-stone-800/75 bg-stone-950/90 pb-0.5 backdrop-blur-md transition-colors hover:bg-stone-900/95"
          aria-label={
            panelCollapsed
              ? "Развернуть панель оценки"
              : "Свернуть панель оценки"
          }
        >
          <div className="absolute left-1 h-4 w-0.5 rounded-full bg-stone-700/90 transition-colors group-hover:bg-stone-500" />
          <motion.div
            animate={{ rotate: panelCollapsed ? 0 : 180 }}
            className="text-stone-600"
          >
            <ChevronRight size={11} strokeWidth={2.5} />
          </motion.div>
        </motion.button>

        <motion.div
          ref={contentRef}
          initial={false}
          animate={{ x: xAnimated }}
          drag={collapseX > 0 ? "x" : false}
          dragListener={false}
          dragControls={dragControls}
          dragConstraints={
            collapseX > 0 ? { left: -collapseX, right: 0 } : undefined
          }
          dragElastic={0.04}
          dragMomentum={false}
          onDragEnd={(_, info) => {
            if (collapseX <= 0) {
              return;
            }
            const { offset, velocity } = info;
            // dragControls.start() turns a tap into a zero-distance drag, so
            // framer's onTap never fires — treat negligible movement as a toggle.
            if (Math.abs(offset.x) < 6 && Math.abs(velocity.x) < 80) {
              setPanelExpanded((expanded) => !expanded);
              return;
            }
            const vTh = 280;
            if (!panelCollapsed) {
              if (offset.x < -48 || velocity.x < -vTh) {
                setPanelExpanded(false);
              } else {
                setPanelExpanded(true);
              }
            } else if (offset.x > 48 || velocity.x > vTh) {
              setPanelExpanded(true);
            } else {
              setPanelExpanded(false);
            }
          }}
          transition={{ type: "spring", damping: 28, stiffness: 280 }}
          className="flex max-w-[360px] flex-col gap-2 pl-2 pr-4"
        >
          <div className="flex gap-2 rounded-lg border border-stone-800/80 bg-stone-950/95 p-1.5 backdrop-blur-md shadow-[4px_0_24px_rgba(0,0,0,0.35)]">
            <button
              type="button"
              onClick={() => setOverlayOpen((open) => !open)}
              className="cursor-pointer rounded-md border border-sky-400/50 bg-sky-500/15 px-3 py-1.5 text-xs font-semibold text-sky-300 transition-colors hover:bg-sky-500/25"
            >
              ★ Оценить
            </button>
            {segments.length > 0 ? (
              <button
                type="button"
                onClick={() => setLinesOpen((open) => !open)}
                className="cursor-pointer rounded-md border border-white/15 bg-transparent px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:border-white/25 hover:bg-white/5"
              >
                Реплики ({segments.length})
              </button>
            ) : null}
          </div>

          {linesOpen ? (
            <div className="flex max-h-[50vh] flex-col gap-1.5 overflow-y-auto rounded-lg border border-white/12 bg-[#0b1120] p-2 shadow-[4px_0_24px_rgba(0,0,0,0.35)]">
              {segments.map((segment, index) => {
                const line = buildDialogueLineKey(segment, index);
                const stored = ratings.getDialogueRating(node.id, line.lineKey);
                return (
                  <VnDialogueRating
                    key={line.lineKey}
                    speakerLabel={segment.speakerLabel}
                    text={segment.text}
                    line={line}
                    currentScore={stored?.score}
                    currentComment={stored?.comment ?? undefined}
                    onRate={(ratedLine, score, comment) =>
                      void ratings.submitDialogueRating({
                        nodeId: node.id,
                        scenarioId: scenario?.id,
                        line: ratedLine,
                        contentVersion,
                        score,
                        comment,
                      })
                    }
                    onClear={(clearedLine) =>
                      void ratings.removeDialogueRating(node.id, clearedLine)
                    }
                    onSaveComment={(ratedLine, score, comment) =>
                      void ratings.submitDialogueRating({
                        nodeId: node.id,
                        scenarioId: scenario?.id,
                        line: ratedLine,
                        contentVersion,
                        score,
                        comment,
                      })
                    }
                  />
                );
              })}
            </div>
          ) : null}
        </motion.div>
      </div>

      {overlayOpen ? (
        <VnRatingOverlay
          targets={targets}
          scenarioId={scenario?.id}
          contentVersion={contentVersion}
          ratings={ratings}
          onClose={() => setOverlayOpen(false)}
        />
      ) : null}
    </>
  );
};
