import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { DbConnection } from "../src/shared/spacetime/bindings";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const OPERATOR_TOKEN_ENV = "SPACETIMEDB_OPERATOR_TOKEN";
const ALT_OPERATOR_TOKEN_ENV = "STDB_OPERATOR_TOKEN";
const OPERATOR_TOKEN_FILE_ENV = "SPACETIMEDB_OPERATOR_TOKEN_FILE";

const defaultTokenPath = (host: string, database: string): string => {
  const hostHash = createHash("sha1").update(host).digest("hex").slice(0, 12);
  return path.join(
    repoRoot,
    ".spacetime",
    `${database}-${hostHash}.operator-token`,
  );
};

const resolveTokenPath = (host: string, database: string): string =>
  process.env[OPERATOR_TOKEN_FILE_ENV] || defaultTokenPath(host, database);

export const getOperatorToken = (
  host: string,
  database: string,
): string | undefined => {
  const envToken =
    process.env[OPERATOR_TOKEN_ENV]?.trim() ||
    process.env[ALT_OPERATOR_TOKEN_ENV]?.trim();
  if (envToken) {
    return envToken;
  }

  const tokenPath = resolveTokenPath(host, database);
  if (!existsSync(tokenPath)) {
    return undefined;
  }

  const token = readFileSync(tokenPath, "utf8").trim();
  return token.length > 0 ? token : undefined;
};

export const persistOperatorToken = (
  host: string,
  database: string,
  token: string,
): void => {
  if (process.env[OPERATOR_TOKEN_ENV]) {
    return;
  }

  const tokenPath = resolveTokenPath(host, database);
  mkdirSync(path.dirname(tokenPath), { recursive: true });
  writeFileSync(tokenPath, `${token}\n`, "utf8");
};

export const connectOperatorConnection = async (
  host: string,
  database: string,
  token: string | undefined = getOperatorToken(host, database),
): Promise<DbConnection> =>
  new Promise<DbConnection>((resolve, reject) => {
    let settled = false;
    const builder = DbConnection.builder()
      .withUri(host)
      .withDatabaseName(database);
    if (token) {
      builder.withToken(token);
    }

    builder
      .onConnect((conn, _identity, nextToken) => {
        persistOperatorToken(host, database, nextToken);
        settled = true;
        resolve(conn);
      })
      .onConnectError((_ctx, error) => {
        reject(error);
      })
      .onDisconnect((_ctx, error) => {
        if (!settled && error) {
          reject(error);
        }
      })
      .build();
  });

export const ensureAdminAccess = async (conn: DbConnection): Promise<void> => {
  const { identity } = conn;
  if (!identity) {
    throw new Error("Connection identity is not available");
  }

  // First, try to bootstrap if the database has no admins yet.
  // This will fail silently if admins already exist (it's gated in the reducer).
  try {
    await conn.reducers.bootstrapAdminIdentity({});
  } catch (_error) {
    // Ignore error if already bootstrapped.
  }

  // Then ensure this specific identity is an admin.
  // This is idempotent for an existing admin.
  await conn.reducers.grantAdminIdentity({ identity });
};

export const ensureWorkerAccess = async (conn: DbConnection): Promise<void> => {
  const identity = conn.identity;
  if (!identity) {
    throw new Error("Connection identity is not available");
  }

  await ensureAdminAccess(conn);
  await conn.reducers.allowWorkerIdentity({ identity });
  await conn.reducers.registerWorkerIdentity({});
};
