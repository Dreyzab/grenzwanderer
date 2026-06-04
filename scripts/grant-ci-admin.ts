import { Identity } from "spacetimedb";
import { connectOperatorConnection } from "./spacetime-operator";

const CI_IDENTITY_HEX =
  "c20065cd9236fda124d43029297bcf4f70f9ac7dba56a16aa8bfcc579cb5488f";

async function main() {
  console.log("Connecting to Maincloud...");
  const conn = await connectOperatorConnection(
    "https://maincloud.spacetimedb.com",
    "grezwandererdata",
  );

  console.log(
    "Your identity: " +
      (conn.identity ? conn.identity.toHexString() : "unknown"),
  );
  console.log("Target CI identity: " + CI_IDENTITY_HEX);

  const bootstrapCode = process.env.ADMIN_BOOTSTRAP_CODE?.trim();
  if (!bootstrapCode) {
    console.error(
      "ADMIN_BOOTSTRAP_CODE must be set to bootstrap admin on an empty database.",
    );
    process.exit(1);
  }

  try {
    console.log("Step 1: Claiming first admin spot (Bootstrapping)...");
    await conn.reducers.bootstrapAdminIdentity({ bootstrapCode });
    console.log("✅ SUCCESS! You are now the first admin.");
  } catch (e: any) {
    // If we get an error here, it might just mean we are already an admin
    console.log("ℹ️ Bootstrap skipped or already initialized.");
  }

  try {
    console.log("Step 2: Granting admin rights to CI identity...");
    await conn.reducers.grantAdminIdentity({
      identity: new Identity(CI_IDENTITY_HEX),
    });
    console.log("✅ SUCCESS! CI identity is now an admin.");
  } catch (e: any) {
    console.error("❌ Failed to grant rights to CI:", e);
  } finally {
    conn.disconnect();
  }
}

main();
