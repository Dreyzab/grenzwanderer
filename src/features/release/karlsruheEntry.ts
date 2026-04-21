import {
  KARLSRUHE_ENTRY_TOKEN,
  RELEASE_PROFILE,
  SPACETIMEDB_DB_NAME,
} from "../../config";
import type { ReleaseProfile } from "./types";

export const KARLSRUHE_EVENT_PATHNAME = "/karlsruhe";
export const KARLSRUHE_EVENT_ARRIVAL_SCENARIO_ID = "karlsruhe_event_arrival";
export const KARLSRUHE_EVENT_ARRIVAL_COMPLETE_FLAG =
  "karlsruhe_arrival_complete";

export interface KarlsruheSessionGrant {
  releaseProfile: ReleaseProfile;
  databaseName: string;
  grantedAt: string;
}

const hasWindow = (): boolean => typeof window !== "undefined";

export const isKarlsruheEventProfile = (
  profile: ReleaseProfile = RELEASE_PROFILE,
): boolean => profile === "karlsruhe_event";

export const getKarlsruheGrantStorageKey = (
  profile: ReleaseProfile = RELEASE_PROFILE,
  databaseName: string = SPACETIMEDB_DB_NAME,
): string => `grenzwanderer::karlsruhe-grant::${profile}::${databaseName}`;

export const readKarlsruheGrant = (
  storageKey: string = getKarlsruheGrantStorageKey(),
): KarlsruheSessionGrant | null => {
  if (!hasWindow()) {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(storageKey);
    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue) as KarlsruheSessionGrant;
    if (
      !parsed ||
      parsed.releaseProfile !== "karlsruhe_event" ||
      typeof parsed.databaseName !== "string" ||
      typeof parsed.grantedAt !== "string"
    ) {
      return null;
    }

    return parsed;
  } catch (_error) {
    return null;
  }
};

export const writeKarlsruheGrant = (
  storageKey: string = getKarlsruheGrantStorageKey(),
  grant: KarlsruheSessionGrant = {
    releaseProfile: "karlsruhe_event",
    databaseName: SPACETIMEDB_DB_NAME,
    grantedAt: new Date().toISOString(),
  },
): void => {
  if (!hasWindow()) {
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(grant));
};

export const clearKarlsruheGrant = (
  storageKey: string = getKarlsruheGrantStorageKey(),
): void => {
  if (!hasWindow()) {
    return;
  }

  window.localStorage.removeItem(storageKey);
};

export const getKarlsruheEntryTokenFromSearch = (
  search: string,
): string | undefined => {
  const params = new URLSearchParams(search);
  const entryToken = params.get("entry")?.trim();
  return entryToken && entryToken.length > 0 ? entryToken : undefined;
};

export const matchesKarlsruheEntryToken = (entryToken?: string): boolean => {
  if (!entryToken) {
    return false;
  }
  if (!KARLSRUHE_ENTRY_TOKEN) {
    return true;
  }
  return entryToken === KARLSRUHE_ENTRY_TOKEN;
};
