import {
  clearAllEvents,
  loadRecentEvents,
  persistEvent,
  pruneOldEvents,
  type PersistedDevLogEntry,
} from "./devLoggerDb";

export type DevLogCategory = "error" | "navigation" | "user-action" | "info";

export interface DevLogEntry {
  id?: number;
  timestamp: number;
  category: DevLogCategory;
  message: string;
  data?: unknown;
  stack?: string;
  url?: string;
  sessionId?: string;
}

const MEMORY_LIMIT = 500;
const PRUNE_DELAY_MS = 30_000;

const generateSessionId = (): string => {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
  } catch {
    // fall through
  }
  return `${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
};

const SESSION_ID = generateSessionId();

type Listener = (entries: DevLogEntry[]) => void;

const buffer: DevLogEntry[] = [];
const listeners = new Set<Listener>();
let pruneScheduled = false;
let hydratePromise: Promise<void> | null = null;

export const isDevLoggerEnabled = (): boolean => {
  try {
    const env = (import.meta as ImportMeta).env;
    if (!env) return false;
    if (env.MODE === "test") return false;
    return Boolean(env.DEV);
  } catch {
    return false;
  }
};

export const safeStringify = (value: unknown, indent?: number): string => {
  try {
    return JSON.stringify(
      value,
      (_key, v) => {
        if (typeof v === "bigint") return `${v.toString()}n`;
        if (v instanceof Error) {
          return { name: v.name, message: v.message, stack: v.stack };
        }
        return v;
      },
      indent,
    );
  } catch {
    return String(value);
  }
};

const sanitizeData = (data: unknown): unknown => {
  if (data === undefined || data === null) return data;
  try {
    return JSON.parse(safeStringify(data));
  } catch {
    return String(data);
  }
};

const notifyListeners = () => {
  const snapshot = buffer.slice();
  for (const listener of listeners) {
    try {
      listener(snapshot);
    } catch {
      // listener errors must not break the logger
    }
  }
};

const append = (entry: DevLogEntry) => {
  buffer.push(entry);
  if (buffer.length > MEMORY_LIMIT) {
    buffer.splice(0, buffer.length - MEMORY_LIMIT);
  }
  notifyListeners();

  void persistEvent(entry as PersistedDevLogEntry);

  if (!pruneScheduled) {
    pruneScheduled = true;
    setTimeout(() => {
      pruneScheduled = false;
      void pruneOldEvents();
    }, PRUNE_DELAY_MS);
  }
};

const writeLog = (
  category: DevLogCategory,
  message: string,
  data?: unknown,
  stack?: string,
) => {
  if (!isDevLoggerEnabled()) return;
  const entry: DevLogEntry = {
    timestamp: Date.now(),
    category,
    message,
    data: sanitizeData(data),
    stack,
    url:
      typeof window !== "undefined"
        ? window.location.pathname + window.location.search
        : undefined,
    sessionId: SESSION_ID,
  };
  append(entry);
};

export const devLogger = {
  error(message: string, data?: unknown, stack?: string): void {
    writeLog("error", message, data, stack);
  },
  navigation(message: string, data?: unknown): void {
    writeLog("navigation", message, data);
  },
  userAction(message: string, data?: unknown): void {
    writeLog("user-action", message, data);
  },
  info(message: string, data?: unknown): void {
    writeLog("info", message, data);
  },
  getRecent(limit?: number): DevLogEntry[] {
    return limit ? buffer.slice(-limit) : buffer.slice();
  },
  async getPersisted(limit = MEMORY_LIMIT): Promise<DevLogEntry[]> {
    return (await loadRecentEvents(limit)) as DevLogEntry[];
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  async clear(): Promise<void> {
    buffer.length = 0;
    notifyListeners();
    await clearAllEvents();
  },
  getSessionId(): string {
    return SESSION_ID;
  },
  async hydrate(limit = MEMORY_LIMIT): Promise<void> {
    if (!isDevLoggerEnabled()) return;
    if (hydratePromise) return hydratePromise;
    hydratePromise = (async () => {
      const recent = (await loadRecentEvents(limit)) as DevLogEntry[];
      if (recent.length === 0) return;
      buffer.unshift(...recent);
      if (buffer.length > MEMORY_LIMIT) {
        buffer.splice(0, buffer.length - MEMORY_LIMIT);
      }
      notifyListeners();
    })();
    return hydratePromise;
  },
};
