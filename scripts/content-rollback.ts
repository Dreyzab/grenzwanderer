import { DbConnection } from "../src/shared/spacetime/bindings";
import type { ContentServer } from "./content-manifest";
import {
  appendRollback,
  assertSha256,
  loadManifest,
  saveManifest,
} from "./content-manifest";
import {
  ensureAdminAccess,
  getOperatorToken,
  persistOperatorToken,
} from "./spacetime-operator";

interface CliOptions {
  checksum: string;
  server: ContentServer;
  host: string;
  database: string;
}

const usage = () => {
  console.error(
    "Usage: bun run content:rollback -- --checksum <sha256> [--server local|maincloud] [--db <name>] [--host <uri>]",
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
  const checksum = readArg(args, "--checksum");
  if (!checksum) {
    usage();
    throw new Error("The --checksum argument is required");
  }
  assertSha256(checksum, "--checksum");

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

  return { checksum, server, host, database };
};

const nextRequestId = (): string =>
  `content_rollback_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;

const rollbackContent = async (
  host: string,
  database: string,
  checksum: string,
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
          await conn.reducers.rollbackContent({
            requestId: nextRequestId(),
            targetChecksum: checksum,
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

  await rollbackContent(cli.host, cli.database, cli.checksum);

  const manifest = loadManifest();
  const updated = appendRollback(manifest, {
    checksum: cli.checksum,
    rolledBackAt: new Date().toISOString(),
    target: {
      server: cli.server,
      host: cli.host,
      database: cli.database,
    },
  });
  saveManifest(updated);

  console.log("Content rollback applied.");
  console.log(`Checksum: ${cli.checksum}`);
  console.log(`Target: ${cli.server} (${cli.host}) db=${cli.database}`);
};

main().catch((error) => {
  console.error("content:rollback failed:", error);
  process.exitCode = 1;
});
