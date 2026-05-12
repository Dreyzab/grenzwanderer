const DB_NAME = "grenzwanderer-devlog";
const DB_VERSION = 1;
const STORE = "events";
const MAX_PERSISTED = 5000;

export interface PersistedDevLogEntry {
  id?: number;
  timestamp: number;
  category: string;
  message: string;
  data?: unknown;
  stack?: string;
  url?: string;
  sessionId?: string;
}

let dbPromise: Promise<IDBDatabase> | null = null;

const hasIndexedDb = (): boolean =>
  typeof indexedDB !== "undefined" && indexedDB !== null;

const openDb = (): Promise<IDBDatabase> => {
  if (!hasIndexedDb()) {
    return Promise.reject(new Error("IndexedDB unavailable"));
  }
  if (dbPromise) return dbPromise;
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("timestamp", "timestamp");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
  });
  return dbPromise;
};

export const persistEvent = async (
  entry: PersistedDevLogEntry,
): Promise<void> => {
  if (!hasIndexedDb()) return;
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).add(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () =>
        reject(tx.error ?? new Error("IndexedDB persist failed"));
    });
  } catch {
    // Logger must never throw.
  }
};

export const loadRecentEvents = async (
  limit: number,
): Promise<PersistedDevLogEntry[]> => {
  if (!hasIndexedDb()) return [];
  try {
    const db = await openDb();
    return await new Promise<PersistedDevLogEntry[]>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const store = tx.objectStore(STORE);
      const cursorReq = store.index("timestamp").openCursor(null, "prev");
      const result: PersistedDevLogEntry[] = [];
      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if (cursor && result.length < limit) {
          result.push(cursor.value as PersistedDevLogEntry);
          cursor.continue();
        } else {
          resolve(result.reverse());
        }
      };
      cursorReq.onerror = () =>
        reject(cursorReq.error ?? new Error("IndexedDB load failed"));
    });
  } catch {
    return [];
  }
};

export const clearAllEvents = async (): Promise<void> => {
  if (!hasIndexedDb()) return;
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () =>
        reject(tx.error ?? new Error("IndexedDB clear failed"));
    });
  } catch {
    // ignore
  }
};

export const pruneOldEvents = async (): Promise<void> => {
  if (!hasIndexedDb()) return;
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      const countReq = store.count();
      countReq.onsuccess = () => {
        const overflow = countReq.result - MAX_PERSISTED;
        if (overflow <= 0) return;
        let removed = 0;
        const cursorReq = store.index("timestamp").openCursor();
        cursorReq.onsuccess = () => {
          const cursor = cursorReq.result;
          if (cursor && removed < overflow) {
            cursor.delete();
            removed++;
            cursor.continue();
          }
        };
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () =>
        reject(tx.error ?? new Error("IndexedDB prune failed"));
    });
  } catch {
    // ignore
  }
};
