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

type ContentTranslationInput = {
  key: string;
  lang: string;
  text: string;
};

const SUPPORTED_TRANSLATION_LANGS = new Set(["ru", "de"]);

const parseTranslationsPayload = (
  translationsJson: string,
): ContentTranslationInput[] => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(translationsJson);
  } catch {
    throw new SenderError("translationsJson must be valid JSON");
  }

  if (!Array.isArray(parsed)) {
    throw new SenderError("translationsJson must be an array");
  }

  return parsed.map((entry, index) => {
    if (!entry || typeof entry !== "object") {
      throw new SenderError(`translation at index ${index} must be an object`);
    }
    const candidate = entry as Record<string, unknown>;
    const key = candidate.key;
    const lang = candidate.lang;
    const text = candidate.text;
    if (typeof key !== "string" || key.trim().length === 0) {
      throw new SenderError(`translation at index ${index} has invalid key`);
    }
    if (typeof lang !== "string" || !SUPPORTED_TRANSLATION_LANGS.has(lang)) {
      throw new SenderError(`translation at index ${index} has invalid lang`);
    }
    if (typeof text !== "string") {
      throw new SenderError(`translation at index ${index} has invalid text`);
    }
    return { key: key.trim(), lang, text };
  });
};

const translationId = (lang: string, key: string): string => `${lang}:${key}`;

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

export const update_translations = spacetimedb.reducer(
  {
    requestId: t.string(),
    translationsJson: t.string(),
  },
  (ctx, { requestId, translationsJson }) => {
    ensureAdminIdentity(ctx, "update translations");
    ensureIdempotent(ctx, requestId, "update_translations");

    const translations = parseTranslationsPayload(translationsJson);
    const deduped = new Map<string, ContentTranslationInput>();
    for (const translation of translations) {
      deduped.set(
        translationId(translation.lang, translation.key),
        translation,
      );
    }

    for (const [id, translation] of deduped) {
      const existing = ctx.db.contentTranslation.translationId.find(id);
      const row = {
        translationId: id,
        key: translation.key,
        lang: translation.lang,
        text: translation.text,
        updatedAt: ctx.timestamp,
      };

      if (existing) {
        ctx.db.contentTranslation.translationId.update(row);
      } else {
        ctx.db.contentTranslation.insert(row);
      }
    }

    emitTelemetry(ctx, "translations_updated", {
      count: String(deduped.size),
      langs: [...new Set([...deduped.values()].map((entry) => entry.lang))]
        .sort()
        .join(","),
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
