import { useCallback, useMemo, useRef, useState } from "react";
import { parseTypedTextMarkup } from "../ui/TypedTextParser";
import type { TypedTextTokenState } from "../ui/TypedText";
import { lookupFact, type FactDefinition } from "../data/factRegistry";

export interface JournalToastData {
  id: number;
  fact: FactDefinition;
}

interface UseVnTutorialStateParams {
  narrativeText: string;
  isLetterOverlay: boolean;
  /** Already-discovered fact keys from SpacetimeDB rows. */
  discoveredFactKeys: Set<string>;
}

export function useVnTutorialState({
  narrativeText,
  isLetterOverlay,
  discoveredFactKeys,
}: UseVnTutorialStateParams) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [journalToast, setJournalToast] = useState<JournalToastData | null>(
    null,
  );
  const [recordingFactPayloads, setRecordingFactPayloads] = useState<
    ReadonlySet<string>
  >(() => new Set());
  const [recentlyDiscoveredFactPayloads, setRecentlyDiscoveredFactPayloads] =
    useState<ReadonlySet<string>>(() => new Set());
  const toastIdRef = useRef(0);
  const tooltipDismissedRef = useRef(false);

  const effectiveDiscoveredFactKeys = useMemo(() => {
    const keys = new Set(discoveredFactKeys);
    for (const payload of recentlyDiscoveredFactPayloads) {
      keys.add(payload);
    }
    return keys;
  }, [discoveredFactKeys, recentlyDiscoveredFactPayloads]);

  /** All fact token payloads present in the current narrative text. */
  const pendingTokenPayloads = useMemo(() => {
    if (!isLetterOverlay) return [];

    const segments = parseTypedTextMarkup(narrativeText);
    const payloads: string[] = [];

    for (const seg of segments) {
      if (
        seg.kind === "token" &&
        (seg.token.type === "fact" || seg.token.type === "lead")
      ) {
        const key = seg.token.payload.trim();
        if (key && !effectiveDiscoveredFactKeys.has(key)) {
          payloads.push(key);
        }
      }
    }
    return payloads;
  }, [narrativeText, isLetterOverlay, effectiveDiscoveredFactKeys]);

  const hasUndiscoveredTokens = pendingTokenPayloads.length > 0;

  const tokenStateByPayload = useMemo<
    Readonly<Record<string, TypedTextTokenState>>
  >(() => {
    const states: Record<string, TypedTextTokenState> = {};
    for (const payload of effectiveDiscoveredFactKeys) {
      states[payload] = "studied";
    }
    for (const payload of recordingFactPayloads) {
      states[payload] = "recording";
    }
    return states;
  }, [effectiveDiscoveredFactKeys, recordingFactPayloads]);

  /**
   * Called when the player tries to surface-tap (continue) on the letter.
   * Returns `true` if the tutorial intercepts the tap (shows tooltip).
   */
  const interceptContinue = useCallback((): boolean => {
    if (
      !isLetterOverlay ||
      !hasUndiscoveredTokens ||
      tooltipDismissedRef.current
    ) {
      return false;
    }
    setShowTooltip(true);
    return true;
  }, [isLetterOverlay, hasUndiscoveredTokens]);

  /** Dismiss the tooltip (e.g. after player clicks a token or taps away). */
  const dismissTooltip = useCallback(() => {
    setShowTooltip(false);
    tooltipDismissedRef.current = true;
  }, []);

  const startRecordingFact = useCallback((factPayload: string) => {
    const key = factPayload.trim();
    if (!key) return;
    setRecordingFactPayloads((current) => {
      if (current.has(key)) return current;
      const next = new Set(current);
      next.add(key);
      return next;
    });
  }, []);

  /** Show the journal entry toast for a discovered fact. */
  const showJournalToast = useCallback((factPayload: string) => {
    const key = factPayload.trim();
    if (!key) return;
    setRecordingFactPayloads((current) => {
      if (!current.has(key)) return current;
      const next = new Set(current);
      next.delete(key);
      return next;
    });
    setRecentlyDiscoveredFactPayloads((current) => {
      if (current.has(key)) return current;
      const next = new Set(current);
      next.add(key);
      return next;
    });

    const fact = lookupFact(key);
    if (!fact) return;

    toastIdRef.current += 1;
    setJournalToast({ id: toastIdRef.current, fact });

    // Auto-dismiss tooltip when a token is clicked
    setShowTooltip(false);
  }, []);

  const failRecordingFact = useCallback((factPayload: string) => {
    const key = factPayload.trim();
    if (!key) return;
    setRecordingFactPayloads((current) => {
      if (!current.has(key)) return current;
      const next = new Set(current);
      next.delete(key);
      return next;
    });
  }, []);

  /** Clear the journal toast (called after animation completes). */
  const clearJournalToast = useCallback(() => {
    setJournalToast(null);
  }, []);

  /** Reset tutorial state when leaving the letter node. */
  const resetTutorial = useCallback(() => {
    setShowTooltip(false);
    setJournalToast(null);
    setRecordingFactPayloads(new Set());
    tooltipDismissedRef.current = false;
  }, []);

  return {
    showTooltip,
    journalToast,
    hasUndiscoveredTokens,
    tokenStateByPayload,
    interceptContinue,
    dismissTooltip,
    startRecordingFact,
    showJournalToast,
    failRecordingFact,
    clearJournalToast,
    resetTutorial,
  };
}
