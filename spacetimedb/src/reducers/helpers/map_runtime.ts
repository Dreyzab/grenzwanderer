import { Timestamp } from "spacetimedb";
import { SenderError } from "spacetimedb/server";

import { parseVnSnapshotPayload } from "../../../../src/shared/vn-contract";
import { createMapEventKey } from "./map_keys";
import { ensurePlayerProfile } from "./player_profile";
import { emitTelemetry } from "./telemetry";
import type { MapEventTemplate, MapPoint, VnSnapshot } from "./types";

const parseSnapshotPayloadForMap = (payloadJson: string): VnSnapshot => {
  const result = parseVnSnapshotPayload(payloadJson);
  if (!result.ok) {
    throw new SenderError(
      result.issues
        .map((issue) => `${issue.path}: ${issue.message}`)
        .join("; "),
    );
  }

  return result.snapshot as VnSnapshot;
};

const getActiveSnapshotForMap = (
  ctx: any,
): { activeVersion: any; snapshot: VnSnapshot } => {
  const activeVersion = [...ctx.db.contentVersion.iter()].find(
    (row: any) => row.isActive,
  );
  if (!activeVersion) {
    throw new SenderError("No active content version");
  }

  const snapshotRow = ctx.db.contentSnapshot.checksum.find(
    activeVersion.checksum,
  );
  if (!snapshotRow) {
    throw new SenderError("Active content snapshot is missing");
  }

  return {
    activeVersion,
    snapshot: parseSnapshotPayloadForMap(snapshotRow.payloadJson),
  };
};

const MAP_EVENT_STATUS_ACTIVE = "active";
const MAP_EVENT_STATUS_EXPIRED = "expired";
const MAP_EVENT_STATUS_RESOLVED = "resolved";

const isExpiredAt = (timestamp: Timestamp, now: Timestamp): boolean =>
  timestamp.microsSinceUnixEpoch <= now.microsSinceUnixEpoch;

const asRecord = (
  value: unknown,
  fieldName: string,
): Record<string, unknown> => {
  if (!value || typeof value !== "object") {
    throw new SenderError(`${fieldName} must be an object`);
  }

  return value as Record<string, unknown>;
};

/** Validates shape needed for persisted map events (local guard, no heavy type barrel). */
const isStoredMapEventPoint = (value: unknown): value is MapPoint => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const point = value as Record<string, unknown>;
  return (
    typeof point.id === "string" &&
    typeof point.title === "string" &&
    typeof point.regionId === "string" &&
    typeof point.lat === "number" &&
    Number.isFinite(point.lat) &&
    typeof point.lng === "number" &&
    Number.isFinite(point.lng) &&
    typeof point.locationId === "string" &&
    point.category === "EPHEMERAL" &&
    Array.isArray(point.bindings)
  );
};

export const parseStoredMapEventPayload = (
  payloadJson: string,
): { point: MapPoint } => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(payloadJson);
  } catch (_error) {
    throw new SenderError("map event payloadJson must be valid JSON");
  }

  const payload = asRecord(parsed, "map event payloadJson");
  if (!isStoredMapEventPoint(payload.point)) {
    throw new SenderError("map event payloadJson has invalid shape");
  }

  return {
    point: payload.point as MapPoint,
  };
};

const resolveMapEventTemplate = (
  snapshot: VnSnapshot,
  templateId: string,
): MapEventTemplate => {
  const template = snapshot.map?.mapEventTemplates?.find(
    (entry) => entry.id === templateId,
  );
  if (!template) {
    throw new SenderError(`Unknown map event template: ${templateId}`);
  }

  return template;
};

const resolveMapEventTtlMinutes = (
  snapshot: VnSnapshot,
  template: MapEventTemplate,
  ttlMinutes?: number,
): number => {
  const resolved =
    ttlMinutes ??
    template.ttlMinutes ??
    snapshot.map?.testDefaults?.defaultEventTtlMinutes ??
    15;

  if (!Number.isFinite(resolved) || resolved <= 0) {
    throw new SenderError("map event ttlMinutes must be a positive number");
  }

  return resolved;
};

