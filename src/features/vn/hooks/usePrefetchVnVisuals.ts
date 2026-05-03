import { useEffect, useMemo, useRef } from "react";

const MAX_PREFETCH = 3;
const DECODE_BUDGET = 1;
const PREFETCH_IDLE_TIMEOUT_MS = 250;

interface NetworkInformationLike {
  effectiveType?: string;
  saveData?: boolean;
}

type NavigatorWithConnection = Navigator & {
  connection?: NetworkInformationLike;
};

type WindowWithIdleCallback = Window &
  typeof globalThis & {
    cancelIdleCallback?: (handle: number) => void;
    requestIdleCallback?: (
      callback: () => void,
      options?: { timeout?: number },
    ) => number;
  };

const shouldSkipPrefetchForConnection = (): boolean => {
  if (typeof navigator === "undefined") {
    return false;
  }

  const connection = (navigator as NavigatorWithConnection).connection;
  return (
    connection?.saveData === true ||
    connection?.effectiveType === "slow-2g" ||
    connection?.effectiveType === "2g"
  );
};

const scheduleIdlePrefetch = (callback: () => void): (() => void) => {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const browserWindow = window as WindowWithIdleCallback;
  if (browserWindow.requestIdleCallback && browserWindow.cancelIdleCallback) {
    const id = browserWindow.requestIdleCallback(callback, {
      timeout: PREFETCH_IDLE_TIMEOUT_MS,
    });
    return () => browserWindow.cancelIdleCallback?.(id);
  }

  const id = browserWindow.setTimeout(callback, PREFETCH_IDLE_TIMEOUT_MS);
  return () => browserWindow.clearTimeout(id);
};

const normalizePrefetchQueue = (urls: readonly string[]): string[] => {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const url of urls) {
    const trimmed = url.trim();
    if (!trimmed || seen.has(trimmed)) {
      continue;
    }

    seen.add(trimmed);
    normalized.push(trimmed);

    if (normalized.length >= MAX_PREFETCH) {
      break;
    }
  }

  return normalized;
};

export function usePrefetchVnVisuals(
  urls: readonly string[] | undefined,
  enabled: boolean,
): void {
  const generationRef = useRef(0);
  const queue = useMemo(() => normalizePrefetchQueue(urls ?? []), [urls]);
  const queueKey = queue.join("\0");

  useEffect(() => {
    generationRef.current += 1;
    const generation = generationRef.current;

    if (!enabled || queue.length === 0 || shouldSkipPrefetchForConnection()) {
      return undefined;
    }

    const activeImages = new Set<HTMLImageElement>();
    const releaseImage = (img: HTMLImageElement) => {
      img.onload = null;
      img.onerror = null;
      activeImages.delete(img);
    };

    const cancelIdle = scheduleIdlePrefetch(() => {
      if (generationRef.current !== generation) {
        return;
      }

      queue.forEach((url, index) => {
        const img = new Image();
        activeImages.add(img);
        img.decoding = "async";

        img.onload = () => {
          if (generationRef.current !== generation) {
            releaseImage(img);
            return;
          }

          if (index < DECODE_BUDGET && typeof img.decode === "function") {
            void img
              .decode()
              .catch(() => undefined)
              .finally(() => releaseImage(img));
            return;
          }

          releaseImage(img);
        };

        img.onerror = () => releaseImage(img);
        img.src = url;
      });
    });

    return () => {
      cancelIdle();
      activeImages.forEach((img) => {
        releaseImage(img);
        img.removeAttribute("src");
      });
      activeImages.clear();
    };
  }, [enabled, queue, queueKey]);
}
