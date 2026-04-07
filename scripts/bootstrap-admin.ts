import {
  connectOperatorConnection,
  getOperatorToken,
} from "./spacetime-operator";

const DEFAULT_HOST = "ws://127.0.0.1:3000";
const DEFAULT_DATABASE = "grezwandererdata";

const usage = () => {
  console.error(
    "Usage: bun run bootstrap:admin -- [--host <uri>] [--db <name>]",
  );
};

const readArg = (args: string[], name: string): string | null => {
  const index = args.indexOf(name);
  if (index < 0 || index + 1 >= args.length) {
    return null;
  }

  return args[index + 1];
};

const main = async (): Promise<void> => {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    usage();
    return;
  }

  const host =
    readArg(args, "--host") ??
    process.env.OPS_STDB_HOST ??
    process.env.SPACETIMEDB_HOST ??
    process.env.VITE_SPACETIMEDB_HOST ??
    DEFAULT_HOST;
  const database =
    readArg(args, "--db") ??
    process.env.OPS_STDB_DB ??
    process.env.SPACETIMEDB_DB_NAME ??
    process.env.VITE_SPACETIMEDB_DB_NAME ??
    DEFAULT_DATABASE;
  const existingToken = getOperatorToken(host, database);
  const conn = await connectOperatorConnection(host, database, existingToken);

  try {
    await conn.reducers.bootstrapAdminIdentity({});
    const identityHex = conn.identity?.toHexString() ?? "unknown";
    console.log(
      `Bootstrapped admin identity ${identityHex} for ${host}/${database}.`,
    );
  } finally {
    conn.disconnect();
  }
};

main().catch((error) => {
  console.error("bootstrap:admin failed:", error);
  process.exitCode = 1;
});
