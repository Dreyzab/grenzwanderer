import { DbConnection } from "../src/shared/spacetime/bindings";
import {
  normalizeContentReleaseProfile,
  type ContentReleaseProfile,
} from "./content-authoring-contract";
import type { ContentTargetCliOptions } from "./content-cli";
import {
  formatContentTarget,
  parseContentTargetArgs,
  readArg,
} from "./content-cli";
import {
  loadManifestForProfile,
  readSnapshotForProfile,
  saveManifest,
  upsertRelease,
} from "./content-manifest";
import {
  ensureAdminAccess,
  getOperatorToken,
  persistOperatorToken,
} from "./spacetime-operator";

const SEMVER_RE = /^\d+\.\d+\.\d+$/;

interface CliOptions extends ContentTargetCliOptions {
  profile: ContentReleaseProfile;
  version: string;
}

const usage = () => {
  console.error(
    "Usage: bun run content:release -- --version <X.Y.Z> [--profile default|karlsruhe_event] [--server local|maincloud] [--db <name>] [--host <uri>]",
  );
};

const parseCli = (): CliOptions => {
  const args = process.argv.slice(2);
  const version = readArg(args, "--version");
  if (!version || !SEMVER_RE.test(version)) {
    usage();
    throw new Error("The --version argument must use semver format X.Y.Z");
  }

  return {
    profile: normalizeContentReleaseProfile(
      readArg(args, "--profile") ?? undefined,
    ),
    version,
    ...parseContentTargetArgs(args, usage),
  };
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
      .onConnect(async (conn, identity, token) => {
        try {
          console.log(
            `ℹ️ INFO Connected as Identity: ${identity.toHexString()}`,
          );
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
  const snapshot = readSnapshotForProfile(cli.profile);
  const version = `content-v${cli.version}+${snapshot.checksum.slice(0, 8)}`;

  await publishContent(
    cli.host,
    cli.database,
    version,
    snapshot.checksum,
    snapshot.schemaVersion,
    snapshot.payloadJson,
  );

  const manifest = loadManifestForProfile(cli.profile);
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
  saveManifest(updated, cli.profile);

  console.log("Content release published.");
  console.log(`Version: ${version}`);
  console.log(`Checksum: ${snapshot.checksum}`);
  console.log(`Target: ${formatContentTarget(cli)}`);
};

main().catch((error) => {
  console.error("content:release failed:", error);
  process.exitCode = 1;
});
