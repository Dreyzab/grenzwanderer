import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { captureMonitoringException } from "../monitoring/sentry";
import {
  readStoredUiLanguage,
  inferBrowserUiLanguage,
} from "../hooks/useUiLanguage";
import { getErrorBoundaryStrings } from "../../features/i18n/uiStrings";

type ErrorBoundaryFallbackArgs = {
  boundaryId: string;
  error: Error;
  reset: () => void;
};

type ErrorBoundaryFallback =
  | ReactNode
  | ((args: ErrorBoundaryFallbackArgs) => ReactNode);

interface ErrorBoundaryProps {
  boundaryId: string;
  children: ReactNode;
  fallback?: ErrorBoundaryFallback;
  onReset?: () => void;
  resetKeys?: readonly unknown[];
}

interface ErrorBoundaryState {
  error: Error | null;
}

const normalizeError = (error: unknown): Error =>
  error instanceof Error ? error : new Error(String(error));

const resetKeysChanged = (
  previous: readonly unknown[] = [],
  next: readonly unknown[] = [],
): boolean => {
  if (previous.length !== next.length) {
    return true;
  }
  return previous.some((value, index) => !Object.is(value, next[index]));
};

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { error: normalizeError(error) };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    captureMonitoringException(error, {
      boundary: this.props.boundaryId,
      component_stack_present: String((info.componentStack?.length ?? 0) > 0),
      stage: "react_error_boundary",
    });
  }

  componentDidUpdate(previousProps: ErrorBoundaryProps): void {
    if (
      this.state.error &&
      resetKeysChanged(previousProps.resetKeys, this.props.resetKeys)
    ) {
      this.setState({ error: null });
    }
  }

  private reset = (): void => {
    this.props.onReset?.();
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { boundaryId, children, fallback } = this.props;
    const { error } = this.state;

    if (!error) {
      return children;
    }

    if (typeof fallback === "function") {
      return fallback({ boundaryId, error, reset: this.reset });
    }

    if (fallback !== undefined) {
      return fallback;
    }

    const lang = readStoredUiLanguage() || inferBrowserUiLanguage();
    const errStrings = getErrorBoundaryStrings(lang);

    return (
      <div
        className="mx-auto flex min-h-[18rem] w-full max-w-2xl flex-col items-center justify-center gap-4 px-6 py-10 text-center text-stone-100"
        role="alert"
      >
        <div>
          <h2 className="text-xl font-semibold">{errStrings.title}</h2>
          <p className="mt-2 text-sm text-stone-300">{errStrings.subtitle}</p>
        </div>
        <button
          className="rounded-md border border-stone-500/70 px-4 py-2 text-sm font-medium text-stone-100 transition hover:border-stone-200 hover:bg-stone-800"
          type="button"
          onClick={this.reset}
        >
          {errStrings.retry}
        </button>
      </div>
    );
  }
}
