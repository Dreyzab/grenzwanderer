import { SenderError, t } from "spacetimedb/server";
import spacetimedb from "../schema";
import { MIN_VN_SCHEMA_WITH_CONTRACT_METADATA } from "../../../src/shared/vn-contract";
import {
  deactivateContentVersions,
  emitTelemetry,
  ensureAdminIdentity,
  ensureIdempotent,
  parseSnapshotPayload,
  resetForSchemaMigration,
  syncMindPalaceContentTables,
} from "./helpers";

export const publish_content = spacetimedb.reducer(
  {
    requestId: t.string(),
    version: t.string(),
    checksum: t.string(),
    schemaVersion: t.u32(),
    payloadJson: t.string(),
  },
  (ctx, { requestId, version, checksum, schemaVersion, payloadJson }) => {
    ensureAdminIdentity(ctx, "publish content");

    if (!version || version.trim().length === 0) {
      throw new SenderError("version must not be empty");
    }
    if (!checksum || checksum.trim().length === 0) {
      throw new SenderError("checksum must not be empty");
    }

    ensureIdempotent(ctx, requestId, "publish_content");

    const snapshot = parseSnapshotPayload(payloadJson);
    if (snapshot.schemaVersion !== schemaVersion) {
      throw new SenderError(
        "schemaVersion argument does not match payloadJson",
      );
    }

    const activeVersion = [...ctx.db.contentVersion.iter()].find(
      (row) => row.isActive,
    );

    if (activeVersion && schemaVersion < activeVersion.schemaVersion) {
      throw new SenderError(
        "schemaVersion downgrade is not allowed through publish_content",
      );
    }

    if (activeVersion && activeVersion.schemaVersion !== schemaVersion) {
      resetForSchemaMigration(ctx);
    } else {
      deactivateContentVersions(ctx);
    }

    const existingSnapshot = ctx.db.contentSnapshot.checksum.find(checksum);
    if (existingSnapshot) {
      ctx.db.contentSnapshot.checksum.update({
        ...existingSnapshot,
        payloadJson,
        createdAt: ctx.timestamp,
      });
    } else {
      ctx.db.contentSnapshot.insert({
        checksum,
        payloadJson,
        createdAt: ctx.timestamp,
      });
    }

    const existingVersion = ctx.db.contentVersion.version.find(version);
    if (existingVersion) {
      ctx.db.contentVersion.version.update({
        ...existingVersion,
        checksum,
        schemaVersion,
        publishedAt: ctx.timestamp,
        isActive: true,
      });
    } else {
      ctx.db.contentVersion.insert({
        version,
        checksum,
        schemaVersion,
        publishedAt: ctx.timestamp,
        isActive: true,
      });
    }

    syncMindPalaceContentTables(ctx, snapshot);

    emitTelemetry(ctx, "content_published", {
      version,
      checksum,
      schemaVersion,
    });
  },
);

export const rollback_content = spacetimedb.reducer(
  {
    requestId: t.string(),
    targetChecksum: t.string(),
  },
  (ctx, { requestId, targetChecksum }) => {
    ensureAdminIdentity(ctx, "roll back content");

    if (!targetChecksum || targetChecksum.trim().length === 0) {
      throw new SenderError("targetChecksum must not be empty");
    }

    ensureIdempotent(ctx, requestId, "rollback_content");

    const targetVersion = [...ctx.db.contentVersion.iter()].find(
      (entry) => entry.checksum === targetChecksum,
    );
    if (!targetVersion) {
      throw new SenderError("targetChecksum is unknown");
    }

    const targetSnapshot = ctx.db.contentSnapshot.checksum.find(targetChecksum);
    if (!targetSnapshot) {
      throw new SenderError("targetChecksum snapshot is missing");
    }

    const snapshot = parseSnapshotPayload(targetSnapshot.payloadJson);
    if (snapshot.schemaVersion !== targetVersion.schemaVersion) {
      throw new SenderError(
        "targetChecksum schemaVersion does not match stored content version",
      );
    }

    deactivateContentVersions(ctx);

    ctx.db.contentVersion.version.update({
      ...targetVersion,
      isActive: true,
      publishedAt: ctx.timestamp,
    });

    syncMindPalaceContentTables(ctx, snapshot);

    emitTelemetry(ctx, "content_rolled_back", {
      version: targetVersion.version,
      targetChecksum,
      schemaVersion: targetVersion.schemaVersion,
      contractMetadata:
        snapshot.schemaVersion >= MIN_VN_SCHEMA_WITH_CONTRACT_METADATA,
    });
  },
);
