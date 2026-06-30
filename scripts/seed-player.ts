import {
  connectOperatorConnection,
  getOperatorToken,
} from "./spacetime-operator";
import { Identity } from "spacetimedb";

const DEFAULT_HOST = "ws://127.0.0.1:3001";
const DEFAULT_DATABASE = "grezwandererdata";

const main = async (): Promise<void> => {
  const args = process.argv.slice(2);
  const playerIdentityHex = args[0];

  if (!playerIdentityHex) {
    console.error(
      "Usage: bun run scripts/seed-player.ts <player_identity_hex>",
    );
    process.exit(1);
  }

  const host = process.env.SPACETIMEDB_HOST ?? DEFAULT_HOST;
  const database = process.env.SPACETIMEDB_DB_NAME ?? DEFAULT_DATABASE;

  const token = getOperatorToken(host, database);
  if (!token) {
    console.error(`No operator token found for ${host}/${database}`);
    process.exit(1);
  }

  const conn = await connectOperatorConnection(host, database, token);
  console.log(`Connected as admin ${conn.identity?.toHexString()}`);

  try {
    const playerIdentity = Identity.fromString(playerIdentityHex);
    console.log(`Seeding Matthias Adler profile for ${playerIdentityHex}...`);

    await conn.reducers.seedPlayerAsEliasThorne({
      targetIdentity: playerIdentity,
    });

    console.log("Successfully seeded Matthias Adler profile.");
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  } finally {
    conn.disconnect();
  }
};

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exitCode = 1;
});
