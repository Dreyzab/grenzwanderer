import { useMemo } from "react";
import { getNodeById } from "../vnContent";
import type { VnChoice, VnNode, VnSnapshot } from "../types";

interface UseNextVnVisualPrefetchUrlsInput {
  autoContinueChoice?: VnChoice | null;
  currentNode?: VnNode | null;
  resolvedBgUrl?: string | null;
  snapshot?: VnSnapshot | null;
  visibleChoices: readonly VnChoice[];
}

export function useNextVnVisualPrefetchUrls({
  autoContinueChoice,
  currentNode,
  resolvedBgUrl,
  snapshot,
  visibleChoices,
}: UseNextVnVisualPrefetchUrlsInput): string[] {
  return useMemo(() => {
    if (!snapshot) {
      return [];
    }

    const urls: string[] = [];
    const currentVisualUrls = new Set(
      [
        resolvedBgUrl,
        currentNode?.backgroundUrl,
        currentNode?.backgroundVideoPosterUrl,
      ].filter((url): url is string => Boolean(url)),
    );

    const pushNodeVisuals = (nodeId: string | undefined) => {
      if (!nodeId) {
        return;
      }

      const node = getNodeById(snapshot, nodeId);
      if (!node) {
        return;
      }

      for (const url of [node.backgroundUrl, node.backgroundVideoPosterUrl]) {
        if (url && !currentVisualUrls.has(url)) {
          urls.push(url);
        }
      }
    };

    pushNodeVisuals(autoContinueChoice?.nextNodeId);
    for (const choice of visibleChoices) {
      pushNodeVisuals(choice.nextNodeId);
    }

    return Array.from(new Set(urls));
  }, [
    autoContinueChoice,
    currentNode?.backgroundUrl,
    currentNode?.backgroundVideoPosterUrl,
    resolvedBgUrl,
    snapshot,
    visibleChoices,
  ]);
}
