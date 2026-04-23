import {
  connectOperatorConnection,
  getOperatorToken,
} from "./spacetime-operator";
import { parseContentTargetArgs, readArg } from "./content-cli";

const usage = () => {
  console.error(
    "Usage: bun run governance:admin:grant -- --identity <hex> [--server local|maincloud] [--db <name>]",
  );
};

const main = async (): Promise<void> => {
  const args = process.argv.slice(2);
  const identityHex = readArg(args, "--identity");

  if (!identityHex) {
    usage();
    throw new Error("The --identity argument is required.");
  }

  const target = parseContentTargetArgs(args, usage);
  const token = getOperatorToken(target.host, target.database);

  console.log(`Connecting to ${target.host}/${target.database}...`);
  const conn = await connectOperatorConnection(
    target.host,
    target.database,
    token,
  );

  try {
    const targetIdentity = Uint8Array.from(
      Buffer.from(identityHex.replace(/^0x/, ""), "hex"),
    );

    console.log(`Granting admin access to ${identityHex}...`);
    await conn.reducers.grantAdminIdentity({ identity: targetIdentity });
    console.log("Success! Identity granted admin access.");
  } catch (error) {
    console.error("Failed to grant admin access:", error);
    process.exitCode = 1;
  } finally {
    conn.disconnect();
  }
};

main().catch((error) => {
  console.error("Governance task failed:", error);
  process.exitCode = 1;
});
