/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ToastType = "fact" | "reward" | "info";
export type ToastSource =
  | "mind_fact"
  | "mind_hypothesis"
  | "dev_cheat"
  | "system";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  source: ToastSource;
}

export type ShowToastInput = {
  message: string;
  type?: ToastType;
  dedupeKey?: string;
  ttlMs?: number;
  source?: ToastSource;
};

interface ToastContextValue {
  toasts: Toast[];
  showToast: (input: ShowToastInput) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_TTL_MS = 4000;
const MAX_VISIBLE = 3;
const DEDUPE_WINDOW_MS = 1500;

let nextId = 0;
const generateId = (): string => {
  nextId += 1;
  return `toast-${nextId}-${Date.now()}`;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  const dedupeRef = useRef<Map<string, number>>(new Map());

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    (input: ShowToastInput) => {
      const {
        message,
        type = "info",
        dedupeKey,
        ttlMs = DEFAULT_TTL_MS,
        source = "system",
      } = input;

      const normalizedMessage = message.trim();
      if (normalizedMessage.length === 0) {
        return;
      }

      const now = Date.now();
      if (dedupeKey) {
        const lastShownAt = dedupeRef.current.get(dedupeKey);
        if (
          typeof lastShownAt === "number" &&
          now - lastShownAt <= DEDUPE_WINDOW_MS
        ) {
          return;
        }
        dedupeRef.current.set(dedupeKey, now);
      }

      const id = generateId();
      setToasts((prev) => {
        const next = [...prev, { id, message: normalizedMessage, type, source }];
        return next.length > MAX_VISIBLE ? next.slice(-MAX_VISIBLE) : next;
      });

      const safeTtl = Number.isFinite(ttlMs) && ttlMs > 0 ? ttlMs : DEFAULT_TTL_MS;
      const timer = setTimeout(() => {
        dismissToast(id);
      }, safeTtl);
      timersRef.current.set(id, timer);

      if (dedupeRef.current.size > 200) {
        const threshold = now - DEDUPE_WINDOW_MS * 2;
        for (const [key, at] of dedupeRef.current) {
          if (at < threshold) {
            dedupeRef.current.delete(key);
          }
        }
      }
    },
    [dismissToast],
  );

  useEffect(() => {
    const timers = timersRef.current;
    const dedupe = dedupeRef.current;
    return () => {
      for (const timer of timers.values()) {
        clearTimeout(timer);
      }
      timers.clear();
      dedupe.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
