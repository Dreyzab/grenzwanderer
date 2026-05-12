import { useEffect, useMemo, useRef } from "react";
import {
  DEFAULT_PREFETCH_IDLE_TIMEOUT_MS,
  prefetchImagesSync,
  scheduleIdlePrefetch,
  shouldSkipPrefetchForConnection,
} from "../prefetch/prefetchImageAssets";

const DEFAULT_MAX_PREFETCH = 3;

const normalizePrefetchQueue = (
  urls: readonly string[],
  maxPrefetch: number,
): string[] => {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const url of urls) {
    const trimmed = url.trim();
    if (!trimmed || seen.has(trimmed)) {
      continue;
    }

    seen.add(trimmed);
    normalized.push(trimmed);

    if (normalized.length >= maxPrefetch) {
      break;
    }
  }

  return normalized;
};

export interface UsePrefetchVnVisualsOptions {
  /** Max simultaneous image prefetches per effect tick. Defaults to 3. */
  maxPrefetch?: number;
}

export function usePrefetchVnVisuals(
  urls: readonly string[] | undefined,
  enabled: boolean,
  options?: UsePrefetchVnVisualsOptions,
): void {
  const maxPrefetch = options?.maxPrefetch ?? DEFAULT_MAX_PREFETCH;
  const generationRef = useRef(0);
  const queue = useMemo(
    () => normalizePrefetchQueue(urls ?? [], maxPrefetch),
    [urls, maxPrefetch],
  );
  const queueKey = queue.join("\0");

  useEffect(() => {
    generationRef.current += 1;
    const generation = generationRef.current;

    if (!enabled || queue.length === 0 || shouldSkipPrefetchForConnection()) {
      return undefined;
    }

    let prefetchHandle: ReturnType<typeof prefetchImagesSync> | null = null;

    const cancelIdle = scheduleIdlePrefetch(() => {
      if (generationRef.current !== generation) {
        return;
      }

      prefetchHandle = prefetchImagesSync(queue, { decodeBudget: 1 });
    }, DEFAULT_PREFETCH_IDLE_TIMEOUT_MS);

    return () => {
      cancelIdle();
      prefetchHandle?.cancel();
    };
  }, [enabled, queue, queueKey]);
}
