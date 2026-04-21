import { useEffect, useMemo, useState } from "react";
import { useTable } from "spacetimedb/react";
import { tables } from "../../../shared/spacetime/bindings";
import { useIdentity } from "../../../shared/spacetime/useIdentity";
import type { MapPointSnapshot } from "../../vn/types";

export interface ActiveMapEventPoint {
  eventId: string;
  templateId: string;
  snapshotChecksum: string;
  sourceLocationId: string;
  point: MapPointSnapshot;
  expiresAtMs: number;
}

export interface UseMapEphemeralStateResult {
  events: ActiveMapEventPoint[];
  isReady: boolean;
  nowMs: number;
}

const normalizeTimeToMillis = (value: unknown): number | null => {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "bigint") {
    return Number(value / 1000n);
  }
  if (
    value &&
    typeof value === "object" &&
    "microsSinceUnixEpoch" in value &&
    typeof value.microsSinceUnixEpoch === "bigint"
  ) {
    return Number(value.microsSinceUnixEpoch / 1000n);
  }
  return null;
};

const isMapPointPayload = (value: unknown): value is MapPointSnapshot => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const point = value as Record<string, unknown>;
  return (
    typeof point.id === "string" &&
    typeof point.title === "string" &&
    typeof point.regionId === "string" &&
    typeof point.lat === "number" &&
    typeof point.lng === "number" &&
    (point.category === "HUB" ||
      point.category === "PUBLIC" ||
      point.category === "SHADOW" ||
      point.category === "EPHEMERAL") &&
    typeof point.locationId === "string" &&
    Array.isArray(point.bindings)
  );
};

const parseEventPayload = (payloadJson: string): MapPointSnapshot | null => {
  try {
    const parsed = JSON.parse(payloadJson) as { point?: unknown };
    return isMapPointPayload(parsed.point) ? parsed.point : null;
  } catch (_error) {
    return null;
  }
};

export const useMapEphemeralState = (): UseMapEphemeralStateResult => {
  const { identityHex } = useIdentity();
  const [events, eventsReady] = useTable(tables.myMapEvents);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  const activeEvents = useMemo(() => {
    if (!identityHex) {
      return [] as ActiveMapEventPoint[];
    }

    return events
      .filter((row) => row.status === "active")
      .map((row) => {
        const point = parseEventPayload(row.payloadJson);
        const expiresAtMs = normalizeTimeToMillis(row.expiresAt);
        if (!point || expiresAtMs === null || expiresAtMs <= nowMs) {
          return null;
        }

        return {
          eventId: row.eventId,
          templateId: row.templateId,
          snapshotChecksum: row.snapshotChecksum,
          sourceLocationId: row.sourceLocationId,
          point,
          expiresAtMs,
        } satisfies ActiveMapEventPoint;
      })
      .filter((event): event is ActiveMapEventPoint => event !== null);
  }, [events, identityHex, nowMs]);

  return {
    events: activeEvents,
    isReady: eventsReady,
    nowMs,
  };
};
