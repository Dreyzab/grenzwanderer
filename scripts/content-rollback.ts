import { DbConnection } from "../src/shared/spacetime/bindings";
import type { ContentTargetCliOptions } from "./content-cli";
import {
  formatContentTarget,
  parseContentTargetArgs,
  readArg,
} from "./content-cli";
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

interface CliOptions extends ContentTargetCliOptions {
  checksum: string;
}

const usage = () => {
  console.error(
    "Usage: bun run content:rollback -- --checksum <sha256> [--server local|maincloud] [--db <name>] [--host <uri>]",
  );
};

const parseCli = (): CliOptions => {
  const args = process.argv.slice(2);
  const checksum = readArg(args, "--checksum");
  if (!checksum) {
    usage();
    throw new Error("The --checksum argument is required");
  }
  assertSha256(checksum, "--checksum");

  return { checksum, ...parseContentTargetArgs(args, usage) };
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
  console.log(`Target: ${formatContentTarget(cli)}`);
};

main().catch((error) => {
  console.error("content:rollback failed:", error);
  process.exitCode = 1;
});
