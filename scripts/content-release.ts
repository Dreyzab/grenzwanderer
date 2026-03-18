import { DbConnection } from "../src/shared/spacetime/bindings";
import type { ContentServer } from "./content-manifest";
import {
  loadManifest,
  readSnapshot,
  saveManifest,
  upsertRelease,
} from "./content-manifest";
import {
  ensureAdminAccess,
  getOperatorToken,
  persistOperatorToken,
} from "./spacetime-operator";

const SEMVER_RE = /^\d+\.\d+\.\d+$/;

interface CliOptions {
  version: string;
  server: ContentServer;
  host: string;
  database: string;
}

const usage = () => {
  console.error(
    "Usage: bun run content:release -- --version <X.Y.Z> [--server local|maincloud] [--db <name>] [--host <uri>]",
  );
};

const readArg = (args: string[], name: string): string | null => {
  const index = args.indexOf(name);
  if (index < 0 || index + 1 >= args.length) {
    return null;
  }
  return args[index + 1];
};

const getDefaultHost = (server: ContentServer): string =>
  server === "local"
    ? "ws://127.0.0.1:3000"
    : "https://maincloud.spacetimedb.com";

const parseCli = (): CliOptions => {
  const args = process.argv.slice(2);
  const version = readArg(args, "--version");
  if (!version || !SEMVER_RE.test(version)) {
    usage();
    throw new Error("The --version argument must use semver format X.Y.Z");
  }

  const serverRaw = readArg(args, "--server") ?? "local";
  if (serverRaw !== "local" && serverRaw !== "maincloud") {
    usage();
    throw new Error("--server must be either local or maincloud");
  }
  const server = serverRaw as ContentServer;

  const database =
    readArg(args, "--db") ??
    process.env.SPACETIMEDB_DB_NAME ??
    process.env.VITE_SPACETIMEDB_DB_NAME ??
    "grezwandererdata";
  const host = readArg(args, "--host") ?? getDefaultHost(server);

  return { version, server, host, database };
};

const nextRequestId = (): string =>
  `content_release_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;

const publishContent = async (
  host: string,
  database: string,
  version: string,
  checksum: string,
  schemaVersion: number,
  payloadJson: string,
): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    let finished = false;
    const builder = DbConnection.builder()
      .withUri(host)
      .withDatabaseName(database)
      .withToken(getOperatorToken(host, database))
      .onConnect(async (conn, _identity, token) => {
        try {
          persistOperatorToken(host, database, token);
          await ensureAdminAccess(conn);
          await conn.reducers.publishContent({
            requestId: nextRequestId(),
            version,
            checksum,
            schemaVersion,
            payloadJson,
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
  const cli = parseCli();
  const snapshot = readSnapshot();
  const version = `content-v${cli.version}+${snapshot.checksum.slice(0, 8)}`;

  await publishContent(
    cli.host,
    cli.database,
    version,
    snapshot.checksum,
    snapshot.schemaVersion,
    snapshot.payloadJson,
  );

  const manifest = loadManifest();
  const updated = upsertRelease(manifest, {
    version,
    checksum: snapshot.checksum,
    schemaVersion: snapshot.schemaVersion,
    generatedAt: snapshot.generatedAt,
    publishedAt: new Date().toISOString(),
    target: {
      server: cli.server,
      host: cli.host,
      database: cli.database,
    },
  });
  saveManifest(updated);

  console.log("Content release published.");
  console.log(`Version: ${version}`);
  console.log(`Checksum: ${snapshot.checksum}`);
  console.log(`Target: ${cli.server} (${cli.host}) db=${cli.database}`);
};

main().catch((error) => {
  console.error("content:release failed:", error);
  process.exitCode = 1;
});
