import { useEffect, useMemo } from "react";
import type { VnSnapshot } from "../types";
import {
  collectOriginDossierUrls,
  collectScenarioVisualUrls,
} from "./collectEntryPrefetchUrls";
import {
  PREFETCH_ENTRY_SCENARIO_ID,
  PREFETCH_PRIMARY_ORIGIN_ID,
} from "./entryPrefetchConstants";
import {
  DEFAULT_PREFETCH_IDLE_TIMEOUT_MS,
  prefetchImagesSync,
  scheduleIdlePrefetch,
  shouldSkipPrefetchForConnection,
} from "./prefetchImageAssets";

const PRIORITY_URL_CAP = 3;
const IDLE_BATCH_SIZE = 5;

const dedupePreserveOrder = (urls: readonly string[]): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of urls) {
    const u = raw.trim();
    if (!u || seen.has(u)) {
      continue;
    }
    seen.add(u);
    out.push(u);
  }
  return out;
};

/**
 * Warm dossier portraits + early case01 visuals while the player is still on Home.
 */
export function useHomeEntryVisualPrefetch(
  snapshot: VnSnapshot | null,
  enabled: boolean,
): void {
  const lists = useMemo(() => {
    if (!snapshot) {
      return { priority: [] as string[], rest: [] as string[] };
    }

    const dossierUrls = collectOriginDossierUrls({
      onlyProfileId: PREFETCH_PRIMARY_ORIGIN_ID,
    });
    const scenarioUrls = collectScenarioVisualUrls(
      snapshot,
      PREFETCH_ENTRY_SCENARIO_ID,
      {
        maxNodes: 15,
        breadthPerNode: 6,
      },
    );
    const merged = dedupePreserveOrder([...dossierUrls, ...scenarioUrls]);
    return {
      priority: merged.slice(0, PRIORITY_URL_CAP),
      rest: merged.slice(PRIORITY_URL_CAP),
    };
  }, [snapshot]);

  const priorityKey = lists.priority.join("\0");
  const restKey = lists.rest.join("\0");

  useEffect(() => {
    if (
      !enabled ||
      lists.priority.length === 0 ||
      shouldSkipPrefetchForConnection()
    ) {
      return undefined;
    }

    const handle = prefetchImagesSync(lists.priority, { decodeBudget: 2 });
    return () => handle.cancel();
  }, [enabled, lists.priority, priorityKey]);

  useEffect(() => {
    if (
      !enabled ||
      lists.rest.length === 0 ||
      shouldSkipPrefetchForConnection()
    ) {
      return undefined;
    }

    let cancelled = false;
    let cancelIdle: (() => void) | undefined;
    let activeHandle: ReturnType<typeof prefetchImagesSync> | null = null;
    let offset = 0;

    const pump = () => {
      cancelIdle = undefined;
      if (cancelled || offset >= lists.rest.length) {
        activeHandle?.cancel();
        activeHandle = null;
        return;
      }

      activeHandle?.cancel();
      const batch = lists.rest.slice(offset, offset + IDLE_BATCH_SIZE);
      offset += batch.length;
      activeHandle = prefetchImagesSync(batch, { decodeBudget: 0 });

      cancelIdle = scheduleIdlePrefetch(
        pump,
        DEFAULT_PREFETCH_IDLE_TIMEOUT_MS + 120,
      );
    };

    cancelIdle = scheduleIdlePrefetch(pump, DEFAULT_PREFETCH_IDLE_TIMEOUT_MS);

    return () => {
      cancelled = true;
      cancelIdle?.();
      activeHandle?.cancel();
    };
  }, [enabled, lists.rest, restKey]);
}
