import { useMemo, useState } from "react";
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
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [linesOpen, setLinesOpen] = useState(false);

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

  if (!node) {
    return null;
  }

  return (
    <div
      data-testid="vn-creator-assessment"
      style={{
        position: "fixed",
        left: 16,
        bottom: 16,
        zIndex: 999,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        maxWidth: 360,
      }}
    >
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={() => setOverlayOpen((open) => !open)}
          style={{
            padding: "6px 12px",
            borderRadius: 6,
            cursor: "pointer",
            border: "1px solid rgba(56,189,248,0.5)",
            background: "rgba(14,165,233,0.15)",
            color: "#7dd3fc",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          ★ Оценить
        </button>
        {segments.length > 0 ? (
          <button
            type="button"
            onClick={() => setLinesOpen((open) => !open)}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              cursor: "pointer",
              border: "1px solid rgba(255,255,255,0.15)",
              background: "transparent",
              color: "#cbd5e1",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            Реплики ({segments.length})
          </button>
        ) : null}
      </div>

      {linesOpen ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            maxHeight: "50vh",
            overflowY: "auto",
            padding: 8,
            borderRadius: 8,
            background: "#0b1120",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
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

      {overlayOpen ? (
        <VnRatingOverlay
          targets={targets}
          scenarioId={scenario?.id}
          contentVersion={contentVersion}
          ratings={ratings}
          onClose={() => setOverlayOpen(false)}
        />
      ) : null}
    </div>
  );
};
