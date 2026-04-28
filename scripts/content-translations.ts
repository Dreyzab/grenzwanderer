import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { DbConnection } from "../src/shared/spacetime/bindings";
import type { ContentTargetCliOptions } from "./content-cli";
import {
  formatContentTarget,
  parseContentTargetArgs,
  readArg,
} from "./content-cli";
import {
  ensureAdminAccess,
  getOperatorToken,
  persistOperatorToken,
} from "./spacetime-operator";

type TranslationInput = {
  key: string;
  lang: string;
  text: string;
};

const localesDir = path.join(
  process.cwd(),
  "src",
  "features",
  "i18n",
  "locales",
);

const usage = () => {
  console.error(
    "Usage: bun run content:translations:publish -- [--locales <path>] [--server local|maincloud] [--db <name>] [--host <uri>]",
  );
};

const flattenSection = (
  lang: string,
  prefix: string,
  section: unknown,
): TranslationInput[] => {
  if (!section || typeof section !== "object" || Array.isArray(section)) {
    return [];
  }

  const rows: TranslationInput[] = [];
  for (const [key, value] of Object.entries(section)) {
    if (typeof value !== "string") {
      continue;
    }
    const contentKey = key.startsWith(`${prefix}.`) ? key : `${prefix}.${key}`;
    rows.push({ lang, key: contentKey, text: value });
  }
  return rows;
};

export const readLocaleTranslations = (
  root = localesDir,
): TranslationInput[] => {
  const translations: TranslationInput[] = [];
  for (const fileName of readdirSync(root)) {
    if (!fileName.endsWith(".json")) {
      continue;
    }

    const lang = path.basename(fileName, ".json");
    if (lang === "en") {
      continue;
    }

    const parsed = JSON.parse(readFileSync(path.join(root, fileName), "utf8"));
    translations.push(
      ...flattenSection(lang, "speaker", parsed.speakers),
      ...flattenSection(lang, "stat", parsed.stats),
      ...flattenSection(lang, "vn", parsed.vn),
      ...flattenSection(lang, "origin", parsed.origin),
    );
  }

  return translations;
};

const nextRequestId = (): string =>
  `content_translations_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;

export const publishTranslations = async (
  target: Pick<ContentTargetCliOptions, "host" | "database">,
  translations: readonly TranslationInput[],
): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    let finished = false;
    const builder = DbConnection.builder()
      .withUri(target.host)
      .withDatabaseName(target.database)
      .withToken(getOperatorToken(target.host, target.database))
      .onConnect(async (conn, identity, token) => {
        try {
          console.log(`INFO Connected as Identity: ${identity.toHexString()}`);
          persistOperatorToken(target.host, target.database, token);
          await ensureAdminAccess(conn);
          await conn.reducers.updateTranslations({
            requestId: nextRequestId(),
            translationsJson: JSON.stringify(translations),
          });
          finished = true;
          conn.disconnect();
          resolve();
        } catch (error) {
          conn.disconnect();
          reject(error);
        }
      })
      .onConnectError((_ctx, error) => {
        reject(error);
      })
      .onDisconnect((_ctx, error) => {
        if (!finished && error) {
          reject(error);
        }
      });

    builder.build();
  });

const main = async (): Promise<void> => {
  const args = process.argv.slice(2);
  const target = parseContentTargetArgs(args, usage);
  const localeRoot = readArg(args, "--locales") ?? localesDir;
  const translations = readLocaleTranslations(localeRoot);

  await publishTranslations(target, translations);

  console.log("Content translations published.");
  console.log(`Rows: ${translations.length}`);
  console.log(`Target: ${formatContentTarget(target)}`);
};

if (import.meta.main) {
  main().catch((error) => {
    console.error("content:translations:publish failed:", error);
    process.exitCode = 1;
  });
}
