import { devLogger, isDevLoggerEnabled } from "./devLogger";

let installed = false;

const renderForLog = (value: unknown): string => {
  if (value instanceof Error) return `${value.name}: ${value.message}`;
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const describeButton = (el: Element): string => {
  const aria = el.getAttribute("aria-label");
  if (aria) return aria;
  const testId = el.getAttribute("data-testid");
  if (testId) return testId;
  const text = el.textContent?.replace(/\s+/g, " ").trim();
  if (text) return text.slice(0, 80);
  return el.tagName.toLowerCase();
};

export const installDevLogger = (): void => {
  if (installed) return;
  if (!isDevLoggerEnabled()) return;
  installed = true;

  void devLogger.hydrate();

  if (typeof window !== "undefined") {
    window.addEventListener("error", (event: ErrorEvent) => {
      devLogger.error(
        event.message || "Unhandled error",
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
        event.error?.stack,
      );
    });

    window.addEventListener(
      "unhandledrejection",
      (event: PromiseRejectionEvent) => {
        const reason = event.reason;
        const message =
          reason instanceof Error
            ? reason.message
            : typeof reason === "string"
              ? reason
              : "Unhandled promise rejection";
        const stack = reason instanceof Error ? reason.stack : undefined;
        devLogger.error(
          `[unhandledrejection] ${message}`,
          { reason: renderForLog(reason) },
          stack,
        );
      },
    );

    document.addEventListener(
      "click",
      (event) => {
        const target = event.target;
        if (!(target instanceof Element)) return;
        const button = target.closest(
          'button, [role="button"], a[href]',
        ) as Element | null;
        if (!button) return;
        devLogger.userAction(`click: ${describeButton(button)}`, {
          tag: button.tagName.toLowerCase(),
          testId: button.getAttribute("data-testid") || undefined,
          href: button.getAttribute("href") || undefined,
        });
      },
      { capture: true, passive: true },
    );
  }

  if (typeof console !== "undefined") {
    const original = console.error.bind(console);
    let inside = false;
    console.error = (...args: unknown[]) => {
      if (!inside) {
        inside = true;
        try {
          const message = args.map(renderForLog).join(" ").slice(0, 800);
          devLogger.error(
            `[console.error] ${message}`,
            args.length === 1 ? args[0] : args,
          );
        } catch {
          // ignore
        } finally {
          inside = false;
        }
      }
      original(...args);
    };
  }
};