export const cleanupExpiredMapEvents = (ctx: any): void => {
  const playerEvents = ctx.db.playerMapEvent.player_map_event_player_id.filter(
    ctx.sender,
  );
  for (const row of playerEvents) {
    if (row.status !== MAP_EVENT_STATUS_ACTIVE) {
      continue;
    }
    if (!isExpiredAt(row.expiresAt, ctx.timestamp)) {
      continue;
    }

    ctx.db.playerMapEvent.eventId.update({
      ...row,
      status: MAP_EVENT_STATUS_EXPIRED,
      resolvedAt: undefined,
    });
  }
};

export const listPlayerMapEvents = (ctx: any): any[] => [
  ...ctx.db.playerMapEvent.player_map_event_player_id.filter(ctx.sender),
];

export const getPlayerActiveMapEventByEventId = (
  ctx: any,
  eventId: string,
): any | null => {
  const row = ctx.db.playerMapEvent.eventId.find(eventId);
  if (!row || row.playerId.toHexString() !== ctx.sender.toHexString()) {
    return null;
  }
  if (row.status !== MAP_EVENT_STATUS_ACTIVE) {
    return null;
  }
  if (isExpiredAt(row.expiresAt, ctx.timestamp)) {
    return null;
  }
  return row;
};

export const markMapEventResolved = (ctx: any, eventId: string): void => {
  const existing = ctx.db.playerMapEvent.eventId.find(eventId);
  if (
    !existing ||
    existing.playerId.toHexString() !== ctx.sender.toHexString()
  ) {
    return;
  }
  if (existing.status !== MAP_EVENT_STATUS_ACTIVE) {
    return;
  }

  ctx.db.playerMapEvent.eventId.update({
    ...existing,
    status: MAP_EVENT_STATUS_RESOLVED,
    resolvedAt: ctx.timestamp,
  });
};

export const spawnMapEventInternal = (
  ctx: any,
  templateId: string,
  options?: {
    ttlMinutes?: number;
    sourceLocationId?: string;
    snapshot?: VnSnapshot;
    snapshotChecksum?: string;
    skipCleanup?: boolean;
  },
): any => {
  ensurePlayerProfile(ctx);
  if (!options?.skipCleanup) {
    cleanupExpiredMapEvents(ctx);
  }

  const activeSnapshot =
    options?.snapshot && options?.snapshotChecksum
      ? {
          snapshot: options.snapshot,
          activeVersion: { checksum: options.snapshotChecksum },
        }
      : getActiveSnapshotForMap(ctx);
  const template = resolveMapEventTemplate(activeSnapshot.snapshot, templateId);

  const existingActive = listPlayerMapEvents(ctx).find(
    (row) =>
      row.templateId === templateId &&
      row.status === MAP_EVENT_STATUS_ACTIVE &&
      !isExpiredAt(row.expiresAt, ctx.timestamp),
  );
  if (existingActive) {
    return existingActive;
  }

  const ttlMinutes = resolveMapEventTtlMinutes(
    activeSnapshot.snapshot,
    template,
    options?.ttlMinutes,
  );
  const ttlMicros = BigInt(Math.round(ttlMinutes * 60 * 1_000_000));
  let attempt = 0;
  let eventId = createMapEventKey(
    ctx.sender,
    templateId,
    ctx.timestamp.microsSinceUnixEpoch,
    attempt,
  );
  while (ctx.db.playerMapEvent.eventId.find(eventId)) {
    attempt += 1;
    eventId = createMapEventKey(
      ctx.sender,
      templateId,
      ctx.timestamp.microsSinceUnixEpoch,
      attempt,
    );
  }

  const row = {
    eventId,
    playerId: ctx.sender,
    templateId,
    snapshotChecksum: activeSnapshot.activeVersion.checksum,
    payloadJson: JSON.stringify({ point: template.point }),
    sourceLocationId: options?.sourceLocationId ?? template.point.locationId,
    status: MAP_EVENT_STATUS_ACTIVE,
    spawnedAt: ctx.timestamp,
    expiresAt: new Timestamp(ctx.timestamp.microsSinceUnixEpoch + ttlMicros),
    resolvedAt: undefined,
  };
  ctx.db.playerMapEvent.insert(row);
  emitTelemetry(ctx, "map_event_spawned", {
    templateId,
    eventId,
    sourceLocationId: row.sourceLocationId,
    snapshotChecksum: row.snapshotChecksum,
  });

  return row;
};
