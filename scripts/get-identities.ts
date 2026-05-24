import { DbConnection } from "../src/shared/spacetime/bindings";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const host = "ws://127.0.0.1:3001";
  const dbName = "grezwandererdata";

  // Find an operator token to use for connection
  const tokenDir = path.join(process.cwd(), ".spacetime");
  const files = fs.readdirSync(tokenDir);
  const tokenFile = files.find((f) => f.endsWith(".operator-token"));

  if (!tokenFile) {
    console.error("No operator token found");
    process.exit(1);
  }

  const token = fs.readFileSync(path.join(tokenDir, tokenFile), "utf8").trim();

  DbConnection.builder()
    .withUri(host)
    .withDatabaseName(dbName)
    .withToken(token)
    .onConnect((conn, identity) => {
      console.log(`Connected with identity: ${identity.toHexString()}`);

      // Wait a bit for the table to sync
      setTimeout(() => {
        const profiles = conn.db.playerProfile.iter();
        console.log("Profiles found:");
        let found = false;
        for (const p of profiles) {
          console.log(`- ${p.nickname}: ${p.playerId.toHexString()}`);
          found = true;
        }
        if (!found) {
          console.log("No profiles found in playerProfile table.");
        }
        conn.disconnect();
        process.exit(0);
      }, 3000);
    })
    .onConnectError((_conn, err) => {
      console.error("Connection error:", err);
      process.exit(1);
    })
    .build();
}

main().catch(console.error);
