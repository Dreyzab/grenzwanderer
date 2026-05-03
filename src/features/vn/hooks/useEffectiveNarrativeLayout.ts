import { useMemo } from "react";
import type { VnNarrativeLayout, VnNode } from "../types";

export function resolveEffectiveNarrativeLayout(
  currentNode: Pick<VnNode, "narrativeLayout" | "narrativePresentation"> | null,
): VnNarrativeLayout {
  const layout = currentNode?.narrativeLayout;
  if (
    currentNode?.narrativePresentation === "letter" &&
    (layout === undefined || layout === "split")
  ) {
    return "letter_overlay";
  }
  if (layout === "split" || layout === "thought_log") {
    return "log";
  }

  return layout ?? "split";
}

export function useEffectiveNarrativeLayout(
  currentNode: Pick<VnNode, "narrativeLayout" | "narrativePresentation"> | null,
): VnNarrativeLayout {
  return useMemo(
    () => resolveEffectiveNarrativeLayout(currentNode),
    [currentNode],
  );
}
