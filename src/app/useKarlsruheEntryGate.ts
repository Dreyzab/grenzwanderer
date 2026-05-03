import { useEffect, useMemo, useRef, useState } from "react";
import { useReducer, useTable } from "spacetimedb/react";
import {
  KARLSRUHE_EVENT_ARRIVAL_COMPLETE_FLAG,
  KARLSRUHE_EVENT_ARRIVAL_SCENARIO_ID,
  KARLSRUHE_EVENT_PATHNAME,
  clearKarlsruheGrant,
  getKarlsruheGrantStorageKey,
  matchesKarlsruheEntryToken,
  readKarlsruheGrant,
  writeKarlsruheGrant,
} from "../features/release/karlsruheEntry";
import type { EntryGateState, ReleaseProfile } from "../features/release/types";
import type { TabId } from "../shared/navigation/shellNavigationTypes";
import { reducers, tables } from "../shared/spacetime/bindings";
import { coerceTabForProfile } from "./shellTabs";

const hasOptionalValue = (value: unknown): boolean => {
  if (value === undefined || value === null) {
    return false;
  }

  if (typeof value === "object" && value !== null && "tag" in value) {
    const tagged = value as { tag?: string };
    return tagged.tag === "some";
  }

  return true;
};

interface FlagRow {
  key: string;
  value: boolean;
}

interface VnSessionRow {
  scenarioId: string;
  completedAt?: unknown;
}

interface KarlsruheEntryGateOptions {
  activeTab: TabId;
  dbName: string;
  entryToken?: string;
  identityHex: string;
  isKarlsruheProfile: boolean;
  pathname: string;
  profile: ReleaseProfile;
  setActiveTab: (tab: TabId) => void;
  setEntryToken: (entryToken: string | undefined) => void;
  setVnScenarioId: (scenarioId: string | undefined) => void;
  vnScenarioId?: string;
}

export const useKarlsruheEntryGate = ({
  activeTab,
  dbName,
  entryToken,
  identityHex,
  isKarlsruheProfile,
  pathname,
  profile,
  setActiveTab,
  setEntryToken,
  setVnScenarioId,
  vnScenarioId,
}: KarlsruheEntryGateOptions) => {
  const [vnSessions] = useTable(tables.myVnSessions);
  const [flagsRows] = useTable(tables.myPlayerFlags);
  const beginKarlsruheEventEntry = useReducer(
    reducers.beginKarlsruheEventEntry,
  );
  const grantStorageKey = useMemo(
    () => getKarlsruheGrantStorageKey(profile, dbName),
    [dbName, profile],
  );
  const [hasKarlsruheGrant, setHasKarlsruheGrant] = useState(() =>
    Boolean(readKarlsruheGrant(grantStorageKey)),
  );
  const [entryGateState, setEntryGateState] =
    useState<EntryGateState>("scan_required");
  const [entryGateError, setEntryGateError] = useState<string | null>(null);
  const validatedEntryTokenRef = useRef<string | null>(null);

  const activeVnSession = useMemo(
    () =>
      (vnSessions as readonly VnSessionRow[]).find(
        (row) => !hasOptionalValue(row.completedAt),
      ) ?? null,
    [vnSessions],
  );

  const playerFlags = useMemo(() => {
    const result: Record<string, boolean> = {};
    for (const row of flagsRows as readonly FlagRow[]) {
      result[row.key] = row.value;
    }
    return result;
  }, [flagsRows]);

  const karlsruheArrivalComplete = Boolean(
    playerFlags[KARLSRUHE_EVENT_ARRIVAL_COMPLETE_FLAG],
  );

  useEffect(() => {
    const refreshGrant = () => {
      setHasKarlsruheGrant(Boolean(readKarlsruheGrant(grantStorageKey)));
    };

    window.addEventListener("popstate", refreshGrant);
    return () => window.removeEventListener("popstate", refreshGrant);
  }, [grantStorageKey]);

  useEffect(() => {
    if (!isKarlsruheProfile) {
      return;
    }

    if (pathname !== KARLSRUHE_EVENT_PATHNAME) {
      setEntryGateError(null);
      setEntryGateState("scan_required");
      validatedEntryTokenRef.current = null;
      return;
    }

    if (entryToken) {
      if (!matchesKarlsruheEntryToken(entryToken)) {
        clearKarlsruheGrant(grantStorageKey);
        setHasKarlsruheGrant(false);
        setEntryGateState("denied");
        setEntryGateError("The supplied Karlsruhe event token is not valid.");
        validatedEntryTokenRef.current = null;
        return;
      }

      if (!identityHex) {
        setEntryGateState("validating");
        setEntryGateError(null);
        return;
      }

      if (validatedEntryTokenRef.current === entryToken) {
        return;
      }

      validatedEntryTokenRef.current = entryToken;
      setEntryGateState("validating");
      setEntryGateError(null);

      void beginKarlsruheEventEntry({
        requestId: `karlsruhe_entry_${Date.now()}_${Math.floor(
          Math.random() * 1_000_000,
        )}`,
        entryToken,
      })
        .then(() => {
          writeKarlsruheGrant(grantStorageKey);
          setHasKarlsruheGrant(true);
          setEntryGateState("granted");
          setEntryToken(undefined);
        })
        .catch((error) => {
          const message =
            error instanceof Error
              ? error.message
              : "Unable to validate Karlsruhe event access.";
          clearKarlsruheGrant(grantStorageKey);
          setHasKarlsruheGrant(false);
          setEntryGateState("denied");
          setEntryGateError(message);
          validatedEntryTokenRef.current = null;
        });
      return;
    }

    if (hasKarlsruheGrant) {
      setEntryGateError(null);
      setEntryGateState("granted");
      return;
    }

    setEntryGateError(null);
    setEntryGateState("scan_required");
  }, [
    beginKarlsruheEventEntry,
    entryToken,
    grantStorageKey,
    hasKarlsruheGrant,
    identityHex,
    isKarlsruheProfile,
    pathname,
    setEntryToken,
  ]);

  useEffect(() => {
    if (
      !isKarlsruheProfile ||
      pathname !== KARLSRUHE_EVENT_PATHNAME ||
      entryGateState !== "granted"
    ) {
      return;
    }

    if (activeVnSession) {
      if (vnScenarioId !== activeVnSession.scenarioId) {
        setVnScenarioId(activeVnSession.scenarioId);
      }
      if (activeTab !== "vn") {
        setActiveTab("vn");
      }
      return;
    }

    if (!karlsruheArrivalComplete) {
      if (vnScenarioId !== KARLSRUHE_EVENT_ARRIVAL_SCENARIO_ID) {
        setVnScenarioId(KARLSRUHE_EVENT_ARRIVAL_SCENARIO_ID);
      }
      if (activeTab !== "vn") {
        setActiveTab("vn");
      }
      return;
    }

    const safeTab = coerceTabForProfile(activeTab, profile, vnScenarioId);
    if (safeTab !== activeTab) {
      setActiveTab(safeTab);
    }
  }, [
    activeTab,
    activeVnSession,
    entryGateState,
    isKarlsruheProfile,
    karlsruheArrivalComplete,
    pathname,
    profile,
    setActiveTab,
    setVnScenarioId,
    vnScenarioId,
  ]);

  return {
    entryGateState,
    entryGateError,
    hasKarlsruheGrant,
    isEntryGateBlocking:
      isKarlsruheProfile &&
      (pathname !== KARLSRUHE_EVENT_PATHNAME || entryGateState !== "granted"),
  };
};
