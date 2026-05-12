export const DEFAULT_PREFETCH_IDLE_TIMEOUT_MS = 250;

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
      opts?: { timeout?: number },
    ) => number;
  };

export function shouldSkipPrefetchForConnection(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  const connection = (navigator as NavigatorWithConnection).connection;
  return (
    connection?.saveData === true ||
    connection?.effectiveType === "slow-2g" ||
    connection?.effectiveType === "2g"
  );
}

export function scheduleIdlePrefetch(
  callback: () => void,
  timeoutMs: number = DEFAULT_PREFETCH_IDLE_TIMEOUT_MS,
): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const browserWindow = window as WindowWithIdleCallback;
  if (browserWindow.requestIdleCallback && browserWindow.cancelIdleCallback) {
    const id = browserWindow.requestIdleCallback(callback, {
      timeout: timeoutMs,
    });
    return () => browserWindow.cancelIdleCallback?.(id);
  }

  const id = browserWindow.setTimeout(callback, timeoutMs);
  return () => browserWindow.clearTimeout(id);
}

export interface PrefetchImagesSyncOptions {
  /** How many loaded images attempt decode(); default 1. */
  decodeBudget?: number;
}

export interface PrefetchImagesSyncHandle {
  cancel: () => void;
}

/**
 * Loads a list of image URLs in parallel (no idle deferral).
 * Safe to cancel on unmount via returned handle.
 */
export function prefetchImagesSync(
  urls: readonly string[],
  options?: PrefetchImagesSyncOptions,
): PrefetchImagesSyncHandle {
  const decodeBudget = options?.decodeBudget ?? 1;
  const activeImages = new Set<HTMLImageElement>();

  const releaseImage = (img: HTMLImageElement) => {
    img.onload = null;
    img.onerror = null;
    activeImages.delete(img);
  };

  urls.forEach((raw, index) => {
    const url = raw.trim();
    if (!url) {
      return;
    }

    const img = new Image();
    activeImages.add(img);
    img.decoding = "async";

    img.onload = () => {
      if (index < decodeBudget && typeof img.decode === "function") {
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

  return {
    cancel: () => {
      activeImages.forEach((img) => {
        releaseImage(img);
        img.removeAttribute("src");
      });
      activeImages.clear();
    },
  };
}
