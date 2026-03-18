import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import {
  connectOperatorConnection,
  getOperatorToken,
} from "./spacetime-operator";

const DEFAULT_HOST = "ws://127.0.0.1:3000";
const DEFAULT_DATABASE = "grezwandererdata";

const usage = () => {
  console.error(
    "Usage: bun run bootstrap:admin -- [--host <uri>] [--db <name>] [--code <bootstrap-code>]",
  );
};

const readArg = (args: string[], name: string): string | null => {
  const index = args.indexOf(name);
  if (index < 0 || index + 1 >= args.length) {
    return null;
  }

  return args[index + 1];
};

const resolveBootstrapCode = async (args: string[]): Promise<string> => {
  const cliCode = readArg(args, "--code")?.trim();
  if (cliCode) {
    return cliCode;
  }

  const envCode = process.env.ADMIN_BOOTSTRAP_CODE?.trim();
  if (envCode) {
    return envCode;
  }

  const rl = createInterface({ input, output });
  try {
    const value = (await rl.question("Admin bootstrap code: ")).trim();
    if (!value) {
      throw new Error("Admin bootstrap code must not be empty");
    }
    return value;
  } finally {
    rl.close();
  }
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
  const bootstrapCode = await resolveBootstrapCode(args);
  const existingToken = getOperatorToken(host, database);
  const conn = await connectOperatorConnection(host, database, existingToken);

  try {
    await conn.reducers.bootstrapAdminIdentity({ bootstrapCode });
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
